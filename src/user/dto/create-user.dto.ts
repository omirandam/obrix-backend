import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'UUID de company' })
  @IsUUID()
  companyId!: string;

  @ApiProperty({ example: 'admin@obrix.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Administrador Obrix' })
  @IsString()
  @Length(2, 200)
  fullName!: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  @Length(3, 50)
  username!: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @Length(8, 100)
  password!: string;
}
