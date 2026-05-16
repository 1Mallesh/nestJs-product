import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, CancelOrderDto } from './dto/order.dto';
import { ShippingService } from '../shipping/shipping.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private shippingService: ShippingService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { vendor: true } },
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) throw new NotFoundException('Address not found');

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${item.product.name}`);
      }
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discount = 0;

    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findFirst({
        where: {
          code: dto.couponCode.toUpperCase(),
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          minOrderAmount: { lte: subtotal },
        },
      });

      if (coupon) {
        if (coupon.discountType === 'PERCENTAGE') {
          discount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else {
          discount = coupon.discountValue;
        }
        await this.prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const deliveryType = await this.shippingService.determineDeliveryType(address);
    const shippingCharge = deliveryType === 'LOCAL' ? 0 : 49;
    const totalAmount = subtotal - discount + shippingCharge;
    const orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const order = await this.prisma.$transaction(async (tx: any) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId: dto.addressId,
          orderNumber,
          paymentMethod: dto.paymentMethod,
          subtotal,
          discount,
          shippingCharge,
          totalAmount,
          notes: dto.notes,
          deliveryType: deliveryType as any,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              vendorId: item.product.vendorId,
              name: item.product.name,
              image: item.product.images[0] || null,
              price: item.price,
              quantity: item.quantity,
              total: item.price * item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity }, totalSold: { increment: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    return { message: 'Order created successfully', data: order };
  }

  async getOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: {
          items: { include: { product: { select: { name: true, images: true } } } },
          address: true,
          payment: true,
          delivery: { include: { deliveryBoy: { include: { user: { select: { name: true, phone: true } } } } } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return { message: 'Orders fetched', data: { orders, total, page, limit } };
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: {
          include: {
            product: { select: { name: true, images: true } },
            vendor: { select: { shopName: true } },
          },
        },
        address: true,
        payment: true,
        delivery: {
          include: {
            deliveryBoy: { include: { user: { select: { name: true, phone: true, avatar: true } } } },
          },
        },
        tracking: { orderBy: { timestamp: 'desc' }, take: 20 },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return { message: 'Order fetched', data: order };
  }

  async cancelOrder(userId: string, orderId: string, dto: CancelOrderDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    const cancelableStatuses = ['PENDING', 'CONFIRMED'];
    if (!cancelableStatuses.includes(order.status)) {
      throw new BadRequestException(`Cannot cancel order in ${order.status} status`);
    }

    await this.prisma.$transaction(async (tx: any) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED', cancellationReason: dto.reason },
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity }, totalSold: { decrement: item.quantity } },
        });
      }
    });

    return { message: 'Order cancelled successfully' };
  }

  async getOrderTracking(orderId: string) {
    const tracking = await this.prisma.deliveryTracking.findMany({
      where: { orderId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, awbCode: true, deliveryType: true },
    });

    return { message: 'Tracking data fetched', data: { order, tracking } };
  }
}
