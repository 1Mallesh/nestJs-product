import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Matches, Length, IsEnum } from 'class-validator';

export class VendorOnboardDto {
  @ApiProperty({ example: 'My Gaming Shop' })
  @IsString()
  shopName: string;

  @ApiPropertyOptional({ example: 'Best gaming accessories store' })
  @IsOptional()
  @IsString()
  shopDescription?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  shopLogo?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.png' })
  @IsOptional()
  @IsString()
  shopBanner?: string;

  @ApiProperty({ example: '29ABCDE1234F1Z5' })
  @IsString()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid GST number format (e.g. 29ABCDE1234F1Z5)',
  })
  gstNumber: string;

  @ApiProperty({ example: 'ABCDE1234F' })
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: 'Invalid PAN number format (e.g. ABCDE1234F)' })
  panNumber: string;

  @ApiProperty({ example: '123456789012' })
  @IsString()
  @Length(12, 12, { message: 'Aadhaar must be exactly 12 digits' })
  aadhaarNumber: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  bankAccountNumber: string;

  @ApiProperty({ example: 'SBIN0001234' })
  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC code (e.g. SBIN0001234)' })
  bankIfscCode: string;

  @ApiProperty({ example: 'John Doe' })
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC code' })
  bankIfscCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountName?: string;
}
