import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryBoyOnboardDto, UpdateLocationDto, UpdateDeliveryStatusDto } from './dto/delivery.dto';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class DeliveryService {
  constructor(
    private prisma: PrismaService,
    private trackingGateway: TrackingGateway,
  ) {}

  async onboard(userId: string, dto: DeliveryBoyOnboardDto) {
    const existing = await this.prisma.deliveryBoy.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Delivery boy profile already exists');

    const deliveryBoy = await this.prisma.deliveryBoy.create({
      data: { ...dto, userId },
    });
    return { message: 'Application submitted. Awaiting admin approval.', data: deliveryBoy };
  }

  async getProfile(userId: string) {
    const deliveryBoy = await this.prisma.deliveryBoy.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true, phone: true, avatar: true } } },
    });
    if (!deliveryBoy) throw new NotFoundException('Profile not found');
    return { message: 'Profile fetched', data: deliveryBoy };
  }

  async getMyDeliveries(userId: string, status?: string) {
    const deliveryBoy = await this.prisma.deliveryBoy.findUnique({ where: { userId } });
    if (!deliveryBoy) throw new NotFoundException('Delivery boy not found');

    const where: any = { deliveryBoyId: deliveryBoy.id };

    const deliveries = await this.prisma.orderDelivery.findMany({
      where,
      include: {
        order: {
          include: {
            items: { include: { product: { select: { name: true, images: true } } } },
            address: true,
            user: { select: { name: true, phone: true } },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
    return { message: 'Deliveries fetched', data: deliveries };
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const deliveryBoy = await this.prisma.deliveryBoy.findUnique({ where: { userId } });
    if (!deliveryBoy) throw new NotFoundException('Delivery boy not found');
    if (deliveryBoy.approvalStatus !== 'APPROVED') {
      throw new ForbiddenException('Account not approved');
    }

    await this.prisma.deliveryBoy.update({
      where: { id: deliveryBoy.id },
      data: { currentLatitude: dto.latitude, currentLongitude: dto.longitude },
    });

    if (dto.orderId) {
      await this.prisma.deliveryTracking.create({
        data: {
          orderId: dto.orderId,
          deliveryBoyId: deliveryBoy.id,
          latitude: dto.latitude,
          longitude: dto.longitude,
        },
      });

      // Emit real-time update via WebSocket
      this.trackingGateway.emitLocationUpdate(dto.orderId, {
        latitude: dto.latitude,
        longitude: dto.longitude,
        deliveryBoyId: deliveryBoy.id,
        timestamp: new Date(),
      });
    }

    return { message: 'Location updated', data: { latitude: dto.latitude, longitude: dto.longitude } };
  }

  async updateDeliveryStatus(userId: string, deliveryId: string, dto: UpdateDeliveryStatusDto) {
    const deliveryBoy = await this.prisma.deliveryBoy.findUnique({ where: { userId } });
    if (!deliveryBoy) throw new NotFoundException('Delivery boy not found');

    const delivery = await this.prisma.orderDelivery.findFirst({
      where: { id: deliveryId, deliveryBoyId: deliveryBoy.id },
      include: { order: true },
    });
    if (!delivery) throw new NotFoundException('Delivery not found');

    const updateData: any = {};
    let orderStatus: any;

    if (dto.action === 'PICKED_UP') {
      updateData.pickedUpAt = new Date();
      orderStatus = 'OUT_FOR_DELIVERY';
    } else if (dto.action === 'DELIVERED') {
      if (!dto.otp) throw new BadRequestException('OTP is required for delivery');
      if (delivery.deliveryOtp && delivery.deliveryOtp !== dto.otp) {
        throw new BadRequestException('Invalid OTP. Please ask the customer for the correct 4-digit PIN.');
      }
      if (dto.proofImageUrl) {
        updateData.proofImageUrl = dto.proofImageUrl;
      }

      updateData.deliveredAt = new Date();
      orderStatus = 'DELIVERED';
      await this.prisma.deliveryBoy.update({
        where: { id: deliveryBoy.id },
        data: { totalDeliveries: { increment: 1 } },
      });
    }

    if (dto.notes) updateData.notes = dto.notes;

    await this.prisma.$transaction([
      this.prisma.orderDelivery.update({ where: { id: deliveryId }, data: updateData }),
      this.prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: orderStatus },
      }),
    ]);

    // Calculate payouts, commissions, taxes, and settlements upon successful delivery completion
    if (dto.action === 'DELIVERED') {
      await this.processSettlementsAndPayouts(delivery.orderId, deliveryBoy.id);
    }

    // Notify customer via WebSocket
    this.trackingGateway.emitOrderStatusUpdate(delivery.orderId, orderStatus);

    return { message: `Order marked as ${dto.action}` };
  }

  private async processSettlementsAndPayouts(orderId: string, deliveryBoyId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  vendor: true,
                },
              },
            },
          },
        },
      });

      if (!order) return;

      const subtotal = order.subtotal;
      
      // 1. Calculate GST details (18% inclusive GST standard)
      // Reverse calculation: Taxable amount = total / 1.18, GST = total - Taxable
      const taxableAmount = Math.round((subtotal / 1.18) * 100) / 100;
      const totalGst = Math.round((subtotal - taxableAmount) * 100) / 100;
      const cgst = Math.round((totalGst / 2) * 100) / 100;
      const sgst = Math.round((totalGst / 2) * 100) / 100;

      await this.prisma.gstTransaction.upsert({
        where: { orderId },
        create: {
          orderId,
          taxableAmount,
          cgst,
          sgst,
          totalGst,
          status: 'ACCRUED',
        },
        update: {},
      });

      // Group items by vendor to create vendor settlements & commissions
      const itemsByVendor = new Map<string, typeof order.items>();
      for (const item of order.items) {
        const vendorId = item.vendorId;
        if (!itemsByVendor.has(vendorId)) {
          itemsByVendor.set(vendorId, []);
        }
        itemsByVendor.get(vendorId)!.push(item);
      }

      for (const [vendorId, vendorItems] of itemsByVendor.entries()) {
        const vendorGross = vendorItems.reduce((sum, item) => sum + item.total, 0);
        
        // Find commission rate (defaults to 10% if not specified)
        const firstProduct = vendorItems[0]?.product;
        const commissionRate = firstProduct?.vendor?.commissionRate ?? 10.0;
        
        // Commission = gross * commissionRate / 100
        const commissionAmount = Math.round((vendorGross * (commissionRate / 100)) * 100) / 100;
        
        // 18% GST charged by platform on commission
        const gstOnCommission = Math.round((commissionAmount * 0.18) * 100) / 100;
        const netCommission = Math.round((commissionAmount + gstOnCommission) * 100) / 100;
        
        // Vendor Payout = gross - netCommission
        const vendorPayout = Math.round((vendorGross - netCommission) * 100) / 100;

        // Save Commission entry
        await this.prisma.commission.create({
          data: {
            orderId,
            vendorId,
            grossAmount: vendorGross,
            commissionRate,
            commissionAmount,
            gstOnCommission,
            netCommission,
            status: 'PENDING',
          },
        });

        // Save Vendor Settlement entry
        await this.prisma.vendorSettlement.create({
          data: {
            orderId,
            vendorId,
            amount: vendorPayout,
            status: 'PENDING',
          },
        });

        // Update Vendor's total earnings in database
        await this.prisma.vendor.update({
          where: { id: vendorId },
          data: {
            totalEarnings: { increment: vendorPayout },
          },
        });
      }

      // 2. Calculate Delivery Boy Payout (Flat ₹50 incentive per order)
      const deliveryPayoutAmount = 50.0;
      await this.prisma.deliveryPayout.create({
        data: {
          orderId,
          deliveryBoyId,
          amount: deliveryPayoutAmount,
          status: 'PENDING',
        },
      });

      // Update Delivery Boy's total earnings in database
      await this.prisma.deliveryBoy.update({
        where: { id: deliveryBoyId },
        data: {
          totalEarnings: { increment: deliveryPayoutAmount },
        },
      });

      // Query the associated payment record to link with the Payment Ledger
      const payment = await this.prisma.payment.findUnique({
        where: { orderId },
      });

      if (payment) {
        // Create Payment Ledger entry to reconcile all totals
        await this.prisma.paymentLedger.upsert({
          where: { orderId },
          create: {
            orderId,
            paymentId: payment.id,
            totalAmount: order.totalAmount,
            subtotal: order.subtotal,
            gstAmount: totalGst,
            shippingCharge: order.shippingCharge,
            discount: order.discount,
            platformCommission: Math.round(subtotal * 0.10 * 100) / 100, // 10% average
            gstOnCommission: Math.round(subtotal * 0.10 * 0.18 * 100) / 100,
            deliveryPayout: deliveryPayoutAmount,
            netPlatformEarning: Math.round((subtotal * 0.10 - deliveryPayoutAmount) * 100) / 100,
            vendorBreakdown: {},
          },
          update: {},
        });
      }

      // Emit real-time settlement notification
      this.trackingGateway.server.emit('settlement.created', {
        orderId,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        deliveryPayout: deliveryPayoutAmount,
        timestamp: new Date(),
      });

    } catch (err: any) {
      console.error('[processSettlementsAndPayouts] Error generating settlements:', err.message);
    }
  }

  async getDashboard(userId: string) {
    const deliveryBoy = await this.prisma.deliveryBoy.findUnique({ where: { userId } });
    if (!deliveryBoy) throw new NotFoundException('Delivery boy not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalDeliveries, todayDeliveries, pendingDeliveries] = await Promise.all([
      this.prisma.orderDelivery.count({ where: { deliveryBoyId: deliveryBoy.id, deliveredAt: { not: null } } }),
      this.prisma.orderDelivery.count({
        where: { deliveryBoyId: deliveryBoy.id, deliveredAt: { gte: today } },
      }),
      this.prisma.orderDelivery.count({
        where: { deliveryBoyId: deliveryBoy.id, deliveredAt: null },
      }),
    ]);

    return {
      message: 'Dashboard data',
      data: {
        totalDeliveries,
        todayDeliveries,
        pendingDeliveries,
        totalEarnings: deliveryBoy.totalEarnings,
        isAvailable: deliveryBoy.isAvailable,
      },
    };
  }

  async toggleAvailability(userId: string) {
    const deliveryBoy = await this.prisma.deliveryBoy.findUnique({ where: { userId } });
    if (!deliveryBoy) throw new NotFoundException('Delivery boy not found');

    const updated = await this.prisma.deliveryBoy.update({
      where: { id: deliveryBoy.id },
      data: { isAvailable: !deliveryBoy.isAvailable },
    });
    return {
      message: `Now ${updated.isAvailable ? 'available' : 'unavailable'}`,
      data: { isAvailable: updated.isAvailable },
    };
  }
}
