import { useEffect, useRef } from 'react';
import { useInstallPrompt } from '@/features/install-prompt/hooks/useInstallPrompt';
import styles from '@/features/install-prompt/components/InstallBanner.module.css';

const ICON_SRC = `${import.meta.env.BASE_URL}icons/icon-192.png`;

function ShareIcon() {
  return (
    <svg
      className={styles.shareIcon}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 10H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1" />
      <path d="M12 15V3" />
      <path d="m8.5 6.5 3.5-3.5 3.5 3.5" />
    </svg>
  );
}

/**
 * Floating "install the app" card above the mobile bottom nav. Renders nothing
 * on desktop, when installed, or when the browser cannot install.
 */
export default function InstallBanner() {
  const { variant, stepsOpen, openSteps, install, dismiss } =
    useInstallPrompt();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mode = variant ? (stepsOpen ? 'steps' : 'banner') : null;

  // Lets PageHeader.module.css raise/hide the search FAB and reserve space.
  useEffect(() => {
    if (!mode) return;
    document.body.dataset.installBanner = mode;
    return () => {
      delete document.body.dataset.installBanner;
    };
  }, [mode]);

  useEffect(() => {
    if (stepsOpen) headingRef.current?.focus();
  }, [stepsOpen]);

  if (!variant) return null;

  if (stepsOpen) {
    return (
      <section className={styles.card} aria-labelledby="install-steps-title">
        <h2
          id="install-steps-title"
          ref={headingRef}
          tabIndex={-1}
          className={styles.stepsHeading}
        >
          Add to Home Screen
        </h2>
        <ol className={styles.steps}>
          <li>
            Tap <ShareIcon /> <strong>Share</strong> in Safari
          </li>
          <li>
            Choose <strong>Add to Home Screen</strong>
          </li>
        </ol>
        <button type="button" className={styles.gotIt} onClick={dismiss}>
          Got it
        </button>
      </section>
    );
  }

  return (
    <aside className={styles.banner} aria-label="Install Hockey Stats">
      <img
        className={styles.icon}
        src={ICON_SRC}
        alt=""
        width="36"
        height="36"
      />
      <div className={styles.text}>
        <p className={styles.title}>Install Hockey Stats</p>
        <p className={styles.subtitle}>Get final-score alerts</p>
      </div>
      <button
        type="button"
        className={styles.action}
        onClick={variant === 'ios' ? openSteps : () => void install()}
      >
        {variant === 'ios' ? 'How?' : 'Install'}
      </button>
      <button
        type="button"
        className={styles.dismiss}
        aria-label="Dismiss install banner"
        onClick={dismiss}
      >
        ✕
      </button>
    </aside>
  );
}
