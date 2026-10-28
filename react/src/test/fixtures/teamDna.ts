import { Team } from '@/features/teams/types/team';
import { TeamStats } from '@/features/teams/types/teamStats';
export const SEASON = '20262027';
export interface Overrides {
  gf?: number;
  ga?: number;
  pp?: number;
  pk?: number;
  sf?: number;
  sa?: number;
  fo?: number;
  gp?: number;
}
export function team(id: number, name: string, o: Overrides = {}): Team {
  const gp = o.gp ?? 40;
  return new Team(id, name, [
    new TeamStats(
      Number(SEASON),
      gp - 10,
      0,
      0,
      7,
      3,
      0,
      o.fo ?? 0.5,
      0,
      o.ga ?? 3,
      0,
      o.gf ?? 3,
      o.pk ?? 0.8,
      o.pp ?? 0.2,
      o.sa ?? 30,
      o.sf ?? 30,
    ),
  ]);
}
export function league(n: number, tweak?: (i: number) => Overrides): Team[] {
  return Array.from({ length: n }, (_, k) => {
    const i = k + 1;
    return team(i, `Team ${i}`, {
      gf: 2 + i / 10,
      ga: 2 + i / 10,
      pp: 0.1 + i / 100,
      pk: 0.7 + i / 100,
      sf: 25 + i,
      sa: 25 + i,
      fo: 0.45 + i / 200,
      ...tweak?.(i),
    });
  });
}
