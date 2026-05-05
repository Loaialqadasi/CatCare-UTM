import { Pagination } from './types';

// Escape special SQL LIKE characters to prevent injection
export const escapeLike = (value: string): string => value.replace(/[\\%_]/g, '\\\\$&');

// Parse pagination parameters with sensible defaults and bounds
export const parsePagination = (page?: number, pageSize?: number): { page: number; pageSize: number; offset: number } => {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page as number)) : 1;
  const safePageSize = Number.isFinite(pageSize)
    ? Math.max(1, Math.min(100, Math.floor(pageSize as number)))
    : 10;
  const offset = (safePage - 1) * safePageSize;
  return { page: safePage, pageSize: safePageSize, offset };
};

// Build pagination metadata from page info and total count
export const buildPagination = (page: number, pageSize: number, totalItems: number): Pagination => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return { page, pageSize, totalItems, totalPages };
};
