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

function loadState(): InstallState | null {
  try {
    return readInstallState(window.localStorage);
  } catch {
    return null;
  }
}

function persist(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the in-memory state still hides the banner.
  }
}

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
    const onChange = () => setIsMobile(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const sync = () => {
      setHasPrompt(getDeferredInstallPrompt() !== null);
      if (hasAppInstalled()) {
        persist(INSTALL_KEYS.installed, '1');
        setState((s) => (s ? { ...s, installed: true } : s));
      }
    };
    sync();
    return subscribeInstallPrompt(sync);
  }, []);

  useEffect(() => {
    if (!isEngagedPath(pathname)) return;
    persist(INSTALL_KEYS.engaged, '1');
    setState((s) => (s && !s.engaged ? { ...s, engaged: true } : s));
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
    setState((s) => (s ? { ...s, dismissedAt: now } : s));
    setStepsOpen(false);
  }, []);

  const install = useCallback(async () => {
    const event = getDeferredInstallPrompt();
    if (!event) return;
    try {
      await event.prompt();
      const { outcome } = await event.userChoice;
      // The event is single-use either way.
      clearDeferredInstallPrompt();
      if (outcome === 'dismissed') dismiss();
      // 'accepted': `appinstalled` sets the permanent flag; hide right away.
      else setState((s) => (s ? { ...s, installed: true } : s));
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
