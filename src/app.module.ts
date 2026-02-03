import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanyModule } from './company/company.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ModuleModule } from './module/module.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CompanyModuleModule } from './company-module/company-module.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CompanyModule,
    UserModule,
    ModuleModule,
    AuthModule,
    CompanyModuleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
