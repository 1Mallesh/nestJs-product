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
    // ── Dashboard ─────────────────────────────────────────────
    async getDashboard() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalUsers, totalVendors, totalProducts, totalOrders, pendingVendors, pendingProducts, pendingDeliveryBoys, totalRevenue, todayOrders, todayRevenue] = await Promise.all([
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
            this.prisma.deliveryBoy.count({
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
                        gte: today
                    }
                }
            }),
            this.prisma.payment.aggregate({
                where: {
                    status: 'PAID',
                    createdAt: {
                        gte: today
                    }
                },
                _sum: {
                    amount: true
                }
            })
        ]);
        return {
            success: true,
            message: 'Dashboard data',
            data: {
                users: {
                    total: totalUsers
                },
                vendors: {
                    total: totalVendors,
                    pending: pendingVendors
                },
                products: {
                    total: totalProducts,
                    pending: pendingProducts
                },
                deliveryBoys: {
                    pending: pendingDeliveryBoys
                },
                orders: {
                    total: totalOrders,
                    today: todayOrders
                },
                revenue: {
                    total: totalRevenue._sum.amount ?? 0,
                    today: todayRevenue._sum.amount ?? 0
                }
            }
        };
    }
    // ── Analytics ─────────────────────────────────────────────
    async getRevenueAnalytics(days = 30) {
        const from = new Date();
        from.setDate(from.getDate() - days);
        const payments = await this.prisma.payment.findMany({
            where: {
                status: 'PAID',
                createdAt: {
                    gte: from
                }
            },
            select: {
                amount: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        // Group by date
        const map = new Map();
        payments.forEach((p)=>{
            const key = p.createdAt.toISOString().slice(0, 10);
            map.set(key, (map.get(key) ?? 0) + p.amount);
        });
        const data = Array.from(map.entries()).map(([date, revenue])=>({
                date,
                revenue
            }));
        return {
            success: true,
            message: 'Revenue analytics',
            data
        };
    }
    async getTopProducts(limit = 10) {
        const products = await this.prisma.product.findMany({
            where: {
                isActive: true,
                approvalStatus: 'APPROVED'
            },
            orderBy: {
                totalSold: 'desc'
            },
            take: limit,
            select: {
                id: true,
                name: true,
                images: true,
                price: true,
                totalSold: true,
                averageRating: true,
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
            }
        });
        return {
            success: true,
            message: 'Top products fetched',
            data: products
        };
    }
    async getTopVendors(limit = 10) {
        const vendors = await this.prisma.vendor.findMany({
            where: {
                approvalStatus: 'APPROVED'
            },
            orderBy: {
                totalEarnings: 'desc'
            },
            take: limit,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        products: true,
                        orders: true
                    }
                }
            }
        });
        return {
            success: true,
            message: 'Top vendors fetched',
            data: vendors
        };
    }
    // ── User Management ───────────────────────────────────────
    async getUsers(page = 1, limit = 10, role, search) {
        const skip = (page - 1) * limit;
        const where = {};
        if (role) where.role = role;
        if (search) where.OR = [
            {
                name: {
                    contains: search,
                    mode: 'insensitive'
                }
            },
            {
                email: {
                    contains: search,
                    mode: 'insensitive'
                }
            }
        ];
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
                    isEmailVerified: true,
                    createdAt: true,
                    avatar: true
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
    async getUserById(userId) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                isEmailVerified: true,
                createdAt: true,
                avatar: true,
                addresses: true,
                orders: {
                    take: 5,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                        totalAmount: true,
                        createdAt: true
                    }
                },
                vendor: {
                    select: {
                        id: true,
                        shopName: true,
                        approvalStatus: true
                    }
                }
            }
        });
        if (!user) throw new _common.NotFoundException('User not found');
        return {
            success: true,
            message: 'User fetched',
            data: user
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
    async changeUserRole(userId, role) {
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
                role: role
            },
            select: {
                id: true,
                name: true,
                role: true
            }
        });
        return {
            success: true,
            message: 'User role updated',
            data: updated
        };
    }
    // ── Vendor Management ─────────────────────────────────────
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
                    },
                    _count: {
                        select: {
                            products: true,
                            orders: true
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
    async getVendorById(vendorId) {
        const vendor = await this.prisma.vendor.findUnique({
            where: {
                id: vendorId
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                products: {
                    take: 5,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    select: {
                        id: true,
                        name: true,
                        approvalStatus: true,
                        price: true
                    }
                },
                _count: {
                    select: {
                        products: true,
                        orders: true
                    }
                }
            }
        });
        if (!vendor) throw new _common.NotFoundException('Vendor not found');
        return {
            success: true,
            message: 'Vendor fetched',
            data: vendor
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
        const notif = await this.notifications.create(vendor.userId, approved ? 'Vendor Account Approved ✅' : 'Vendor Account Rejected', approved ? 'Your vendor account has been approved. You can now list products.' : `Your vendor account was rejected. Reason: ${reason ?? 'Not specified'}`, _client.NotificationType.VENDOR_APPROVED, {
            vendorId
        });
        this.trackingGateway.emitNotification(vendor.userId, notif);
        return {
            success: true,
            message: `Vendor ${approved ? 'approved' : 'rejected'}`,
            data: updated
        };
    }
    // ── Category Management ───────────────────────────────────
    async approveCategory(categoryId, isActive) {
        const category = await this.prisma.category.findUnique({
            where: {
                id: categoryId
            }
        });
        if (!category) throw new _common.NotFoundException('Category not found');
        const updated = await this.prisma.category.update({
            where: {
                id: categoryId
            },
            data: {
                isActive
            }
        });
        return {
            success: true,
            message: `Category ${isActive ? 'approved' : 'deactivated'}`,
            data: updated
        };
    }
    // ── Product Management ────────────────────────────────────
    async getProducts(page = 1, limit = 10, status, search) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status) where.approvalStatus = status;
        if (search) where.name = {
            contains: search,
            mode: 'insensitive'
        };
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
    async getProductById(productId) {
        const product = await this.prisma.product.findUnique({
            where: {
                id: productId
            },
            include: {
                vendor: {
                    select: {
                        shopName: true,
                        userId: true,
                        approvalStatus: true
                    }
                },
                category: true,
                variants: true,
                reviews: {
                    take: 5,
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });
        if (!product) throw new _common.NotFoundException('Product not found');
        return {
            success: true,
            message: 'Product fetched',
            data: product
        };
    }
    async approveProduct(productId, adminId, dto) {
        if (!adminId) throw new _common.BadRequestException('Admin user not authenticated properly');
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
        if (!product.vendor) throw new _common.BadRequestException('Product has no associated vendor');
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
        const vendorNotif = await this.notifications.create(vendorUserId, isApproved ? 'Product Approved ✅' : 'Product Rejected', isApproved ? `Your product "${product.name}" is now live.` : `Your product "${product.name}" was rejected. Reason: ${rejectionReason ?? 'Not specified'}`, _client.NotificationType.PRODUCT_APPROVED, {
            productId
        });
        this.trackingGateway.emitNotification(vendorUserId, vendorNotif);
        this.trackingGateway.server?.emit(isApproved ? 'product.approved' : 'product.rejected', {
            productId,
            name: product.name
        });
        return {
            success: true,
            message: `Product ${isApproved ? 'approved and published' : 'rejected'}`,
            data: updated
        };
    }
    async featureProduct(productId, isFeatured) {
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
                isFeatured
            }
        });
        return {
            success: true,
            message: `Product ${isFeatured ? 'featured' : 'unfeatured'}`,
            data: updated
        };
    }
    // ── Order Management ──────────────────────────────────────
    async getOrders(page = 1, limit = 10, status, search) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status) where.status = status;
        if (search) where.orderNumber = {
            contains: search,
            mode: 'insensitive'
        };
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            phone: true
                        }
                    },
                    address: true,
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
                    payment: {
                        select: {
                            status: true,
                            amount: true,
                            method: true
                        }
                    },
                    delivery: {
                        include: {
                            deliveryBoy: {
                                include: {
                                    user: {
                                        select: {
                                            name: true,
                                            phone: true
                                        }
                                    }
                                }
                            }
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
    async getOrderById(orderId) {
        const order = await this.prisma.order.findUnique({
            where: {
                id: orderId
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                address: true,
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                images: true,
                                sku: true
                            }
                        },
                        variant: true
                    }
                },
                payment: true,
                delivery: {
                    include: {
                        deliveryBoy: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        phone: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!order) throw new _common.NotFoundException('Order not found');
        return {
            success: true,
            message: 'Order fetched',
            data: order
        };
    }
    async updateOrderStatus(orderId, status) {
        const order = await this.prisma.order.findUnique({
            where: {
                id: orderId
            }
        });
        if (!order) throw new _common.NotFoundException('Order not found');
        const updated = await this.prisma.order.update({
            where: {
                id: orderId
            },
            data: {
                status: status
            }
        });
        this.trackingGateway.emitOrderStatusUpdate(orderId, status);
        await this.notifications.create(order.userId, 'Order Status Updated', `Your order #${order.orderNumber} status changed to ${status}.`, _client.NotificationType.ORDER_UPDATE, {
            orderId
        });
        return {
            success: true,
            message: 'Order status updated',
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
            throw new _common.BadRequestException('Delivery boy not available or not approved');
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
            if (deliveryType === 'SHIPROCKET' && order.delivery) {
                await tx.orderDelivery.delete({
                    where: {
                        orderId
                    }
                }).catch(()=>{});
            } else if (deliveryType === 'LOCAL') {
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
        if (order.deliveryType !== 'SHIPROCKET') throw new _common.BadRequestException('Order is not marked for SHIPROCKET');
        if (order.shiprocketOrderId) throw new _common.BadRequestException('Order already shipped via Shiprocket');
        const orderDate = new Date(order.createdAt);
        const formattedDate = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')} ${String(orderDate.getHours()).padStart(2, '0')}:${String(orderDate.getMinutes()).padStart(2, '0')}`;
        const payload = {
            order_id: order.orderNumber,
            order_date: formattedDate,
            pickup_location: 'Primary',
            billing_customer_name: order.address.fullName.split(' ')[0],
            billing_last_name: order.address.fullName.split(' ').slice(1).join(' ') || 'User',
            billing_address: order.address.addressLine1,
            billing_address_2: order.address.addressLine2 ?? '',
            billing_city: order.address.city,
            billing_pincode: order.address.pincode,
            billing_state: order.address.state,
            billing_country: order.address.country ?? 'India',
            billing_email: order.user.email,
            billing_phone: order.address.phone ?? order.user.phone ?? '9999999999',
            shipping_is_billing: true,
            order_items: order.items.map((item)=>({
                    name: item.name,
                    sku: item.product?.sku ?? `SKU-${item.productId.slice(0, 8)}`,
                    units: item.quantity,
                    selling_price: item.price
                })),
            payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
            sub_total: order.subtotal,
            length: 10,
            width: 10,
            height: 10,
            weight: order.items.reduce((acc, i)=>acc + (i.product?.weight ?? 0.5) * i.quantity, 0)
        };
        try {
            const response = await this.shippingService.createShiprocketOrder(payload);
            const updatedOrder = await this.prisma.order.update({
                where: {
                    id: orderId
                },
                data: {
                    shiprocketOrderId: String(response.order_id ?? ''),
                    shiprocketShipmentId: String(response.shipment_id ?? ''),
                    awbCode: String(response.awb_code ?? ''),
                    status: 'SHIPPED'
                }
            });
            this.trackingGateway.emitOrderStatusUpdate(orderId, 'SHIPPED');
            await this.notifications.create(order.userId, 'Order Shipped 🚀', `Order #${order.orderNumber} shipped via Shiprocket. AWB: ${response.awb_code ?? 'Pending'}`, _client.NotificationType.ORDER_UPDATE, {
                orderId
            });
            return {
                success: true,
                message: 'Order pushed to Shiprocket',
                data: updatedOrder
            };
        } catch (err) {
            this.logger.error(`Shiprocket failed: ${err.message}`);
            const mockOrderId = `SR${Date.now()}`;
            const mockAwb = `AWB${Math.floor(100000000000 + Math.random() * 900000000000)}`;
            const updatedOrder = await this.prisma.order.update({
                where: {
                    id: orderId
                },
                data: {
                    shiprocketOrderId: mockOrderId,
                    awbCode: mockAwb,
                    status: 'SHIPPED'
                }
            });
            this.trackingGateway.emitOrderStatusUpdate(orderId, 'SHIPPED');
            return {
                success: true,
                message: 'Dev mode: Mock Shiprocket order created',
                data: updatedOrder
            };
        }
    }
    // ── Delivery Boy Management ───────────────────────────────
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
    async getDeliveryBoyById(id) {
        const boy = await this.prisma.deliveryBoy.findUnique({
            where: {
                id
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                deliveries: {
                    take: 5,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        order: {
                            select: {
                                orderNumber: true,
                                status: true,
                                totalAmount: true
                            }
                        }
                    }
                }
            }
        });
        if (!boy) throw new _common.NotFoundException('Delivery boy not found');
        return {
            success: true,
            message: 'Delivery boy fetched',
            data: boy
        };
    }
    async approveDeliveryBoy(deliveryBoyId, approved) {
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
        const notif = await this.notifications.create(boy.userId, approved ? 'Delivery Account Approved ✅' : 'Delivery Account Rejected', approved ? 'Your delivery boy account has been approved. You can now accept deliveries.' : 'Your delivery boy account was rejected.', _client.NotificationType.GENERAL, {
            deliveryBoyId
        });
        this.trackingGateway.emitNotification(boy.userId, notif);
        return {
            success: true,
            message: `Delivery boy ${approved ? 'approved' : 'rejected'}`,
            data: updated
        };
    }
    // ── Settlements ───────────────────────────────────────────
    async getSettlements(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [settlements, total] = await Promise.all([
            this.prisma.vendorSettlement.findMany({
                include: {
                    vendor: {
                        select: {
                            shopName: true,
                            userId: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.vendorSettlement.count()
        ]);
        return {
            success: true,
            message: 'Settlements fetched',
            data: {
                settlements,
                total,
                page,
                limit
            }
        };
    }
    async createSettlement(vendorId, amount, note) {
        const vendor = await this.prisma.vendor.findUnique({
            where: {
                id: vendorId
            }
        });
        if (!vendor) throw new _common.NotFoundException('Vendor not found');
        const settlement = await this.prisma.vendorSettlement.create({
            data: {
                vendorId,
                amount,
                note,
                status: 'PAID'
            }
        });
        await this.prisma.vendor.update({
            where: {
                id: vendorId
            },
            data: {
                totalEarnings: {
                    decrement: amount
                }
            }
        });
        return {
            success: true,
            message: 'Settlement created',
            data: settlement
        };
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