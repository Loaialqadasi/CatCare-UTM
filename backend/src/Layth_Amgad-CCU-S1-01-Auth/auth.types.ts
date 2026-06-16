import { UserRole } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/types.js';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  emailVerified?: boolean;
}

export interface AuthResult {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ForgotPasswordResult {
  message: string;
<<<<<<< HEAD
  token?: string; // Included for in-app password reset (no email delivery)
=======
  token?: string; // Only included in development for testing
>>>>>>> c4c05d1dbba72ca5ab6c54197d794c3c574d081e
}

export interface ResetPasswordResult {
  message: string;
}

export interface RefreshTokenResult {
  token: string;
}
<<<<<<< HEAD

export interface VerifyEmailResult {
  message: string;
}
=======
>>>>>>> c4c05d1dbba72ca5ab6c54197d794c3c574d081e
