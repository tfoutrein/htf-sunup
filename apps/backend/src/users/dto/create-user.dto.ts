import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
  IsNumber,
} from 'class-validator';
import { IsStrongPassword } from '../../utils/password-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User name', example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', example: 'MyPassword123!' })
  @IsString()
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    description: 'User role',
    example: 'fbo',
    enum: ['manager', 'fbo'],
  })
  @IsString()
  @IsIn(['manager', 'fbo'])
  role: string;

  @ApiProperty({
    description: 'Manager ID (required for FBO role)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  managerId?: number;
}
