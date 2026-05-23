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
    get UpdateVendorDto () {
        return UpdateVendorDto;
    },
    get VendorOnboardDto () {
        return VendorOnboardDto;
    }
});
const _swagger = require("@nestjs/swagger");
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let VendorOnboardDto = class VendorOnboardDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'My Gaming Shop'
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], VendorOnboardDto.prototype, "shopName", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Best gaming accessories store'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], VendorOnboardDto.prototype, "shopDescription", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'https://example.com/logo.png'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], VendorOnboardDto.prototype, "shopLogo", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'https://example.com/banner.png'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], VendorOnboardDto.prototype, "shopBanner", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: '29ABCDE1234F1Z5'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Matches)(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
        message: 'Invalid GST number format (e.g. 29ABCDE1234F1Z5)'
    }),
    _ts_metadata("design:type", String)
], VendorOnboardDto.prototype, "gstNumber", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'ABCDE1234F'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Matches)(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
        message: 'Invalid PAN number format (e.g. ABCDE1234F)'
    }),
    _ts_metadata("design:type", String)
], VendorOnboardDto.prototype, "panNumber", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: '123456789012'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Length)(12, 12, {
        message: 'Aadhaar must be exactly 12 digits'
    }),
    _ts_metadata("design:type", String)
], VendorOnboardDto.prototype, "aadhaarNumber", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: '9876543210'
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], VendorOnboardDto.prototype, "bankAccountNumber", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'SBIN0001234'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Matches)(/^[A-Z]{4}0[A-Z0-9]{6}$/, {
        message: 'Invalid IFSC code (e.g. SBIN0001234)'
    }),
    _ts_metadata("design:type", String)
], VendorOnboardDto.prototype, "bankIfscCode", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'John Doe'
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], VendorOnboardDto.prototype, "bankAccountName", void 0);
let UpdateVendorDto = class UpdateVendorDto {
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateVendorDto.prototype, "shopName", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateVendorDto.prototype, "shopDescription", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateVendorDto.prototype, "shopLogo", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateVendorDto.prototype, "shopBanner", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateVendorDto.prototype, "bankAccountNumber", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Matches)(/^[A-Z]{4}0[A-Z0-9]{6}$/, {
        message: 'Invalid IFSC code'
    }),
    _ts_metadata("design:type", String)
], UpdateVendorDto.prototype, "bankIfscCode", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateVendorDto.prototype, "bankAccountName", void 0);

//# sourceMappingURL=vendor-onboard.dto.js.map