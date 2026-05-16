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
    get ForgotPasswordDto () {
        return ForgotPasswordDto;
    },
    get ResetPasswordDto () {
        return ResetPasswordDto;
    },
    get VerifyOtpDto () {
        return VerifyOtpDto;
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
let ForgotPasswordDto = class ForgotPasswordDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'john@example.com'
    }),
    (0, _classvalidator.IsEmail)(),
    _ts_metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
let ResetPasswordDto = class ResetPasswordDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ResetPasswordDto.prototype, "token", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        minLength: 8
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(8),
    (0, _classvalidator.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
        message: 'Password must contain uppercase, lowercase, number and special character'
    }),
    _ts_metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
let VerifyOtpDto = class VerifyOtpDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    (0, _classvalidator.IsEmail)(),
    _ts_metadata("design:type", String)
], VerifyOtpDto.prototype, "email", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], VerifyOtpDto.prototype, "otp", void 0);

//# sourceMappingURL=forgot-password.dto.js.map