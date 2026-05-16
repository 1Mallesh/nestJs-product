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

    // Notify customer via WebSocket
    this.trackingGateway.emitOrderStatusUpdate(delivery.orderId, orderStatus);

    return { message: `Order marked as ${dto.action}` };
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
