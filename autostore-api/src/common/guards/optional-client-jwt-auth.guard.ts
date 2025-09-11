import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../users/entities/role.enum';

@Injectable()
export class OptionalClientJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const role = request.body?.role;
    if (!role || role === Role.Client) {
      return true;
    }
    return super.canActivate(context);
  }
}