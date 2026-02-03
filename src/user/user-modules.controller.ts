import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AssignModulesDto } from './dto/assign-modules.dto';

@ApiTags('User Modules')
@Controller('users')
export class UserModulesController {
  constructor(private readonly users: UserService) {}

  @Get(':id/modules')
  @ApiOperation({ summary: 'Listar módulos asignados a un user' })
  getModules(@Param('id') userId: string) {
    return this.users.getModules(userId);
  }

  @Post(':id/modules')
  @ApiOperation({ summary: 'Asignar módulos a un user (append)' })
  assign(@Param('id') userId: string, @Body() dto: AssignModulesDto) {
    return this.users.assignModules(userId, dto.moduleIds);
  }
}
