import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsEnum, IsOptional, IsUUID, IsArray,
  ValidateNested, IsNumber, Min, IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

// Sent by frontend when DB cart is empty (local-first cart architecture)
export class OrderItemPayload {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  addressId: string;

  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.RAZORPAY })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;

  // Optional: frontend can send cart items directly (local-first cart)
  @ApiPropertyOptional({ type: [OrderItemPayload] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemPayload)
  items?: OrderItemPayload[];

  // Frontend sends these — accepted and ignored gracefully (deliveryType is computed server-side)
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliverySlot?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryType?: string;
}

export class CancelOrderDto {
  @ApiProperty()
  @IsString()
  reason: string;
}
