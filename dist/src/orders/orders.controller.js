"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OrdersController", {
    enumerable: true,
    get: function() {
        return OrdersController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _ordersservice = require("./orders.service");
const _orderdto = require("./dto/order.dto");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
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
let OrdersController = class OrdersController {
    createOrder(userId, dto) {
        return this.ordersService.createOrder(userId, dto);
    }
    getOrders(userId, page, limit) {
        return this.ordersService.getOrders(userId, page, limit);
    }
    getOrderById(userId, orderId) {
        return this.ordersService.getOrderById(userId, orderId);
    }
    cancelOrder(userId, orderId, dto) {
        return this.ordersService.cancelOrder(userId, orderId, dto);
    }
    getTracking(orderId) {
        return this.ordersService.getOrderTracking(orderId);
    }
    constructor(ordersService){
        this.ordersService = ordersService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiOperation)({
        summary: 'Create order from cart'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _orderdto.CreateOrderDto === "undefined" ? Object : _orderdto.CreateOrderDto
    ]),
    _ts_metadata("design:returntype", void 0)
], OrdersController.prototype, "createOrder", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'Get all orders for current user'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Number,
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], OrdersController.prototype, "getOrders", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _swagger.ApiOperation)({
        summary: 'Get order details by ID'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], OrdersController.prototype, "getOrderById", null);
_ts_decorate([
    (0, _common.Post)(':id/cancel'),
    (0, _swagger.ApiOperation)({
        summary: 'Cancel an order'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _orderdto.CancelOrderDto === "undefined" ? Object : _orderdto.CancelOrderDto
    ]),
    _ts_metadata("design:returntype", void 0)
], OrdersController.prototype, "cancelOrder", null);
_ts_decorate([
    (0, _common.Get)(':id/tracking'),
    (0, _swagger.ApiOperation)({
        summary: 'Get order tracking history'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], OrdersController.prototype, "getTracking", null);
OrdersController = _ts_decorate([
    (0, _swagger.ApiTags)('Orders'),
    (0, _swagger.ApiBearerAuth)('JWT-auth'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('orders'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _ordersservice.OrdersService === "undefined" ? Object : _ordersservice.OrdersService
    ])
], OrdersController);

//# sourceMappingURL=orders.controller.js.map