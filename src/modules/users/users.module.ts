import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserAccount } from './entities/user-account.entity';
import { Address } from './entities/address.entity';
import { Role } from '../rbac/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserAccount, Role, Address])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}