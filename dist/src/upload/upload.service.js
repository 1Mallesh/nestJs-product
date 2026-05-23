"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UploadService", {
    enumerable: true,
    get: function() {
        return UploadService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _clients3 = require("@aws-sdk/client-s3");
const _uuid = require("uuid");
const _fs = /*#__PURE__*/ _interop_require_wildcard(require("fs"));
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
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
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let UploadService = class UploadService {
    // ── File upload (S3 or local) ──────────────────────────────
    async uploadFile(file, folder = 'products') {
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/jpg'
        ];
        if (!allowedMimes.includes(file.mimetype)) {
            throw new _common.BadRequestException('Only image files are allowed (jpg, png, webp, gif)');
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new _common.BadRequestException('File size must be less than 5MB');
        }
        if (this.s3Configured && this.s3) {
            return this.uploadToS3(file, folder);
        }
        return this.uploadToLocal(file, folder);
    }
    async uploadToS3(file, folder) {
        const ext = file.originalname.split('.').pop();
        const key = `${folder}/${(0, _uuid.v4)()}.${ext}`;
        await this.s3.send(new _clients3.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        }));
        const region = this.configService.get('AWS_REGION') || 'ap-south-1';
        return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
    }
    async uploadToLocal(file, folder) {
        const dir = _path.join(this.uploadDir, folder);
        if (!_fs.existsSync(dir)) _fs.mkdirSync(dir, {
            recursive: true
        });
        const ext = file.originalname.split('.').pop();
        const filename = `${(0, _uuid.v4)()}.${ext}`;
        const filepath = _path.join(dir, filename);
        _fs.writeFileSync(filepath, file.buffer);
        const appUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
        return `${appUrl}/uploads/${folder}/${filename}`;
    }
    async uploadMultiple(files, folder = 'products') {
        return Promise.all(files.map((f)=>this.uploadFile(f, folder)));
    }
    // ── URL validation (just return the URL if valid) ──────────
    validateUrl(url) {
        try {
            const parsed = new URL(url);
            if (![
                'http:',
                'https:'
            ].includes(parsed.protocol)) {
                throw new _common.BadRequestException('URL must use http or https');
            }
            return url;
        } catch  {
            throw new _common.BadRequestException(`Invalid URL: ${url}`);
        }
    }
    validateUrls(urls) {
        return urls.map((u)=>this.validateUrl(u));
    }
    constructor(configService){
        this.configService = configService;
        this.s3 = null;
        const accessKey = this.configService.get('AWS_ACCESS_KEY_ID') || '';
        const secretKey = this.configService.get('AWS_SECRET_ACCESS_KEY') || '';
        this.bucket = this.configService.get('AWS_S3_BUCKET') || '';
        // Only use S3 when real credentials are present
        this.s3Configured = accessKey.length > 0 && !accessKey.includes('your') && secretKey.length > 0 && !secretKey.includes('your') && this.bucket.length > 0 && !this.bucket.includes('your');
        if (this.s3Configured) {
            this.s3 = new _clients3.S3Client({
                region: this.configService.get('AWS_REGION') || 'ap-south-1',
                credentials: {
                    accessKeyId: accessKey,
                    secretAccessKey: secretKey
                }
            });
        }
        // Local fallback folder — served as /uploads/...
        this.uploadDir = _path.join(process.cwd(), 'public', 'uploads');
        if (!this.s3Configured && !_fs.existsSync(this.uploadDir)) {
            _fs.mkdirSync(this.uploadDir, {
                recursive: true
            });
        }
    }
};
UploadService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], UploadService);

//# sourceMappingURL=upload.service.js.map