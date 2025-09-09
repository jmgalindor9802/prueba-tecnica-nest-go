import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { OptionalClientJwtAuthGuard } from '../common/guards/optional-client-jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard, OptionalClientJwtAuthGuard],
  exports: [UsersService],
})
export class UsersModule {}
