import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRazorpayOrderDto, VerifyPaymentDto, RefundDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: Razorpay;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private trackingGateway: TrackingGateway,
    private notificationsService: NotificationsService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID') || '',
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET') || '',
    });
  }

  // ─── Create Razorpay Order ───────────────────────────────────────────────────

  async createRazorpayOrder(userId: string, dto: CreateRazorpayOrderDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === 'PAID') throw new BadRequestException('Order already paid');

    const options = {
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { orderId: order.id },
    };

    try {
      const razorpayOrder = await this.razorpay.orders.create(options);

      await this.prisma.payment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          razorpayOrderId: razorpayOrder.id,
          amount: order.totalAmount,
        },
        update: { razorpayOrderId: razorpayOrder.id },
      });

      return {
        message: 'Razorpay order created',
        data: {
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: this.configService.get('RAZORPAY_KEY_ID'),
          keyId: this.configService.get('RAZORPAY_KEY_ID'),
        },
      };
    } catch {
      throw new InternalServerErrorException('Failed to create payment order');
    }
  }

  // ─── Client-side Signature Verify (after Razorpay modal success) ────────────

  async verifyPayment(dto: VerifyPaymentDto) {
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
    const body = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId },
      include: {
        payment: true,
        items: { include: { vendor: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    await this.prisma.$transaction(async (tx: any) => {
      await tx.payment.update({
        where: { orderId: order.id },
        data: {
          razorpayPaymentId: dto.razorpayPaymentId,
          razorpaySignature: dto.razorpaySignature,
          status: 'PAID',
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
      });

      // Create delivery record if it doesn't exist
      const existingDelivery = await tx.orderDelivery.findUnique({
        where: { orderId: order.id },
      });
      if (!existingDelivery) {
        await tx.orderDelivery.create({ data: { orderId: order.id } });
      }
    });

    // Emit real-time update
    this.trackingGateway.emitOrderStatusUpdate(order.id, 'CONFIRMED');

    return { message: 'Payment verified successfully', data: { orderId: order.id } };
  }

  // ─── Razorpay Webhook Handler ────────────────────────────────────────────────

  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
    const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.warn('RAZORPAY_WEBHOOK_SECRET not configured — skipping verification');
    } else {
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSig !== signature) {
        this.logger.warn('Razorpay webhook: invalid signature');
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    let event: any;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid webhook payload');
    }

    this.logger.log(`Razorpay webhook received: ${event.event}`);

    switch (event.event) {
      case 'payment.captured':
        await this.processPaymentCaptured(event);
        break;
      case 'payment.failed':
        await this.processPaymentFailed(event);
        break;
      case 'refund.created':
        await this.processRefundCreated(event);
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${event.event}`);
    }

    return { received: true };
  }

  // ─── payment.captured ────────────────────────────────────────────────────────

  private async processPaymentCaptured(event: any) {
    const payload = event.payload?.payment?.entity;
    if (!payload) return;

    const razorpayPaymentId: string = payload.id;
    const razorpayOrderId: string = payload.order_id;
    const webhookEventId: string = event.id; // unique per webhook delivery

    // Idempotency: skip if already processed
    const alreadyProcessed = await this.prisma.payment.findFirst({
      where: { webhookEventId },
    });
    if (alreadyProcessed) {
      this.logger.log(`Webhook ${webhookEventId} already processed — skipping`);
      return;
    }

    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId },
    });
    if (!payment) {
      this.logger.warn(`payment.captured: no payment record for razorpayOrderId=${razorpayOrderId}`);
      return;
    }

    if (payment.status === 'PAID') {
      this.logger.log(`Payment ${payment.id} already PAID — marking idempotency only`);
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { webhookEventId },
      });
      return;
    }

    // Load order with items and vendor commission rates
    const order = await this.prisma.order.findUnique({
      where: { id: payment.orderId },
      include: {
        items: { include: { vendor: true } },
        user: { select: { id: true, name: true } },
      },
    });
    if (!order) {
      this.logger.error(`payment.captured: order not found for orderId=${payment.orderId}`);
      return;
    }

    // ── Financial calculations ────────────────────────────────────────────────
    const subtotal = order.subtotal;
    const gstAmount = Math.round(subtotal * (0.18 / 1.18) * 100) / 100;
    const shippingCharge = order.shippingCharge;
    const discount = order.discount;
    const totalAmount = order.totalAmount;

    // Per-vendor commission & earnings
    const vendorBreakdown: Record<string, { vendorId: string; shopName: string; itemTotal: number; commission: number; vendorEarning: number }> = {};
    let totalCommission = 0;

    for (const item of order.items) {
      const rate = item.vendor.commissionRate / 100;
      const commission = Math.round(item.total * rate * 100) / 100;
      const vendorEarning = Math.round(item.total * (1 - rate) * 100) / 100;
      totalCommission += commission;

      if (!vendorBreakdown[item.vendorId]) {
        vendorBreakdown[item.vendorId] = {
          vendorId: item.vendorId,
          shopName: item.vendor.shopName,
          itemTotal: 0,
          commission: 0,
          vendorEarning: 0,
        };
      }
      vendorBreakdown[item.vendorId].itemTotal += item.total;
      vendorBreakdown[item.vendorId].commission += commission;
      vendorBreakdown[item.vendorId].vendorEarning += vendorEarning;
    }

    totalCommission = Math.round(totalCommission * 100) / 100;
    const gstOnCommission = Math.round(totalCommission * 0.18 * 100) / 100; // GST platform owes on its commission income
    const deliveryPayout = 0; // set when delivery boy is assigned
    const netPlatformEarning = Math.round((totalCommission - gstOnCommission - deliveryPayout) * 100) / 100;

    // ── Persist everything atomically ─────────────────────────────────────────
    await this.prisma.$transaction(async (tx: any) => {
      // 1. Update payment record
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId,
          status: 'PAID',
          method: payload.method,
          webhookEventId,
        },
      });

      // 2. Confirm order
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
      });

      // 3. Create delivery record if absent
      const existingDelivery = await tx.orderDelivery.findUnique({ where: { orderId: order.id } });
      if (!existingDelivery) {
        await tx.orderDelivery.create({ data: { orderId: order.id } });
      }

      // 4. Save financial ledger
      await tx.paymentLedger.upsert({
        where: { orderId: order.id },
        create: {
          paymentId: payment.id,
          orderId: order.id,
          totalAmount,
          subtotal,
          gstAmount,
          shippingCharge,
          discount,
          platformCommission: totalCommission,
          gstOnCommission,
          deliveryPayout,
          netPlatformEarning,
          vendorBreakdown,
        },
        update: {
          platformCommission: totalCommission,
          gstOnCommission,
          netPlatformEarning,
          vendorBreakdown,
        },
      });

      // 5. Increment vendor earnings
      for (const [vendorId, breakdown] of Object.entries(vendorBreakdown)) {
        await tx.vendor.update({
          where: { id: vendorId },
          data: { totalEarnings: { increment: breakdown.vendorEarning } },
        });
      }
    });

    // ── Notifications ─────────────────────────────────────────────────────────
    // Notify customer
    await this.notificationsService.createNotification({
      userId: order.userId,
      title: 'Payment Successful',
      message: `Payment of ₹${totalAmount} for order #${order.orderNumber} confirmed.`,
      type: 'PAYMENT_SUCCESS',
      data: { orderId: order.id, amount: totalAmount },
    });
    this.trackingGateway.emitNotification(order.userId, {
      title: 'Payment Successful',
      message: `Order #${order.orderNumber} confirmed.`,
      type: 'PAYMENT_SUCCESS',
      orderId: order.id,
    });

    // Notify each vendor
    const notifiedVendors = new Set<string>();
    for (const item of order.items) {
      if (notifiedVendors.has(item.vendorId)) continue;
      notifiedVendors.add(item.vendorId);
      await this.notificationsService.createNotification({
        userId: item.vendor.userId,
        title: 'New Order Received',
        message: `Order #${order.orderNumber} payment confirmed. Prepare for dispatch.`,
        type: 'ORDER_UPDATE',
        data: { orderId: order.id, earning: vendorBreakdown[item.vendorId]?.vendorEarning },
      });
      this.trackingGateway.emitNotification(item.vendor.userId, {
        title: 'New Order Received',
        message: `Order #${order.orderNumber} is confirmed and ready to pack.`,
        type: 'ORDER_UPDATE',
        orderId: order.id,
      });
    }

    // Real-time order status
    this.trackingGateway.emitOrderStatusUpdate(order.id, 'CONFIRMED');

    this.logger.log(`payment.captured processed: order=${order.orderNumber}, amount=₹${totalAmount}, commission=₹${totalCommission}`);
  }

  // ─── payment.failed ──────────────────────────────────────────────────────────

  private async processPaymentFailed(event: any) {
    const payload = event.payload?.payment?.entity;
    if (!payload) return;

    const razorpayOrderId: string = payload.order_id;
    const failureReason: string = payload.error_description || 'Payment failed';
    const webhookEventId: string = event.id;

    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId },
    });
    if (!payment) return;

    // Idempotency
    if (payment.webhookEventId === webhookEventId) return;

    const order = await this.prisma.order.findUnique({
      where: { id: payment.orderId },
    });
    if (!order) return;

    await this.prisma.$transaction(async (tx: any) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason, webhookEventId },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED', status: 'CANCELLED', cancellationReason: failureReason },
      });
    });

    // Restore stock
    await this.restoreStock(order.id);

    await this.notificationsService.createNotification({
      userId: order.userId,
      title: 'Payment Failed',
      message: `Payment for order #${order.orderNumber} failed. ${failureReason}`,
      type: 'PAYMENT_SUCCESS', // closest available type
      data: { orderId: order.id, reason: failureReason },
    });

    this.trackingGateway.emitOrderStatusUpdate(order.id, 'CANCELLED');

    this.logger.warn(`payment.failed: order=${order.orderNumber}, reason=${failureReason}`);
  }

  // ─── refund.created ──────────────────────────────────────────────────────────

  private async processRefundCreated(event: any) {
    const payload = event.payload?.refund?.entity;
    if (!payload) return;

    const razorpayPaymentId: string = payload.payment_id;
    const refundId: string = payload.id;
    const refundAmount: number = payload.amount / 100;

    const payment = await this.prisma.payment.findFirst({
      where: { razorpayPaymentId },
    });
    if (!payment) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED', refundId, refundAmount },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: 'REFUNDED' },
    });

    this.logger.log(`refund.created: payment=${payment.id}, refundId=${refundId}, amount=₹${refundAmount}`);
  }

  // ─── Stock restoration on payment failure ───────────────────────────────────

  private async restoreStock(orderId: string) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      if (item.variantId) {
        await this.prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  }

  // ─── Get Payment Status ──────────────────────────────────────────────────────

  async getPaymentStatus(orderId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: { order: { select: { orderNumber: true, totalAmount: true, status: true } } },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    return { message: 'Payment status', data: payment };
  }

  // ─── Refund (Admin) ──────────────────────────────────────────────────────────

  async processRefund(dto: RefundDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId: dto.orderId },
    });

    if (!payment || payment.status !== 'PAID') {
      throw new BadRequestException('Payment not eligible for refund');
    }

    if (!payment.razorpayPaymentId) {
      throw new BadRequestException('Razorpay payment ID not found');
    }

    try {
      const refund = await this.razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(dto.amount * 100),
      });

      await this.prisma.$transaction(async (tx: any) => {
        await tx.payment.update({
          where: { orderId: dto.orderId },
          data: { status: 'REFUNDED', refundAmount: dto.amount },
        });

        await tx.order.update({
          where: { id: dto.orderId },
          data: { paymentStatus: 'REFUNDED' },
        });
      });

      return { message: 'Refund processed', data: refund };
    } catch {
      throw new InternalServerErrorException('Refund processing failed');
    }
  }
}
