// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\billing\billing.module.ts
import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
