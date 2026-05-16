import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRazorpayOrderDto, VerifyPaymentDto, RefundDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID') || '',
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET') || '',
    });
  }

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
          keyId: this.configService.get('RAZORPAY_KEY_ID'),
        },
      };
    } catch {
      throw new InternalServerErrorException('Failed to create payment order');
    }
  }

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
      include: { payment: true },
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

      await tx.orderDelivery.create({
        data: { orderId: order.id },
      });
    });

    return { message: 'Payment verified successfully', data: { orderId: order.id } };
  }

  async getPaymentStatus(orderId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: { order: { select: { orderNumber: true, totalAmount: true, status: true } } },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    return { message: 'Payment status', data: payment };
  }

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

      await this.prisma.payment.update({
        where: { orderId: dto.orderId },
        data: { status: 'REFUNDED', refundAmount: dto.amount },
      });

      await this.prisma.order.update({
        where: { id: dto.orderId },
        data: { paymentStatus: 'REFUNDED' },
      });

      return { message: 'Refund processed', data: refund };
    } catch {
      throw new InternalServerErrorException('Refund processing failed');
    }
  }
}
