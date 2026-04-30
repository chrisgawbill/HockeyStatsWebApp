import React, { useState } from "react";
import { Container } from "react-bootstrap";
import { Team } from "../Data/Models/Team";
import { TeamStats } from "../Data/Models/TeamStats";
import { localTeamList } from "../Data/LocalData/TeamListData";
import "../style/TeamList/TeamList.css";
import PageHeader from "../Components/PageHeader";
import TeamListModal from "../Components/Modals/TeamListModal";
import { useListOfTeamsData } from "../Data/Context/ListOfTeamsContext";

const triCodeLookup: Record<string, string> = Object.fromEntries(
  (localTeamList as any[]).map((t) => [t.fullName, t.triCode])
);

function getCurrentStats(team: Team): TeamStats | null {
  if (!team.seasonStats || team.seasonStats.length === 0) return null;
  return team.seasonStats.reduce((latest, stat) =>
    !latest || stat.seasonId > latest.seasonId ? stat : latest
  );
}

export default function TeamList() {
  const { listOfTeamsData, loadingListOfTeamsData } = useListOfTeamsData();
  const [showTeamModal, setShowTeamModal] = useState<boolean>(false);
  const [modalTeam, setModalTeam] = useState<Team>(new Team(0, "", []));

  if (loadingListOfTeamsData) {
    return <p>Loading Data</p>;
  }

  const sorted = [...listOfTeamsData].sort((a: Team, b: Team) =>
    a.teamName.localeCompare(b.teamName)
  );

  return (
    <Container fluid>
      <PageHeader />
      <div className="team-card-grid">
        {sorted.map((team: Team) => {
          const triCode = triCodeLookup[team.teamName] ?? "";
          const logoUrl = `https://assets.nhle.com/logos/nhl/svg/${triCode}_light.svg`;
          const stats = getCurrentStats(team);
          return (
            <div
              key={team.teamName}
              className="team-card"
              onClick={() => {
                setShowTeamModal(true);
                setModalTeam(team);
              }}
            >
              <img className="team-card__logo" src={logoUrl} alt={team.teamName} />
              <p className="team-card__name">{team.teamName}</p>
              {stats ? (
                <>
                  <p className="team-card__record">
                    {stats.wins}-{stats.losses}-{stats.otLosses}
                  </p>
                  <p className="team-card__points">{stats.points} PTS</p>
                </>
              ) : (
                <p className="team-card__record">—</p>
              )}
            </div>
          );
        })}
      </div>
      <TeamListModal
        showModal={showTeamModal}
        setShowModal={setShowTeamModal}
        team={modalTeam}
      />
    </Container>
  );
}
