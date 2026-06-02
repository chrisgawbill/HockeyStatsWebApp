import { axiosExpressHandler } from './AxiosInstance';

/**
 * Frontend API client: one async function per backend operation. Each issues a
 * GET through the shared axios instance, returns `response.data`, and logs then
 * re-throws on failure so callers can surface their own loading/empty states.
 * Season-aware calls take an optional `season` and thread it through `withParams`.
 */

const DIAGNOSTICS_HEADER = 'x-diagnostics-key';

/**
 * Appends only the defined params to `path` as a query string (empty/undefined
 * values are dropped), so `?season=` etc. is added only when actually set.
 */
function withParams(
	path: string,
	params: Record<string, string | undefined>,
): string {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value) search.set(key, value);
	}
	const qs = search.toString();
	return qs ? `${path}?${qs}` : path;
}
export async function GetCurrentStandings(season?: string) {
	try {
		const response = await axiosExpressHandler.get(withParams('/standings', { season }));
		return response.data;
	} catch (error) {
		console.error('Error fetching data: ', error);
		throw error;
	}
}
export async function GetSkaterStatLeaders(statIndicator: string, season?: string) {
	try {
		const response = await axiosExpressHandler.get(
			withParams(`/player/skater/statLeaders/${statIndicator}`, { season }),
		);
		return response.data;
	} catch (error) {
		console.error('Error fetching data: ', error);
		throw error;
	}
}
export async function GetGoalieStatLeaders(statIndicator: string, season?: string) {
	try {
		const response = await axiosExpressHandler.get(
			withParams(`/player/goalie/statLeaders/${statIndicator}`, { season }),
		);
		return response.data;
	} catch (error) {
		console.error('Error fetching data: ', error);
		throw error;
	}
}
export async function GetListOfTeams() {
	try {
		const response = await axiosExpressHandler.get('/team/');
		return response.data;
	} catch (error) {
		console.error('Error fetching data: ', error);
		throw error;
	}
}
export async function GetTeamStatsById(teamId: string, season?: string) {
	try {
		const response = await axiosExpressHandler.get(withParams(`/team/${teamId}`, { season }));
		return response.data;
	} catch (error) {
		console.error('Error fetching data: ', error);
		throw error;
	}
}
export async function GetScheduledGames(season?: string) {
	try {
		const response = await axiosExpressHandler.get(withParams('/schedule/', { season }));
		return response.data;
	} catch (error) {
		console.error('Error fetching data: ', error);
		throw error;
	}
}
export async function GetGameLanding(gameID: number) {
	try {
		const response = await axiosExpressHandler.get(
			`/schedule/landing/${gameID}`,
		);
		return response.data;
	} catch (error) {
		console.error('Error fetching data: ', error);
		throw error;
	}
}
export async function GetGameDetails(gameID: number) {
	try {
		const response = await axiosExpressHandler.get(`/schedule/${gameID}`);
		return response.data;
	} catch (error) {
		console.error('Error fetching data: ', error);
		throw error;
	}
}
export async function GetTeamRoster(triCode: string, season?: string) {
	try {
		const response = await axiosExpressHandler.get(
			withParams(`/team/roster/${triCode}`, { season }),
		);
		return response.data;
	} catch (error) {
		console.error('Error fetching team roster: ', error);
		throw error;
	}
}
export async function GetTeamSchedule(triCode: string, season?: string) {
	try {
		const response = await axiosExpressHandler.get(withParams(`/team/schedule/${triCode}`, { season }));
		return response.data;
	} catch (error) {
		console.error('Error fetching team schedule: ', error);
		throw error;
	}
}
export async function GetSkaterSummary(teamId?: string, season?: string) {
	try {
		const url = withParams('/player/skater/summary', { teamId, season });
		const response = await axiosExpressHandler.get(url);
		return response.data;
	} catch (error) {
		console.error('Error fetching skater summary: ', error);
		throw error;
	}
}
export async function GetSkaterCorsi(teamId?: string, season?: string) {
	try {
		const url = withParams('/player/skater/corsi', { teamId, season });
		const response = await axiosExpressHandler.get(url);
		return response.data;
	} catch (error) {
		console.error('Error fetching skater corsi: ', error);
		throw error;
	}
}
export async function GetGoalieSummary(teamId?: string, season?: string) {
	try {
		const url = withParams('/player/goalie/summary', { teamId, season });
		const response = await axiosExpressHandler.get(url);
		return response.data;
	} catch (error) {
		console.error('Error fetching goalie summary: ', error);
		throw error;
	}
}
/**
 * Placeholder for a future draft endpoint. Draft lottery odds are currently
 * computed locally from league rank in LeagueStandingsHelper, so this returns
 * nothing by design.
 */
export async function GetDraft() {}

export async function GetHealth(passphrase: string) {
	try {
		const response = await axiosExpressHandler.get('/health', {
			headers: { [DIAGNOSTICS_HEADER]: passphrase },
		});
		return response.data;
	} catch (error) {
		console.error('Error fetching health: ', error);
		throw error;
	}
}
export async function GetCacheReport(passphrase: string) {
	try {
		const response = await axiosExpressHandler.get('/health/cache-usage', {
			headers: { [DIAGNOSTICS_HEADER]: passphrase },
		});
		return response.data;
	} catch (error) {
		console.error('Error fetching cache report: ', error);
		throw error;
	}
}
