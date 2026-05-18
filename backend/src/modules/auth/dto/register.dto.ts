// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\auth\dto\register.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must be less than 100 characters' })
  name: string;

  @ApiProperty({ example: 'john@sellerflow.ai' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must be less than 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)',
  })
  password: string;

  @ApiProperty({ example: 'My Store', required: false })
  @IsString()
  @IsOptional()
  workspaceName?: string;
}
