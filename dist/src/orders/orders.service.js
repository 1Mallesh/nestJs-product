"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OrdersService", {
    enumerable: true,
    get: function() {
        return OrdersService;
    }
});
const _common = require("@nestjs/common");
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
// ─── Constants ────────────────────────────────────────────────────────────────
const GST_RATE = 0.18; // 18% GST included in product price
const PLATFORM_COMMISSION = 0.10; // 10% platform commission from vendor
const FREE_DELIVERY_THRESHOLD = 499; // Free delivery above ₹499
let OrdersService = class OrdersService {
    // ── Create Order ────────────────────────────────────────────────────────────
    async createOrder(userId, dto) {
        this.logger.log(`[createOrder] userId=${userId} dto=${JSON.stringify(dto)}`);
        // 1. Resolve delivery address
        const address = await this.prisma.address.findFirst({
            where: {
                id: dto.addressId,
                userId
            }
        });
        if (!address) {
            this.logger.warn(`[createOrder] Address not found: addressId=${dto.addressId} userId=${userId}`);
            throw new _common.NotFoundException('Delivery address not found. Please add a valid address.');
        }
        // 2. Resolve cart items — prefer DB cart, fall back to request payload
        let enrichedItems = [];
        const dbCart = await this.prisma.cart.findUnique({
            where: {
                userId
            },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                vendor: true
                            }
                        },
                        variant: true
                    }
                }
            }
        });
        if (dbCart && dbCart.items.length > 0) {
            this.logger.log(`[createOrder] Using DB cart with ${dbCart.items.length} items`);
            enrichedItems = dbCart.items.map((item)=>({
                    productId: item.productId,
                    variantId: item.variantId,
                    vendorId: item.product.vendorId,
                    vendorCommissionRate: item.product.vendor?.commissionRate ?? PLATFORM_COMMISSION * 100,
                    name: item.product.name,
                    image: item.product.images[0] ?? null,
                    price: item.price,
                    quantity: item.quantity,
                    total: item.price * item.quantity
                }));
        } else if (dto.items && dto.items.length > 0) {
            this.logger.log(`[createOrder] DB cart empty — using ${dto.items.length} items from request payload`);
            enrichedItems = await this.enrichItemsFromPayload(dto.items);
        } else {
            this.logger.warn(`[createOrder] No items found in DB cart or request for userId=${userId}`);
            throw new _common.BadRequestException('Your cart is empty. Please add items before placing an order.');
        }
        // 3. Stock validation for every item
        await this.validateStock(enrichedItems);
        // 4. Price calculations
        const subtotal = enrichedItems.reduce((sum, i)=>sum + i.total, 0);
        // Reverse-calculate GST from GST-inclusive price (18% GST, so GST = price × 18/118)
        const gstAmount = Math.round(subtotal * (GST_RATE / (1 + GST_RATE)) * 100) / 100;
        // Platform commission (shared across all vendor items)
        const platformCommission = enrichedItems.reduce((sum, i)=>sum + i.total * (i.vendorCommissionRate / 100), 0);
        // Coupon discount
        let discount = 0;
        let appliedCouponId = null;
        if (dto.couponCode) {
            const couponResult = await this.applyCoupon(dto.couponCode, subtotal);
            discount = couponResult.discount;
            appliedCouponId = couponResult.couponId;
        }
        // Shipping: free above threshold or if local delivery
        const deliveryType = await this.shippingService.determineDeliveryType(address);
        let shippingCharge = subtotal - discount >= FREE_DELIVERY_THRESHOLD ? 0 : deliveryType === 'LOCAL' ? 0 : 49;
        // Special custom coupon code bypass for real payment testing (below ₹10)
        if (dto.couponCode && dto.couponCode.toUpperCase().trim() === 'REALTEST') {
            discount = subtotal - 1;
            shippingCharge = 0;
        }
        const totalAmount = Math.round((subtotal - discount + shippingCharge) * 100) / 100;
        const orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;
        this.logger.log(`[createOrder] subtotal=${subtotal} gst=${gstAmount} commission=${platformCommission} ` + `discount=${discount} shipping=${shippingCharge} total=${totalAmount} method=${dto.paymentMethod}`);
        // 5. Create order + items + deduct stock in one transaction
        const order = await this.prisma.$transaction(async (tx)=>{
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    addressId: dto.addressId,
                    orderNumber,
                    paymentMethod: dto.paymentMethod,
                    subtotal,
                    discount,
                    shippingCharge,
                    totalAmount,
                    notes: dto.notes,
                    deliveryType: deliveryType,
                    status: dto.paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING',
                    paymentStatus: 'PENDING',
                    items: {
                        create: enrichedItems.map((item)=>({
                                productId: item.productId,
                                variantId: item.variantId,
                                vendorId: item.vendorId,
                                name: item.name,
                                image: item.image,
                                price: item.price,
                                quantity: item.quantity,
                                total: item.total,
                                status: 'PENDING'
                            }))
                    }
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },
                    address: true
                }
            });
            // Deduct stock and increment totalSold per product
            for (const item of enrichedItems){
                await tx.product.update({
                    where: {
                        id: item.productId
                    },
                    data: {
                        stock: {
                            decrement: item.quantity
                        },
                        totalSold: {
                            increment: item.quantity
                        }
                    }
                });
            }
            // COD: create payment record + order delivery immediately
            if (dto.paymentMethod === 'COD') {
                await tx.payment.create({
                    data: {
                        orderId: newOrder.id,
                        amount: totalAmount,
                        status: 'PENDING',
                        method: 'COD'
                    }
                });
                await tx.orderDelivery.create({
                    data: {
                        orderId: newOrder.id
                    }
                });
            }
            // Clear DB cart if it was used
            if (dbCart && dbCart.items.length > 0) {
                await tx.cartItem.deleteMany({
                    where: {
                        cartId: dbCart.id
                    }
                });
            }
            return newOrder;
        });
        // 6. Update vendor earnings (outside transaction — non-critical)
        await this.updateVendorEarnings(enrichedItems);
        // 7. Update coupon usage count
        if (appliedCouponId) {
            await this.prisma.coupon.update({
                where: {
                    id: appliedCouponId
                },
                data: {
                    usedCount: {
                        increment: 1
                    }
                }
            });
        }
        // 8. Notify each unique vendor + admin
        await this.sendOrderNotifications(order, enrichedItems, dto.paymentMethod);
        // 9. Emit real-time events
        this.trackingGateway.server?.emit('order.created', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            totalAmount,
            paymentMethod: dto.paymentMethod,
            userId
        });
        // 9b. Auto-assign delivery boy for COD orders immediately if local delivery
        if (dto.paymentMethod === 'COD' && deliveryType === 'LOCAL') {
            try {
                let availableBoy = null;
                if (address && address.latitude && address.longitude) {
                    const boys = await this.prisma.deliveryBoy.findMany({
                        where: {
                            approvalStatus: 'APPROVED',
                            isAvailable: true
                        }
                    });
                    let minDistance = Infinity;
                    for (const boy of boys){
                        if (boy.currentLatitude && boy.currentLongitude) {
                            const distance = this.calculateDistance(address.latitude, address.longitude, boy.currentLatitude, boy.currentLongitude);
                            if (distance < minDistance) {
                                minDistance = distance;
                                availableBoy = boy;
                            }
                        }
                    }
                }
                if (!availableBoy) {
                    availableBoy = await this.prisma.deliveryBoy.findFirst({
                        where: {
                            approvalStatus: 'APPROVED',
                            isAvailable: true
                        },
                        orderBy: {
                            totalDeliveries: 'asc'
                        }
                    });
                }
                if (availableBoy) {
                    await this.prisma.orderDelivery.upsert({
                        where: {
                            orderId: order.id
                        },
                        create: {
                            orderId: order.id,
                            deliveryBoyId: availableBoy.id,
                            assignedAt: new Date()
                        },
                        update: {
                            deliveryBoyId: availableBoy.id,
                            assignedAt: new Date()
                        }
                    });
                    await this.prisma.order.update({
                        where: {
                            id: order.id
                        },
                        data: {
                            status: 'CONFIRMED'
                        }
                    });
                    // Notify the delivery boy
                    this.trackingGateway.emitNotification(availableBoy.userId, {
                        title: 'New COD Delivery Assigned 🚲',
                        message: `Order #${order.orderNumber} has been assigned to you. Please pick up immediately.`,
                        orderNumber: order.orderNumber,
                        orderId: order.id
                    });
                    this.trackingGateway.emitOrderStatusUpdate(order.id, 'CONFIRMED');
                    this.logger.log(`[createOrder] Auto-assigned COD order ${order.orderNumber} to delivery boy ${availableBoy.id}`);
                }
            } catch (err) {
                this.logger.warn(`[createOrder] COD auto-assignment failed: ${err.message}`);
            }
        }
        return {
            message: 'Order placed successfully',
            data: {
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                subtotal,
                gstAmount,
                platformCommission: Math.round(platformCommission * 100) / 100,
                discount,
                shippingCharge,
                totalAmount,
                deliveryType,
                itemCount: enrichedItems.length
            }
        };
    }
    // ── Helpers ─────────────────────────────────────────────────────────────────
    async enrichItemsFromPayload(items) {
        const enriched = [];
        for (const item of items){
            const product = await this.prisma.product.findUnique({
                where: {
                    id: item.productId
                },
                include: {
                    vendor: true
                }
            });
            if (!product) throw new _common.NotFoundException(`Product not found: ${item.productId}`);
            if (!product.isActive || product.approvalStatus !== 'APPROVED') {
                throw new _common.BadRequestException(`Product "${product.name}" is not available.`);
            }
            let price = product.price;
            if (item.variantId) {
                const variant = await this.prisma.productVariant.findUnique({
                    where: {
                        id: item.variantId
                    }
                });
                if (!variant) throw new _common.NotFoundException(`Variant not found: ${item.variantId}`);
                price = variant.price ?? product.price;
            }
            enriched.push({
                productId: product.id,
                variantId: item.variantId ?? null,
                vendorId: product.vendorId,
                vendorCommissionRate: product.vendor?.commissionRate ?? PLATFORM_COMMISSION * 100,
                name: product.name,
                image: product.images[0] ?? null,
                price,
                quantity: item.quantity,
                total: price * item.quantity
            });
        }
        return enriched;
    }
    async validateStock(items) {
        const ids = items.map((i)=>i.productId);
        const products = await this.prisma.product.findMany({
            where: {
                id: {
                    in: ids
                }
            },
            select: {
                id: true,
                name: true,
                stock: true
            }
        });
        for (const item of items){
            const product = products.find((p)=>p.id === item.productId);
            if (!product) throw new _common.NotFoundException(`Product not found: ${item.productId}`);
            if (product.stock < item.quantity) {
                throw new _common.BadRequestException(`"${product.name}" only has ${product.stock} unit(s) in stock (requested ${item.quantity}).`);
            }
        }
    }
    async applyCoupon(code, subtotal) {
        const coupon = await this.prisma.coupon.findFirst({
            where: {
                code: code.toUpperCase().trim(),
                isActive: true,
                minOrderAmount: {
                    lte: subtotal
                },
                AND: [
                    {
                        OR: [
                            {
                                expiresAt: null
                            },
                            {
                                expiresAt: {
                                    gt: new Date()
                                }
                            }
                        ]
                    },
                    {
                        OR: [
                            {
                                usageLimit: null
                            },
                            {
                                usedCount: {
                                    lt: 999999
                                }
                            }
                        ]
                    }
                ]
            }
        });
        if (!coupon) {
            this.logger.warn(`[createOrder] Coupon "${code}" invalid or not applicable`);
            return {
                discount: 0,
                couponId: null
            };
        }
        let discount = coupon.discountType === 'PERCENTAGE' ? subtotal * coupon.discountValue / 100 : coupon.discountValue;
        if (coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
        }
        return {
            discount: Math.round(discount * 100) / 100,
            couponId: coupon.id
        };
    }
    async updateVendorEarnings(items) {
        // Group earnings by vendorId
        const earningsByVendor = new Map();
        for (const item of items){
            const earning = item.total * (1 - item.vendorCommissionRate / 100);
            earningsByVendor.set(item.vendorId, (earningsByVendor.get(item.vendorId) ?? 0) + earning);
        }
        for (const [vendorId, amount] of earningsByVendor){
            await this.prisma.vendor.update({
                where: {
                    id: vendorId
                },
                data: {
                    totalEarnings: {
                        increment: Math.round(amount * 100) / 100
                    }
                }
            }).catch((err)=>{
                this.logger.warn(`[createOrder] Failed to update earnings for vendor ${vendorId}: ${err.message}`);
            });
        }
    }
    async sendOrderNotifications(order, items, paymentMethod) {
        try {
            // Notify each unique vendor
            const vendorIds = [
                ...new Set(items.map((i)=>i.vendorId))
            ];
            for (const vendorId of vendorIds){
                const vendor = await this.prisma.vendor.findUnique({
                    where: {
                        id: vendorId
                    }
                });
                if (!vendor) continue;
                const vendorItems = items.filter((i)=>i.vendorId === vendorId);
                const vendorTotal = vendorItems.reduce((s, i)=>s + i.total, 0);
                const notif = await this.notifications.create(vendor.userId, 'New Order Received', `Order #${order.orderNumber} — ${vendorItems.length} item(s) worth ₹${vendorTotal.toFixed(2)} via ${paymentMethod}`, _client.NotificationType.ORDER_UPDATE, {
                    orderId: order.id,
                    orderNumber: order.orderNumber
                });
                this.trackingGateway.emitNotification(vendor.userId, notif);
            }
            // Notify all admins
            const admins = await this.prisma.user.findMany({
                where: {
                    role: 'ADMIN'
                }
            });
            for (const admin of admins){
                const notif = await this.notifications.create(admin.id, 'New Order Placed', `Order #${order.orderNumber} placed via ${paymentMethod}. Total: ₹${order.totalAmount}`, _client.NotificationType.ORDER_UPDATE, {
                    orderId: order.id
                });
                this.trackingGateway.emitNotification(admin.id, notif);
            }
        } catch (err) {
            this.logger.warn(`[createOrder] Notification dispatch failed: ${err.message}`);
        }
    }
    // ── Get Orders ──────────────────────────────────────────────────────────────
    async getOrders(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where: {
                    userId
                },
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
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.order.count({
                where: {
                    userId
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
    // ── Get Order By ID ──────────────────────────────────────────────────────────
    async getOrderById(userId, orderId) {
        const order = await this.prisma.order.findFirst({
            where: {
                id: orderId,
                userId
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                images: true,
                                sku: true
                            }
                        },
                        vendor: {
                            select: {
                                shopName: true
                            }
                        }
                    }
                },
                address: true,
                payment: true,
                delivery: {
                    include: {
                        deliveryBoy: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        phone: true,
                                        avatar: true
                                    }
                                }
                            }
                        }
                    }
                },
                tracking: {
                    orderBy: {
                        timestamp: 'desc'
                    },
                    take: 20
                }
            }
        });
        if (!order) throw new _common.NotFoundException('Order not found');
        return {
            message: 'Order fetched',
            data: order
        };
    }
    // ── Cancel Order ─────────────────────────────────────────────────────────────
    async cancelOrder(userId, orderId, dto) {
        const order = await this.prisma.order.findFirst({
            where: {
                id: orderId,
                userId
            },
            include: {
                items: true
            }
        });
        if (!order) throw new _common.NotFoundException('Order not found');
        if (![
            'PENDING',
            'CONFIRMED'
        ].includes(order.status)) {
            throw new _common.BadRequestException(`Cannot cancel order in "${order.status}" status. Only PENDING or CONFIRMED orders can be cancelled.`);
        }
        await this.prisma.$transaction(async (tx)=>{
            await tx.order.update({
                where: {
                    id: orderId
                },
                data: {
                    status: 'CANCELLED',
                    cancellationReason: dto.reason
                }
            });
            // Restore stock
            for (const item of order.items){
                await tx.product.update({
                    where: {
                        id: item.productId
                    },
                    data: {
                        stock: {
                            increment: item.quantity
                        },
                        totalSold: {
                            decrement: item.quantity
                        }
                    }
                });
            }
            // Mark payment as refunded if paid
            if (order.paymentStatus === 'PAID') {
                await tx.payment.updateMany({
                    where: {
                        orderId
                    },
                    data: {
                        status: 'REFUNDED'
                    }
                });
                await tx.order.update({
                    where: {
                        id: orderId
                    },
                    data: {
                        paymentStatus: 'REFUNDED'
                    }
                });
            }
        });
        // Reverse vendor earnings
        const items = order.items;
        for (const item of items){
            const product = await this.prisma.product.findUnique({
                where: {
                    id: item.productId
                },
                include: {
                    vendor: true
                }
            });
            if (product?.vendor) {
                const earning = item.total * (1 - (product.vendor.commissionRate ?? 10) / 100);
                await this.prisma.vendor.update({
                    where: {
                        id: product.vendorId
                    },
                    data: {
                        totalEarnings: {
                            decrement: Math.round(earning * 100) / 100
                        }
                    }
                }).catch(()=>{});
            }
        }
        return {
            message: 'Order cancelled successfully'
        };
    }
    // ── Order Tracking (full rich response for customer tracking page) ────────────
    async getOrderTracking(orderId) {
        const order = await this.prisma.order.findUnique({
            where: {
                id: orderId
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                images: true,
                                sku: true
                            }
                        },
                        vendor: {
                            select: {
                                shopName: true
                            }
                        }
                    }
                },
                address: true,
                payment: true,
                delivery: {
                    include: {
                        deliveryBoy: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        phone: true,
                                        avatar: true
                                    }
                                }
                            }
                        }
                    }
                },
                tracking: {
                    orderBy: {
                        timestamp: 'desc'
                    },
                    take: 50
                }
            }
        });
        if (!order) throw new _common.NotFoundException('Order not found');
        let shiprocketTracking = null;
        if (order.deliveryType === 'SHIPROCKET' && order.awbCode) {
            try {
                const trackingRes = await this.shippingService.trackShiprocket(order.awbCode);
                shiprocketTracking = trackingRes;
            } catch (err) {
                this.logger.warn(`Failed to fetch live Shiprocket tracking for AWB ${order.awbCode}: ${err.message}`);
            }
        }
        return {
            message: 'Order tracking fetched',
            data: {
                ...order,
                shiprocketTracking
            }
        };
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    constructor(prisma, shippingService, notifications, trackingGateway){
        this.prisma = prisma;
        this.shippingService = shippingService;
        this.notifications = notifications;
        this.trackingGateway = trackingGateway;
        this.logger = new _common.Logger(OrdersService.name);
    }
};
OrdersService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _shippingservice.ShippingService === "undefined" ? Object : _shippingservice.ShippingService,
        typeof _notificationsservice.NotificationsService === "undefined" ? Object : _notificationsservice.NotificationsService,
        typeof _trackinggateway.TrackingGateway === "undefined" ? Object : _trackinggateway.TrackingGateway
    ])
], OrdersService);

//# sourceMappingURL=orders.service.js.map