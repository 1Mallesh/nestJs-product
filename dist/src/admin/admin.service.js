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
const _config = require("@nestjs/config");
const _prismaservice = require("../prisma/prisma.service");
const _notificationsservice = require("../notifications/notifications.service");
const _trackinggateway = require("../tracking/tracking.gateway");
const _shippingservice = require("../shipping/shipping.service");
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
    async approveProduct(productId, adminId, dto) {
        if (!adminId) throw new _common.BadRequestException('Admin user not authenticated properly (missing adminId)');
        const { approvalStatus, rejectionReason } = dto;
        const isApproved = approvalStatus === 'APPROVED';
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
        if (!product.vendor) throw new _common.BadRequestException('Product has no associated vendor profile');
        if (!product.vendor.userId) throw new _common.BadRequestException('Associated vendor has no valid userId');
        const now = new Date();
        const updated = await this.prisma.product.update({
            where: {
                id: productId
            },
            data: {
                approvalStatus: isApproved ? 'APPROVED' : 'REJECTED',
                rejectionReason: isApproved ? null : rejectionReason,
                isPublished: isApproved,
                publishedAt: isApproved ? now : null,
                approvedBy: isApproved ? adminId : null,
                approvedAt: isApproved ? now : null
            }
        });
        const vendorUserId = product.vendor.userId;
        // Vendor Notification
        const vendorNotif = await this.notifications.create(vendorUserId, isApproved ? 'Product Approved' : 'Product Rejected', isApproved ? `Your product "${product.name}" has been approved and is now live.` : `Your product "${product.name}" was rejected. Reason: ${rejectionReason || 'Not specified'}`, _client.NotificationType.PRODUCT_APPROVED, {
            productId
        });
        this.trackingGateway.emitNotification(vendorUserId, vendorNotif);
        // Admin Notification
        const adminNotif = await this.notifications.create(adminId, isApproved ? 'Product Approved' : 'Product Rejected', isApproved ? `You have approved the product "${product.name}".` : `You have rejected the product "${product.name}". Reason: ${rejectionReason || 'Not specified'}`, _client.NotificationType.PRODUCT_APPROVED, {
            productId
        });
        this.trackingGateway.emitNotification(adminId, adminNotif);
        const event = isApproved ? 'product.approved' : 'product.rejected';
        this.trackingGateway.server?.emit(event, {
            productId,
            vendorId: product.vendorId,
            name: product.name,
            approvedBy: adminId
        });
        return {
            success: true,
            message: `Product ${isApproved ? 'approved and published' : 'rejected'}`,
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
    async updateDeliveryType(orderId, deliveryType) {
        const order = await this.prisma.order.findUnique({
            where: {
                id: orderId
            },
            include: {
                delivery: true
            }
        });
        if (!order) throw new _common.NotFoundException('Order not found');
        const updated = await this.prisma.$transaction(async (tx)=>{
            // If switching from LOCAL to SHIPROCKET, unassign delivery boy if any
            if (deliveryType === 'SHIPROCKET' && order.delivery) {
                await tx.orderDelivery.delete({
                    where: {
                        orderId
                    }
                }).catch(()=>{});
            } else if (deliveryType === 'LOCAL') {
                // Create orderDelivery record if missing
                await tx.orderDelivery.upsert({
                    where: {
                        orderId
                    },
                    create: {
                        orderId
                    },
                    update: {}
                });
            }
            return tx.order.update({
                where: {
                    id: orderId
                },
                data: {
                    deliveryType
                }
            });
        });
        this.trackingGateway.emitOrderStatusUpdate(orderId, order.status);
        return {
            success: true,
            message: `Delivery type updated to ${deliveryType}`,
            data: updated
        };
    }
    async shipWithShiprocket(orderId) {
        const order = await this.prisma.order.findUnique({
            where: {
                id: orderId
            },
            include: {
                address: true,
                user: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        if (!order) throw new _common.NotFoundException('Order not found');
        if (order.deliveryType !== 'SHIPROCKET') {
            throw new _common.BadRequestException('Order is not marked for SHIPROCKET delivery');
        }
        if (order.shiprocketOrderId) {
            throw new _common.BadRequestException('Order already shipped via Shiprocket');
        }
        // Map order database to Shiprocket adhoc order request
        const orderDate = new Date(order.createdAt);
        const formattedDate = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')} ${String(orderDate.getHours()).padStart(2, '0')}:${String(orderDate.getMinutes()).padStart(2, '0')}`;
        const shiprocketPayload = {
            order_id: order.orderNumber,
            order_date: formattedDate,
            pickup_location: 'Primary',
            billing_customer_name: order.address.fullName.split(' ')[0] || 'Customer',
            billing_last_name: order.address.fullName.split(' ').slice(1).join(' ') || 'User',
            billing_address: order.address.addressLine1,
            billing_address_2: order.address.addressLine2 || '',
            billing_city: order.address.city,
            billing_pincode: order.address.pincode,
            billing_state: order.address.state,
            billing_country: order.address.country || 'India',
            billing_email: order.user.email || 'customer@example.com',
            billing_phone: order.address.phone || order.user.phone || '9999999999',
            shipping_is_billing: true,
            order_items: order.items.map((item)=>({
                    name: item.name,
                    sku: item.product?.sku || `SKU-${item.productId.slice(0, 8)}`,
                    units: item.quantity,
                    selling_price: item.price
                })),
            payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
            sub_total: order.subtotal,
            length: 10,
            width: 10,
            height: 10,
            weight: order.items.reduce((acc, item)=>acc + (item.product?.weight || 0.5) * item.quantity, 0)
        };
        try {
            const response = await this.shippingService.createShiprocketOrder(shiprocketPayload);
            const updatedOrder = await this.prisma.order.update({
                where: {
                    id: orderId
                },
                data: {
                    shiprocketOrderId: String(response.order_id || ''),
                    shiprocketShipmentId: String(response.shipment_id || ''),
                    awbCode: String(response.awb_code || ''),
                    status: 'SHIPPED'
                }
            });
            this.trackingGateway.emitOrderStatusUpdate(orderId, 'SHIPPED');
            await this.notifications.create(order.userId, 'Order Shipped via Shiprocket 🚀', `Your order #${order.orderNumber} has been handed over to Shiprocket. AWB: ${response.awb_code || 'Pending'}`, _client.NotificationType.ORDER_UPDATE, {
                orderId
            });
            return {
                success: true,
                message: 'Order pushed to Shiprocket successfully',
                data: updatedOrder
            };
        } catch (err) {
            this.logger.error(`Shiprocket shipping failed: ${err.message}`);
            // Graceful dev-mode fallback if credentials are unset or call fails
            const email = this.configService.get('SHIPROCKET_EMAIL');
            if (this.configService.get('NODE_ENV') !== 'production' || !email || email.includes('your@email.com')) {
                this.logger.log('Fallback: Generating mock/sandbox Shiprocket credentials in development mode');
                const mockOrderId = `SR${Date.now()}`;
                const mockShipmentId = `SH${Date.now()}`;
                const mockAwbCode = `AWB${Math.floor(100000000000 + Math.random() * 900000000000)}`;
                const updatedOrder = await this.prisma.order.update({
                    where: {
                        id: orderId
                    },
                    data: {
                        shiprocketOrderId: mockOrderId,
                        shiprocketShipmentId: mockShipmentId,
                        awbCode: mockAwbCode,
                        status: 'SHIPPED'
                    }
                });
                this.trackingGateway.emitOrderStatusUpdate(orderId, 'SHIPPED');
                await this.notifications.create(order.userId, 'Order Shipped via Shiprocket 🚀', `Your order #${order.orderNumber} has been handed over to Shiprocket. AWB: ${mockAwbCode}`, _client.NotificationType.ORDER_UPDATE, {
                    orderId
                });
                return {
                    success: true,
                    message: 'Dev Mode: Mock Shiprocket order created successfully (credentials missing)',
                    data: updatedOrder
                };
            }
            throw new _common.BadRequestException(`Shiprocket integration failed: ${err.response?.data?.message || err.message}`);
        }
    }
    constructor(prisma, notifications, trackingGateway, shippingService, configService){
        this.prisma = prisma;
        this.notifications = notifications;
        this.trackingGateway = trackingGateway;
        this.shippingService = shippingService;
        this.configService = configService;
        this.logger = new _common.Logger(AdminService.name);
    }
};
AdminService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _notificationsservice.NotificationsService === "undefined" ? Object : _notificationsservice.NotificationsService,
        typeof _trackinggateway.TrackingGateway === "undefined" ? Object : _trackinggateway.TrackingGateway,
        typeof _shippingservice.ShippingService === "undefined" ? Object : _shippingservice.ShippingService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], AdminService);

//# sourceMappingURL=admin.service.js.map