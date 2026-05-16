import { Controller, Get, Post, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DeliveryService } from './delivery.service';
import { DeliveryBoyOnboardDto, UpdateLocationDto, UpdateDeliveryStatusDto } from './dto/delivery.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Delivery')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('onboard')
  @Roles(Role.DELIVERY_BOY, Role.CUSTOMER)
  @ApiOperation({ summary: 'Delivery boy onboarding' })
  onboard(@CurrentUser('id') userId: string, @Body() dto: DeliveryBoyOnboardDto) {
    return this.deliveryService.onboard(userId, dto);
  }

  @Get('profile')
  @Roles(Role.DELIVERY_BOY)
  @ApiOperation({ summary: 'Get delivery boy profile' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.deliveryService.getProfile(userId);
  }

  @Get('dashboard')
  @Roles(Role.DELIVERY_BOY)
  @ApiOperation({ summary: 'Delivery boy dashboard' })
  getDashboard(@CurrentUser('id') userId: string) {
    return this.deliveryService.getDashboard(userId);
  }

  @Get('deliveries')
  @Roles(Role.DELIVERY_BOY)
  @ApiOperation({ summary: 'Get my assigned deliveries' })
  getMyDeliveries(@CurrentUser('id') userId: string, @Query('status') status?: string) {
    return this.deliveryService.getMyDeliveries(userId, status);
  }

  @Post('location')
  @Roles(Role.DELIVERY_BOY)
  @ApiOperation({ summary: 'Update current location (GPS tracking)' })
  updateLocation(@CurrentUser('id') userId: string, @Body() dto: UpdateLocationDto) {
    return this.deliveryService.updateLocation(userId, dto);
  }

  @Put('deliveries/:id/status')
  @Roles(Role.DELIVERY_BOY)
  @ApiOperation({ summary: 'Update delivery status (pickup/delivered)' })
  updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') deliveryId: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveryService.updateDeliveryStatus(userId, deliveryId, dto);
  }

  @Post('toggle-availability')
  @Roles(Role.DELIVERY_BOY)
  @ApiOperation({ summary: 'Toggle availability status' })
  toggleAvailability(@CurrentUser('id') userId: string) {
    return this.deliveryService.toggleAvailability(userId);
  }
}
