"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AdminService", {
    enumerable: true,
    get: function() {
        return AdminService;
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
let AdminService = class AdminService {
    async getDashboard() {
        const [totalUsers, totalVendors, totalProducts, totalOrders, pendingVendors, pendingProducts, totalRevenue, todayOrders] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.vendor.count({
                where: {
                    approvalStatus: 'APPROVED'
                }
            }),
            this.prisma.product.count({
                where: {
                    isActive: true,
                    approvalStatus: 'APPROVED'
                }
            }),
            this.prisma.order.count(),
            this.prisma.vendor.count({
                where: {
                    approvalStatus: 'PENDING'
                }
            }),
            this.prisma.product.count({
                where: {
                    approvalStatus: 'PENDING'
                }
            }),
            this.prisma.payment.aggregate({
                where: {
                    status: 'PAID'
                },
                _sum: {
                    amount: true
                }
            }),
            this.prisma.order.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            })
        ]);
        return {
            message: 'Dashboard data',
            data: {
                totalUsers,
                totalVendors,
                totalProducts,
                totalOrders,
                pendingVendors,
                pendingProducts,
                totalRevenue: totalRevenue._sum.amount || 0,
                todayOrders
            }
        };
    }
    // Vendor Management
    async getVendors(page = 1, limit = 10, status) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status) where.approvalStatus = status;
        const [vendors, total] = await Promise.all([
            this.prisma.vendor.findMany({
                where,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            phone: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.vendor.count({
                where
            })
        ]);
        return {
            message: 'Vendors fetched',
            data: {
                vendors,
                total,
                page,
                limit
            }
        };
    }
    async approveVendor(vendorId, approved, reason) {
        const vendor = await this.prisma.vendor.findUnique({
            where: {
                id: vendorId
            }
        });
        if (!vendor) throw new _common.NotFoundException('Vendor not found');
        const updated = await this.prisma.vendor.update({
            where: {
                id: vendorId
            },
            data: {
                approvalStatus: approved ? 'APPROVED' : 'REJECTED',
                rejectionReason: approved ? null : reason
            }
        });
        // Update user role to VENDOR if approved
        if (approved) {
            await this.prisma.user.update({
                where: {
                    id: vendor.userId
                },
                data: {
                    role: 'VENDOR'
                }
            });
        }
        return {
            message: `Vendor ${approved ? 'approved' : 'rejected'}`,
            data: updated
        };
    }
    // Product Management
    async getProducts(page = 1, limit = 10, status) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status) where.approvalStatus = status;
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: {
                    vendor: {
                        select: {
                            shopName: true
                        }
                    },
                    category: {
                        select: {
                            name: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.product.count({
                where
            })
        ]);
        return {
            message: 'Products fetched',
            data: {
                products,
                total,
                page,
                limit
            }
        };
    }
    async approveProduct(productId, approved, reason) {
        const product = await this.prisma.product.findUnique({
            where: {
                id: productId
            }
        });
        if (!product) throw new _common.NotFoundException('Product not found');
        const updated = await this.prisma.product.update({
            where: {
                id: productId
            },
            data: {
                approvalStatus: approved ? 'APPROVED' : 'REJECTED',
                rejectionReason: approved ? null : reason
            }
        });
        return {
            message: `Product ${approved ? 'approved' : 'rejected'}`,
            data: updated
        };
    }
    // User Management
    async getUsers(page = 1, limit = 10, role) {
        const skip = (page - 1) * limit;
        const where = {};
        if (role) where.role = role;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    createdAt: true
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.user.count({
                where
            })
        ]);
        return {
            message: 'Users fetched',
            data: {
                users,
                total,
                page,
                limit
            }
        };
    }
    async toggleUserBlock(userId) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) throw new _common.NotFoundException('User not found');
        const updated = await this.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                isActive: !user.isActive
            },
            select: {
                id: true,
                name: true,
                isActive: true
            }
        });
        return {
            message: `User ${updated.isActive ? 'unblocked' : 'blocked'}`,
            data: updated
        };
    }
    // Order Management
    async getOrders(page = 1, limit = 10, status) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status) where.status = status;
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },
                    payment: {
                        select: {
                            status: true,
                            amount: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.order.count({
                where
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
    // Delivery Boy Management
    async getDeliveryBoys(page = 1, limit = 10, status) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status) where.approvalStatus = status;
        const [boys, total] = await Promise.all([
            this.prisma.deliveryBoy.findMany({
                where,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            phone: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.deliveryBoy.count({
                where
            })
        ]);
        return {
            message: 'Delivery boys fetched',
            data: {
                boys,
                total,
                page,
                limit
            }
        };
    }
    async approveDeliveryBoy(deliveryBoyId, approved, reason) {
        const boy = await this.prisma.deliveryBoy.findUnique({
            where: {
                id: deliveryBoyId
            }
        });
        if (!boy) throw new _common.NotFoundException('Delivery boy not found');
        const updated = await this.prisma.deliveryBoy.update({
            where: {
                id: deliveryBoyId
            },
            data: {
                approvalStatus: approved ? 'APPROVED' : 'REJECTED'
            }
        });
        if (approved) {
            await this.prisma.user.update({
                where: {
                    id: boy.userId
                },
                data: {
                    role: 'DELIVERY_BOY'
                }
            });
        }
        return {
            message: `Delivery boy ${approved ? 'approved' : 'rejected'}`,
            data: updated
        };
    }
    async assignDeliveryBoy(orderId, deliveryBoyId) {
        const order = await this.prisma.order.findUnique({
            where: {
                id: orderId
            },
            include: {
                delivery: true
            }
        });
        if (!order) throw new _common.NotFoundException('Order not found');
        if (order.paymentStatus !== 'PAID' && order.paymentMethod !== 'COD') {
            throw new _common.BadRequestException('Order payment not confirmed');
        }
        const deliveryBoy = await this.prisma.deliveryBoy.findUnique({
            where: {
                id: deliveryBoyId
            }
        });
        if (!deliveryBoy || deliveryBoy.approvalStatus !== 'APPROVED') {
            throw new _common.BadRequestException('Delivery boy not available');
        }
        const delivery = await this.prisma.orderDelivery.upsert({
            where: {
                orderId
            },
            create: {
                orderId,
                deliveryBoyId,
                assignedAt: new Date()
            },
            update: {
                deliveryBoyId,
                assignedAt: new Date()
            }
        });
        await this.prisma.order.update({
            where: {
                id: orderId
            },
            data: {
                status: 'PACKED'
            }
        });
        return {
            message: 'Delivery boy assigned',
            data: delivery
        };
    }
    // Analytics
    async getRevenueAnalytics(days = 30) {
        const from = new Date();
        from.setDate(from.getDate() - days);
        const revenue = await this.prisma.payment.groupBy({
            by: [
                'createdAt'
            ],
            where: {
                status: 'PAID',
                createdAt: {
                    gte: from
                }
            },
            _sum: {
                amount: true
            }
        });
        return {
            message: 'Revenue analytics',
            data: revenue
        };
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
AdminService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], AdminService);

//# sourceMappingURL=admin.service.js.map