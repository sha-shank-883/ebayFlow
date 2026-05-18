// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\orders\dto\order-query.dto.ts
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export class OrderQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: OrderStatus, required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsString()
  skip?: string;

  @ApiProperty({ required: false, default: 50 })
  @IsOptional()
  @IsString()
  take?: string;
}
