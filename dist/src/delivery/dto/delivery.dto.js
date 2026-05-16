"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get DeliveryBoyOnboardDto () {
        return DeliveryBoyOnboardDto;
    },
    get UpdateDeliveryStatusDto () {
        return UpdateDeliveryStatusDto;
    },
    get UpdateLocationDto () {
        return UpdateLocationDto;
    }
});
const _swagger = require("@nestjs/swagger");
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let DeliveryBoyOnboardDto = class DeliveryBoyOnboardDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Length)(12, 12),
    _ts_metadata("design:type", String)
], DeliveryBoyOnboardDto.prototype, "aadhaarNumber", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'ABCDE1234F'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Matches)(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
    _ts_metadata("design:type", String)
], DeliveryBoyOnboardDto.prototype, "panNumber", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], DeliveryBoyOnboardDto.prototype, "drivingLicense", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'BIKE'
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], DeliveryBoyOnboardDto.prototype, "vehicleType", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], DeliveryBoyOnboardDto.prototype, "vehicleNumber", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], DeliveryBoyOnboardDto.prototype, "bankAccountNumber", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'SBIN0001234'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Matches)(/^[A-Z]{4}0[A-Z0-9]{6}$/),
    _ts_metadata("design:type", String)
], DeliveryBoyOnboardDto.prototype, "bankIfscCode", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], DeliveryBoyOnboardDto.prototype, "bankAccountName", void 0);
let UpdateLocationDto = class UpdateLocationDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classtransformer.Type)(()=>Number),
    _ts_metadata("design:type", Number)
], UpdateLocationDto.prototype, "latitude", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classtransformer.Type)(()=>Number),
    _ts_metadata("design:type", Number)
], UpdateLocationDto.prototype, "longitude", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], UpdateLocationDto.prototype, "orderId", void 0);
let UpdateDeliveryStatusDto = class UpdateDeliveryStatusDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        enum: [
            'PICKED_UP',
            'DELIVERED'
        ]
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateDeliveryStatusDto.prototype, "action", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateDeliveryStatusDto.prototype, "notes", void 0);

//# sourceMappingURL=delivery.dto.js.map