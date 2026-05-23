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
const _approveproductdto = require("./dto/approve-product.dto");
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
    // ── Dashboard ─────────────────────────────────────────────
    getDashboard() {
        return this.adminService.getDashboard();
    }
    // ── Analytics ─────────────────────────────────────────────
    getRevenue(days) {
        return this.adminService.getRevenueAnalytics(days);
    }
    getTopProducts(limit) {
        return this.adminService.getTopProducts(limit);
    }
    getTopVendors(limit) {
        return this.adminService.getTopVendors(limit);
    }
    // ── User Management ───────────────────────────────────────
    getUsers(page, limit, role, search) {
        return this.adminService.getUsers(page, limit, role, search);
    }
    getUserById(id) {
        return this.adminService.getUserById(id);
    }
    toggleBlock(id) {
        return this.adminService.toggleUserBlock(id);
    }
    changeRole(id, role) {
        return this.adminService.changeUserRole(id, role);
    }
    // ── Vendor Management ─────────────────────────────────────
    getVendors(page, limit, status) {
        return this.adminService.getVendors(page, limit, status);
    }
    getVendorById(id) {
        return this.adminService.getVendorById(id);
    }
    approveVendor(id, approved, reason) {
        return this.adminService.approveVendor(id, approved, reason);
    }
    // ── Category Management ───────────────────────────────────
    approveCategory(id, isActive) {
        return this.adminService.approveCategory(id, isActive);
    }
    // ── Product Management ────────────────────────────────────
    getProducts(page, limit, status, search) {
        return this.adminService.getProducts(page, limit, status, search);
    }
    getProductById(id) {
        return this.adminService.getProductById(id);
    }
    approveProduct(id, dto, adminId) {
        return this.adminService.approveProduct(id, adminId, dto);
    }
    featureProduct(id, isFeatured) {
        return this.adminService.featureProduct(id, isFeatured);
    }
    // ── Order Management ──────────────────────────────────────
    getOrders(page, limit, status, search) {
        return this.adminService.getOrders(page, limit, status, search);
    }
    getOrderById(id) {
        return this.adminService.getOrderById(id);
    }
    assignDelivery(orderId, deliveryBoyId) {
        return this.adminService.assignDeliveryBoy(orderId, deliveryBoyId);
    }
    updateDeliveryType(orderId, deliveryType) {
        return this.adminService.updateDeliveryType(orderId, deliveryType);
    }
    shipWithShiprocket(orderId) {
        return this.adminService.shipWithShiprocket(orderId);
    }
    updateOrderStatus(orderId, status) {
        return this.adminService.updateOrderStatus(orderId, status);
    }
    // ── Delivery Boy Management ───────────────────────────────
    getDeliveryBoys(page, limit, status) {
        return this.adminService.getDeliveryBoys(page, limit, status);
    }
    getDeliveryBoyById(id) {
        return this.adminService.getDeliveryBoyById(id);
    }
    approveDeliveryBoy(id, approved) {
        return this.adminService.approveDeliveryBoy(id, approved);
    }
    // ── Settlements ───────────────────────────────────────────
    getSettlements(page, limit) {
        return this.adminService.getSettlements(page, limit);
    }
    paySettlement(vendorId, amount, note) {
        return this.adminService.createSettlement(vendorId, amount, note);
    }
    constructor(adminService){
        this.adminService = adminService;
    }
};
_ts_decorate([
    (0, _common.Get)('dashboard'),
    (0, _swagger.ApiOperation)({
        summary: 'Platform overview — users, orders, revenue, pending approvals'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getDashboard", null);
_ts_decorate([
    (0, _common.Get)('analytics/revenue'),
    (0, _swagger.ApiOperation)({
        summary: 'Daily revenue chart for last N days'
    }),
    (0, _swagger.ApiQuery)({
        name: 'days',
        required: false,
        type: Number
    }),
    _ts_param(0, (0, _common.Query)('days', new _common.DefaultValuePipe(30), _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getRevenue", null);
_ts_decorate([
    (0, _common.Get)('analytics/top-products'),
    (0, _swagger.ApiOperation)({
        summary: 'Top selling products'
    }),
    (0, _swagger.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number
    }),
    _ts_param(0, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getTopProducts", null);
_ts_decorate([
    (0, _common.Get)('analytics/top-vendors'),
    (0, _swagger.ApiOperation)({
        summary: 'Top earning vendors'
    }),
    (0, _swagger.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number
    }),
    _ts_param(0, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getTopVendors", null);
_ts_decorate([
    (0, _common.Get)('users'),
    (0, _swagger.ApiOperation)({
        summary: 'List all users with filters'
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
        name: 'role',
        required: false,
        enum: [
            'CUSTOMER',
            'VENDOR',
            'DELIVERY_BOY',
            'ADMIN'
        ]
    }),
    (0, _swagger.ApiQuery)({
        name: 'search',
        required: false
    }),
    _ts_param(0, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Query)('role')),
    _ts_param(3, (0, _common.Query)('search')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getUsers", null);
_ts_decorate([
    (0, _common.Get)('users/:id'),
    (0, _swagger.ApiOperation)({
        summary: 'Get user detail by ID'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getUserById", null);
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
    (0, _common.Patch)('users/:id/role'),
    (0, _swagger.ApiOperation)({
        summary: 'Change user role'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('role')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "changeRole", null);
_ts_decorate([
    (0, _common.Get)('vendors'),
    (0, _swagger.ApiOperation)({
        summary: 'List all vendors'
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
    (0, _common.Get)('vendors/:id'),
    (0, _swagger.ApiOperation)({
        summary: 'Get vendor detail by ID'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getVendorById", null);
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
    (0, _common.Patch)('categories/:id/approve'),
    (0, _swagger.ApiOperation)({
        summary: 'Approve or deactivate a vendor-submitted category'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('isActive')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Boolean
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "approveCategory", null);
_ts_decorate([
    (0, _common.Get)('products'),
    (0, _swagger.ApiOperation)({
        summary: 'List all products with approval filters'
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
    (0, _swagger.ApiQuery)({
        name: 'search',
        required: false
    }),
    _ts_param(0, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Query)('status')),
    _ts_param(3, (0, _common.Query)('search')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getProducts", null);
_ts_decorate([
    (0, _common.Get)('products/:id'),
    (0, _swagger.ApiOperation)({
        summary: 'Get product detail by ID'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getProductById", null);
_ts_decorate([
    (0, _common.Patch)('products/:id/approve'),
    (0, _swagger.ApiOperation)({
        summary: 'Approve or reject a vendor product'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _approveproductdto.ApproveProductDto === "undefined" ? Object : _approveproductdto.ApproveProductDto,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "approveProduct", null);
_ts_decorate([
    (0, _common.Patch)('products/:id/feature'),
    (0, _swagger.ApiOperation)({
        summary: 'Toggle featured status of a product'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('isFeatured')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Boolean
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "featureProduct", null);
_ts_decorate([
    (0, _common.Get)('orders'),
    (0, _swagger.ApiOperation)({
        summary: 'List all orders'
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
    (0, _swagger.ApiQuery)({
        name: 'search',
        required: false
    }),
    _ts_param(0, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Query)('status')),
    _ts_param(3, (0, _common.Query)('search')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getOrders", null);
_ts_decorate([
    (0, _common.Get)('orders/:id'),
    (0, _swagger.ApiOperation)({
        summary: 'Get full order detail by ID'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getOrderById", null);
_ts_decorate([
    (0, _common.Post)('orders/:orderId/assign-delivery'),
    (0, _swagger.ApiOperation)({
        summary: 'Assign a delivery boy to an order'
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
    (0, _common.Patch)('orders/:orderId/delivery-type'),
    (0, _swagger.ApiOperation)({
        summary: 'Switch order between LOCAL and SHIPROCKET delivery'
    }),
    _ts_param(0, (0, _common.Param)('orderId')),
    _ts_param(1, (0, _common.Body)('deliveryType')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "updateDeliveryType", null);
_ts_decorate([
    (0, _common.Post)('orders/:orderId/shiprocket-ship'),
    (0, _swagger.ApiOperation)({
        summary: 'Push order to Shiprocket for shipping'
    }),
    _ts_param(0, (0, _common.Param)('orderId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "shipWithShiprocket", null);
_ts_decorate([
    (0, _common.Patch)('orders/:orderId/status'),
    (0, _swagger.ApiOperation)({
        summary: 'Manually update order status'
    }),
    _ts_param(0, (0, _common.Param)('orderId')),
    _ts_param(1, (0, _common.Body)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "updateOrderStatus", null);
_ts_decorate([
    (0, _common.Get)('delivery-boys'),
    (0, _swagger.ApiOperation)({
        summary: 'List all delivery boys'
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
    (0, _common.Get)('delivery-boys/:id'),
    (0, _swagger.ApiOperation)({
        summary: 'Get delivery boy detail'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getDeliveryBoyById", null);
_ts_decorate([
    (0, _common.Patch)('delivery-boys/:id/approve'),
    (0, _swagger.ApiOperation)({
        summary: 'Approve or reject a delivery boy'
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
    (0, _common.Get)('settlements'),
    (0, _swagger.ApiOperation)({
        summary: 'List all vendor settlements'
    }),
    (0, _swagger.ApiQuery)({
        name: 'page',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'limit',
        required: false
    }),
    _ts_param(0, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getSettlements", null);
_ts_decorate([
    (0, _common.Post)('settlements/:vendorId/pay'),
    (0, _swagger.ApiOperation)({
        summary: 'Create a settlement payout for a vendor'
    }),
    _ts_param(0, (0, _common.Param)('vendorId')),
    _ts_param(1, (0, _common.Body)('amount')),
    _ts_param(2, (0, _common.Body)('note')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Number,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "paySettlement", null);
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