import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Matches, Length } from 'class-validator';

export class VendorOnboardDto {
  @ApiProperty({ example: 'My Shop' })
  @IsString()
  shopName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shopDescription?: string;

  @ApiProperty({ example: '29ABCDE1234F1Z5' })
  @IsString()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid GST number format',
  })
  gstNumber: string;

  @ApiProperty({ example: 'ABCDE1234F' })
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: 'Invalid PAN number format' })
  panNumber: string;

  @ApiProperty({ example: '123456789012' })
  @IsString()
  @Length(12, 12, { message: 'Aadhaar must be 12 digits' })
  aadhaarNumber: string;

  @ApiProperty()
  @IsString()
  bankAccountNumber: string;

  @ApiProperty({ example: 'SBIN0001234' })
  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC code' })
  bankIfscCode: string;

  @ApiProperty()
  @IsString()
  bankAccountName: string;
}

export class UpdateVendorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shopName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shopDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shopLogo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shopBanner?: string;
}
