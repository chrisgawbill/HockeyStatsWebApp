import { localTeamList } from "../LocalData/teamListData";

export function getTeamPrimaryColor(abbrev?: string): string {
  const normalizedAbbrev = abbrev?.toUpperCase();
  return (
    localTeamList.find((team) => team.triCode === normalizedAbbrev)?.primary ??
    "#1f5f99"
  );
}
