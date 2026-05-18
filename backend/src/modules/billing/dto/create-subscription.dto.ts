// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\billing\dto\create-subscription.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'price_1234567890' })
  @IsString()
  @IsNotEmpty()
  priceId: string;
}
