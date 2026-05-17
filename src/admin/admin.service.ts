import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { NotificationType } from '@prisma/client';
import { ApproveProductDto } from './dto/approve-product.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private trackingGateway: TrackingGateway,
  ) {}

  async getDashboard() {
    const [
      totalUsers, totalVendors, totalProducts, totalOrders,
      pendingVendors, pendingProducts, totalRevenue, todayOrders,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.vendor.count({ where: { approvalStatus: 'APPROVED' } }),
      this.prisma.product.count({ where: { isActive: true, approvalStatus: 'APPROVED' } }),
      this.prisma.order.count(),
      this.prisma.vendor.count({ where: { approvalStatus: 'PENDING' } }),
      this.prisma.product.count({ where: { approvalStatus: 'PENDING' } }),
      this.prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

    return {
      success: true,
      message: 'Dashboard data',
      data: {
        totalUsers, totalVendors, totalProducts, totalOrders,
        pendingVendors, pendingProducts,
        totalRevenue: totalRevenue._sum.amount || 0,
        todayOrders,
      },
    };
  }

  // Vendor Management
  async getVendors(page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.approvalStatus = status;

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        include: { user: { select: { name: true, email: true, phone: true } } },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return { success: true, message: 'Vendors fetched', data: { vendors, total, page, limit } };
  }

  async approveVendor(vendorId: string, approved: boolean, reason?: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        approvalStatus: approved ? 'APPROVED' : 'REJECTED',
        rejectionReason: approved ? null : reason,
      },
    });

    if (approved) {
      await this.prisma.user.update({
        where: { id: vendor.userId },
        data: { role: 'VENDOR' },
      });
    }

    const notif = await this.notifications.create(
      vendor.userId,
      approved ? 'Vendor Account Approved' : 'Vendor Account Rejected',
      approved
        ? 'Your vendor account has been approved. You can now list products.'
        : `Your vendor account was rejected. Reason: ${reason || 'Not specified'}`,
      NotificationType.VENDOR_APPROVED,
      { vendorId },
    );
    this.trackingGateway.emitNotification(vendor.userId, notif);

    return { success: true, message: `Vendor ${approved ? 'approved' : 'rejected'}`, data: updated };
  }

  // Product Management
  async getProducts(page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.approvalStatus = status;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          vendor: { select: { shopName: true, userId: true } },
          category: { select: { name: true } },
        },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { success: true, message: 'Products fetched', data: { products, total, page, limit } };
  }

  async approveProduct(productId: string, adminId: string, dto: ApproveProductDto) {
    if (!adminId) throw new BadRequestException('Admin user not authenticated properly (missing adminId)');

    const { approvalStatus, rejectionReason } = dto;
    const isApproved = approvalStatus === 'APPROVED';

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: { include: { user: true } } },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (!product.vendor) throw new BadRequestException('Product has no associated vendor profile');
    if (!product.vendor.userId) throw new BadRequestException('Associated vendor has no valid userId');

    const now = new Date();
    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        approvalStatus: isApproved ? 'APPROVED' : 'REJECTED',
        rejectionReason: isApproved ? null : rejectionReason,
        isPublished: isApproved,
        publishedAt: isApproved ? now : null,
        approvedBy: isApproved ? adminId : null,
        approvedAt: isApproved ? now : null,
      },
    });

    const vendorUserId = product.vendor.userId;

    // Vendor Notification
    const vendorNotif = await this.notifications.create(
      vendorUserId,
      isApproved ? 'Product Approved' : 'Product Rejected',
      isApproved
        ? `Your product "${product.name}" has been approved and is now live.`
        : `Your product "${product.name}" was rejected. Reason: ${rejectionReason || 'Not specified'}`,
      NotificationType.PRODUCT_APPROVED,
      { productId },
    );
    this.trackingGateway.emitNotification(vendorUserId, vendorNotif);

    // Admin Notification
    const adminNotif = await this.notifications.create(
      adminId,
      isApproved ? 'Product Approved' : 'Product Rejected',
      isApproved
        ? `You have approved the product "${product.name}".`
        : `You have rejected the product "${product.name}". Reason: ${rejectionReason || 'Not specified'}`,
      NotificationType.PRODUCT_APPROVED,
      { productId },
    );
    this.trackingGateway.emitNotification(adminId, adminNotif);

    const event = isApproved ? 'product.approved' : 'product.rejected';
    this.trackingGateway.server?.emit(event, {
      productId,
      vendorId: product.vendorId,
      name: product.name,
      approvedBy: adminId,
    });

    return { success: true, message: `Product ${isApproved ? 'approved and published' : 'rejected'}`, data: updated };
  }

  // User Management
  async getUsers(page = 1, limit = 10, role?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { success: true, message: 'Users fetched', data: { users, total, page, limit } };
  }

  async toggleUserBlock(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, isActive: true },
    });

    return { success: true, message: `User ${updated.isActive ? 'unblocked' : 'blocked'}`, data: updated };
  }

  // Order Management
  async getOrders(page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
          payment: { select: { status: true, amount: true } },
        },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { success: true, message: 'Orders fetched', data: { orders, total, page, limit } };
  }

  // Delivery Boy Management
  async getDeliveryBoys(page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.approvalStatus = status;

    const [boys, total] = await Promise.all([
      this.prisma.deliveryBoy.findMany({
        where,
        include: { user: { select: { name: true, email: true, phone: true } } },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deliveryBoy.count({ where }),
    ]);

    return { success: true, message: 'Delivery boys fetched', data: { boys, total, page, limit } };
  }

  async approveDeliveryBoy(deliveryBoyId: string, approved: boolean, reason?: string) {
    const boy = await this.prisma.deliveryBoy.findUnique({ where: { id: deliveryBoyId } });
    if (!boy) throw new NotFoundException('Delivery boy not found');

    const updated = await this.prisma.deliveryBoy.update({
      where: { id: deliveryBoyId },
      data: { approvalStatus: approved ? 'APPROVED' : 'REJECTED' },
    });

    if (approved) {
      await this.prisma.user.update({
        where: { id: boy.userId },
        data: { role: 'DELIVERY_BOY' },
      });
    }

    return { success: true, message: `Delivery boy ${approved ? 'approved' : 'rejected'}`, data: updated };
  }

  async assignDeliveryBoy(orderId: string, deliveryBoyId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { delivery: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus !== 'PAID' && order.paymentMethod !== 'COD') {
      throw new BadRequestException('Order payment not confirmed');
    }

    const deliveryBoy = await this.prisma.deliveryBoy.findUnique({ where: { id: deliveryBoyId } });
    if (!deliveryBoy || deliveryBoy.approvalStatus !== 'APPROVED') {
      throw new BadRequestException('Delivery boy not available');
    }

    const delivery = await this.prisma.orderDelivery.upsert({
      where: { orderId },
      create: { orderId, deliveryBoyId, assignedAt: new Date() },
      update: { deliveryBoyId, assignedAt: new Date() },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PACKED' },
    });

    this.trackingGateway.emitOrderStatusUpdate(orderId, 'PACKED');

    return { success: true, message: 'Delivery boy assigned', data: delivery };
  }

  // Analytics
  async getRevenueAnalytics(days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const revenue = await this.prisma.payment.groupBy({
      by: ['createdAt'],
      where: { status: 'PAID', createdAt: { gte: from } },
      _sum: { amount: true },
    });

    return { success: true, message: 'Revenue analytics', data: revenue };
  }
}
