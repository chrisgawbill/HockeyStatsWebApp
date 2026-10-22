import { describe, expect, it } from 'vitest';
import { formatMinutesSeconds } from '@/lib/statFormat';

describe('formatMinutesSeconds', () => {
  it('shows seconds per game as m:ss', () => {
    expect(formatMinutesSeconds(1324)).toBe('22:04');
    expect(formatMinutesSeconds(59.6)).toBe('1:00');
    expect(formatMinutesSeconds(0)).toBe('0:00');
  });

  it('shows a dash when missing', () => {
    expect(formatMinutesSeconds(null)).toBe('—');
  });
});
