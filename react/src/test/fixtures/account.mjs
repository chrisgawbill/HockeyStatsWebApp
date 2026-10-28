export const email = 'member@example.test';
export const token = 'synthetic-session';
export const accountResponses = {
  '/api/auth/me': { email },
  '/api/push/config': { enabled: false, publicKey: '' },
  '/api/favorites': { favorites: [] },
  '/api/favorite-players': { favorites: [] },
  '/api/after-action-reports': { reports: [], unreadCount: 0 },
  '/api/weekly-player-reports': { reports: [], unreadCount: 0 },
  '/api/push/weekly-report': { enabled: false },
};
