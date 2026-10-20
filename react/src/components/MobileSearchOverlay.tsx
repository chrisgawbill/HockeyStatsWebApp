import { KeyboardEvent, RefObject } from 'react';

import ThemeToggle from '@/components/ThemeToggle';
import { SearchResult } from '@/components/useHeaderSearch';
import styles from '@/components/PageHeader.module.css';

interface MobileSearchOverlayProps {
  query: string;
  onQueryChange: (query: string) => void;
  results: SearchResult[];
  onSelectResult: (result: SearchResult) => void;
  onClose: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  inputRef: RefObject<HTMLInputElement>;
}

/** Full-screen search dialog shown on phones, with a theme toggle and results list. */
export default function MobileSearchOverlay({
  query,
  onQueryChange,
  results,
  onSelectResult,
  onClose,
  onKeyDown,
  inputRef,
}: MobileSearchOverlayProps) {
  return (
    <div
      className={styles['mobile-search-overlay']}
      role="dialog"
      aria-modal="true"
      aria-label="Search teams or games"
      onClick={onClose}
      onKeyDown={onKeyDown}
    >
      <div
        className={styles['mobile-search-panel']}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles['mobile-search-header']}>
          <input
            ref={inputRef}
            type="text"
            className={styles['mobile-search-input']}
            placeholder="Search teams or games"
            aria-label="Search teams or games"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <button
            type="button"
            className={styles['mobile-search-close-btn']}
            onClick={onClose}
            aria-label="Close search"
          >
            &times;
          </button>
        </div>
        <div className={styles['mobile-search-theme']}>
          <ThemeToggle />
        </div>
        <ul className={styles['mobile-search-results']} role="listbox">
          {results.map((result) => (
            <li key={result.id} role="option">
              <button
                type="button"
                className={styles['mobile-search-result']}
                onClick={() => {
                  onSelectResult(result);
                  onClose();
                }}
              >
                {result.label}
              </button>
            </li>
          ))}
          {query.trim() !== '' && results.length === 0 && (
            <li className={styles['mobile-search-empty']}>No results found</li>
          )}
        </ul>
      </div>
    </div>
  );
}
