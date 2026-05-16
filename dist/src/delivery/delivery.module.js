"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DeliveryModule", {
    enumerable: true,
    get: function() {
        return DeliveryModule;
    }
});
const _common = require("@nestjs/common");
const _deliveryservice = require("./delivery.service");
const _deliverycontroller = require("./delivery.controller");
const _trackingmodule = require("../tracking/tracking.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let DeliveryModule = class DeliveryModule {
};
DeliveryModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _trackingmodule.TrackingModule
        ],
        controllers: [
            _deliverycontroller.DeliveryController
        ],
        providers: [
            _deliveryservice.DeliveryService
        ],
        exports: [
            _deliveryservice.DeliveryService
        ]
    })
], DeliveryModule);

//# sourceMappingURL=delivery.module.js.map