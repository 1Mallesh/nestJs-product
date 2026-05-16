import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { VendorService } from './vendor.service';
import { VendorOnboardDto, UpdateVendorDto } from './dto/vendor-onboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Vendor')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post('onboard')
  @Roles(Role.VENDOR, Role.CUSTOMER)
  @ApiOperation({ summary: 'Vendor onboarding with KYC documents' })
  onboard(@CurrentUser('id') userId: string, @Body() dto: VendorOnboardDto) {
    return this.vendorService.onboard(userId, dto);
  }

  @Get('profile')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Get vendor profile' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.vendorService.getProfile(userId);
  }

  @Put('profile')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Update vendor profile' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateVendorDto) {
    return this.vendorService.updateProfile(userId, dto);
  }

  @Get('dashboard')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Vendor dashboard analytics' })
  getDashboard(@CurrentUser('id') userId: string) {
    return this.vendorService.getDashboard(userId);
  }

  @Get('orders')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Get vendor orders' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getOrders(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.vendorService.getOrders(userId, page, limit);
  }

  @Put('orders/:itemId/status')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Update order item status' })
  updateOrderStatus(
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
    @Body('status') status: string,
  ) {
    return this.vendorService.updateOrderItemStatus(userId, itemId, status);
  }
}
