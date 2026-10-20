import { useHeaderSearch } from '@/components/useHeaderSearch';
import styles from '@/components/PageHeader.module.css';
import { joinClassNames } from '@/lib/joinClassNames';

/** Desktop search input with its results dropdown, driven by `useHeaderSearch`. */
export default function HeaderSearchBox({
  search,
}: {
  search: ReturnType<typeof useHeaderSearch>;
}) {
  const {
    query,
    setQuery,
    activeIndex,
    setActiveIndex,
    isOpen,
    setIsOpen,
    searchBoxRef,
    results,
    goToResult,
    handleKeyDown,
  } = search;

  return (
    <div className={styles['nav-search-col']} ref={searchBoxRef}>
      <input
        type="text"
        className={styles['nav-search-input']}
        placeholder="Search teams or games"
        aria-label="Search teams or games"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(-1);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {isOpen && results.length > 0 && (
        <ul className={styles['nav-search-dropdown']} role="listbox">
          {results.map((result, index) => (
            <li
              key={result.id}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                className={joinClassNames(
                  styles['nav-search-option'],
                  index === activeIndex && styles['nav-search-option--active'],
                )}
                onMouseDown={(event) => {
                  // Keeps the input's onBlur from closing the dropdown before
                  // the click registers.
                  event.preventDefault();
                  goToResult(result);
                }}
              >
                {result.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
