import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class AssignModulesDto {
  @ApiProperty({ example: ['uuid-module-1', 'uuid-module-2'] })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  moduleIds!: string[];
}
