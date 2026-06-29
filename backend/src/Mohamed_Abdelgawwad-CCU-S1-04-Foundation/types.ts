export type UserRole = 'student' | 'volunteer' | 'manager' | 'admin';

export const ROLE_RANK: Record<UserRole, number> = {
  student: 0,
  volunteer: 1,
  manager: 2,
  admin: 3,
};

export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload extends AuthUser {}

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface CursorPagination {
  nextCursor: number | null;
  hasMore: boolean;
  pageSize: number;
}