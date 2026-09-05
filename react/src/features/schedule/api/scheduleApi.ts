import { get } from '@/lib/apiClient';

/** Whole-season schedule (`GET /schedule/`), normalized backend contracts. */
export async function GetScheduledGames(season?: string) {
  return get('/schedule/', { season });
}
