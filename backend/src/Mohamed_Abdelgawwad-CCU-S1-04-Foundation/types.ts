export type UserRole = 'student' | 'volunteer' | 'manager' | 'admin';

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
