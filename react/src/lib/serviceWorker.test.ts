import { afterEach, describe, expect, it, vi } from 'vitest';
import { getServiceWorkerContainer } from '@/lib/serviceWorker';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getServiceWorkerContainer', () => {
  it('is null when the property exists but is undefined (Firefox private window)', () => {
    vi.stubGlobal('navigator', { serviceWorker: undefined });
    expect(getServiceWorkerContainer()).toBeNull();
  });

  it('is null when the browser has no service workers at all', () => {
    vi.stubGlobal('navigator', {});
    expect(getServiceWorkerContainer()).toBeNull();
  });

  it('returns the container when service workers are available', () => {
    const container = { register: vi.fn() };
    vi.stubGlobal('navigator', { serviceWorker: container });
    expect(getServiceWorkerContainer()).toBe(container);
  });
});
