import { Pagination } from './types.js';

export const escapeLike = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

export const parsePagination = (page?: number, pageSize?: number): { page: number; pageSize: number; offset: number } => {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page as number)) : 1;
  const safePageSize = Number.isFinite(pageSize)
    ? Math.max(1, Math.min(100, Math.floor(pageSize as number)))
    : 10;
  const offset = (safePage - 1) * safePageSize;
  return { page: safePage, pageSize: safePageSize, offset };
};

export const buildPagination = (page: number, pageSize: number, totalItems: number): Pagination => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return { page, pageSize, totalItems, totalPages };
};
