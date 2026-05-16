"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DeliveryController", {
    enumerable: true,
    get: function() {
        return DeliveryController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _client = require("@prisma/client");
const _deliveryservice = require("./delivery.service");
const _deliverydto = require("./dto/delivery.dto");
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
let DeliveryController = class DeliveryController {
    onboard(userId, dto) {
        return this.deliveryService.onboard(userId, dto);
    }
    getProfile(userId) {
        return this.deliveryService.getProfile(userId);
    }
    getDashboard(userId) {
        return this.deliveryService.getDashboard(userId);
    }
    getMyDeliveries(userId, status) {
        return this.deliveryService.getMyDeliveries(userId, status);
    }
    updateLocation(userId, dto) {
        return this.deliveryService.updateLocation(userId, dto);
    }
    updateStatus(userId, deliveryId, dto) {
        return this.deliveryService.updateDeliveryStatus(userId, deliveryId, dto);
    }
    toggleAvailability(userId) {
        return this.deliveryService.toggleAvailability(userId);
    }
    constructor(deliveryService){
        this.deliveryService = deliveryService;
    }
};
_ts_decorate([
    (0, _common.Post)('onboard'),
    (0, _rolesdecorator.Roles)(_client.Role.DELIVERY_BOY, _client.Role.CUSTOMER),
    (0, _swagger.ApiOperation)({
        summary: 'Delivery boy onboarding'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _deliverydto.DeliveryBoyOnboardDto === "undefined" ? Object : _deliverydto.DeliveryBoyOnboardDto
    ]),
    _ts_metadata("design:returntype", void 0)
], DeliveryController.prototype, "onboard", null);
_ts_decorate([
    (0, _common.Get)('profile'),
    (0, _rolesdecorator.Roles)(_client.Role.DELIVERY_BOY),
    (0, _swagger.ApiOperation)({
        summary: 'Get delivery boy profile'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], DeliveryController.prototype, "getProfile", null);
_ts_decorate([
    (0, _common.Get)('dashboard'),
    (0, _rolesdecorator.Roles)(_client.Role.DELIVERY_BOY),
    (0, _swagger.ApiOperation)({
        summary: 'Delivery boy dashboard'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], DeliveryController.prototype, "getDashboard", null);
_ts_decorate([
    (0, _common.Get)('deliveries'),
    (0, _rolesdecorator.Roles)(_client.Role.DELIVERY_BOY),
    (0, _swagger.ApiOperation)({
        summary: 'Get my assigned deliveries'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Query)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], DeliveryController.prototype, "getMyDeliveries", null);
_ts_decorate([
    (0, _common.Post)('location'),
    (0, _rolesdecorator.Roles)(_client.Role.DELIVERY_BOY),
    (0, _swagger.ApiOperation)({
        summary: 'Update current location (GPS tracking)'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _deliverydto.UpdateLocationDto === "undefined" ? Object : _deliverydto.UpdateLocationDto
    ]),
    _ts_metadata("design:returntype", void 0)
], DeliveryController.prototype, "updateLocation", null);
_ts_decorate([
    (0, _common.Put)('deliveries/:id/status'),
    (0, _rolesdecorator.Roles)(_client.Role.DELIVERY_BOY),
    (0, _swagger.ApiOperation)({
        summary: 'Update delivery status (pickup/delivered)'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _deliverydto.UpdateDeliveryStatusDto === "undefined" ? Object : _deliverydto.UpdateDeliveryStatusDto
    ]),
    _ts_metadata("design:returntype", void 0)
], DeliveryController.prototype, "updateStatus", null);
_ts_decorate([
    (0, _common.Post)('toggle-availability'),
    (0, _rolesdecorator.Roles)(_client.Role.DELIVERY_BOY),
    (0, _swagger.ApiOperation)({
        summary: 'Toggle availability status'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], DeliveryController.prototype, "toggleAvailability", null);
DeliveryController = _ts_decorate([
    (0, _swagger.ApiTags)('Delivery'),
    (0, _swagger.ApiBearerAuth)('JWT-auth'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _common.Controller)('delivery'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _deliveryservice.DeliveryService === "undefined" ? Object : _deliveryservice.DeliveryService
    ])
], DeliveryController);

//# sourceMappingURL=delivery.controller.js.map