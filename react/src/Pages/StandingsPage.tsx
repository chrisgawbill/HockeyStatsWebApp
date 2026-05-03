import React, { useState } from "react";
import "../style/StandingsPage/StandingsPage.css";
import { Container, Row } from "react-bootstrap";
import StandingsContainer from "../Components/LandingPage/LandingPageStandings/StandingsContainer";
import SlidingToggle from "../Components/LandingPage/LandingPageStandings/SlidingToggle";
import PageHeader from "../Components/PageHeader";
import { useStandingsData } from "../Data/Context/StandingsContext";
import { StandingsTeam } from "../Data/Models/StandingsTeam";
import StandingsClinchLegend from "../Components/LandingPage/LandingPageStandings/StandingsClinchLegend";

type Conference = "Eastern" | "Western";
type StandingsView = "conference" | "division";

interface StandingsEntry {
  name: string;
  data: StandingsTeam[];
  format: "Conference" | "Division";
}

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

  if (loadingStandingsData) {
    return <p>Loading Data</p>;
  }

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
      <Container fluid className="standings-page">
        <Row className="standings-page-toggle-row mb-2 justify-content-center">
          <SlidingToggle
            options={[
              { label: "Conference", value: "conference" as StandingsView },
              { label: "Division", value: "division" as StandingsView },
            ]}
            value={view}
            onChange={setView}
          />
        </Row>
        <Row className="standings-page-toggle-row mb-2 justify-content-center">
          <SlidingToggle
            options={[
              { label: "Eastern", value: "Eastern" as Conference },
              { label: "Western", value: "Western" as Conference },
            ]}
            value={conference}
            onChange={setConference}
          />
        </Row>
        <div className="standings-page-legend-row">
          <StandingsClinchLegend />
        </div>
        <Row id="standings-page-table-container">
          {standingsLookup[view][conference].map((entry) => (
            <StandingsContainer
              key={entry.name}
              standingsName={entry.name}
              standingsData={entry.data}
              standingFormat={entry.format}
            />
          ))}
        </Row>
      </Container>
    </>
  );
}
