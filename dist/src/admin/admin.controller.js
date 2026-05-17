"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AdminController", {
    enumerable: true,
    get: function() {
        return AdminController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _client = require("@prisma/client");
const _adminservice = require("./admin.service");
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
let AdminController = class AdminController {
    getDashboard() {
        return this.adminService.getDashboard();
    }
    // Vendor endpoints
    getVendors(page, limit, status) {
        return this.adminService.getVendors(page, limit, status);
    }
    approveVendor(id, approved, reason) {
        return this.adminService.approveVendor(id, approved, reason);
    }
    // Product endpoints
    getProducts(page, limit, status) {
        return this.adminService.getProducts(page, limit, status);
    }
    approveProduct(id, adminId, approved, reason) {
        return this.adminService.approveProduct(id, adminId, approved, reason);
    }
    // User endpoints
    getUsers(page, limit, role) {
        return this.adminService.getUsers(page, limit, role);
    }
    toggleBlock(id) {
        return this.adminService.toggleUserBlock(id);
    }
    // Order endpoints
    getOrders(page, limit, status) {
        return this.adminService.getOrders(page, limit, status);
    }
    assignDelivery(orderId, deliveryBoyId) {
        return this.adminService.assignDeliveryBoy(orderId, deliveryBoyId);
    }
    // Delivery Boy endpoints
    getDeliveryBoys(page, limit, status) {
        return this.adminService.getDeliveryBoys(page, limit, status);
    }
    approveDeliveryBoy(id, approved) {
        return this.adminService.approveDeliveryBoy(id, approved);
    }
    // Analytics
    getRevenue(days) {
        return this.adminService.getRevenueAnalytics(days);
    }
    constructor(adminService){
        this.adminService = adminService;
    }
};
_ts_decorate([
    (0, _common.Get)('dashboard'),
    (0, _swagger.ApiOperation)({
        summary: 'Admin dashboard analytics'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getDashboard", null);
_ts_decorate([
    (0, _common.Get)('vendors'),
    (0, _swagger.ApiOperation)({
        summary: 'Get all vendors'
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
    _ts_param(0, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Query)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getVendors", null);
_ts_decorate([
    (0, _common.Patch)('vendors/:id/approve'),
    (0, _swagger.ApiOperation)({
        summary: 'Approve or reject vendor'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('approved')),
    _ts_param(2, (0, _common.Body)('reason')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Boolean,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "approveVendor", null);
_ts_decorate([
    (0, _common.Get)('products'),
    (0, _swagger.ApiOperation)({
        summary: 'Get all products'
    }),
    (0, _swagger.ApiQuery)({
        name: 'status',
        required: false
    }),
    _ts_param(0, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Query)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getProducts", null);
_ts_decorate([
    (0, _common.Patch)('products/:id/approve'),
    (0, _swagger.ApiOperation)({
        summary: 'Approve or reject product'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _currentuserdecorator.CurrentUser)('sub')),
    _ts_param(2, (0, _common.Body)('approved')),
    _ts_param(3, (0, _common.Body)('reason')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Boolean,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "approveProduct", null);
_ts_decorate([
    (0, _common.Get)('users'),
    (0, _swagger.ApiOperation)({
        summary: 'Get all users'
    }),
    _ts_param(0, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Query)('role')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getUsers", null);
_ts_decorate([
    (0, _common.Patch)('users/:id/toggle-block'),
    (0, _swagger.ApiOperation)({
        summary: 'Block or unblock a user'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "toggleBlock", null);
_ts_decorate([
    (0, _common.Get)('orders'),
    (0, _swagger.ApiOperation)({
        summary: 'Get all orders'
    }),
    _ts_param(0, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Query)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getOrders", null);
_ts_decorate([
    (0, _common.Post)('orders/:orderId/assign-delivery'),
    (0, _swagger.ApiOperation)({
        summary: 'Assign delivery boy to order'
    }),
    _ts_param(0, (0, _common.Param)('orderId')),
    _ts_param(1, (0, _common.Body)('deliveryBoyId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "assignDelivery", null);
_ts_decorate([
    (0, _common.Get)('delivery-boys'),
    (0, _swagger.ApiOperation)({
        summary: 'Get all delivery boys'
    }),
    _ts_param(0, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Query)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getDeliveryBoys", null);
_ts_decorate([
    (0, _common.Patch)('delivery-boys/:id/approve'),
    (0, _swagger.ApiOperation)({
        summary: 'Approve or reject delivery boy'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('approved')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Boolean
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "approveDeliveryBoy", null);
_ts_decorate([
    (0, _common.Get)('analytics/revenue'),
    (0, _swagger.ApiOperation)({
        summary: 'Revenue analytics'
    }),
    (0, _swagger.ApiQuery)({
        name: 'days',
        required: false
    }),
    _ts_param(0, (0, _common.Query)('days', new _common.DefaultValuePipe(30), _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getRevenue", null);
AdminController = _ts_decorate([
    (0, _swagger.ApiTags)('Admin'),
    (0, _swagger.ApiBearerAuth)('JWT-auth'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_client.Role.ADMIN),
    (0, _common.Controller)('admin'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _adminservice.AdminService === "undefined" ? Object : _adminservice.AdminService
    ])
], AdminController);

//# sourceMappingURL=admin.controller.js.map