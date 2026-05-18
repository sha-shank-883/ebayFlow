// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\orders\orders.module.ts
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EbayModule } from '../ebay/ebay.module';

@Module({
  imports: [EbayModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
