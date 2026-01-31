import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserModulesController } from './user-modules.controller';

@Module({
  controllers: [UserController, UserModulesController],
  providers: [UserService],
})
export class UserModule {}
