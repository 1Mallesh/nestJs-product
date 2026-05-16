"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WishlistController", {
    enumerable: true,
    get: function() {
        return WishlistController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _wishlistservice = require("./wishlist.service");
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
let WishlistController = class WishlistController {
    getWishlist(userId) {
        return this.wishlistService.getWishlist(userId);
    }
    toggle(userId, productId) {
        return this.wishlistService.toggle(userId, productId);
    }
    remove(userId, productId) {
        return this.wishlistService.remove(userId, productId);
    }
    constructor(wishlistService){
        this.wishlistService = wishlistService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'Get wishlist'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], WishlistController.prototype, "getWishlist", null);
_ts_decorate([
    (0, _common.Post)(':productId/toggle'),
    (0, _swagger.ApiOperation)({
        summary: 'Toggle product in wishlist'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Param)('productId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], WishlistController.prototype, "toggle", null);
_ts_decorate([
    (0, _common.Delete)(':productId'),
    (0, _swagger.ApiOperation)({
        summary: 'Remove from wishlist'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Param)('productId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], WishlistController.prototype, "remove", null);
WishlistController = _ts_decorate([
    (0, _swagger.ApiTags)('Wishlist'),
    (0, _swagger.ApiBearerAuth)('JWT-auth'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('wishlist'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _wishlistservice.WishlistService === "undefined" ? Object : _wishlistservice.WishlistService
    ])
], WishlistController);

//# sourceMappingURL=wishlist.controller.js.map