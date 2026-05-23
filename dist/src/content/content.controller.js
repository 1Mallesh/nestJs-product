"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ContentController", {
    enumerable: true,
    get: function() {
        return ContentController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _publicdecorator = require("../common/decorators/public.decorator");
const _contentservice = require("./content.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ContentController = class ContentController {
    getSettings() {
        return this.contentService.getSettings();
    }
    getBanners() {
        return this.contentService.getBanners();
    }
    getOffers() {
        return this.contentService.getOffers();
    }
    getTrustBadges() {
        return this.contentService.getTrustBadges();
    }
    constructor(contentService){
        this.contentService = contentService;
    }
};
_ts_decorate([
    (0, _publicdecorator.Public)(),
    (0, _common.Get)('settings'),
    (0, _swagger.ApiOperation)({
        summary: 'Get site settings (currency, shipping info, etc.)'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], ContentController.prototype, "getSettings", null);
_ts_decorate([
    (0, _publicdecorator.Public)(),
    (0, _common.Get)('banners'),
    (0, _swagger.ApiOperation)({
        summary: 'Get homepage banners'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], ContentController.prototype, "getBanners", null);
_ts_decorate([
    (0, _publicdecorator.Public)(),
    (0, _common.Get)('offers'),
    (0, _swagger.ApiOperation)({
        summary: 'Get active promotional offers'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], ContentController.prototype, "getOffers", null);
_ts_decorate([
    (0, _publicdecorator.Public)(),
    (0, _common.Get)('trust-badges'),
    (0, _swagger.ApiOperation)({
        summary: 'Get trust badge content'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], ContentController.prototype, "getTrustBadges", null);
ContentController = _ts_decorate([
    (0, _swagger.ApiTags)('Content'),
    (0, _common.Controller)('content'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _contentservice.ContentService === "undefined" ? Object : _contentservice.ContentService
    ])
], ContentController);

//# sourceMappingURL=content.controller.js.map