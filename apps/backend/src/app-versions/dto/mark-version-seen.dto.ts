import { IsNumber } from 'class-validator';

export class MarkVersionSeenDto {
  @IsNumber()
  versionId: number;
}
