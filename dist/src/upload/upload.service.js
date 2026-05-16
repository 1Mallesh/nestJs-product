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
    async uploadFile(file, folder = 'uploads') {
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif'
        ];
        if (!allowedMimes.includes(file.mimetype)) {
            throw new _common.BadRequestException('Only image files are allowed (jpg, png, webp, gif)');
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new _common.BadRequestException('File size must be less than 5MB');
        }
        const extension = file.originalname.split('.').pop();
        const key = `${folder}/${(0, _uuid.v4)()}.${extension}`;
        const command = new _clients3.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        });
        await this.s3.send(command);
        const region = this.configService.get('AWS_REGION') || 'ap-south-1';
        return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
    }
    async uploadMultiple(files, folder = 'uploads') {
        const uploads = files.map((file)=>this.uploadFile(file, folder));
        return Promise.all(uploads);
    }
    async deleteFile(fileUrl) {
        const url = new URL(fileUrl);
        const key = url.pathname.slice(1);
        const command = new _clients3.DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key
        });
        await this.s3.send(command);
    }
    constructor(configService){
        this.configService = configService;
        this.s3 = new _clients3.S3Client({
            region: this.configService.get('AWS_REGION') || 'ap-south-1',
            credentials: {
                accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
                secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || ''
            }
        });
        this.bucket = this.configService.get('AWS_S3_BUCKET') || 'ecommerce-bucket';
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