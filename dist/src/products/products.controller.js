"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductsController", {
    enumerable: true,
    get: function() {
        return ProductsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _client = require("@prisma/client");
const _productsservice = require("./products.service");
const _productdto = require("./dto/product.dto");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _rolesguard = require("../common/guards/roles.guard");
const _rolesdecorator = require("../common/decorators/roles.decorator");
const _currentuserdecorator = require("../common/decorators/current-user.decorator");
const _publicdecorator = require("../common/decorators/public.decorator");
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
let ProductsController = class ProductsController {
    create(userId, dto) {
        return this.productsService.create(userId, dto);
    }
    findAll(page, limit, categoryId, search, minPrice, maxPrice) {
        return this.productsService.findAll({
            page,
            limit,
            categoryId,
            search,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined
        });
    }
    getVendorProducts(userId, page, limit) {
        return this.productsService.getVendorProducts(userId, page, limit);
    }
    getFeatured(page, limit) {
        return this.productsService.getFeatured(page, limit);
    }
    findOne(id) {
        return this.productsService.findOne(id);
    }
    update(userId, id, dto) {
        return this.productsService.update(userId, id, dto);
    }
    remove(userId, id) {
        return this.productsService.remove(userId, id);
    }
    addVariant(userId, id, dto) {
        return this.productsService.addVariant(userId, id, dto);
    }
    constructor(productsService){
        this.productsService = productsService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiBearerAuth)('JWT-auth'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_client.Role.VENDOR),
    (0, _swagger.ApiOperation)({
        summary: 'Create product (Vendor)'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _productdto.CreateProductDto === "undefined" ? Object : _productdto.CreateProductDto
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductsController.prototype, "create", null);
_ts_decorate([
    (0, _publicdecorator.Public)(),
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'Get all approved products (public)'
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
        name: 'categoryId',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'search',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'minPrice',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'maxPrice',
        required: false
    }),
    _ts_param(0, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Query)('limit', new _common.DefaultValuePipe(20), _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Query)('categoryId')),
    _ts_param(3, (0, _common.Query)('search')),
    _ts_param(4, (0, _common.Query)('minPrice')),
    _ts_param(5, (0, _common.Query)('maxPrice')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)('vendor/my-products'),
    (0, _swagger.ApiBearerAuth)('JWT-auth'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_client.Role.VENDOR),
    (0, _swagger.ApiOperation)({
        summary: 'Get vendor\'s own products'
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
], ProductsController.prototype, "getVendorProducts", null);
_ts_decorate([
    (0, _publicdecorator.Public)(),
    (0, _common.Get)('featured'),
    (0, _swagger.ApiOperation)({
        summary: 'Get featured products'
    }),
    (0, _swagger.ApiQuery)({
        name: 'page',
        required: false,
        type: Number
    }),
    (0, _swagger.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number
    }),
    _ts_param(0, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductsController.prototype, "getFeatured", null);
_ts_decorate([
    (0, _publicdecorator.Public)(),
    (0, _common.Get)(':id'),
    (0, _swagger.ApiOperation)({
        summary: 'Get product details'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductsController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Put)(':id'),
    (0, _swagger.ApiBearerAuth)('JWT-auth'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_client.Role.VENDOR),
    (0, _swagger.ApiOperation)({
        summary: 'Update product (Vendor)'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _productdto.UpdateProductDto === "undefined" ? Object : _productdto.UpdateProductDto
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductsController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiBearerAuth)('JWT-auth'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_client.Role.VENDOR),
    (0, _swagger.ApiOperation)({
        summary: 'Delete product (Vendor)'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductsController.prototype, "remove", null);
_ts_decorate([
    (0, _common.Post)(':id/variants'),
    (0, _swagger.ApiBearerAuth)('JWT-auth'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_client.Role.VENDOR),
    (0, _swagger.ApiOperation)({
        summary: 'Add product variant (Vendor)'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _productdto.CreateVariantDto === "undefined" ? Object : _productdto.CreateVariantDto
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductsController.prototype, "addVariant", null);
ProductsController = _ts_decorate([
    (0, _swagger.ApiTags)('Products'),
    (0, _common.Controller)('products'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _productsservice.ProductsService === "undefined" ? Object : _productsservice.ProductsService
    ])
], ProductsController);

//# sourceMappingURL=products.controller.js.map