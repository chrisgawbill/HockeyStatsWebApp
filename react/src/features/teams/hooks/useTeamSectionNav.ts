import { MouseEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import {
  TEAM_SECTIONS,
  TeamSection,
} from '@/features/teams/types/teamPageTypes';
import {
  isTeamSection,
  resolveLegacyTeamTab,
} from '@/features/teams/utils/teamPageHelper';

interface StickyOffsets {
  header: number;
  nav: number;
}

/**
 * Drives the team page's anchor nav and returns the highlighted section plus
 * the nav click handler.
 *
 * Once content exists it lands on the section named by the URL hash. A legacy
 * `?tab=` link (from before the page used anchors) is remapped to the matching
 * section and stripped from the URL. This runs only once per page load.
 *
 * Afterwards, scroll-spy highlights whichever section is current just below
 * the sticky header and nav, using IntersectionObserver rather than a scroll
 * listener.
 */
export function useTeamSectionNav(
  isContentReady: boolean,
  stickyOffsets: StickyOffsets,
) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<TeamSection>(
    TEAM_SECTIONS[0].key,
  );
  const hasHandledDeepLinkRef = useRef(false);

  useEffect(() => {
    if (!isContentReady || hasHandledDeepLinkRef.current) return;
    hasHandledDeepLinkRef.current = true;

    const rawHash = location.hash.slice(1);
    const hashTarget = isTeamSection(rawHash) ? rawHash : null;
    const legacyTabParam = searchParams.get('tab');
    const target = hashTarget ?? resolveLegacyTeamTab(legacyTabParam);

    if (legacyTabParam != null || (target && rawHash !== target)) {
      const url = new URL(window.location.href);
      url.searchParams.delete('tab');
      if (target) url.hash = target;
      window.history.replaceState(null, '', url.toString());
    }

    if (target) {
      setActiveSection(target);
      requestAnimationFrame(() => {
        document.getElementById(target)?.scrollIntoView({ block: 'start' });
      });
    }
  }, [isContentReady, location.hash, searchParams]);

  useEffect(() => {
    if (!isContentReady) return;

    const totalOffset = stickyOffsets.header + stickyOffsets.nav;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as TeamSection);
          }
        }
      },
      { rootMargin: `-${totalOffset}px 0px -70% 0px`, threshold: 0 },
    );

    TEAM_SECTIONS.map((section) => document.getElementById(section.key))
      .filter((element): element is HTMLElement => element != null)
      .forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [isContentReady, stickyOffsets.header, stickyOffsets.nav]);

  /** Jumps to a section and records it in history without a route change. */
  function handleNavClick(
    event: MouseEvent<HTMLAnchorElement>,
    section: TeamSection,
  ) {
    event.preventDefault();
    setActiveSection(section);
    document.getElementById(section)?.scrollIntoView({ block: 'start' });
    window.history.pushState(null, '', `#${section}`);
  }

  return { activeSection, handleNavClick };
}
