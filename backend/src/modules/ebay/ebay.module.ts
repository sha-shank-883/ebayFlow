import { Module } from '@nestjs/common';
import { EbayService } from './ebay.service';
import { EbayController } from './ebay.controller';
import { EbayOauthService } from './ebay-oauth.service';
import { EbayTradingService } from './ebay-trading.service';
import { EbayTradingController } from './ebay-trading.controller';

@Module({
  controllers: [EbayController, EbayTradingController],
  providers: [EbayService, EbayOauthService, EbayTradingService],
  exports: [EbayService, EbayOauthService, EbayTradingService],
})
export class EbayModule {}
