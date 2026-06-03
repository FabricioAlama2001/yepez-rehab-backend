import { IsOptional, IsString } from 'class-validator';

export class CreateInitialRecordDto {
  @IsOptional()
  @IsString()
  consultationReason?: string;

  @IsOptional()
  @IsString()
  painDescription?: string;

  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  surgeries?: string;

  @IsOptional()
  @IsString()
  currentMedication?: string;

  @IsOptional()
  @IsString()
  previousTherapy?: string;
}
