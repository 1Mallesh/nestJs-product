"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PaymentsController", {
    enumerable: true,
    get: function() {
        return PaymentsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _client = require("@prisma/client");
const _paymentsservice = require("./payments.service");
const _paymentdto = require("./dto/payment.dto");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _rolesguard = require("../common/guards/roles.guard");
const _rolesdecorator = require("../common/decorators/roles.decorator");
const _currentuserdecorator = require("../common/decorators/current-user.decorator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let PaymentsController = class PaymentsController {
    createRazorpayOrder(userId, dto) {
        return this.paymentsService.createRazorpayOrder(userId, dto);
    }
    verifyPayment(dto) {
        return this.paymentsService.verifyPayment(dto);
    }
    getPaymentStatus(orderId) {
        return this.paymentsService.getPaymentStatus(orderId);
    }
    processRefund(dto) {
        return this.paymentsService.processRefund(dto);
    }
    constructor(paymentsService){
        this.paymentsService = paymentsService;
    }
};
_ts_decorate([
    (0, _common.Post)('create-order'),
    (0, _swagger.ApiOperation)({
        summary: 'Create Razorpay payment order'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _paymentdto.CreateRazorpayOrderDto === "undefined" ? Object : _paymentdto.CreateRazorpayOrderDto
    ]),
    _ts_metadata("design:returntype", void 0)
], PaymentsController.prototype, "createRazorpayOrder", null);
_ts_decorate([
    (0, _common.Post)('verify'),
    (0, _swagger.ApiOperation)({
        summary: 'Verify Razorpay payment signature'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _paymentdto.VerifyPaymentDto === "undefined" ? Object : _paymentdto.VerifyPaymentDto
    ]),
    _ts_metadata("design:returntype", void 0)
], PaymentsController.prototype, "verifyPayment", null);
_ts_decorate([
    (0, _common.Get)(':orderId/status'),
    (0, _swagger.ApiOperation)({
        summary: 'Get payment status for an order'
    }),
    _ts_param(0, (0, _common.Param)('orderId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], PaymentsController.prototype, "getPaymentStatus", null);
_ts_decorate([
    (0, _common.Post)('refund'),
    (0, _common.UseGuards)(_rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_client.Role.ADMIN),
    (0, _swagger.ApiOperation)({
        summary: 'Process refund (Admin)'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _paymentdto.RefundDto === "undefined" ? Object : _paymentdto.RefundDto
    ]),
    _ts_metadata("design:returntype", void 0)
], PaymentsController.prototype, "processRefund", null);
PaymentsController = _ts_decorate([
    (0, _swagger.ApiTags)('Payments'),
    (0, _swagger.ApiBearerAuth)('JWT-auth'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('payments'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _paymentsservice.PaymentsService === "undefined" ? Object : _paymentsservice.PaymentsService
    ])
], PaymentsController);

//# sourceMappingURL=payments.controller.js.map