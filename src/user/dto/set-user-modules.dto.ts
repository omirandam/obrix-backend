import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class SetUserModulesDto {
  @ApiProperty({
    example: [
      '7f8c1e9b-4d5a-4f7a-9b3f-0f1e2a3b4c5d',
      '1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  moduleIds!: string[];
}
