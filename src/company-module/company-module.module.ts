import { Module } from '@nestjs/common';
import { CompanyModuleService } from './company-module.service';
import { CompanyModuleController } from './company-module.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CompanyModuleController],
  providers: [CompanyModuleService, PrismaService],
  exports: [CompanyModuleService],
})
export class CompanyModuleModule {}
