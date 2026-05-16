"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _core = require("@nestjs/core");
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _helmet = /*#__PURE__*/ _interop_require_wildcard(require("helmet"));
const _appmodule = require("./app.module");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
async function bootstrap() {
    const app = await _core.NestFactory.create(_appmodule.AppModule, {
        logger: [
            'log',
            'error',
            'warn',
            'debug'
        ]
    });
    // Security
    app.use(_helmet.default());
    // CORS
    app.enableCors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS'
        ],
        credentials: true
    });
    // Global prefix
    app.setGlobalPrefix('api/v1');
    // Validation pipe
    app.useGlobalPipes(new _common.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true
        }
    }));
    // Swagger documentation
    const config = new _swagger.DocumentBuilder().setTitle('Multi-Vendor E-Commerce API').setDescription('Production-level multi-vendor e-commerce backend API. Roles: ADMIN, CUSTOMER, VENDOR, DELIVERY_BOY').setVersion('1.0').addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header'
    }, 'JWT-auth').addTag('Authentication', 'Login, Register, Token management').addTag('Users', 'User profile and addresses').addTag('Vendor', 'Vendor onboarding and management').addTag('Admin', 'Admin panel APIs').addTag('Products', 'Product catalog').addTag('Categories', 'Product categories').addTag('Cart', 'Shopping cart').addTag('Wishlist', 'Product wishlist').addTag('Orders', 'Order management').addTag('Payments', 'Razorpay payment integration').addTag('Delivery', 'Delivery boy management and GPS tracking').addTag('Reviews', 'Product reviews').addTag('Notifications', 'User notifications').addTag('Upload', 'File upload to AWS S3').build();
    const document = _swagger.SwaggerModule.createDocument(app, config);
    _swagger.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha'
        }
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`\n🚀 Server running on: http://localhost:${port}/api/v1`);
    console.log(`📚 Swagger Docs:   http://localhost:${port}/api/docs`);
    console.log(`🔌 WebSocket:      ws://localhost:${port}/tracking\n`);
}
bootstrap();

//# sourceMappingURL=main.js.map