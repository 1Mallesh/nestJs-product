"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CartController", {
    enumerable: true,
    get: function() {
        return CartController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _cartservice = require("./cart.service");
const _cartdto = require("./dto/cart.dto");
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
let CartController = class CartController {
    getCart(userId) {
        return this.cartService.getCart(userId);
    }
    addToCart(userId, dto) {
        return this.cartService.addToCart(userId, dto);
    }
    updateItem(userId, itemId, dto) {
        return this.cartService.updateItem(userId, itemId, dto);
    }
    removeItem(userId, itemId) {
        return this.cartService.removeItem(userId, itemId);
    }
    clearCart(userId) {
        return this.cartService.clearCart(userId);
    }
    constructor(cartService){
        this.cartService = cartService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'Get cart'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], CartController.prototype, "getCart", null);
_ts_decorate([
    (0, _common.Post)('add'),
    (0, _swagger.ApiOperation)({
        summary: 'Add item to cart'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _cartdto.AddToCartDto === "undefined" ? Object : _cartdto.AddToCartDto
    ]),
    _ts_metadata("design:returntype", void 0)
], CartController.prototype, "addToCart", null);
_ts_decorate([
    (0, _common.Put)('items/:itemId'),
    (0, _swagger.ApiOperation)({
        summary: 'Update cart item quantity'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Param)('itemId')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _cartdto.UpdateCartItemDto === "undefined" ? Object : _cartdto.UpdateCartItemDto
    ]),
    _ts_metadata("design:returntype", void 0)
], CartController.prototype, "updateItem", null);
_ts_decorate([
    (0, _common.Delete)('items/:itemId'),
    (0, _swagger.ApiOperation)({
        summary: 'Remove item from cart'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Param)('itemId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], CartController.prototype, "removeItem", null);
_ts_decorate([
    (0, _common.Delete)('clear'),
    (0, _swagger.ApiOperation)({
        summary: 'Clear entire cart'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], CartController.prototype, "clearCart", null);
CartController = _ts_decorate([
    (0, _swagger.ApiTags)('Cart'),
    (0, _swagger.ApiBearerAuth)('JWT-auth'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('cart'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _cartservice.CartService === "undefined" ? Object : _cartservice.CartService
    ])
], CartController);

//# sourceMappingURL=cart.controller.js.map