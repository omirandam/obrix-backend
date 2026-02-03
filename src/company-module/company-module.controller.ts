import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
} from '@nestjs/common';
import { CompanyModuleService } from './company-module.service';
import { ToggleCompanyModuleDto } from './dto/toggle-company-module.dto';
import { SetCompanyModulesDto } from './dto/upsert-company-modules.dto';

@Controller('company-modules')
export class CompanyModuleController {
  constructor(private readonly service: CompanyModuleService) {}

  // GET /company-modules/:companyId
  @Get(':companyId')
  list(@Param('companyId') companyId: string) {
    return this.service.listByCompany(companyId);
  }

  // GET /company-modules/:companyId/enabled
  @Get(':companyId/enabled')
  listEnabled(@Param('companyId') companyId: string) {
    return this.service.listEnabledByCompany(companyId);
  }

  // PATCH /company-modules/:companyId/:moduleId
  @Patch(':companyId/:moduleId')
  toggle(
    @Param('companyId') companyId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: ToggleCompanyModuleDto,
  ) {
    return this.service.toggle(companyId, moduleId, dto.isEnabled);
  }

  // PUT /company-modules/:companyId
  @Put(':companyId')
  setAll(
    @Param('companyId') companyId: string,
    @Body() dto: SetCompanyModulesDto,
  ) {
    // dto trae companyId también, pero usamos el de la ruta para evitar inconsistencias
    return this.service.setCompanyModules(companyId, dto.moduleIds);
  }

  // DELETE /company-modules/:companyId/:moduleId
  @Delete(':companyId/:moduleId')
  remove(
    @Param('companyId') companyId: string,
    @Param('moduleId') moduleId: string,
  ) {
    return this.service.remove(companyId, moduleId);
  }

  // GET /company-modules/:companyId/catalog
  @Get(':companyId/catalog')
  catalog(@Param('companyId') companyId: string) {
    return this.service.getCatalogWithStatus(companyId);
  }
}
