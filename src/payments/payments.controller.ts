import {
  Controller, Post, Get, Body, Param, UseGuards,
  Headers, RawBodyRequest, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CreateRazorpayOrderDto, VerifyPaymentDto, RefundDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  @ApiOperation({ summary: 'Create Razorpay payment order' })
  createRazorpayOrder(@CurrentUser('id') userId: string, @Body() dto: CreateRazorpayOrderDto) {
    return this.paymentsService.createRazorpayOrder(userId, dto);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify Razorpay payment signature' })
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Get(':orderId/status')
  @ApiOperation({ summary: 'Get payment status for an order' })
  getPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentStatus(orderId);
  }

  @Post('refund')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Process refund (Admin)' })
  processRefund(@Body() dto: RefundDto) {
    return this.paymentsService.processRefund(dto);
  }

  // Public endpoint — bypasses JWT, reads raw body for HMAC verification
  @Public()
  @Post('webhook/razorpay')
  @ApiExcludeEndpoint()
  handleRazorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.from('');
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
