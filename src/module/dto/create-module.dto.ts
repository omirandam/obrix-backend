import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({ example: 'OBRAS' })
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Z0-9_]+$/, { message: 'key debe ser MAYUS, números o _' })
  key!: string;

  @ApiProperty({ example: 'Gestión de Obras' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiPropertyOptional({ example: 'Control de obras, avances y documentos' })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  description?: string;

  @ApiProperty({
    example: 'building',
    description: 'Nombre de icono, emoji o URL',
  })
  @IsString()
  @Length(1, 100)
  icon!: string;
}
