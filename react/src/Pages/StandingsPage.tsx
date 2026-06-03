import React, { useState } from "react";
import styles from "../style/StandingsPage/StandingsPage.module.css";
import { Container, Row } from "react-bootstrap";
import StandingsContainer from "../Components/LandingPage/LandingPageStandings/StandingsContainer";
import SlidingToggle from "../Components/LandingPage/LandingPageStandings/SlidingToggle";
import PageHeader from "../Components/PageHeader";
import { useStandingsData } from "../Data/Context/StandingsContext";
import { StandingsTeam } from "../Data/Models/standingsTeam";
import StandingsClinchLegend from "../Components/LandingPage/LandingPageStandings/StandingsClinchLegend";
import LoadingState from "../Components/LoadingState";
import EmptyState from "../Components/EmptyState";
import SeasonSelector from "../Components/SeasonSelector";
import { useSeason } from "../Data/Context/SeasonContext";
import { formatSeasonLabel } from "../Data/Helpers/seasonHelper";

type Conference = "Eastern" | "Western";
type StandingsView = "conference" | "division";

interface StandingsEntry {
  name: string;
  data: StandingsTeam[];
  format: "Conference" | "Division";
}

/**
 * Standings route. Pulls the pre-split conference/division arrays from
 * StandingsContext and lets the user toggle between a conference view and a
 * division view, and between Eastern and Western. `?season=` drives the data.
 */
export default function StandingsPage() {
  const {
    easternStandingsData,
    westernStandingsData,
    metropolitanStandings,
    atlanticStandings,
    centralStandings,
    pacificStandings,
    loadingStandingsData,
  } = useStandingsData();

  const [view, setView] = useState<StandingsView>("conference");
  const [conference, setConference] = useState<Conference>("Eastern");
  const { season } = useSeason();

  const hasStandings =
    easternStandingsData.length > 0 || westernStandingsData.length > 0;

  /**
   * Maps the active view/conference toggles to the table sections to render: one
   * combined conference table or two division tables.
   */
  const standingsLookup: Record<
    StandingsView,
    Record<Conference, StandingsEntry[]>
  > = {
    conference: {
      Eastern: [{ name: "", data: easternStandingsData, format: "Conference" }],
      Western: [{ name: "", data: westernStandingsData, format: "Conference" }],
    },
    division: {
      Eastern: [
        { name: "Metro", data: metropolitanStandings, format: "Division" },
        { name: "Atlantic", data: atlanticStandings, format: "Division" },
      ],
      Western: [
        { name: "Central", data: centralStandings, format: "Division" },
        { name: "Pacific", data: pacificStandings, format: "Division" },
      ],
    },
  };

  return (
    <>
      <PageHeader />
      <Container fluid className={styles["standings-page"]}>
        <SeasonSelector />
        {loadingStandingsData ? (
          <LoadingState label="Loading standings" fullPage />
        ) : !hasStandings ? (
          <EmptyState
            fullPage
            title="No standings"
            message={`No standings available for ${formatSeasonLabel(season)}.`}
          />
        ) : (
          <>
            <Row className={`${styles["standings-page-toggle-row"]} mb-2 justify-content-center`}>
              <SlidingToggle
                options={[
                  { label: "Conference", value: "conference" as StandingsView },
                  { label: "Division", value: "division" as StandingsView },
                ]}
                value={view}
                onChange={setView}
              />
            </Row>
            <Row className={`${styles["standings-page-toggle-row"]} mb-2 justify-content-center`}>
              <SlidingToggle
                options={[
                  { label: "Eastern", value: "Eastern" as Conference },
                  { label: "Western", value: "Western" as Conference },
                ]}
                value={conference}
                onChange={setConference}
              />
            </Row>
            <div className={styles["standings-page-legend-row"]}>
              <StandingsClinchLegend className={styles["standings-legend"]} />
            </div>
            <Row className={styles["standings-page-table-container"]}>
              {standingsLookup[view][conference].map((entry) => (
                <StandingsContainer
                  key={entry.name}
                  standingsName={entry.name}
                  standingsData={entry.data}
                  standingFormat={entry.format}
                />
              ))}
            </Row>
          </>
        )}
      </Container>
    </>
  );
}
