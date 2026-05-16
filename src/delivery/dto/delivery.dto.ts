import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Matches, Length, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class DeliveryBoyOnboardDto {
  @ApiProperty()
  @IsString()
  @Length(12, 12)
  aadhaarNumber: string;

  @ApiProperty({ example: 'ABCDE1234F' })
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
  panNumber: string;

  @ApiProperty()
  @IsString()
  drivingLicense: string;

  @ApiProperty({ example: 'BIKE' })
  @IsString()
  vehicleType: string;

  @ApiProperty()
  @IsString()
  vehicleNumber: string;

  @ApiProperty()
  @IsString()
  bankAccountNumber: string;

  @ApiProperty({ example: 'SBIN0001234' })
  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
  bankIfscCode: string;

  @ApiProperty()
  @IsString()
  bankAccountName: string;
}

export class UpdateLocationDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  orderId?: string;
}

export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: ['PICKED_UP', 'DELIVERED'] })
  @IsString()
  action: 'PICKED_UP' | 'DELIVERED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
