import { describe, expect, it, vi } from 'vitest';
import {
  chooseShareMethod,
  getShareTitle,
  sharePage,
  type ShareNavigator,
} from '@/lib/sharePage';

const shareData = {
  title: 'Toronto Maple Leafs · Hockey Stats',
  url: 'https://example.com/HockeyStatsWebApp/#/team/TOR?season=20252026',
};

function namedError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

function clipboardThat(writeText: (text: string) => Promise<void>) {
  return { writeText: vi.fn(writeText) };
}

describe('getShareTitle', () => {
  it('adds the site name after the page heading', () => {
    expect(getShareTitle('Player comparison')).toBe(
      'Player comparison · Hockey Stats',
    );
  });

  it('collapses whitespace from multi-line headings', () => {
    expect(getShareTitle('  TOR\n  at   BOS ')).toBe(
      'TOR at BOS · Hockey Stats',
    );
  });

  it('falls back to the site name with no heading', () => {
    expect(getShareTitle(null)).toBe('Hockey Stats');
    expect(getShareTitle('   ')).toBe('Hockey Stats');
    expect(getShareTitle('Hockey Stats')).toBe('Hockey Stats');
  });
});

describe('chooseShareMethod', () => {
  it('uses the share sheet when navigator.share exists', () => {
    const shareNavigator: ShareNavigator = { share: vi.fn() };
    expect(chooseShareMethod(shareNavigator, shareData)).toBe('share-sheet');
  });

  it('copies the link when canShare rejects the data', () => {
    const shareNavigator: ShareNavigator = {
      share: vi.fn(),
      canShare: () => false,
      clipboard: clipboardThat(async () => {}),
    };
    expect(chooseShareMethod(shareNavigator, shareData)).toBe('copy-link');
  });

  it('copies the link when navigator.share is missing', () => {
    const shareNavigator: ShareNavigator = {
      clipboard: clipboardThat(async () => {}),
    };
    expect(chooseShareMethod(shareNavigator, shareData)).toBe('copy-link');
  });

  it('is unavailable with neither share nor clipboard', () => {
    expect(chooseShareMethod({}, shareData)).toBe('unavailable');
  });
});

describe('sharePage', () => {
  it('shares the title and URL through the share sheet', async () => {
    const share = vi.fn(async () => {});
    await expect(sharePage(shareData, { share })).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith(shareData);
  });

  it('reports a closed share sheet as cancelled, without copying', async () => {
    const clipboard = clipboardThat(async () => {});
    const share = vi.fn(async () => {
      throw namedError('AbortError');
    });
    await expect(sharePage(shareData, { share, clipboard })).resolves.toBe(
      'cancelled',
    );
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it('copies the link when the share sheet is blocked', async () => {
    const clipboard = clipboardThat(async () => {});
    const share = vi.fn(async () => {
      throw namedError('NotAllowedError');
    });
    await expect(sharePage(shareData, { share, clipboard })).resolves.toBe(
      'copied',
    );
    expect(clipboard.writeText).toHaveBeenCalledWith(shareData.url);
  });

  it('fails on any other share error', async () => {
    const share = vi.fn(async () => {
      throw namedError('DataError');
    });
    await expect(sharePage(shareData, { share })).resolves.toBe('failed');
  });

  it('copies the URL when the share sheet is missing', async () => {
    const clipboard = clipboardThat(async () => {});
    await expect(sharePage(shareData, { clipboard })).resolves.toBe('copied');
    expect(clipboard.writeText).toHaveBeenCalledWith(shareData.url);
  });

  it('fails when the clipboard refuses the link', async () => {
    const clipboard = clipboardThat(async () => {
      throw namedError('NotAllowedError');
    });
    await expect(sharePage(shareData, { clipboard })).resolves.toBe('failed');
  });

  it('fails when the device can neither share nor copy', async () => {
    await expect(sharePage(shareData, {})).resolves.toBe('failed');
  });
});
