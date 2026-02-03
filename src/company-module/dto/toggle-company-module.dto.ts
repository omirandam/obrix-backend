import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleCompanyModuleDto {
  @ApiProperty({
    example: true,
    description: 'Indica si el módulo queda habilitado o no para la company',
  })
  @IsBoolean()
  isEnabled!: boolean;
}
