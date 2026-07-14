export type ClinchStatus =
  | 'presidents'
  | 'conference'
  | 'division'
  | 'playoffs'
  | 'wildcard';

export const CLINCH_STATUS_META: Record<
  ClinchStatus,
  { badge: string; className: string; label: string }
> = {
  presidents: {
    badge: 'P',
    className: 'standings-status--presidents',
    label: 'Presidents',
  },
  conference: {
    badge: 'C',
    className: 'standings-status--conference',
    label: 'Conference',
  },
  division: {
    badge: 'D',
    className: 'standings-status--division',
    label: 'Division',
  },
  playoffs: {
    badge: 'X',
    className: 'standings-status--playoffs',
    label: 'Playoffs',
  },
  wildcard: {
    badge: 'W',
    className: 'standings-status--wildcard',
    label: 'Wild Card',
  },
};
