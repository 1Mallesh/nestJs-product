"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppModule", {
    enumerable: true,
    get: function() {
        return AppModule;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _throttler = require("@nestjs/throttler");
const _core = require("@nestjs/core");
const _prismamodule = require("./prisma/prisma.module");
const _authmodule = require("./auth/auth.module");
const _usersmodule = require("./users/users.module");
const _vendormodule = require("./vendor/vendor.module");
const _adminmodule = require("./admin/admin.module");
const _productsmodule = require("./products/products.module");
const _categoriesmodule = require("./categories/categories.module");
const _cartmodule = require("./cart/cart.module");
const _wishlistmodule = require("./wishlist/wishlist.module");
const _ordersmodule = require("./orders/orders.module");
const _paymentsmodule = require("./payments/payments.module");
const _deliverymodule = require("./delivery/delivery.module");
const _trackingmodule = require("./tracking/tracking.module");
const _notificationsmodule = require("./notifications/notifications.module");
const _reviewsmodule = require("./reviews/reviews.module");
const _uploadmodule = require("./upload/upload.module");
const _shippingmodule = require("./shipping/shipping.module");
const _jwtauthguard = require("./auth/guards/jwt-auth.guard");
const _rolesguard = require("./common/guards/roles.guard");
const _httpexceptionfilter = require("./common/filters/http-exception.filter");
const _responseinterceptor = require("./common/interceptors/response.interceptor");
const _logginginterceptor = require("./common/interceptors/logging.interceptor");
const _loggermiddleware = require("./common/middleware/logger.middleware");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(_loggermiddleware.LoggerMiddleware).forRoutes('*');
    }
};
AppModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _config.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env'
            }),
            _throttler.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100
                }
            ]),
            _prismamodule.PrismaModule,
            _authmodule.AuthModule,
            _usersmodule.UsersModule,
            _vendormodule.VendorModule,
            _adminmodule.AdminModule,
            _productsmodule.ProductsModule,
            _categoriesmodule.CategoriesModule,
            _cartmodule.CartModule,
            _wishlistmodule.WishlistModule,
            _ordersmodule.OrdersModule,
            _paymentsmodule.PaymentsModule,
            _deliverymodule.DeliveryModule,
            _trackingmodule.TrackingModule,
            _notificationsmodule.NotificationsModule,
            _reviewsmodule.ReviewsModule,
            _uploadmodule.UploadModule,
            _shippingmodule.ShippingModule
        ],
        providers: [
            {
                provide: _core.APP_GUARD,
                useClass: _jwtauthguard.JwtAuthGuard
            },
            {
                provide: _core.APP_GUARD,
                useClass: _rolesguard.RolesGuard
            },
            {
                provide: _core.APP_FILTER,
                useClass: _httpexceptionfilter.AllExceptionsFilter
            },
            {
                provide: _core.APP_INTERCEPTOR,
                useClass: _responseinterceptor.ResponseInterceptor
            },
            {
                provide: _core.APP_INTERCEPTOR,
                useClass: _logginginterceptor.LoggingInterceptor
            }
        ]
    })
], AppModule);

//# sourceMappingURL=app.module.js.map