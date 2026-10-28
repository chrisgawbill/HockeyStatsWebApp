import { afterEach, describe, expect, it, vi } from 'vitest';
import type { KeyboardEvent } from 'react';
import type { Coord, Skater } from '@/features/board-game/types/game';
import {
  coordKey,
  focusNextRinkTile,
  nextTileInDirection,
  skaterControlLabel,
} from '@/features/board-game/utils/rinkControls';

const FROM: Coord = { col: 5, row: 3 };
const CANDIDATES: Coord[] = [
  { col: 7, row: 3 },
  { col: 6, row: 3 },
  { col: 5, row: 1 },
  { col: 4, row: 4 },
];

function keyEvent(key: string) {
  return {
    key,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent<HTMLElement> & {
    preventDefault: ReturnType<typeof vi.fn>;
  };
}

describe('rink controls', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('picks the nearest highlighted tile in the arrow direction', () => {
    expect(nextTileInDirection('ArrowRight', FROM, CANDIDATES)).toEqual({
      col: 6,
      row: 3,
    });
    expect(nextTileInDirection('ArrowUp', FROM, CANDIDATES)).toEqual({
      col: 5,
      row: 1,
    });
    expect(nextTileInDirection('ArrowLeft', FROM, CANDIDATES)).toEqual({
      col: 4,
      row: 4,
    });
  });

  it('returns null for other keys or an empty direction', () => {
    expect(nextTileInDirection('Enter', FROM, CANDIDATES)).toBeNull();
    expect(nextTileInDirection('ArrowDown', FROM, [{ col: 9, row: 3 }])).toBe(
      null,
    );
  });

  it('moves focus to the next tile button and keeps arrows from scrolling', () => {
    const focus = vi.fn();
    const querySelector = vi.fn(() => ({ focus }));
    vi.stubGlobal('document', { querySelector });

    const arrow = keyEvent('ArrowRight');
    focusNextRinkTile(arrow, FROM, CANDIDATES);
    expect(arrow.preventDefault).toHaveBeenCalled();
    expect(querySelector).toHaveBeenCalledWith('[data-rink-tile="6,3"]');
    expect(focus).toHaveBeenCalled();

    const blocked = keyEvent('ArrowDown');
    focusNextRinkTile(blocked, FROM, []);
    expect(blocked.preventDefault).toHaveBeenCalled();

    const tab = keyEvent('Tab');
    focusNextRinkTile(tab, FROM, CANDIDATES);
    expect(tab.preventDefault).not.toHaveBeenCalled();
    expect(querySelector).toHaveBeenCalledTimes(1);
  });

  it('names tiles and skaters the same way on both renderers', () => {
    const skater: Skater = {
      id: 'user-C',
      team: 'user',
      role: 'C',
      pos: FROM,
      stunned: false,
    };
    expect(coordKey(FROM)).toBe('5,3');
    expect(skaterControlLabel(skater, true)).toBe('Blue C, has puck');
    expect(skaterControlLabel({ ...skater, team: 'cpu' }, false)).toBe('Red C');
  });
});
