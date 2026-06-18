import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class NewGameDto {
  @IsString()
  @IsNotEmpty()
  userName!: string;

  @IsString()
  @IsIn(['Amateur', 'Intermediate', 'Professional'])
  engineLevel!: string;
}
