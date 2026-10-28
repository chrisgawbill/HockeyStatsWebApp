/**
 * Sharing the page being viewed. Every page is a hash route whose URL
 * rebuilds the view (including `season=`), so the current address is shared
 * as is: through the device's share sheet where the Web Share API exists,
 * otherwise by copying the link to the clipboard.
 */

export const SITE_TITLE = 'Hockey Stats';

/** The parts of `navigator` that sharing uses; tests pass a stand-in. */
export interface ShareNavigator {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
  clipboard?: Pick<Clipboard, 'writeText'>;
}

/** How a page can be shared on this device. */
export type ShareMethod = 'share-sheet' | 'copy-link' | 'unavailable';

/** What happened after the user asked to share. */
export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Builds the shared title from the page's main heading. */
export function getShareTitle(pageHeading: string | null | undefined): string {
  const heading = pageHeading?.replace(/\s+/g, ' ').trim();
  if (!heading || heading === SITE_TITLE) return SITE_TITLE;
  return `${heading} · ${SITE_TITLE}`;
}

/** Picks the share sheet when the device offers one for this data, else copying the link. */
export function chooseShareMethod(
  shareNavigator: ShareNavigator,
  shareData: ShareData,
): ShareMethod {
  const hasShareSheet =
    typeof shareNavigator.share === 'function' &&
    (typeof shareNavigator.canShare !== 'function' ||
      shareNavigator.canShare(shareData));
  if (hasShareSheet) return 'share-sheet';
  if (typeof shareNavigator.clipboard?.writeText === 'function') {
    return 'copy-link';
  }
  return 'unavailable';
}

/** True when the user closed the share sheet without sharing. */
function isShareCancelled(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/** True when the browser refused the share sheet (e.g. a policy block) and copying may still work. */
function isShareSheetBlocked(error: unknown): boolean {
  return error instanceof Error && error.name === 'NotAllowedError';
}

/** Copies the link, reporting whether the clipboard accepted it. */
async function copyLink(
  shareNavigator: ShareNavigator,
  url: string,
): Promise<ShareOutcome> {
  try {
    await shareNavigator.clipboard!.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/** Shares `{ title, url }` with the best method this device has. */
export async function sharePage(
  shareData: { title: string; url: string },
  shareNavigator: ShareNavigator = navigator,
): Promise<ShareOutcome> {
  const method = chooseShareMethod(shareNavigator, shareData);
  if (method === 'copy-link') return copyLink(shareNavigator, shareData.url);
  if (method === 'unavailable') return 'failed';

  try {
    await shareNavigator.share!(shareData);
    return 'shared';
  } catch (error) {
    if (isShareCancelled(error)) return 'cancelled';
    if (
      isShareSheetBlocked(error) &&
      typeof shareNavigator.clipboard?.writeText === 'function'
    ) {
      return copyLink(shareNavigator, shareData.url);
    }
    return 'failed';
  }
}
