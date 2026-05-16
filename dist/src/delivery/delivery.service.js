"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DeliveryService", {
    enumerable: true,
    get: function() {
        return DeliveryService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
const _trackinggateway = require("../tracking/tracking.gateway");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let DeliveryService = class DeliveryService {
    async onboard(userId, dto) {
        const existing = await this.prisma.deliveryBoy.findUnique({
            where: {
                userId
            }
        });
        if (existing) throw new _common.ConflictException('Delivery boy profile already exists');
        const deliveryBoy = await this.prisma.deliveryBoy.create({
            data: {
                ...dto,
                userId
            }
        });
        return {
            message: 'Application submitted. Awaiting admin approval.',
            data: deliveryBoy
        };
    }
    async getProfile(userId) {
        const deliveryBoy = await this.prisma.deliveryBoy.findUnique({
            where: {
                userId
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true
                    }
                }
            }
        });
        if (!deliveryBoy) throw new _common.NotFoundException('Profile not found');
        return {
            message: 'Profile fetched',
            data: deliveryBoy
        };
    }
    async getMyDeliveries(userId, status) {
        const deliveryBoy = await this.prisma.deliveryBoy.findUnique({
            where: {
                userId
            }
        });
        if (!deliveryBoy) throw new _common.NotFoundException('Delivery boy not found');
        const where = {
            deliveryBoyId: deliveryBoy.id
        };
        const deliveries = await this.prisma.orderDelivery.findMany({
            where,
            include: {
                order: {
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: {
                                        name: true,
                                        images: true
                                    }
                                }
                            }
                        },
                        address: true,
                        user: {
                            select: {
                                name: true,
                                phone: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                assignedAt: 'desc'
            }
        });
        return {
            message: 'Deliveries fetched',
            data: deliveries
        };
    }
    async updateLocation(userId, dto) {
        const deliveryBoy = await this.prisma.deliveryBoy.findUnique({
            where: {
                userId
            }
        });
        if (!deliveryBoy) throw new _common.NotFoundException('Delivery boy not found');
        if (deliveryBoy.approvalStatus !== 'APPROVED') {
            throw new _common.ForbiddenException('Account not approved');
        }
        await this.prisma.deliveryBoy.update({
            where: {
                id: deliveryBoy.id
            },
            data: {
                currentLatitude: dto.latitude,
                currentLongitude: dto.longitude
            }
        });
        if (dto.orderId) {
            await this.prisma.deliveryTracking.create({
                data: {
                    orderId: dto.orderId,
                    deliveryBoyId: deliveryBoy.id,
                    latitude: dto.latitude,
                    longitude: dto.longitude
                }
            });
            // Emit real-time update via WebSocket
            this.trackingGateway.emitLocationUpdate(dto.orderId, {
                latitude: dto.latitude,
                longitude: dto.longitude,
                deliveryBoyId: deliveryBoy.id,
                timestamp: new Date()
            });
        }
        return {
            message: 'Location updated',
            data: {
                latitude: dto.latitude,
                longitude: dto.longitude
            }
        };
    }
    async updateDeliveryStatus(userId, deliveryId, dto) {
        const deliveryBoy = await this.prisma.deliveryBoy.findUnique({
            where: {
                userId
            }
        });
        if (!deliveryBoy) throw new _common.NotFoundException('Delivery boy not found');
        const delivery = await this.prisma.orderDelivery.findFirst({
            where: {
                id: deliveryId,
                deliveryBoyId: deliveryBoy.id
            },
            include: {
                order: true
            }
        });
        if (!delivery) throw new _common.NotFoundException('Delivery not found');
        const updateData = {};
        let orderStatus;
        if (dto.action === 'PICKED_UP') {
            updateData.pickedUpAt = new Date();
            orderStatus = 'OUT_FOR_DELIVERY';
        } else if (dto.action === 'DELIVERED') {
            updateData.deliveredAt = new Date();
            orderStatus = 'DELIVERED';
            await this.prisma.deliveryBoy.update({
                where: {
                    id: deliveryBoy.id
                },
                data: {
                    totalDeliveries: {
                        increment: 1
                    }
                }
            });
        }
        if (dto.notes) updateData.notes = dto.notes;
        await this.prisma.$transaction([
            this.prisma.orderDelivery.update({
                where: {
                    id: deliveryId
                },
                data: updateData
            }),
            this.prisma.order.update({
                where: {
                    id: delivery.orderId
                },
                data: {
                    status: orderStatus
                }
            })
        ]);
        // Notify customer via WebSocket
        this.trackingGateway.emitOrderStatusUpdate(delivery.orderId, orderStatus);
        return {
            message: `Order marked as ${dto.action}`
        };
    }
    async getDashboard(userId) {
        const deliveryBoy = await this.prisma.deliveryBoy.findUnique({
            where: {
                userId
            }
        });
        if (!deliveryBoy) throw new _common.NotFoundException('Delivery boy not found');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalDeliveries, todayDeliveries, pendingDeliveries] = await Promise.all([
            this.prisma.orderDelivery.count({
                where: {
                    deliveryBoyId: deliveryBoy.id,
                    deliveredAt: {
                        not: null
                    }
                }
            }),
            this.prisma.orderDelivery.count({
                where: {
                    deliveryBoyId: deliveryBoy.id,
                    deliveredAt: {
                        gte: today
                    }
                }
            }),
            this.prisma.orderDelivery.count({
                where: {
                    deliveryBoyId: deliveryBoy.id,
                    deliveredAt: null
                }
            })
        ]);
        return {
            message: 'Dashboard data',
            data: {
                totalDeliveries,
                todayDeliveries,
                pendingDeliveries,
                totalEarnings: deliveryBoy.totalEarnings,
                isAvailable: deliveryBoy.isAvailable
            }
        };
    }
    async toggleAvailability(userId) {
        const deliveryBoy = await this.prisma.deliveryBoy.findUnique({
            where: {
                userId
            }
        });
        if (!deliveryBoy) throw new _common.NotFoundException('Delivery boy not found');
        const updated = await this.prisma.deliveryBoy.update({
            where: {
                id: deliveryBoy.id
            },
            data: {
                isAvailable: !deliveryBoy.isAvailable
            }
        });
        return {
            message: `Now ${updated.isAvailable ? 'available' : 'unavailable'}`,
            data: {
                isAvailable: updated.isAvailable
            }
        };
    }
    constructor(prisma, trackingGateway){
        this.prisma = prisma;
        this.trackingGateway = trackingGateway;
    }
};
DeliveryService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _trackinggateway.TrackingGateway === "undefined" ? Object : _trackinggateway.TrackingGateway
    ])
], DeliveryService);

//# sourceMappingURL=delivery.service.js.map