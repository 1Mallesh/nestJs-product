import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendorOnboardDto, UpdateVendorDto } from './dto/vendor-onboard.dto';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  async onboard(userId: string, dto: VendorOnboardDto) {
    const existing = await this.prisma.vendor.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Vendor profile already exists');

    const panConflict = await this.prisma.vendor.findUnique({ where: { panNumber: dto.panNumber } });
    if (panConflict) throw new ConflictException('PAN number already registered');

    const aadhaarConflict = await this.prisma.vendor.findUnique({ where: { aadhaarNumber: dto.aadhaarNumber } });
    if (aadhaarConflict) throw new ConflictException('Aadhaar number already registered');

    const vendor = await this.prisma.vendor.create({
      data: { ...dto, userId },
    });

    return { message: 'Vendor onboarding submitted. Awaiting admin approval.', data: vendor };
  }

  async getProfile(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true, phone: true } } },
    });

    if (!vendor) throw new NotFoundException('Vendor profile not found');
    return { message: 'Vendor profile fetched', data: vendor };
  }

  async updateProfile(userId: string, dto: UpdateVendorDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');

    const updated = await this.prisma.vendor.update({
      where: { userId },
      data: dto,
    });
    return { message: 'Profile updated', data: updated };
  }

  async getOrders(userId: string, page = 1, limit = 10) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: { vendorId: vendor.id },
        include: {
          order: { include: { user: { select: { name: true, email: true } }, address: true } },
          product: { select: { name: true, images: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.orderItem.count({ where: { vendorId: vendor.id } }),
    ]);

    return { message: 'Orders fetched', data: { orders, total, page, limit } };
  }

  async getDashboard(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const [totalProducts, totalOrders, pendingOrders, totalRevenue] = await Promise.all([
      this.prisma.product.count({ where: { vendorId: vendor.id } }),
      this.prisma.orderItem.count({ where: { vendorId: vendor.id } }),
      this.prisma.orderItem.count({ where: { vendorId: vendor.id, status: 'PENDING' } }),
      this.prisma.orderItem.aggregate({
        where: { vendorId: vendor.id, status: 'DELIVERED' },
        _sum: { total: true },
      }),
    ]);

    return {
      message: 'Dashboard data',
      data: {
        totalProducts,
        totalOrders,
        pendingOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        commissionRate: vendor.commissionRate,
        totalEarnings: vendor.totalEarnings,
      },
    };
  }

  async updateOrderItemStatus(userId: string, orderItemId: string, status: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const item = await this.prisma.orderItem.findFirst({
      where: { id: orderItemId, vendorId: vendor.id },
    });
    if (!item) throw new NotFoundException('Order item not found');

    const updated = await this.prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status: status as any },
    });
    return { message: 'Order status updated', data: updated };
  }
}
