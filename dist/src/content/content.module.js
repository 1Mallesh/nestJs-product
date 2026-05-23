"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ContentModule", {
    enumerable: true,
    get: function() {
        return ContentModule;
    }
});
const _common = require("@nestjs/common");
const _contentcontroller = require("./content.controller");
const _contentservice = require("./content.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let ContentModule = class ContentModule {
};
ContentModule = _ts_decorate([
    (0, _common.Module)({
        controllers: [
            _contentcontroller.ContentController
        ],
        providers: [
            _contentservice.ContentService
        ]
    })
], ContentModule);

//# sourceMappingURL=content.module.js.map