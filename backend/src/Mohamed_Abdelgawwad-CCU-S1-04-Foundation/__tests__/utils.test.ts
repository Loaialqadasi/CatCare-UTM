import { parsePagination, buildPagination } from '../utils.js';

describe('parsePagination', () => {
  it('defaults: parsePagination() -> { page: 1, pageSize: 10, offset: 0 }', () => {
    expect(parsePagination()).toEqual({ page: 1, pageSize: 10, offset: 0 });
  });

  it('custom page: parsePagination(3, 20) -> { page: 3, pageSize: 20, offset: 40 }', () => {
    expect(parsePagination(3, 20)).toEqual({ page: 3, pageSize: 20, offset: 40 });
  });

  it('page 0 clamped to 1: parsePagination(0) -> { page: 1, pageSize: 10, offset: 0 }', () => {
    expect(parsePagination(0)).toEqual({ page: 1, pageSize: 10, offset: 0 });
  });

  it('negative page clamped to 1: parsePagination(-5) -> { page: 1, pageSize: 10, offset: 0 }', () => {
    expect(parsePagination(-5)).toEqual({ page: 1, pageSize: 10, offset: 0 });
  });

  it('pageSize over 100 clamped: parsePagination(1, 200) -> { page: 1, pageSize: 100, offset: 0 }', () => {
    expect(parsePagination(1, 200)).toEqual({ page: 1, pageSize: 100, offset: 0 });
  });

  it('pageSize 0 clamped to 1: parsePagination(1, 0) -> { page: 1, pageSize: 1, offset: 0 }', () => {
    expect(parsePagination(1, 0)).toEqual({ page: 1, pageSize: 1, offset: 0 });
  });

  it('NaN page defaults to 1: parsePagination(NaN) -> { page: 1, pageSize: 10, offset: 0 }', () => {
    expect(parsePagination(NaN)).toEqual({ page: 1, pageSize: 10, offset: 0 });
  });

  it('fractional page floored: parsePagination(2.7, 15.9) -> { page: 2, pageSize: 15, offset: 15 }', () => {
    expect(parsePagination(2.7, 15.9)).toEqual({ page: 2, pageSize: 15, offset: 15 });
  });
});

describe('buildPagination', () => {
  it('totalItems 0: buildPagination(1, 10, 0) -> { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }', () => {
    expect(buildPagination(1, 10, 0)).toEqual({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
  });

  it('exact fit: buildPagination(1, 10, 50) -> { ...totalPages: 5 }', () => {
    expect(buildPagination(1, 10, 50)).toEqual({ page: 1, pageSize: 10, totalItems: 50, totalPages: 5 });
  });

  it('remainder: buildPagination(1, 10, 55) -> { ...totalPages: 6 }', () => {
    expect(buildPagination(1, 10, 55)).toEqual({ page: 1, pageSize: 10, totalItems: 55, totalPages: 6 });
  });
});
