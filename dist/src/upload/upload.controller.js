"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UploadController", {
    enumerable: true,
    get: function() {
        return UploadController;
    }
});
const _common = require("@nestjs/common");
const _platformexpress = require("@nestjs/platform-express");
const _swagger = require("@nestjs/swagger");
const _multer = require("multer");
const _uploadservice = require("./upload.service");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
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
let UploadController = class UploadController {
    uploadSingle(file, folder = 'uploads') {
        if (!file) throw new _common.BadRequestException('File is required');
        return this.uploadService.uploadFile(file, folder).then((url)=>({
                message: 'File uploaded',
                data: {
                    url
                }
            }));
    }
    uploadMultiple(files, folder = 'uploads') {
        if (!files || files.length === 0) throw new _common.BadRequestException('Files are required');
        return this.uploadService.uploadMultiple(files, folder).then((urls)=>({
                message: 'Files uploaded',
                data: {
                    urls
                }
            }));
    }
    constructor(uploadService){
        this.uploadService = uploadService;
    }
};
_ts_decorate([
    (0, _common.Post)('single'),
    (0, _swagger.ApiOperation)({
        summary: 'Upload a single image'
    }),
    (0, _swagger.ApiConsumes)('multipart/form-data'),
    (0, _swagger.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary'
                }
            }
        }
    }),
    (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)('file', {
        storage: (0, _multer.memoryStorage)()
    })),
    _ts_param(0, (0, _common.UploadedFile)()),
    _ts_param(1, (0, _common.Query)('folder')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], UploadController.prototype, "uploadSingle", null);
_ts_decorate([
    (0, _common.Post)('multiple'),
    (0, _swagger.ApiOperation)({
        summary: 'Upload multiple images (max 5)'
    }),
    (0, _swagger.ApiConsumes)('multipart/form-data'),
    (0, _swagger.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary'
                    }
                }
            }
        }
    }),
    (0, _common.UseInterceptors)((0, _platformexpress.FilesInterceptor)('files', 5, {
        storage: (0, _multer.memoryStorage)()
    })),
    _ts_param(0, (0, _common.UploadedFiles)()),
    _ts_param(1, (0, _common.Query)('folder')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Array,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], UploadController.prototype, "uploadMultiple", null);
UploadController = _ts_decorate([
    (0, _swagger.ApiTags)('Upload'),
    (0, _swagger.ApiBearerAuth)('JWT-auth'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('upload'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _uploadservice.UploadService === "undefined" ? Object : _uploadservice.UploadService
    ])
], UploadController);

//# sourceMappingURL=upload.controller.js.map