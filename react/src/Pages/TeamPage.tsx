import React, { useEffect, useRef } from "react";
import { GetListOfTeams, GetTeamStatsById } from "../Services/ApiHandler";
import { ConvertToListOfTeams } from "../Data/Helpers/TeamHelpers";
import PageHeader from "../Components/PageHeader";

interface TeamPageProps {
  teamId: Number;
}
export default function TeamPage({ teamId }: TeamPageProps) {
  const teamListData = React.useRef<any[]>([]);
  useEffect(() => {

  });
  return(
     <div>
        <PageHeader />
        
     </div>
    );
}
