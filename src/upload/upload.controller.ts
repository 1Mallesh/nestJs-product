import {
  Controller, Post, Body, UseGuards, UseInterceptors,
  UploadedFile, UploadedFiles, BadRequestException, Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiOperation, ApiBearerAuth,
  ApiConsumes, ApiBody, ApiProperty,
} from '@nestjs/swagger';
import { IsString, IsUrl, IsArray } from 'class-validator';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class UrlDto {
  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  url: string;
}

class UrlsDto {
  @ApiProperty({ type: [String], example: ['https://example.com/a.jpg', 'https://example.com/b.jpg'] })
  @IsArray()
  @IsString({ each: true })
  urls: string[];
}

@ApiTags('Upload')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ── 1. Upload single file ──────────────────────────────────
  @Post('single')
  @ApiOperation({ summary: 'Upload a single image file (S3 or local fallback)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'products',
  ) {
    if (!file) throw new BadRequestException('File is required');
    const url = await this.uploadService.uploadFile(file, folder);
    return { success: true, message: 'File uploaded', data: { url } };
  }

  // ── 2. Upload multiple files ───────────────────────────────
  @Post('multiple')
  @ApiOperation({ summary: 'Upload multiple image files (max 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10, { storage: memoryStorage() }))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder = 'products',
  ) {
    if (!files || files.length === 0) throw new BadRequestException('At least one file is required');
    const urls = await this.uploadService.uploadMultiple(files, folder);
    return { success: true, message: `${urls.length} file(s) uploaded`, data: { urls } };
  }

  // ── 3. Submit a single image URL (no upload) ───────────────
  @Post('url')
  @ApiOperation({ summary: 'Submit an external image URL (validates and returns it)' })
  @ApiBody({ type: UrlDto })
  submitUrl(@Body('url') url: string) {
    if (!url) throw new BadRequestException('url is required');
    const validated = this.uploadService.validateUrl(url);
    return { success: true, message: 'URL accepted', data: { url: validated } };
  }

  // ── 4. Submit multiple image URLs ─────────────────────────
  @Post('urls')
  @ApiOperation({ summary: 'Submit multiple external image URLs' })
  @ApiBody({ type: UrlsDto })
  submitUrls(@Body('urls') urls: string[]) {
    if (!urls || urls.length === 0) throw new BadRequestException('urls array is required');
    const validated = this.uploadService.validateUrls(urls);
    return { success: true, message: `${validated.length} URL(s) accepted`, data: { urls: validated } };
  }

  // ── 5. Mixed: files + URLs together ───────────────────────
  @Post('mixed')
  @ApiOperation({ summary: 'Upload files AND submit URLs together — returns combined array' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Image files to upload' },
        urls: { type: 'array', items: { type: 'string' }, description: 'External image URLs to include' },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10, { storage: memoryStorage() }))
  async uploadMixed(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('urls') rawUrls: string | string[],
    @Query('folder') folder = 'products',
  ) {
    const fileUrls = files && files.length > 0
      ? await this.uploadService.uploadMultiple(files, folder)
      : [];

    // Body may send urls as a single string or array
    const urlList: string[] = rawUrls
      ? (Array.isArray(rawUrls) ? rawUrls : [rawUrls])
      : [];
    const validatedUrls = urlList.length > 0
      ? this.uploadService.validateUrls(urlList)
      : [];

    const allUrls = [...fileUrls, ...validatedUrls];
    if (allUrls.length === 0) throw new BadRequestException('Provide at least one file or URL');

    return {
      success: true,
      message: `${allUrls.length} image(s) ready`,
      data: {
        urls: allUrls,
        uploaded: fileUrls.length,
        fromUrl: validatedUrls.length,
      },
    };
  }
}
