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
const _notificationsservice = require("../notifications/notifications.service");
const _trackinggateway = require("../tracking/tracking.gateway");
const _client = require("@prisma/client");
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
            success: true,
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
            success: true,
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
        const notif = await this.notifications.create(vendor.userId, approved ? 'Vendor Account Approved' : 'Vendor Account Rejected', approved ? 'Your vendor account has been approved. You can now list products.' : `Your vendor account was rejected. Reason: ${reason || 'Not specified'}`, _client.NotificationType.VENDOR_APPROVED, {
            vendorId
        });
        this.trackingGateway.emitNotification(vendor.userId, notif);
        return {
            success: true,
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
                            shopName: true,
                            userId: true
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
            success: true,
            message: 'Products fetched',
            data: {
                products,
                total,
                page,
                limit
            }
        };
    }
    async approveProduct(productId, adminId, approved, reason) {
        const product = await this.prisma.product.findUnique({
            where: {
                id: productId
            },
            include: {
                vendor: {
                    include: {
                        user: true
                    }
                }
            }
        });
        if (!product) throw new _common.NotFoundException('Product not found');
        const now = new Date();
        const updated = await this.prisma.product.update({
            where: {
                id: productId
            },
            data: {
                approvalStatus: approved ? 'APPROVED' : 'REJECTED',
                rejectionReason: approved ? null : reason,
                isPublished: approved,
                publishedAt: approved ? now : null,
                approvedBy: approved ? adminId : null,
                approvedAt: approved ? now : null
            }
        });
        const vendorUserId = product.vendor.userId;
        const notif = await this.notifications.create(vendorUserId, approved ? 'Product Approved' : 'Product Rejected', approved ? `Your product "${product.name}" has been approved and is now live.` : `Your product "${product.name}" was rejected. Reason: ${reason || 'Not specified'}`, _client.NotificationType.PRODUCT_APPROVED, {
            productId
        });
        this.trackingGateway.emitNotification(vendorUserId, notif);
        const event = approved ? 'product.approved' : 'product.rejected';
        this.trackingGateway.server?.emit(event, {
            productId,
            vendorId: product.vendorId,
            name: product.name,
            approvedBy: adminId
        });
        return {
            success: true,
            message: `Product ${approved ? 'approved and published' : 'rejected'}`,
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
            success: true,
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
            success: true,
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
            success: true,
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
            success: true,
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
            success: true,
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
        this.trackingGateway.emitOrderStatusUpdate(orderId, 'PACKED');
        return {
            success: true,
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
            success: true,
            message: 'Revenue analytics',
            data: revenue
        };
    }
    constructor(prisma, notifications, trackingGateway){
        this.prisma = prisma;
        this.notifications = notifications;
        this.trackingGateway = trackingGateway;
    }
};
AdminService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _notificationsservice.NotificationsService === "undefined" ? Object : _notificationsservice.NotificationsService,
        typeof _trackinggateway.TrackingGateway === "undefined" ? Object : _trackinggateway.TrackingGateway
    ])
], AdminService);

//# sourceMappingURL=admin.service.js.map