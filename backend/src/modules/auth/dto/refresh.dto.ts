// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\auth\dto\refresh.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({ example: 'refresh-token-here' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
