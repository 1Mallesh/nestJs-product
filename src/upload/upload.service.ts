import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private s3: S3Client | null = null;
  private bucket: string;
  private s3Configured: boolean;
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    const accessKey = this.configService.get<string>('AWS_ACCESS_KEY_ID') || '';
    const secretKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '';
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET') || '';

    // Only use S3 when real credentials are present
    this.s3Configured =
      accessKey.length > 0 &&
      !accessKey.includes('your') &&
      secretKey.length > 0 &&
      !secretKey.includes('your') &&
      this.bucket.length > 0 &&
      !this.bucket.includes('your');

    if (this.s3Configured) {
      this.s3 = new S3Client({
        region: this.configService.get<string>('AWS_REGION') || 'ap-south-1',
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      });
    }

    // Local fallback folder — served as /uploads/...
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!this.s3Configured && !fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // ── File upload (S3 or local) ──────────────────────────────
  async uploadFile(file: Express.Multer.File, folder = 'products'): Promise<string> {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed (jpg, png, webp, gif)');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    if (this.s3Configured && this.s3) {
      return this.uploadToS3(file, folder);
    }
    return this.uploadToLocal(file, folder);
  }

  private async uploadToS3(file: Express.Multer.File, folder: string): Promise<string> {
    const ext = file.originalname.split('.').pop();
    const key = `${folder}/${uuidv4()}.${ext}`;
    await this.s3!.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));
    const region = this.configService.get<string>('AWS_REGION') || 'ap-south-1';
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  private async uploadToLocal(file: Express.Multer.File, folder: string): Promise<string> {
    const dir = path.join(this.uploadDir, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const ext = file.originalname.split('.').pop();
    const filename = `${uuidv4()}.${ext}`;
    const filepath = path.join(dir, filename);

    fs.writeFileSync(filepath, file.buffer);

    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    return `${appUrl}/uploads/${folder}/${filename}`;
  }

  async uploadMultiple(files: Express.Multer.File[], folder = 'products'): Promise<string[]> {
    return Promise.all(files.map((f) => this.uploadFile(f, folder)));
  }

  // ── URL validation (just return the URL if valid) ──────────
  validateUrl(url: string): string {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new BadRequestException('URL must use http or https');
      }
      return url;
    } catch {
      throw new BadRequestException(`Invalid URL: ${url}`);
    }
  }

  validateUrls(urls: string[]): string[] {
    return urls.map((u) => this.validateUrl(u));
  }
}
