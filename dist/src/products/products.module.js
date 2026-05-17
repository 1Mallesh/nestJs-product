"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductsModule", {
    enumerable: true,
    get: function() {
        return ProductsModule;
    }
});
const _common = require("@nestjs/common");
const _productsservice = require("./products.service");
const _productscontroller = require("./products.controller");
const _trackingmodule = require("../tracking/tracking.module");
const _notificationsmodule = require("../notifications/notifications.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let ProductsModule = class ProductsModule {
};
ProductsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _trackingmodule.TrackingModule,
            _notificationsmodule.NotificationsModule
        ],
        controllers: [
            _productscontroller.ProductsController
        ],
        providers: [
            _productsservice.ProductsService
        ],
        exports: [
            _productsservice.ProductsService
        ]
    })
], ProductsModule);

//# sourceMappingURL=products.module.js.map