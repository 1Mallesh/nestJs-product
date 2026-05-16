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
                    keyId: this.configService.get('RAZORPAY_KEY_ID')
                }
            };
        } catch  {
            throw new _common.InternalServerErrorException('Failed to create payment order');
        }
    }
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
                payment: true
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
            await tx.orderDelivery.create({
                data: {
                    orderId: order.id
                }
            });
        });
        return {
            message: 'Payment verified successfully',
            data: {
                orderId: order.id
            }
        };
    }
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
            await this.prisma.payment.update({
                where: {
                    orderId: dto.orderId
                },
                data: {
                    status: 'REFUNDED',
                    refundAmount: dto.amount
                }
            });
            await this.prisma.order.update({
                where: {
                    id: dto.orderId
                },
                data: {
                    paymentStatus: 'REFUNDED'
                }
            });
            return {
                message: 'Refund processed',
                data: refund
            };
        } catch  {
            throw new _common.InternalServerErrorException('Refund processing failed');
        }
    }
    constructor(prisma, configService){
        this.prisma = prisma;
        this.configService = configService;
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
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], PaymentsService);

//# sourceMappingURL=payments.service.js.map