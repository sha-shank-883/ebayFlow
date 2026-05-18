// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\auth\dto\login.dto.ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'demo@sellerflow.ai' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Demo123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
