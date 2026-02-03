import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetUserModulesDto } from './dto/set-user-modules.dto';

@ApiTags('User')
@Controller()
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post('users')
  @ApiOperation({ summary: 'Crear user' })
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar users' })
  findAll() {
    return this.service.findAll();
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Obtener user por id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('companies/:companyId/users')
  @ApiOperation({ summary: 'Listar users por company' })
  findByCompany(@Param('companyId') companyId: string) {
    return this.service.findByCompany(companyId);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Actualizar user' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Eliminar user' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/available-modules')
  availableModules(@Param('id') userId: string) {
    return this.service.getAvailableModulesForUser(userId);
  }

  @Put(':id/modules')
  setModules(@Param('id') userId: string, @Body() dto: SetUserModulesDto) {
    return this.service.setUserModules(userId, dto.moduleIds);
  }

  @Get(':id/modules')
  getModules(@Param('id') userId: string) {
    return this.service.getModules(userId);
  }
}
