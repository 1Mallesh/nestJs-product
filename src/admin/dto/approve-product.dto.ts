import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveProductDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'], description: 'Approval status' })
  @IsEnum(['APPROVED', 'REJECTED'])
  approvalStatus: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Reason for rejection if status is REJECTED' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
