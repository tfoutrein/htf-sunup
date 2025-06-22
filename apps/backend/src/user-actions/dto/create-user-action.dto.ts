import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateUserActionDto {
  @ApiProperty({ description: "ID de l'action" })
  @IsNumber()
  actionId: number;

  @ApiProperty({ description: 'ID du défi' })
  @IsNumber()
  challengeId: number;

  @ApiProperty({ description: 'Action complétée ou non', required: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiProperty({ description: 'URL de preuve (optionnel)', required: false })
  @IsOptional()
  @IsString()
  proofUrl?: string;
}
