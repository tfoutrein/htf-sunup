import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
  IsNumber,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User name', example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  @MinLength(6)
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
