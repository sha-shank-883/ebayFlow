// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\ai\ai.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateContentDto } from './dto/generate-content.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-description')
  @ApiOperation({ summary: 'Generate product description using AI' })
  generateDescription(@Body() dto: GenerateContentDto) {
    return this.aiService.generateDescription(dto);
  }

  @Post('generate-title')
  @ApiOperation({ summary: 'Generate optimized product title using AI' })
  generateTitle(@Body() dto: GenerateContentDto) {
    return this.aiService.generateTitle(dto);
  }
}
