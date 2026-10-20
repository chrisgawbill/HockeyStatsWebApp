import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import {
  FAN_TIERS,
  FAN_TIER_NAMES,
  MAX_CATEGORY_LABEL_LENGTH,
  countGraphemes,
  isCategoryLabelTooLong,
  readCategoryLabel,
  type FanTier,
  type FavoriteCategory,
} from '@/lib/favoriteCategory';
import styles from '@/components/FavoriteCategoryMenu.module.css';

/** Width of the menu on screens wide enough for it. */
const MENU_WIDTH_PX = 280;
/** Smallest gap kept between the menu and the screen edges. */
const SCREEN_MARGIN_PX = 16;
const GAP_BELOW_ANCHOR_PX = 8;

const FOCUSABLE_SELECTOR =
  'input:not(:disabled), button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])';

export interface FavoriteCategoryMenuProps {
  /** Name of the favorite team or player, used in labels. */
  itemName: string;
  category: FavoriteCategory;
  /** The star that opened the menu; the menu sits under it and returns focus to it. */
  anchorRef: RefObject<HTMLElement | null>;
  /** Saves the chosen category; rejects when the save fails. */
  onSave: (category: FavoriteCategory) => Promise<void>;
  /** Removes the favorite; rejects when the save fails. */
  onUnfavorite: () => Promise<void>;
  onClose: () => void;
}

/** Returns the fixed position that keeps the menu under its star and on screen. */
function getMenuPosition(anchor: HTMLElement | null): CSSProperties {
  const menuWidth = Math.min(
    MENU_WIDTH_PX,
    window.innerWidth - 2 * SCREEN_MARGIN_PX,
  );
  const anchorBox = anchor?.getBoundingClientRect();
  const preferredLeft = (anchorBox?.right ?? window.innerWidth) - menuWidth;
  const left = Math.min(
    Math.max(preferredLeft, SCREEN_MARGIN_PX),
    window.innerWidth - menuWidth - SCREEN_MARGIN_PX,
  );
  const top = (anchorBox?.bottom ?? 0) + GAP_BELOW_ANCHOR_PX;
  return {
    top,
    left,
    width: menuWidth,
    maxHeight: window.innerHeight - top - SCREEN_MARGIN_PX,
  };
}

/**
 * Lists the elements Tab actually stops on, in order. Browsers give a radio
 * group a single tab stop (its checked radio), so unchecked radios are left
 * out when the group has a checked one.
 */
function listTabStops(container: HTMLElement): HTMLElement[] {
  const focusableElements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
  return focusableElements.filter((element) => {
    if (!(element instanceof HTMLInputElement) || element.type !== 'radio') {
      return true;
    }
    const groupHasCheckedRadio = focusableElements.some(
      (other) =>
        other instanceof HTMLInputElement &&
        other.type === 'radio' &&
        other.name === element.name &&
        other.checked,
    );
    return element.checked || !groupHasCheckedRadio;
  });
}

/** Keeps Tab and Shift+Tab cycling inside the menu. */
function keepFocusInside(event: KeyboardEvent<HTMLElement>) {
  const tabStops = listTabStops(event.currentTarget);
  const firstTabStop = tabStops[0];
  const lastTabStop = tabStops[tabStops.length - 1];
  if (event.shiftKey && document.activeElement === firstTabStop) {
    event.preventDefault();
    lastTabStop.focus();
  } else if (!event.shiftKey && document.activeElement === lastTabStop) {
    event.preventDefault();
    firstTabStop.focus();
  }
}

/** Re-computes the menu position on scroll and resize while it is open. */
function useMenuPosition(anchorRef: RefObject<HTMLElement | null>) {
  const [position, setPosition] = useState(() =>
    getMenuPosition(anchorRef.current),
  );
  useEffect(() => {
    const updatePosition = () =>
      setPosition(getMenuPosition(anchorRef.current));
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef]);
  return position;
}

/** Calls `onClose` when a pointer press lands outside both the menu and its star. */
function useCloseOnOutsidePress(
  menuRef: RefObject<HTMLElement | null>,
  anchorRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    const closeOnOutsidePress = (event: PointerEvent) => {
      const pressedElement = event.target as Node;
      const isInsideMenu = menuRef.current?.contains(pressedElement);
      const isOnStar = anchorRef.current?.contains(pressedElement);
      if (!isInsideMenu && !isOnStar) onClose();
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, [menuRef, anchorRef, onClose]);
}

/**
 * Small popover for a favorite's fan category: pick Diehard, Fan or Curious,
 * add an optional label, save, or unfavorite. Focus moves into the menu when
 * it opens and returns to the star when it closes with Esc, Save or Unfavorite;
 * clicking outside closes it. A failed save keeps the menu open and says so.
 */
export default function FavoriteCategoryMenu({
  itemName,
  category,
  anchorRef,
  onSave,
  onUnfavorite,
  onClose,
}: FavoriteCategoryMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [draftTier, setDraftTier] = useState<FanTier>(category.tier);
  const [draftLabel, setDraftLabel] = useState(category.label ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const position = useMenuPosition(anchorRef);
  const isLabelTooLong = isCategoryLabelTooLong(draftLabel);
  const labelLength = countGraphemes(draftLabel.trim());

  const closeAndReturnFocus = () => {
    onClose();
    anchorRef.current?.focus();
  };

  useEffect(() => {
    menuRef.current
      ?.querySelector<HTMLInputElement>('input[type="radio"]:checked')
      ?.focus();
  }, []);

  useCloseOnOutsidePress(menuRef, anchorRef, onClose);

  const runActionThenClose = async (action: () => Promise<void>) => {
    setIsSaving(true);
    setSaveFailed(false);
    try {
      await action();
      closeAndReturnFocus();
    } catch {
      setSaveFailed(true);
      setIsSaving(false);
    }
  };

  const saveCategory = (event: FormEvent) => {
    event.preventDefault();
    if (isLabelTooLong) return;
    runActionThenClose(() =>
      onSave({ tier: draftTier, label: readCategoryLabel(draftLabel) }),
    );
  };

  const closeOnEscapeAndKeepTabInside = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeAndReturnFocus();
    } else if (event.key === 'Tab') {
      keepFocusInside(event);
    }
    event.stopPropagation();
  };

  return createPortal(
    <div
      ref={menuRef}
      className={styles.menu}
      style={position}
      role="dialog"
      aria-label={`Fan category for ${itemName}`}
      onKeyDown={closeOnEscapeAndKeepTabInside}
      onClick={(event) => event.stopPropagation()}
    >
      <form onSubmit={saveCategory}>
        <fieldset className={styles.tiers} disabled={isSaving}>
          <legend className={styles.legend}>Fan tier</legend>
          {FAN_TIERS.map((tier) => (
            <label key={tier} className={styles.tierOption}>
              <input
                type="radio"
                name="fan-tier"
                value={tier}
                checked={draftTier === tier}
                onChange={() => setDraftTier(tier)}
              />
              {FAN_TIER_NAMES[tier]}
            </label>
          ))}
        </fieldset>
        <label className={styles.labelField}>
          <span className={styles.legend}>Label (optional)</span>
          <span className={styles.labelRow}>
            <input
              type="text"
              className={styles.labelInput}
              value={draftLabel}
              onChange={(event) => setDraftLabel(event.target.value)}
              disabled={isSaving}
              placeholder="e.g. Prospect"
              aria-invalid={isLabelTooLong}
              aria-describedby="fan-label-count"
            />
            <button
              type="button"
              className={styles.textButton}
              onClick={() => setDraftLabel('')}
              disabled={isSaving || draftLabel === ''}
            >
              Clear
            </button>
          </span>
        </label>
        <p
          id="fan-label-count"
          className={isLabelTooLong ? styles.countOver : styles.count}
        >
          {labelLength}/{MAX_CATEGORY_LABEL_LENGTH}
          {isLabelTooLong && ' - label is too long'}
        </p>
        {saveFailed && (
          <p className={styles.error} role="alert">
            Couldn&apos;t save. Try again in a moment.
          </p>
        )}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={() => runActionThenClose(onUnfavorite)}
            disabled={isSaving}
          >
            Unfavorite
          </button>
          <button
            type="submit"
            className={styles.saveButton}
            disabled={isSaving || isLabelTooLong}
          >
            Save
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
