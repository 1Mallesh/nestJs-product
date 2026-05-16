"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ReviewsController", {
    enumerable: true,
    get: function() {
        return ReviewsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _reviewsservice = require("./reviews.service");
const _reviewdto = require("./dto/review.dto");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
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
let ReviewsController = class ReviewsController {
    create(userId, dto) {
        return this.reviewsService.create(userId, dto);
    }
    getProductReviews(productId, page, limit) {
        return this.reviewsService.getProductReviews(productId, page, limit);
    }
    delete(userId, reviewId) {
        return this.reviewsService.deleteReview(userId, reviewId);
    }
    constructor(reviewsService){
        this.reviewsService = reviewsService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiBearerAuth)('JWT-auth'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _swagger.ApiOperation)({
        summary: 'Submit a product review (verified buyers only)'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _reviewdto.CreateReviewDto === "undefined" ? Object : _reviewdto.CreateReviewDto
    ]),
    _ts_metadata("design:returntype", void 0)
], ReviewsController.prototype, "create", null);
_ts_decorate([
    (0, _publicdecorator.Public)(),
    (0, _common.Get)('product/:productId'),
    (0, _swagger.ApiOperation)({
        summary: 'Get product reviews'
    }),
    _ts_param(0, (0, _common.Param)('productId')),
    _ts_param(1, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Query)('limit', new _common.DefaultValuePipe(10), _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Number,
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], ReviewsController.prototype, "getProductReviews", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiBearerAuth)('JWT-auth'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _swagger.ApiOperation)({
        summary: 'Delete your review'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)('id')),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ReviewsController.prototype, "delete", null);
ReviewsController = _ts_decorate([
    (0, _swagger.ApiTags)('Reviews'),
    (0, _common.Controller)('reviews'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _reviewsservice.ReviewsService === "undefined" ? Object : _reviewsservice.ReviewsService
    ])
], ReviewsController);

//# sourceMappingURL=reviews.controller.js.map