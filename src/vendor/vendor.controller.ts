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

  // ── Onboarding ────────────────────────────────────────────
  @Post('onboard')
  @Roles(Role.VENDOR, Role.CUSTOMER)
  @ApiOperation({ summary: 'Submit vendor KYC & onboarding' })
  onboard(@CurrentUser('id') userId: string, @Body() dto: VendorOnboardDto) {
    return this.vendorService.onboard(userId, dto);
  }

  // ── Profile ───────────────────────────────────────────────
  @Get('profile')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Get vendor profile with user info' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.vendorService.getProfile(userId);
  }

  @Put('profile')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Update shop info and bank details' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateVendorDto) {
    return this.vendorService.updateProfile(userId, dto);
  }

  // ── Dashboard ─────────────────────────────────────────────
  @Get('dashboard')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Vendor dashboard — revenue, orders, product stats' })
  getDashboard(@CurrentUser('id') userId: string) {
    return this.vendorService.getDashboard(userId);
  }

  // ── Products ──────────────────────────────────────────────
  @Get('products')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Get all my products with approval status' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  getMyProducts(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.vendorService.getMyProducts(userId, page, limit, status);
  }

  @Get('products/stats')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Product counts by approval status' })
  getProductStats(@CurrentUser('id') userId: string) {
    return this.vendorService.getProductStats(userId);
  }

  // ── Orders ────────────────────────────────────────────────
  @Get('orders')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Get orders for my products' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  getOrders(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.vendorService.getOrders(userId, page, limit, status);
  }

  @Put('orders/:itemId/status')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Update order item status (PROCESSING → SHIPPED)' })
  updateOrderStatus(
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
    @Body('status') status: string,
  ) {
    return this.vendorService.updateOrderItemStatus(userId, itemId, status);
  }

  // ── Earnings & Settlements ────────────────────────────────
  @Get('earnings')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Total earnings and commission summary' })
  getEarnings(@CurrentUser('id') userId: string) {
    return this.vendorService.getEarnings(userId);
  }

  @Get('settlements')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Settlement history (paid out amounts)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getSettlements(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.vendorService.getSettlements(userId, page, limit);
  }
}
