"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "VendorService", {
    enumerable: true,
    get: function() {
        return VendorService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let VendorService = class VendorService {
    async onboard(userId, dto) {
        const existing = await this.prisma.vendor.findUnique({
            where: {
                userId
            }
        });
        if (existing) throw new _common.ConflictException('Vendor profile already exists');
        const panConflict = await this.prisma.vendor.findUnique({
            where: {
                panNumber: dto.panNumber
            }
        });
        if (panConflict) throw new _common.ConflictException('PAN number already registered');
        const aadhaarConflict = await this.prisma.vendor.findUnique({
            where: {
                aadhaarNumber: dto.aadhaarNumber
            }
        });
        if (aadhaarConflict) throw new _common.ConflictException('Aadhaar number already registered');
        const vendor = await this.prisma.vendor.create({
            data: {
                ...dto,
                userId
            }
        });
        return {
            message: 'Vendor onboarding submitted. Awaiting admin approval.',
            data: vendor
        };
    }
    async getProfile(userId) {
        const vendor = await this.prisma.vendor.findUnique({
            where: {
                userId
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });
        if (!vendor) throw new _common.NotFoundException('Vendor profile not found');
        return {
            message: 'Vendor profile fetched',
            data: vendor
        };
    }
    async updateProfile(userId, dto) {
        const vendor = await this.prisma.vendor.findUnique({
            where: {
                userId
            }
        });
        if (!vendor) throw new _common.NotFoundException('Vendor profile not found');
        const updated = await this.prisma.vendor.update({
            where: {
                userId
            },
            data: dto
        });
        return {
            message: 'Profile updated',
            data: updated
        };
    }
    async getOrders(userId, page = 1, limit = 10) {
        const vendor = await this.prisma.vendor.findUnique({
            where: {
                userId
            }
        });
        if (!vendor) throw new _common.NotFoundException('Vendor not found');
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            this.prisma.orderItem.findMany({
                where: {
                    vendorId: vendor.id
                },
                include: {
                    order: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            },
                            address: true
                        }
                    },
                    product: {
                        select: {
                            name: true,
                            images: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.orderItem.count({
                where: {
                    vendorId: vendor.id
                }
            })
        ]);
        return {
            message: 'Orders fetched',
            data: {
                orders,
                total,
                page,
                limit
            }
        };
    }
    async getDashboard(userId) {
        const vendor = await this.prisma.vendor.findUnique({
            where: {
                userId
            }
        });
        if (!vendor) throw new _common.NotFoundException('Vendor not found');
        const [totalProducts, totalOrders, pendingOrders, totalRevenue] = await Promise.all([
            this.prisma.product.count({
                where: {
                    vendorId: vendor.id
                }
            }),
            this.prisma.orderItem.count({
                where: {
                    vendorId: vendor.id
                }
            }),
            this.prisma.orderItem.count({
                where: {
                    vendorId: vendor.id,
                    status: 'PENDING'
                }
            }),
            this.prisma.orderItem.aggregate({
                where: {
                    vendorId: vendor.id,
                    status: 'DELIVERED'
                },
                _sum: {
                    total: true
                }
            })
        ]);
        return {
            message: 'Dashboard data',
            data: {
                totalProducts,
                totalOrders,
                pendingOrders,
                totalRevenue: totalRevenue._sum.total || 0,
                commissionRate: vendor.commissionRate,
                totalEarnings: vendor.totalEarnings
            }
        };
    }
    async updateOrderItemStatus(userId, orderItemId, status) {
        const vendor = await this.prisma.vendor.findUnique({
            where: {
                userId
            }
        });
        if (!vendor) throw new _common.NotFoundException('Vendor not found');
        const item = await this.prisma.orderItem.findFirst({
            where: {
                id: orderItemId,
                vendorId: vendor.id
            }
        });
        if (!item) throw new _common.NotFoundException('Order item not found');
        const updated = await this.prisma.orderItem.update({
            where: {
                id: orderItemId
            },
            data: {
                status: status
            }
        });
        return {
            message: 'Order status updated',
            data: updated
        };
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
VendorService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], VendorService);

//# sourceMappingURL=vendor.service.js.map