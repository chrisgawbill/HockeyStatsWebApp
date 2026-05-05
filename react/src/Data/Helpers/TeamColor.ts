import { localTeamList } from "../LocalData/TeamListData";

export function getTeamPrimaryColor(abbrev?: string): string {
  const normalizedAbbrev = abbrev?.toUpperCase();
  return (
    localTeamList.find((team) => team.triCode === normalizedAbbrev)?.primary ??
    "#1f5f99"
  );
}
