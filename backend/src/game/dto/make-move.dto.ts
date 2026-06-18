import { IsString, IsNotEmpty, IsInt, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MakeMoveDto {
  @IsString()
  @IsIn(['user', 'agent'])
  actor!: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  order!: number;

  @IsString()
  @IsNotEmpty()
  notation!: string;
}
