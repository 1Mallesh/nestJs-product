"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "VendorController", {
    enumerable: true,
    get: function() {
        return VendorController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _client = require("@prisma/client");
const _vendorservice = require("./vendor.service");
const _vendoronboarddto = require("./dto/vendor-onboard.dto");
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
let VendorController = class VendorController {
    // ── Onboarding ────────────────────────────────────────────
    onboard(userId, dto) {
        return this.vendorService.onboard(userId, dto);
    }
    // ── Profile ───────────────────────────────────────────────
    getProfile(userId) {
        return this.vendorService.getProfile(userId);
    }
    updateProfile(userId, dto) {
        return this.vendorService.updateProfile(userId, dto);
    }
    // ── Dashboard ─────────────────────────────────────────────
    getDashboard(userId) {
        return this.vendorService.getDashboard(userId);
    }
    // ── Products ──────────────────────────────────────────────
    getMyProducts(userId, page, limit, status) {
        return this.vendorService.getMyProducts(userId, page, limit, status);
    }
    getProductStats(userId) {
        return this.vendorService.getProductStats(userId);
    }
    // ── Orders ────────────────────────────────────────────────
    getOrders(userId, page, limit, status) {
        return this.vendorService.getOrders(userId, page, limit, status);
    }
    updateOrderStatus(userId, itemId, status) {
        return this.vendorService.updateOrderItemStatus(userId, itemId, status);
    }
    // ── Earnings & Settlements ────────────────────────────────
    getEarnings(userId) {
        return this.vendorService.getEarnings(userId);
    }
    getSettlements(userId, page, limit) {
        return this.vendorService.getSettlements(userId, page, limit);
    }
    constructor(vendorService){
        this.vendorService = vendorService;
    }
};
_ts_decorate([
    (0, _common.Post)('onboard'),
    (0, _rolesdecorator.Roles)(_client.Role.VENDOR, _client.Role.CUSTOMER),
    (0, _swagger.ApiOperation)({
        summary: 'Submit vendor KYC & onboarding'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _vendoronboarddto.VendorOnboardDto === "undefined" ? Object : _vendoronboarddto.VendorOnboardDto
    ]),
    _ts_metadata("design:returntype", void 0)
], VendorController.prototype, "onboard", null);
_ts_decorate([
    (0, _common.Get)('profile'),
    (0, _rolesdecorator.Roles)(_client.Role.VENDOR),
    (0, _swagger.ApiOperation)({
        summary: 'Get vendor profile with user info'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], VendorController.prototype, "getProfile", null);
_ts_decorate([
    (0, _common.Put)('profile'),
    (0, _rolesdecorator.Roles)(_client.Role.VENDOR),
    (0, _swagger.ApiOperation)({
        summary: 'Update shop info and bank details'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _vendoronboarddto.UpdateVendorDto === "undefined" ? Object : _vendoronboarddto.UpdateVendorDto
    ]),
    _ts_metadata("design:returntype", void 0)
], VendorController.prototype, "updateProfile", null);
_ts_decorate([
    (0, _common.Get)('dashboard'),
    (0, _rolesdecorator.Roles)(_client.Role.VENDOR),
    (0, _swagger.ApiOperation)({
        summary: 'Vendor dashboard — revenue, orders, product stats'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], VendorController.prototype, "getDashboard", null);
_ts_decorate([
    (0, _common.Get)('products'),
    (0, _rolesdecorator.Roles)(_client.Role.VENDOR),
    (0, _swagger.ApiOperation)({
        summary: 'Get all my products with approval status'
    }),
    (0, _swagger.ApiQuery)({
        name: 'page',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'limit',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'status',
        required: false,
        enum: [
            'PENDING',
            'APPROVED',
            'REJECTED'
        ]
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_param(3, (0, _common.Query)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Number,
        Number,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], VendorController.prototype, "getMyProducts", null);
_ts_decorate([
    (0, _common.Get)('products/stats'),
    (0, _rolesdecorator.Roles)(_client.Role.VENDOR),
    (0, _swagger.ApiOperation)({
        summary: 'Product counts by approval status'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], VendorController.prototype, "getProductStats", null);
_ts_decorate([
    (0, _common.Get)('orders'),
    (0, _rolesdecorator.Roles)(_client.Role.VENDOR),
    (0, _swagger.ApiOperation)({
        summary: 'Get orders for my products'
    }),
    (0, _swagger.ApiQuery)({
        name: 'page',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'limit',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'status',
        required: false
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_param(3, (0, _common.Query)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Number,
        Number,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], VendorController.prototype, "getOrders", null);
_ts_decorate([
    (0, _common.Put)('orders/:itemId/status'),
    (0, _rolesdecorator.Roles)(_client.Role.VENDOR),
    (0, _swagger.ApiOperation)({
        summary: 'Update order item status (PROCESSING → SHIPPED)'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Param)('itemId')),
    _ts_param(2, (0, _common.Body)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], VendorController.prototype, "updateOrderStatus", null);
_ts_decorate([
    (0, _common.Get)('earnings'),
    (0, _rolesdecorator.Roles)(_client.Role.VENDOR),
    (0, _swagger.ApiOperation)({
        summary: 'Total earnings and commission summary'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], VendorController.prototype, "getEarnings", null);
_ts_decorate([
    (0, _common.Get)('settlements'),
    (0, _rolesdecorator.Roles)(_client.Role.VENDOR),
    (0, _swagger.ApiOperation)({
        summary: 'Settlement history (paid out amounts)'
    }),
    (0, _swagger.ApiQuery)({
        name: 'page',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'limit',
        required: false
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
], VendorController.prototype, "getSettlements", null);
VendorController = _ts_decorate([
    (0, _swagger.ApiTags)('Vendor'),
    (0, _swagger.ApiBearerAuth)('JWT-auth'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _common.Controller)('vendor'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _vendorservice.VendorService === "undefined" ? Object : _vendorservice.VendorService
    ])
], VendorController);

//# sourceMappingURL=vendor.controller.js.map