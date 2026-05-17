import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApproveProductDto } from './dto/approve-product.dto';
@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard analytics' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // Vendor endpoints
  @Get('vendors')
  @ApiOperation({ summary: 'Get all vendors' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  getVendors(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getVendors(page, limit, status);
  }

  @Patch('vendors/:id/approve')
  @ApiOperation({ summary: 'Approve or reject vendor' })
  approveVendor(
    @Param('id') id: string,
    @Body('approved') approved: boolean,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.approveVendor(id, approved, reason);
  }

  // Product endpoints
  @Get('products')
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'status', required: false })
  getProducts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getProducts(page, limit, status);
  }

  @Patch('products/:id/approve')
  @ApiOperation({ summary: 'Approve or reject product' })
  approveProduct(
    @Param('id') id: string,
    @Body() dto: ApproveProductDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.approveProduct(id, adminId, dto);
  }

  // User endpoints
  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('role') role?: string,
  ) {
    return this.adminService.getUsers(page, limit, role);
  }

  @Patch('users/:id/toggle-block')
  @ApiOperation({ summary: 'Block or unblock a user' })
  toggleBlock(@Param('id') id: string) {
    return this.adminService.toggleUserBlock(id);
  }

  // Order endpoints
  @Get('orders')
  @ApiOperation({ summary: 'Get all orders' })
  getOrders(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getOrders(page, limit, status);
  }

  @Post('orders/:orderId/assign-delivery')
  @ApiOperation({ summary: 'Assign delivery boy to order' })
  assignDelivery(
    @Param('orderId') orderId: string,
    @Body('deliveryBoyId') deliveryBoyId: string,
  ) {
    return this.adminService.assignDeliveryBoy(orderId, deliveryBoyId);
  }

  @Patch('orders/:orderId/delivery-type')
  @ApiOperation({ summary: 'Update delivery type of an order' })
  updateDeliveryType(
    @Param('orderId') orderId: string,
    @Body('deliveryType') deliveryType: 'LOCAL' | 'SHIPROCKET',
  ) {
    return this.adminService.updateDeliveryType(orderId, deliveryType);
  }

  @Post('orders/:orderId/shiprocket-ship')
  @ApiOperation({ summary: 'Trigger Shiprocket order creation' })
  shipWithShiprocket(
    @Param('orderId') orderId: string,
  ) {
    return this.adminService.shipWithShiprocket(orderId);
  }


  // Delivery Boy endpoints
  @Get('delivery-boys')
  @ApiOperation({ summary: 'Get all delivery boys' })
  getDeliveryBoys(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getDeliveryBoys(page, limit, status);
  }

  @Patch('delivery-boys/:id/approve')
  @ApiOperation({ summary: 'Approve or reject delivery boy' })
  approveDeliveryBoy(
    @Param('id') id: string,
    @Body('approved') approved: boolean,
  ) {
    return this.adminService.approveDeliveryBoy(id, approved);
  }

  // Analytics
  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Revenue analytics' })
  @ApiQuery({ name: 'days', required: false })
  getRevenue(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.adminService.getRevenueAnalytics(days);
  }
}
