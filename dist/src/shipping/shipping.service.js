"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ShippingService", {
    enumerable: true,
    get: function() {
        return ShippingService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _axios = require("@nestjs/axios");
const _rxjs = require("rxjs");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ShippingService = class ShippingService {
    async determineDeliveryType(address) {
        const radiusKm = this.configService.get('LOCAL_DELIVERY_RADIUS_KM', 10);
        // Simplified: use latitude/longitude to determine distance
        // In production, compare against warehouse coordinates
        if (address.latitude && address.longitude) {
            const warehouseLat = 12.9716; // Example: Bangalore warehouse
            const warehouseLng = 77.5946;
            const distance = this.calculateDistance(address.latitude, address.longitude, warehouseLat, warehouseLng);
            return distance <= radiusKm ? 'LOCAL' : 'SHIPROCKET';
        }
        return 'SHIPROCKET'; // Default to shiprocket if no coordinates
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
    async getShiprocketToken() {
        if (this.shiprocketToken.length > 0 && this.tokenExpiry && this.tokenExpiry > new Date()) {
            return this.shiprocketToken;
        }
        try {
            const response = await (0, _rxjs.firstValueFrom)(this.httpService.post(`${this.configService.get('SHIPROCKET_API_URL')}/auth/login`, {
                email: this.configService.get('SHIPROCKET_EMAIL'),
                password: this.configService.get('SHIPROCKET_PASSWORD')
            }));
            this.shiprocketToken = response.data.token;
            this.tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000); // 9 days
            return this.shiprocketToken;
        } catch (error) {
            this.logger.error('Failed to get Shiprocket token', error);
            throw error;
        }
    }
    async createShiprocketOrder(orderData) {
        try {
            const token = await this.getShiprocketToken();
            const response = await (0, _rxjs.firstValueFrom)(this.httpService.post(`${this.configService.get('SHIPROCKET_API_URL')}/orders/create/adhoc`, orderData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }));
            return response.data;
        } catch (error) {
            this.logger.error('Shiprocket order creation failed', error);
            throw error;
        }
    }
    async trackShiprocket(awbCode) {
        try {
            const token = await this.getShiprocketToken();
            const response = await (0, _rxjs.firstValueFrom)(this.httpService.get(`${this.configService.get('SHIPROCKET_API_URL')}/courier/track/awb/${awbCode}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }));
            return response.data;
        } catch (error) {
            this.logger.error('Shiprocket tracking failed', error);
            throw error;
        }
    }
    async generateLabel(shipmentId) {
        try {
            const token = await this.getShiprocketToken();
            const response = await (0, _rxjs.firstValueFrom)(this.httpService.post(`${this.configService.get('SHIPROCKET_API_URL')}/courier/generate/label`, {
                shipment_id: [
                    shipmentId
                ]
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }));
            return response.data;
        } catch (error) {
            this.logger.error('Label generation failed', error);
            throw error;
        }
    }
    constructor(configService, httpService){
        this.configService = configService;
        this.httpService = httpService;
        this.logger = new _common.Logger(ShippingService.name);
        this.shiprocketToken = '';
        this.tokenExpiry = null;
    }
};
ShippingService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _axios.HttpService === "undefined" ? Object : _axios.HttpService
    ])
], ShippingService);

//# sourceMappingURL=shipping.service.js.map