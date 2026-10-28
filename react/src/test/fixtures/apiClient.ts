import { vi } from 'vitest';
export const get = vi.fn();
export const post = vi.fn();
export const put = vi.fn();
export class ApiError extends Error {
  constructor(public readonly status: number) {
    super();
  }
}
