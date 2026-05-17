"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PaymentsService", {
    enumerable: true,
    get: function() {
        return PaymentsService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _razorpay = /*#__PURE__*/ _interop_require_default(require("razorpay"));
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _prismaservice = require("../prisma/prisma.service");
const _trackinggateway = require("../tracking/tracking.gateway");
const _notificationsservice = require("../notifications/notifications.service");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PaymentsService = class PaymentsService {
    // ─── Create Razorpay Order ───────────────────────────────────────────────────
    async createRazorpayOrder(userId, dto) {
        const order = await this.prisma.order.findFirst({
            where: {
                id: dto.orderId,
                userId
            }
        });
        if (!order) throw new _common.NotFoundException('Order not found');
        if (order.paymentStatus === 'PAID') throw new _common.BadRequestException('Order already paid');
        const options = {
            amount: Math.round(order.totalAmount * 100),
            currency: 'INR',
            receipt: order.orderNumber,
            notes: {
                orderId: order.id
            }
        };
        try {
            const razorpayOrder = await this.razorpay.orders.create(options);
            await this.prisma.payment.upsert({
                where: {
                    orderId: order.id
                },
                create: {
                    orderId: order.id,
                    razorpayOrderId: razorpayOrder.id,
                    amount: order.totalAmount
                },
                update: {
                    razorpayOrderId: razorpayOrder.id
                }
            });
            return {
                message: 'Razorpay order created',
                data: {
                    razorpayOrderId: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    key: this.configService.get('RAZORPAY_KEY_ID'),
                    keyId: this.configService.get('RAZORPAY_KEY_ID')
                }
            };
        } catch  {
            throw new _common.InternalServerErrorException('Failed to create payment order');
        }
    }
    // ─── Client-side Signature Verify (after Razorpay modal success) ────────────
    async verifyPayment(dto) {
        const secret = this.configService.get('RAZORPAY_KEY_SECRET') || '';
        const body = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
        const expectedSignature = _crypto.createHmac('sha256', secret).update(body).digest('hex');
        if (expectedSignature !== dto.razorpaySignature) {
            throw new _common.BadRequestException('Invalid payment signature');
        }
        const order = await this.prisma.order.findFirst({
            where: {
                id: dto.orderId
            },
            include: {
                payment: true,
                items: {
                    include: {
                        vendor: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                address: true
            }
        });
        if (!order) throw new _common.NotFoundException('Order not found');
        await this.prisma.$transaction(async (tx)=>{
            await tx.payment.update({
                where: {
                    orderId: order.id
                },
                data: {
                    razorpayPaymentId: dto.razorpayPaymentId,
                    razorpaySignature: dto.razorpaySignature,
                    status: 'PAID'
                }
            });
            await tx.order.update({
                where: {
                    id: order.id
                },
                data: {
                    paymentStatus: 'PAID',
                    status: 'CONFIRMED'
                }
            });
            // Create delivery record if it doesn't exist
            const existingDelivery = await tx.orderDelivery.findUnique({
                where: {
                    orderId: order.id
                }
            });
            if (!existingDelivery) {
                await tx.orderDelivery.create({
                    data: {
                        orderId: order.id
                    }
                });
            }
        });
        // ── Auto-assign nearest available delivery boy ───────────────────────────
        try {
            let availableBoy = null;
            // If customer address has GPS coordinates, find the closest one
            if (order.address && order.address.latitude && order.address.longitude) {
                const boys = await this.prisma.deliveryBoy.findMany({
                    where: {
                        approvalStatus: 'APPROVED',
                        isAvailable: true
                    }
                });
                let minDistance = Infinity;
                for (const boy of boys){
                    if (boy.currentLatitude && boy.currentLongitude) {
                        const distance = this.calculateDistance(order.address.latitude, order.address.longitude, boy.currentLatitude, boy.currentLongitude);
                        if (distance < minDistance) {
                            minDistance = distance;
                            availableBoy = boy;
                        }
                    }
                }
            }
            // Fallback: If no boy found via GPS, get the least-loaded one
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
                    title: 'New Delivery Assigned 🚲',
                    message: `Order #${order.orderNumber} has been assigned to you. Please pick up immediately.`,
                    orderNumber: order.orderNumber,
                    orderId: order.id
                });
                this.trackingGateway.emitOrderStatusUpdate(order.id, 'CONFIRMED');
                this.logger.log(`[verifyPayment] Auto-assigned order ${order.orderNumber} to delivery boy ${availableBoy.id}`);
            }
        } catch (err) {
            this.logger.warn(`[verifyPayment] Auto-assignment failed: ${err.message}`);
        }
        // Emit real-time payment confirmed update
        this.trackingGateway.emitOrderStatusUpdate(order.id, 'CONFIRMED');
        // Notify customer
        this.notificationsService.create(order.userId, 'Payment Successful 🎉', `Your payment for order #${order.orderNumber} was successful! Your order is being prepared.`, 'ORDER_UPDATE', {
            orderId: order.id,
            orderNumber: order.orderNumber
        }).catch(()=>{});
        return {
            message: 'Payment verified successfully',
            data: {
                orderId: order.id
            }
        };
    }
    // ─── Razorpay Webhook Handler ────────────────────────────────────────────────
    async handleWebhook(rawBody, signature) {
        const webhookSecret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');
        if (!webhookSecret) {
            this.logger.warn('RAZORPAY_WEBHOOK_SECRET not configured — skipping verification');
        } else {
            const expectedSig = _crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
            if (expectedSig !== signature) {
                this.logger.warn('Razorpay webhook: invalid signature');
                throw new _common.BadRequestException('Invalid webhook signature');
            }
        }
        let event;
        try {
            event = JSON.parse(rawBody.toString('utf8'));
        } catch  {
            throw new _common.BadRequestException('Invalid webhook payload');
        }
        this.logger.log(`Razorpay webhook received: ${event.event}`);
        switch(event.event){
            case 'payment.captured':
                await this.processPaymentCaptured(event);
                break;
            case 'payment.failed':
                await this.processPaymentFailed(event);
                break;
            case 'refund.created':
                await this.processRefundCreated(event);
                break;
            default:
                this.logger.log(`Unhandled webhook event: ${event.event}`);
        }
        return {
            received: true
        };
    }
    // ─── payment.captured ────────────────────────────────────────────────────────
    async processPaymentCaptured(event) {
        const payload = event.payload?.payment?.entity;
        if (!payload) return;
        const razorpayPaymentId = payload.id;
        const razorpayOrderId = payload.order_id;
        const webhookEventId = event.id; // unique per webhook delivery
        // Idempotency: skip if already processed
        const alreadyProcessed = await this.prisma.payment.findFirst({
            where: {
                webhookEventId
            }
        });
        if (alreadyProcessed) {
            this.logger.log(`Webhook ${webhookEventId} already processed — skipping`);
            return;
        }
        const payment = await this.prisma.payment.findFirst({
            where: {
                razorpayOrderId
            }
        });
        if (!payment) {
            this.logger.warn(`payment.captured: no payment record for razorpayOrderId=${razorpayOrderId}`);
            return;
        }
        if (payment.status === 'PAID') {
            this.logger.log(`Payment ${payment.id} already PAID — marking idempotency only`);
            await this.prisma.payment.update({
                where: {
                    id: payment.id
                },
                data: {
                    webhookEventId
                }
            });
            return;
        }
        // Load order with items and vendor commission rates
        const order = await this.prisma.order.findUnique({
            where: {
                id: payment.orderId
            },
            include: {
                items: {
                    include: {
                        vendor: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        if (!order) {
            this.logger.error(`payment.captured: order not found for orderId=${payment.orderId}`);
            return;
        }
        // ── Financial calculations ────────────────────────────────────────────────
        const subtotal = order.subtotal;
        const gstAmount = Math.round(subtotal * (0.18 / 1.18) * 100) / 100;
        const shippingCharge = order.shippingCharge;
        const discount = order.discount;
        const totalAmount = order.totalAmount;
        // Per-vendor commission & earnings
        const vendorBreakdown = {};
        let totalCommission = 0;
        for (const item of order.items){
            const rate = item.vendor.commissionRate / 100;
            const commission = Math.round(item.total * rate * 100) / 100;
            const vendorEarning = Math.round(item.total * (1 - rate) * 100) / 100;
            totalCommission += commission;
            if (!vendorBreakdown[item.vendorId]) {
                vendorBreakdown[item.vendorId] = {
                    vendorId: item.vendorId,
                    shopName: item.vendor.shopName,
                    itemTotal: 0,
                    commission: 0,
                    vendorEarning: 0
                };
            }
            vendorBreakdown[item.vendorId].itemTotal += item.total;
            vendorBreakdown[item.vendorId].commission += commission;
            vendorBreakdown[item.vendorId].vendorEarning += vendorEarning;
        }
        totalCommission = Math.round(totalCommission * 100) / 100;
        const gstOnCommission = Math.round(totalCommission * 0.18 * 100) / 100; // GST platform owes on its commission income
        const deliveryPayout = 0; // set when delivery boy is assigned
        const netPlatformEarning = Math.round((totalCommission - gstOnCommission - deliveryPayout) * 100) / 100;
        // ── Persist everything atomically ─────────────────────────────────────────
        await this.prisma.$transaction(async (tx)=>{
            // 1. Update payment record
            await tx.payment.update({
                where: {
                    id: payment.id
                },
                data: {
                    razorpayPaymentId,
                    status: 'PAID',
                    method: payload.method,
                    webhookEventId
                }
            });
            // 2. Confirm order
            await tx.order.update({
                where: {
                    id: order.id
                },
                data: {
                    paymentStatus: 'PAID',
                    status: 'CONFIRMED'
                }
            });
            // 3. Create delivery record if absent
            const existingDelivery = await tx.orderDelivery.findUnique({
                where: {
                    orderId: order.id
                }
            });
            if (!existingDelivery) {
                await tx.orderDelivery.create({
                    data: {
                        orderId: order.id
                    }
                });
            }
            // 4. Save financial ledger
            await tx.paymentLedger.upsert({
                where: {
                    orderId: order.id
                },
                create: {
                    paymentId: payment.id,
                    orderId: order.id,
                    totalAmount,
                    subtotal,
                    gstAmount,
                    shippingCharge,
                    discount,
                    platformCommission: totalCommission,
                    gstOnCommission,
                    deliveryPayout,
                    netPlatformEarning,
                    vendorBreakdown
                },
                update: {
                    platformCommission: totalCommission,
                    gstOnCommission,
                    netPlatformEarning,
                    vendorBreakdown
                }
            });
            // 5. Increment vendor earnings
            for (const [vendorId, breakdown] of Object.entries(vendorBreakdown)){
                await tx.vendor.update({
                    where: {
                        id: vendorId
                    },
                    data: {
                        totalEarnings: {
                            increment: breakdown.vendorEarning
                        }
                    }
                });
            }
        });
        // ── Notifications ─────────────────────────────────────────────────────────
        // Notify customer
        await this.notificationsService.create(order.userId, 'Payment Successful', `Payment of ₹${totalAmount} for order #${order.orderNumber} confirmed.`, 'PAYMENT_SUCCESS', {
            orderId: order.id,
            amount: totalAmount
        });
        this.trackingGateway.emitNotification(order.userId, {
            title: 'Payment Successful',
            message: `Order #${order.orderNumber} confirmed.`,
            type: 'PAYMENT_SUCCESS',
            orderId: order.id
        });
        // Notify each vendor
        const notifiedVendors = new Set();
        for (const item of order.items){
            if (notifiedVendors.has(item.vendorId)) continue;
            notifiedVendors.add(item.vendorId);
            await this.notificationsService.create(item.vendor.userId, 'New Order Received', `Order #${order.orderNumber} payment confirmed. Prepare for dispatch.`, 'ORDER_UPDATE', {
                orderId: order.id,
                earning: vendorBreakdown[item.vendorId]?.vendorEarning
            });
            this.trackingGateway.emitNotification(item.vendor.userId, {
                title: 'New Order Received',
                message: `Order #${order.orderNumber} is confirmed and ready to pack.`,
                type: 'ORDER_UPDATE',
                orderId: order.id
            });
        }
        // Real-time order status
        this.trackingGateway.emitOrderStatusUpdate(order.id, 'CONFIRMED');
        this.logger.log(`payment.captured processed: order=${order.orderNumber}, amount=₹${totalAmount}, commission=₹${totalCommission}`);
    }
    // ─── payment.failed ──────────────────────────────────────────────────────────
    async processPaymentFailed(event) {
        const payload = event.payload?.payment?.entity;
        if (!payload) return;
        const razorpayOrderId = payload.order_id;
        const failureReason = payload.error_description || 'Payment failed';
        const webhookEventId = event.id;
        const payment = await this.prisma.payment.findFirst({
            where: {
                razorpayOrderId
            }
        });
        if (!payment) return;
        // Idempotency
        if (payment.webhookEventId === webhookEventId) return;
        const order = await this.prisma.order.findUnique({
            where: {
                id: payment.orderId
            }
        });
        if (!order) return;
        await this.prisma.$transaction(async (tx)=>{
            await tx.payment.update({
                where: {
                    id: payment.id
                },
                data: {
                    status: 'FAILED',
                    failureReason,
                    webhookEventId
                }
            });
            await tx.order.update({
                where: {
                    id: order.id
                },
                data: {
                    paymentStatus: 'FAILED',
                    status: 'CANCELLED',
                    cancellationReason: failureReason
                }
            });
        });
        // Restore stock
        await this.restoreStock(order.id);
        await this.notificationsService.create(order.userId, 'Payment Failed', `Payment for order #${order.orderNumber} failed. ${failureReason}`, 'PAYMENT_SUCCESS', {
            orderId: order.id,
            reason: failureReason
        });
        this.trackingGateway.emitOrderStatusUpdate(order.id, 'CANCELLED');
        this.logger.warn(`payment.failed: order=${order.orderNumber}, reason=${failureReason}`);
    }
    // ─── refund.created ──────────────────────────────────────────────────────────
    async processRefundCreated(event) {
        const payload = event.payload?.refund?.entity;
        if (!payload) return;
        const razorpayPaymentId = payload.payment_id;
        const refundId = payload.id;
        const refundAmount = payload.amount / 100;
        const payment = await this.prisma.payment.findFirst({
            where: {
                razorpayPaymentId
            }
        });
        if (!payment) return;
        await this.prisma.payment.update({
            where: {
                id: payment.id
            },
            data: {
                status: 'REFUNDED',
                refundId,
                refundAmount
            }
        });
        await this.prisma.order.update({
            where: {
                id: payment.orderId
            },
            data: {
                paymentStatus: 'REFUNDED'
            }
        });
        this.logger.log(`refund.created: payment=${payment.id}, refundId=${refundId}, amount=₹${refundAmount}`);
    }
    // ─── Stock restoration on payment failure ───────────────────────────────────
    async restoreStock(orderId) {
        const items = await this.prisma.orderItem.findMany({
            where: {
                orderId
            }
        });
        for (const item of items){
            if (item.variantId) {
                await this.prisma.productVariant.update({
                    where: {
                        id: item.variantId
                    },
                    data: {
                        stock: {
                            increment: item.quantity
                        }
                    }
                });
            } else {
                await this.prisma.product.update({
                    where: {
                        id: item.productId
                    },
                    data: {
                        stock: {
                            increment: item.quantity
                        }
                    }
                });
            }
        }
    }
    // ─── Get Payment Status ──────────────────────────────────────────────────────
    async getPaymentStatus(orderId) {
        const payment = await this.prisma.payment.findUnique({
            where: {
                orderId
            },
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        totalAmount: true,
                        status: true
                    }
                }
            }
        });
        if (!payment) throw new _common.NotFoundException('Payment not found');
        return {
            message: 'Payment status',
            data: payment
        };
    }
    // ─── Refund (Admin) ──────────────────────────────────────────────────────────
    async processRefund(dto) {
        const payment = await this.prisma.payment.findUnique({
            where: {
                orderId: dto.orderId
            }
        });
        if (!payment || payment.status !== 'PAID') {
            throw new _common.BadRequestException('Payment not eligible for refund');
        }
        if (!payment.razorpayPaymentId) {
            throw new _common.BadRequestException('Razorpay payment ID not found');
        }
        try {
            const refund = await this.razorpay.payments.refund(payment.razorpayPaymentId, {
                amount: Math.round(dto.amount * 100)
            });
            await this.prisma.$transaction(async (tx)=>{
                await tx.payment.update({
                    where: {
                        orderId: dto.orderId
                    },
                    data: {
                        status: 'REFUNDED',
                        refundAmount: dto.amount
                    }
                });
                await tx.order.update({
                    where: {
                        id: dto.orderId
                    },
                    data: {
                        paymentStatus: 'REFUNDED'
                    }
                });
            });
            return {
                message: 'Refund processed',
                data: refund
            };
        } catch  {
            throw new _common.InternalServerErrorException('Refund processing failed');
        }
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }
    constructor(prisma, configService, trackingGateway, notificationsService){
        this.prisma = prisma;
        this.configService = configService;
        this.trackingGateway = trackingGateway;
        this.notificationsService = notificationsService;
        this.logger = new _common.Logger(PaymentsService.name);
        this.razorpay = new _razorpay.default({
            key_id: this.configService.get('RAZORPAY_KEY_ID') || '',
            key_secret: this.configService.get('RAZORPAY_KEY_SECRET') || ''
        });
    }
};
PaymentsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _trackinggateway.TrackingGateway === "undefined" ? Object : _trackinggateway.TrackingGateway,
        typeof _notificationsservice.NotificationsService === "undefined" ? Object : _notificationsservice.NotificationsService
    ])
], PaymentsService);

//# sourceMappingURL=payments.service.js.map