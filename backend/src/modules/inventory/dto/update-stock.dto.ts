// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\inventory\dto\update-stock.dto.ts
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStockDto {
  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 'Restock from supplier', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
