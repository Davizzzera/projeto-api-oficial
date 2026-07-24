import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionValidationService } from './session-validation.service';
import { UserRepository } from '../repositories/user.repository';
import { MembershipRepository } from '../repositories/membership.repository';
import { OrganizationRepository } from '../repositories/organization.repository';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionValidationService,
    UserRepository,
    MembershipRepository,
    OrganizationRepository
  ],
  exports: [AuthService, SessionValidationService],
})
export class AuthModule {}
