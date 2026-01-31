import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @Length(3, 50)
  username!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @Length(8, 100)
  password!: string;
}
