import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import PageHeader from "../Components/PageHeader";
import TeamHero from "../Components/TeamPage/TeamHero";
import BasicInfoStrip from "../Components/TeamPage/BasicInfoStrip";
import ScheduleStrip from "../Components/TeamPage/ScheduleStrip";
import LoadingState from "../Components/LoadingState";
import TeamStatsRow from "../Components/TeamPage/TeamStatsRow";
import PlayerStatsSection from "../Components/TeamPage/PlayerStatsSection";
import RosterSection from "../Components/TeamPage/RosterSection";
import { localTeamList } from "../Data/LocalData/TeamListData";
import {
  MockTeam,
  MockStatItem,
  Position,
  RosterPlayer,
  PlayerStatLine,
} from "../Data/LocalData/TeamPageMockData";
import { ScheduledGame } from "../Data/Models/ScheduledGame";
import ConvertContractsToGames from "../Data/Helpers/ScheduleHelper";
import {
  GetTeamStatsById,
  GetTeamRoster,
  GetTeamSchedule,
  GetSkaterSummary,
  GetSkaterCorsi,
  GetGoalieSummary,
} from "../Services/ApiHandler";
import { useStandingsContext } from "../Data/Context/StandingsContext";
import { InterfaceWithChatBot } from "../Services/GenAIHandler";
import styles from "../style/TeamPage/TeamPage.module.css";

const POS_MAP: Record<string, Position> = {
  C: "Center",
  L: "Left Wing",
  R: "Right Wing",
  D: "Defenseman",
  G: "Goalie",
};

function buildEmptyRoster(): Record<Position, RosterPlayer[]> {
  return {
    Center: [],
    "Left Wing": [],
    "Right Wing": [],
    Defenseman: [],
    Goalie: [],
  };
}

function formatToi(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")} TOI`;
}

function transformRoster(
  players: any[],
  toiMap: Map<number, number>,
): Record<Position, RosterPlayer[]> {
  const result = buildEmptyRoster();
  for (const p of players ?? []) {
    const pos = POS_MAP[p.position] as Position;
    if (!pos) continue;
    const toi = toiMap.get(p.id);
    const stat = toi != null ? formatToi(toi) : "";
    result[pos].push({
      id: p.id,
      name: p.name,
      number: p.number ?? 0,
      stat,
      headshot: p.headshot ?? "",
    });
  }
  for (const pos of [
    "Center",
    "Left Wing",
    "Right Wing",
    "Defenseman",
  ] as Position[]) {
    result[pos].sort((a, b) => {
      const aToi = toiMap.get(a.id) ?? 0;
      const bToi = toiMap.get(b.id) ?? 0;
      return bToi - aToi;
    });
  }
  result["Goalie"].sort((a, b) => {
    const aToi = toiMap.get(a.id) ?? 0;
    const bToi = toiMap.get(b.id) ?? 0;
    return bToi - aToi;
  });
  return result;
}

function transformPlayerStats(
  summary: any[],
  corsiData: any,
): PlayerStatLine[] {
  const corsiMap = new Map<number, number>();
  for (const p of corsiData?.data ?? []) {
    if (p.playerId != null && p.satPercentage != null)
      corsiMap.set(p.playerId, p.satPercentage);
  }
  return (summary ?? []).map(
    (p: any): PlayerStatLine => ({
      playerId: p.playerId,
      name: p.name ?? "",
      position: p.position ?? "",
      gamesPlayed: p.gamesPlayed ?? 0,
      goals: p.goals ?? 0,
      assists: p.assists ?? 0,
      points: p.points ?? 0,
      plusMinus: p.plusMinus ?? 0,
      penaltyMinutes: p.penaltyMinutes ?? 0,
      // Backend already maps "no faceoffs" (0) to null; pass it through.
      faceoffWinPct: p.faceoffWinPct ?? null,
      corsiPct: corsiMap.get(p.playerId) ?? null,
    }),
  );
}

function transformTeamStats(raw: any): MockStatItem[] {
  return [
    { label: "Goals For / GP", value: raw.goalsForPerGame?.toFixed(2) ?? "—" },
    {
      label: "Goals Against / GP",
      value: raw.goalsAgainstPerGame?.toFixed(2) ?? "—",
    },
    {
      label: "Power Play %",
      value:
        raw.powerPlayPct != null
          ? `${(raw.powerPlayPct * 100).toFixed(1)}%`
          : "—",
    },
    {
      label: "Penalty Kill %",
      value:
        raw.penaltyKillPct != null
          ? `${(raw.penaltyKillPct * 100).toFixed(1)}%`
          : "—",
    },
    { label: "Shots / GP", value: raw.shotsForPerGame?.toFixed(1) ?? "—" },
  ];
}

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const location = useLocation();
  const routeState = location.state as {
    sourcePath?: string;
    fallbackPath?: string;
    activeNavPath?: string;
  } | null;
  const triCode: string = teamId?.toUpperCase() ?? "";
  const teamSourcePath = location.pathname;
  const { easternStandingsData, westernStandingsData } = useStandingsContext();
  const teamActiveNavPath =
    routeState?.activeNavPath ?? routeState?.sourcePath ?? "/teamList";
  const teamEntry = (localTeamList as any[]).find((t) => t.triCode === triCode);
  const numericId: number = teamEntry?.id ?? 0;
  const primaryColor: string = teamEntry?.primary ?? "#1B4F8A";
  const pageStyle = { "--color-primary": primaryColor } as React.CSSProperties;

  const [team, setTeam] = useState<MockTeam | null>(null);
  const [staticInfo, setStaticInfo] = useState<{
    arena: string;
    founded: number;
    stanleyCups: number;
    conferenceChampionships: number;
    hallOfFamers: number;
  } | null>(null);
  const [stats, setStats] = useState<MockStatItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduledGame[]>([]);
  const [roster, setRoster] =
    useState<Record<Position, RosterPlayer[]>>(buildEmptyRoster());
  const [playerStats, setPlayerStats] = useState<PlayerStatLine[]>([]);
  const [headshotMap, setHeadshotMap] = useState<Map<number, string>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!triCode) return;
    setStaticInfo(null);

    async function fetchMain() {
      try {
        const [
          statsRes,
          rosterRes,
          scheduleRes,
          summaryRes,
          corsiRes,
          goalieRes,
        ] = await Promise.all([
          GetTeamStatsById(String(numericId)),
          GetTeamRoster(triCode),
          GetTeamSchedule(triCode),
          GetSkaterSummary(String(numericId)),
          GetSkaterCorsi(String(numericId)),
          GetGoalieSummary(String(numericId)).catch(() => null),
        ]);

        const raw = statsRes?.data?.[0] ?? {};
        const allStandings = [...easternStandingsData, ...westernStandingsData];
        const s = allStandings.find(t => t.id === triCode);

        const conferenceStandings = s?.conferenceName === 'Eastern'
          ? easternStandingsData
          : westernStandingsData;
        const playoffCutoff = conferenceStandings.find(
          (t) => t.conferenceStandingsPlace === 8,
        );
        const teamPoints = s?.points ?? raw.points ?? 0;
        const playoffLineDelta =
          playoffCutoff != null ? teamPoints - playoffCutoff.points : 0;

        setTeam({
          name: raw.teamFullName ?? teamEntry?.fullName ?? "",
          triCode,
          wins: s?.wins ?? raw.wins ?? 0,
          losses: s?.losses ?? raw.losses ?? 0,
          otLosses: s?.otLosses ?? raw.otLosses ?? 0,
          points: teamPoints,
          divisionRank: s?.divisionStandingsPlace ?? 0,
          division: s?.divisionName ?? "",
          conference: s?.conferenceName ?? "",
          conferenceRank: s?.conferenceStandingsPlace ?? 0,
          playoffLineDelta,
          founded: 0,
          arena: "—",
          stanleyCups: 0,
          conferenceChampionships: 0,
          hallOfFamers: 0,
        });

        const toiMap = new Map<number, number>();
        for (const p of summaryRes ?? []) {
          if (p.playerId != null && p.toiPerGame != null)
            toiMap.set(p.playerId, p.toiPerGame);
        }
        for (const g of goalieRes ?? []) {
          if (g.goalieId != null && g.toiPerGame != null)
            toiMap.set(g.goalieId, g.toiPerGame);
        }
        const newHeadshotMap = new Map<number, string>();
        for (const p of rosterRes.players ?? []) {
          if (p.id && p.headshot) newHeadshotMap.set(p.id, p.headshot);
        }
        setHeadshotMap(newHeadshotMap);
        setStats(transformTeamStats(raw));
        setSchedule(ConvertContractsToGames(scheduleRes.games));
        setRoster(transformRoster(rosterRes.players, toiMap));
        setPlayerStats(transformPlayerStats(summaryRes, corsiRes));
      } catch (err) {
        console.error("Error loading team data", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchStaticInfo() {
      try {
        const prompt =
          `Give me basic historical information about the ${teamEntry?.fullName} NHL team. ` +
          `Return ONLY a raw JSON object (no markdown) with exactly these fields: ` +
          `arena (string), founded (number - year founded), stanleyCups (number), ` +
          `conferenceChampionships (number - total conference final appearances), ` +
          `hallOfFamers (number - players inducted into the Hockey Hall of Fame).`;
        const info = await InterfaceWithChatBot({ content: prompt }, triCode);
        setStaticInfo({
          arena: info.arena ?? "—",
          founded: info.founded ?? 0,
          stanleyCups: info.stanleyCups ?? 0,
          conferenceChampionships: info.conferenceChampionships ?? 0,
          hallOfFamers: info.hallOfFamers ?? 0,
        });
      } catch (err) {
        console.error("Error fetching static team info from AI", err);
      }
    }

    fetchMain();
    fetchStaticInfo();
  }, [teamId, triCode]);

  if (loading || !team) {
    return (
      <div className={styles["team-page"]} style={pageStyle}>
        <PageHeader />
        <div className={styles["team-page__content"]} style={{ paddingTop: "2rem" }}>
          <LoadingState label="Loading team" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles["team-page"]} style={pageStyle}>
      <PageHeader />
      <TeamHero team={team} />
      <div className={styles["team-page__content"]}>
        <BasicInfoStrip team={staticInfo ? { ...team, ...staticInfo } : team} />
        <ScheduleStrip
          games={schedule}
          teamAbbrev={triCode}
          sourceLabel={team.name}
          sourcePath={teamSourcePath}
          activeNavPath={teamActiveNavPath}
        />
        <TeamStatsRow stats={stats} />
        <PlayerStatsSection players={playerStats} headshotMap={headshotMap} />
        <RosterSection roster={roster} />
      </div>
    </div>
  );
}
