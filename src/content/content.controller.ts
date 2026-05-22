import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ContentService } from './content.service';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Public()
  @Get('settings')
  @ApiOperation({ summary: 'Get site settings (currency, shipping info, etc.)' })
  getSettings() {
    return this.contentService.getSettings();
  }

  @Public()
  @Get('banners')
  @ApiOperation({ summary: 'Get homepage banners' })
  getBanners() {
    return this.contentService.getBanners();
  }

  @Public()
  @Get('offers')
  @ApiOperation({ summary: 'Get active promotional offers' })
  getOffers() {
    return this.contentService.getOffers();
  }

  @Public()
  @Get('trust-badges')
  @ApiOperation({ summary: 'Get trust badge content' })
  getTrustBadges() {
    return this.contentService.getTrustBadges();
  }
}
