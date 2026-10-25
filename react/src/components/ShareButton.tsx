import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShareIcon } from '@/components/PageHeaderIcons';
import { getShareTitle, sharePage, type ShareOutcome } from '@/lib/sharePage';
import styles from '@/components/ShareButton.module.css';

/** How long the "Link copied" confirmation stays up. */
const CONFIRMATION_VISIBLE_MS = 3000;

/** How long a failure message stays up. */
const ERROR_VISIBLE_MS = 6000;

/** Message shown for each share outcome; a shared or cancelled share shows none. */
const OUTCOME_MESSAGES: Partial<Record<ShareOutcome, string>> = {
  copied: 'Link copied',
  failed: "Couldn't share this page. Copy the address from your browser.",
};

/** Reads the page's main heading, which names what is being shared. */
function readPageHeading(): string | null {
  return document.querySelector('h1')?.textContent ?? null;
}

/**
 * Phone top bar button that shares the page being viewed: the device's share
 * sheet where there is one, otherwise the link is copied and a toast confirms
 * it. The toast lives in a polite live region so screen readers announce it.
 */
export default function ShareButton() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const visibleMs =
      message === OUTCOME_MESSAGES.copied
        ? CONFIRMATION_VISIBLE_MS
        : ERROR_VISIBLE_MS;
    const hideMessageTimer = window.setTimeout(
      () => setMessage(null),
      visibleMs,
    );
    return () => window.clearTimeout(hideMessageTimer);
  }, [message]);

  const shareCurrentPage = async () => {
    setMessage(null);
    const outcome = await sharePage({
      title: getShareTitle(readPageHeading()),
      url: window.location.href,
    });
    setMessage(OUTCOME_MESSAGES[outcome] ?? null);
  };

  return (
    <>
      <button
        type="button"
        className={styles.share}
        onClick={shareCurrentPage}
        aria-label="Share this page"
      >
        <ShareIcon />
      </button>
      {createPortal(
        <p className={message ? styles.toast : styles.liveRegion} role="status">
          {message}
        </p>,
        document.body,
      )}
    </>
  );
}
