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

  // ── Dashboard ─────────────────────────────────────────────
  @Get('dashboard')
  @ApiOperation({ summary: 'Platform overview — users, orders, revenue, pending approvals' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // ── Analytics ─────────────────────────────────────────────
  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Daily revenue chart for last N days' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getRevenue(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.adminService.getRevenueAnalytics(days);
  }

  @Get('analytics/top-products')
  @ApiOperation({ summary: 'Top selling products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopProducts(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return this.adminService.getTopProducts(limit);
  }

  @Get('analytics/top-vendors')
  @ApiOperation({ summary: 'Top earning vendors' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopVendors(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return this.adminService.getTopVendors(limit);
  }

  // ── User Management ───────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: 'List all users with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'role', required: false, enum: ['CUSTOMER', 'VENDOR', 'DELIVERY_BOY', 'ADMIN'] })
  @ApiQuery({ name: 'search', required: false })
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(page, limit, role, search);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user detail by ID' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/toggle-block')
  @ApiOperation({ summary: 'Block or unblock a user' })
  toggleBlock(@Param('id') id: string) {
    return this.adminService.toggleUserBlock(id);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change user role' })
  changeRole(@Param('id') id: string, @Body('role') role: string) {
    return this.adminService.changeUserRole(id, role);
  }

  // ── Vendor Management ─────────────────────────────────────
  @Get('vendors')
  @ApiOperation({ summary: 'List all vendors' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  getVendors(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getVendors(page, limit, status);
  }

  @Get('vendors/:id')
  @ApiOperation({ summary: 'Get vendor detail by ID' })
  getVendorById(@Param('id') id: string) {
    return this.adminService.getVendorById(id);
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

  // ── Category Management ───────────────────────────────────
  @Patch('categories/:id/approve')
  @ApiOperation({ summary: 'Approve or deactivate a vendor-submitted category' })
  approveCategory(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.adminService.approveCategory(id, isActive);
  }

  // ── Product Management ────────────────────────────────────
  @Get('products')
  @ApiOperation({ summary: 'List all products with approval filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @ApiQuery({ name: 'search', required: false })
  getProducts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getProducts(page, limit, status, search);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product detail by ID' })
  getProductById(@Param('id') id: string) {
    return this.adminService.getProductById(id);
  }

  @Patch('products/:id/approve')
  @ApiOperation({ summary: 'Approve or reject a vendor product' })
  approveProduct(
    @Param('id') id: string,
    @Body() dto: ApproveProductDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.approveProduct(id, adminId, dto);
  }

  @Patch('products/:id/feature')
  @ApiOperation({ summary: 'Toggle featured status of a product' })
  featureProduct(@Param('id') id: string, @Body('isFeatured') isFeatured: boolean) {
    return this.adminService.featureProduct(id, isFeatured);
  }

  // ── Order Management ──────────────────────────────────────
  @Get('orders')
  @ApiOperation({ summary: 'List all orders' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  getOrders(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getOrders(page, limit, status, search);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get full order detail by ID' })
  getOrderById(@Param('id') id: string) {
    return this.adminService.getOrderById(id);
  }

  @Post('orders/:orderId/assign-delivery')
  @ApiOperation({ summary: 'Assign a delivery boy to an order' })
  assignDelivery(
    @Param('orderId') orderId: string,
    @Body('deliveryBoyId') deliveryBoyId: string,
  ) {
    return this.adminService.assignDeliveryBoy(orderId, deliveryBoyId);
  }

  @Patch('orders/:orderId/delivery-type')
  @ApiOperation({ summary: 'Switch order between LOCAL and SHIPROCKET delivery' })
  updateDeliveryType(
    @Param('orderId') orderId: string,
    @Body('deliveryType') deliveryType: 'LOCAL' | 'SHIPROCKET',
  ) {
    return this.adminService.updateDeliveryType(orderId, deliveryType);
  }

  @Post('orders/:orderId/shiprocket-ship')
  @ApiOperation({ summary: 'Push order to Shiprocket for shipping' })
  shipWithShiprocket(@Param('orderId') orderId: string) {
    return this.adminService.shipWithShiprocket(orderId);
  }

  @Patch('orders/:orderId/status')
  @ApiOperation({ summary: 'Manually update order status' })
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateOrderStatus(orderId, status);
  }

  // ── Delivery Boy Management ───────────────────────────────
  @Get('delivery-boys')
  @ApiOperation({ summary: 'List all delivery boys' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  getDeliveryBoys(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getDeliveryBoys(page, limit, status);
  }

  @Get('delivery-boys/:id')
  @ApiOperation({ summary: 'Get delivery boy detail' })
  getDeliveryBoyById(@Param('id') id: string) {
    return this.adminService.getDeliveryBoyById(id);
  }

  @Patch('delivery-boys/:id/approve')
  @ApiOperation({ summary: 'Approve or reject a delivery boy' })
  approveDeliveryBoy(
    @Param('id') id: string,
    @Body('approved') approved: boolean,
  ) {
    return this.adminService.approveDeliveryBoy(id, approved);
  }

  // ── Settlements ───────────────────────────────────────────
  @Get('settlements')
  @ApiOperation({ summary: 'List all vendor settlements' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getSettlements(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getSettlements(page, limit);
  }

  @Post('settlements/:vendorId/pay')
  @ApiOperation({ summary: 'Create a settlement payout for a vendor' })
  paySettlement(
    @Param('vendorId') vendorId: string,
    @Body('amount') amount: number,
    @Body('note') note?: string,
  ) {
    return this.adminService.createSettlement(vendorId, amount, note);
  }
}
