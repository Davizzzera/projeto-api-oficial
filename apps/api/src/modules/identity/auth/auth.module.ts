import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionValidationService } from './session-validation.service';
import { UserRepository } from '../repositories/user.repository';
import { MembershipRepository } from '../repositories/membership.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { SessionGuard } from '../../../common/guards/session.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RedisSessionRepository } from './repositories/redis-session.repository';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionValidationService,
    UserRepository,
    MembershipRepository,
    OrganizationRepository,
    SessionGuard,
    PermissionsGuard,
    RedisSessionRepository
  ],
  exports: [AuthService, SessionValidationService, SessionGuard, PermissionsGuard],
})
export class AuthModule {}
