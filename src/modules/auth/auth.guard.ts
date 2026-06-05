import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './current-user.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    (request as AuthenticatedRequest).user = this.authService.authenticate(token);
    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const authorization = request.header('authorization');

    if (!authorization) {
      return undefined;
    }

    const [scheme, token] = authorization.split(' ');
    return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
  }
}
