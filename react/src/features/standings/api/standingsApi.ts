import { get } from '@/lib/apiClient';

/** Season-wide league standings (`GET /standings`). */
export async function GetCurrentStandings(season?: string) {
  return get('/standings', { season });
}
