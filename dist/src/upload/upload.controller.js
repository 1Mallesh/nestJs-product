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
const _classvalidator = require("class-validator");
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
let UrlDto = class UrlDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'https://example.com/image.jpg'
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UrlDto.prototype, "url", void 0);
let UrlsDto = class UrlsDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: [
            String
        ],
        example: [
            'https://example.com/a.jpg',
            'https://example.com/b.jpg'
        ]
    }),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    }),
    _ts_metadata("design:type", Array)
], UrlsDto.prototype, "urls", void 0);
let UploadController = class UploadController {
    // ── 1. Upload single file ──────────────────────────────────
    async uploadSingle(file, folder = 'products') {
        if (!file) throw new _common.BadRequestException('File is required');
        const url = await this.uploadService.uploadFile(file, folder);
        return {
            success: true,
            message: 'File uploaded',
            data: {
                url
            }
        };
    }
    // ── 2. Upload multiple files ───────────────────────────────
    async uploadMultiple(files, folder = 'products') {
        if (!files || files.length === 0) throw new _common.BadRequestException('At least one file is required');
        const urls = await this.uploadService.uploadMultiple(files, folder);
        return {
            success: true,
            message: `${urls.length} file(s) uploaded`,
            data: {
                urls
            }
        };
    }
    // ── 3. Submit a single image URL (no upload) ───────────────
    submitUrl(url) {
        if (!url) throw new _common.BadRequestException('url is required');
        const validated = this.uploadService.validateUrl(url);
        return {
            success: true,
            message: 'URL accepted',
            data: {
                url: validated
            }
        };
    }
    // ── 4. Submit multiple image URLs ─────────────────────────
    submitUrls(urls) {
        if (!urls || urls.length === 0) throw new _common.BadRequestException('urls array is required');
        const validated = this.uploadService.validateUrls(urls);
        return {
            success: true,
            message: `${validated.length} URL(s) accepted`,
            data: {
                urls: validated
            }
        };
    }
    // ── 5. Mixed: files + URLs together ───────────────────────
    async uploadMixed(files, rawUrls, folder = 'products') {
        const fileUrls = files && files.length > 0 ? await this.uploadService.uploadMultiple(files, folder) : [];
        // Body may send urls as a single string or array
        const urlList = rawUrls ? Array.isArray(rawUrls) ? rawUrls : [
            rawUrls
        ] : [];
        const validatedUrls = urlList.length > 0 ? this.uploadService.validateUrls(urlList) : [];
        const allUrls = [
            ...fileUrls,
            ...validatedUrls
        ];
        if (allUrls.length === 0) throw new _common.BadRequestException('Provide at least one file or URL');
        return {
            success: true,
            message: `${allUrls.length} image(s) ready`,
            data: {
                urls: allUrls,
                uploaded: fileUrls.length,
                fromUrl: validatedUrls.length
            }
        };
    }
    constructor(uploadService){
        this.uploadService = uploadService;
    }
};
_ts_decorate([
    (0, _common.Post)('single'),
    (0, _swagger.ApiOperation)({
        summary: 'Upload a single image file (S3 or local fallback)'
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
    _ts_metadata("design:returntype", Promise)
], UploadController.prototype, "uploadSingle", null);
_ts_decorate([
    (0, _common.Post)('multiple'),
    (0, _swagger.ApiOperation)({
        summary: 'Upload multiple image files (max 10)'
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
    (0, _common.UseInterceptors)((0, _platformexpress.FilesInterceptor)('files', 10, {
        storage: (0, _multer.memoryStorage)()
    })),
    _ts_param(0, (0, _common.UploadedFiles)()),
    _ts_param(1, (0, _common.Query)('folder')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Array,
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], UploadController.prototype, "uploadMultiple", null);
_ts_decorate([
    (0, _common.Post)('url'),
    (0, _swagger.ApiOperation)({
        summary: 'Submit an external image URL (validates and returns it)'
    }),
    (0, _swagger.ApiBody)({
        type: UrlDto
    }),
    _ts_param(0, (0, _common.Body)('url')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], UploadController.prototype, "submitUrl", null);
_ts_decorate([
    (0, _common.Post)('urls'),
    (0, _swagger.ApiOperation)({
        summary: 'Submit multiple external image URLs'
    }),
    (0, _swagger.ApiBody)({
        type: UrlsDto
    }),
    _ts_param(0, (0, _common.Body)('urls')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Array
    ]),
    _ts_metadata("design:returntype", void 0)
], UploadController.prototype, "submitUrls", null);
_ts_decorate([
    (0, _common.Post)('mixed'),
    (0, _swagger.ApiOperation)({
        summary: 'Upload files AND submit URLs together — returns combined array'
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
                    },
                    description: 'Image files to upload'
                },
                urls: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: 'External image URLs to include'
                }
            }
        }
    }),
    (0, _common.UseInterceptors)((0, _platformexpress.FilesInterceptor)('files', 10, {
        storage: (0, _multer.memoryStorage)()
    })),
    _ts_param(0, (0, _common.UploadedFiles)()),
    _ts_param(1, (0, _common.Body)('urls')),
    _ts_param(2, (0, _common.Query)('folder')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Array,
        Object,
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], UploadController.prototype, "uploadMixed", null);
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