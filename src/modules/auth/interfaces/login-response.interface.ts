import { AuthUser } from './auth-user.interface';

export interface LoginResponse {
  token: string;
  expiresIn: number;
  expiresAt: string;
  user: AuthUser;
}
