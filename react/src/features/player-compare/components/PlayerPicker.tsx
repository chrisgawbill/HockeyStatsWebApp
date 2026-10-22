import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import {
  MIN_SEARCH_LENGTH,
  normalizeForSearch,
  searchPlayers,
} from '@/features/player-compare/utils/playerSearch';
import {
  formatPlayerTeamLine,
  formatSearchSeasonLine,
} from '@/features/player-compare/utils/playerLabels';
import type { ComparePlayer } from '@/features/player-compare/types/playerCompare';
import styles from '@/features/player-compare/components/PlayerPicker.module.css';

export interface PlayerPickerProps {
  /** The players that can be picked (one group: skaters or goalies). */
  players: ComparePlayer[];
  /** Plural noun for the group, e.g. "skaters". */
  groupNoun: string;
  /** Players already in the comparison, left out of the results. */
  excludedIds: number[];
  /** True when the comparison is full; the field is disabled. */
  isFull: boolean;
  /** Focuses the field when it first shows. */
  autoFocus?: boolean;
  onPick: (player: ComparePlayer) => void;
}

/**
 * Name search for the next player to compare, as an ARIA combobox: type two
 * letters, ↑/↓ move through the matches, Enter picks, Escape closes the list
 * and then clears the field. The field keeps focus after a pick, so a second
 * player can be added straight away.
 */
export default function PlayerPicker({
  players,
  groupNoun,
  excludedIds,
  isFull,
  autoFocus = false,
  onPick,
}: PlayerPickerProps) {
  const inputId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(
    () => searchPlayers(players, query, excludedIds),
    [players, query, excludedIds],
  );
  const isQueryLongEnough =
    normalizeForSearch(query).length >= MIN_SEARCH_LENGTH;
  const isListShown = isOpen && results.length > 0;
  const isNoMatchShown = isOpen && isQueryLongEnough && results.length === 0;
  const activeOptionId = isListShown ? `${listId}-${activeIndex}` : undefined;

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  /** Adds the player and empties the field for the next search. */
  function pickPlayer(player: ComparePlayer) {
    onPick(player);
    setQuery('');
    setIsOpen(false);
    setActiveIndex(0);
  }

  /** Moves the highlighted result up or down, wrapping at either end. */
  function moveActiveResult(step: 1 | -1) {
    setIsOpen(true);
    setActiveIndex(
      (currentIndex) => (currentIndex + step + results.length) % results.length,
    );
  }

  /** Arrow keys, Enter and Escape for the combobox. */
  function respondToKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (results.length === 0) return;
      event.preventDefault();
      moveActiveResult(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter') {
      if (!isListShown) return;
      event.preventDefault();
      pickPlayer(results[activeIndex]);
    } else if (event.key === 'Escape') {
      if (isListShown || isNoMatchShown) {
        setIsOpen(false);
      } else {
        setQuery('');
      }
    }
  }

  const label = isFull
    ? 'Comparison full: remove a player to add another'
    : `Search ${groupNoun} to add`;
  const statusText = !isQueryLongEnough
    ? ''
    : `${results.length} ${results.length === 1 ? 'match' : 'matches'}`;

  return (
    <div className={styles.picker}>
      <label htmlFor={inputId} className={styles.visuallyHidden}>
        {label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        className={`ds-input ${styles.input}`}
        type="text"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        aria-autocomplete="list"
        aria-expanded={isListShown}
        aria-controls={listId}
        aria-activedescendant={activeOptionId}
        placeholder={
          isFull ? 'Remove a player to add another' : `Search ${groupNoun}…`
        }
        disabled={isFull}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={respondToKey}
      />
      <ul
        id={listId}
        role="listbox"
        aria-label={`Matching ${groupNoun}`}
        className={styles.results}
        hidden={!isListShown}
      >
        {results.map((player, index) => (
          <li
            key={player.playerId}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            className={styles.result}
            // Picks before the input's blur closes the list.
            onMouseDown={(event) => {
              event.preventDefault();
              pickPlayer(player);
            }}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <span className={styles.resultName}>{player.name}</span>
            <span className={styles.resultDetail}>
              {formatPlayerTeamLine(player)} · {formatSearchSeasonLine(player)}
            </span>
          </li>
        ))}
      </ul>
      {isNoMatchShown && (
        <p className={styles.noMatch}>
          No {groupNoun} match “{query.trim()}”
        </p>
      )}
      <p role="status" className={styles.visuallyHidden}>
        {statusText}
      </p>
    </div>
  );
}
