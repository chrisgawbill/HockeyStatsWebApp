import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  hasAppInstalled,
  subscribeInstallPrompt,
} from '@/lib/installPrompt';
import { isIosDevice, isStandaloneDisplay } from '@/lib/displayMode';
import {
  INSTALL_KEYS,
  getInstallVariant,
  isEngagedPath,
  readInstallState,
  recordVisit,
  type InstallState,
  type InstallVariant,
} from '@/features/install-prompt/utils/installEligibility';

/** Same breakpoint as the bottom nav / search FAB in PageHeader.module.css. */
const MOBILE_QUERY = '(max-width: 576px)';

export interface InstallPromptState {
  variant: InstallVariant | null;
  /** iOS only: the instruction card is replacing the banner. */
  stepsOpen: boolean;
  openSteps: () => void;
  /** Chromium: show the native prompt. Accepted hides; dismissed snoozes. */
  install: () => Promise<void>;
  /** Hide for 30 days (banner "✕" and the iOS "Got it"). */
  dismiss: () => void;
}

/** Reads the persisted install state, or null when storage is unavailable. */
function loadState(): InstallState | null {
  try {
    return readInstallState(window.localStorage);
  } catch {
    return null;
  }
}

/** Writes one install flag to localStorage, ignoring storage failures. */
function persist(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the in-memory state still hides the banner.
  }
}

/**
 * Decides whether the mobile install banner should show, and which kind
 * (Chromium native prompt or iOS instructions). Combines the persisted
 * eligibility state (visits, engagement, dismissals, install), the captured
 * `beforeinstallprompt` event, and whether the viewport is phone-sized, and
 * exposes the install, open-steps, and dismiss actions.
 */
export function useInstallPrompt(): InstallPromptState {
  const { pathname } = useLocation();
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia?.(MOBILE_QUERY).matches === true,
  );
  // null means storage threw: never show.
  const [state, setState] = useState<InstallState | null>(() => {
    try {
      recordVisit(window.localStorage, window.sessionStorage);
    } catch {
      return null;
    }
    return loadState();
  });
  const [hasPrompt, setHasPrompt] = useState(
    () => getDeferredInstallPrompt() !== null,
  );
  const [stepsOpen, setStepsOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia?.(MOBILE_QUERY);
    if (!media) return;
    const handleMediaChange = () => setIsMobile(media.matches);
    media.addEventListener('change', handleMediaChange);
    return () => media.removeEventListener('change', handleMediaChange);
  }, []);

  useEffect(() => {
    const syncInstallState = () => {
      setHasPrompt(getDeferredInstallPrompt() !== null);
      if (hasAppInstalled()) {
        persist(INSTALL_KEYS.installed, '1');
        setState((current) =>
          current ? { ...current, installed: true } : current,
        );
      }
    };
    syncInstallState();
    return subscribeInstallPrompt(syncInstallState);
  }, []);

  useEffect(() => {
    if (!isEngagedPath(pathname)) return;
    persist(INSTALL_KEYS.engaged, '1');
    setState((current) =>
      current && !current.engaged ? { ...current, engaged: true } : current,
    );
  }, [pathname]);

  const variant =
    isMobile && state
      ? getInstallVariant(
          state,
          {
            standalone: isStandaloneDisplay(),
            ios: isIosDevice(),
            hasInstallPrompt: hasPrompt,
          },
          Date.now(),
        )
      : null;

  const dismiss = useCallback(() => {
    const now = Date.now();
    persist(INSTALL_KEYS.dismissedAt, String(now));
    setState((current) =>
      current ? { ...current, dismissedAt: now } : current,
    );
    setStepsOpen(false);
  }, []);

  const install = useCallback(async () => {
    const installEvent = getDeferredInstallPrompt();
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      // The event is single-use either way.
      clearDeferredInstallPrompt();
      if (outcome === 'dismissed') dismiss();
      // 'accepted': `appinstalled` sets the permanent flag; hide right away.
      else
        setState((current) =>
          current ? { ...current, installed: true } : current,
        );
    } catch {
      clearDeferredInstallPrompt();
    }
  }, [dismiss]);

  const openSteps = useCallback(() => setStepsOpen(true), []);

  return {
    variant,
    stepsOpen: variant === 'ios' && stepsOpen,
    openSteps,
    install,
    dismiss,
  };
}
