import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Obrix' })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional({ example: 'Obrix System S.A. de C.V.' })
  @IsOptional()
  @IsString()
  @Length(2, 250)
  legalName?: string;

  @ApiPropertyOptional({ example: 'OBR010101AAA' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i, {
    message: 'RFC inválido (formato general)',
  })
  rfc?: string;
}
