// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\listings\listings.module.ts
import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { AiModule } from '../ai/ai.module';
import { EbayModule } from '../ebay/ebay.module';

@Module({
  imports: [AiModule, EbayModule],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
