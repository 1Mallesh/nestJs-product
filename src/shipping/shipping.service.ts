import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Address } from '@prisma/client';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);
  private shiprocketToken: string = '';
  private tokenExpiry: Date | null = null;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async determineDeliveryType(address: Address): Promise<'LOCAL' | 'SHIPROCKET'> {
    const radiusKm = this.configService.get<number>('LOCAL_DELIVERY_RADIUS_KM', 10);
    // Simplified: use latitude/longitude to determine distance
    // In production, compare against warehouse coordinates
    if (address.latitude && address.longitude) {
      const warehouseLat = 12.9716; // Example: Bangalore warehouse
      const warehouseLng = 77.5946;
      const distance = this.calculateDistance(
        address.latitude, address.longitude,
        warehouseLat, warehouseLng,
      );
      return distance <= radiusKm ? 'LOCAL' : 'SHIPROCKET';
    }
    return 'SHIPROCKET'; // Default to shiprocket if no coordinates
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  private async getShiprocketToken(): Promise<string> {
    if (this.shiprocketToken.length > 0 && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.shiprocketToken;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get('SHIPROCKET_API_URL')}/auth/login`,
          {
            email: this.configService.get('SHIPROCKET_EMAIL'),
            password: this.configService.get('SHIPROCKET_PASSWORD'),
          },
        ),
      );

      this.shiprocketToken = response.data.token;
      this.tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000); // 9 days
      return this.shiprocketToken;
    } catch (error) {
      this.logger.error('Failed to get Shiprocket token', error);
      throw error;
    }
  }

  async createShiprocketOrder(orderData: any) {
    try {
      const token = await this.getShiprocketToken();
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get('SHIPROCKET_API_URL')}/orders/create/adhoc`,
          orderData,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Shiprocket order creation failed', error);
      throw error;
    }
  }

  async trackShiprocket(awbCode: string) {
    try {
      const token = await this.getShiprocketToken();
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get('SHIPROCKET_API_URL')}/courier/track/awb/${awbCode}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Shiprocket tracking failed', error);
      throw error;
    }
  }

  async generateLabel(shipmentId: string) {
    try {
      const token = await this.getShiprocketToken();
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get('SHIPROCKET_API_URL')}/courier/generate/label`,
          { shipment_id: [shipmentId] },
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Label generation failed', error);
      throw error;
    }
  }
}
