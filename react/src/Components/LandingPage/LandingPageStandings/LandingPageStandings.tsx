import { Container, Row } from "react-bootstrap";
import { useState } from "react";
import StandingsContainer from "./StandingsContainer";
import SlidingToggle from "./SlidingToggle";
import React from "react";
import { useStandingsData } from "../../../Data/Context/StandingsContext";
import { StandingsTeam } from "../../../Data/Models/StandingsTeam";

type Conference = "Eastern" | "Western";
type StandingsView = "conference" | "division";

interface StandingsEntry {
  name: string;
  data: StandingsTeam[];
  format: "Conference" | "Division";
}

export default function LandingPageStandings() {
  const {
    easternStandingsData,
    westernStandingsData,
    metropolitanStandings,
    atlanticStandings,
    centralStandings,
    pacificStandings,
    loadingData,
  } = useStandingsData();

  const [view, setView] = useState<StandingsView>("conference");
  const [conference, setConference] = useState<Conference>("Eastern");

  if (loadingData) {
    return <p>Loading Data</p>;
  }

  const standingsLookup: Record<StandingsView, Record<Conference, StandingsEntry[]>> = {
    conference: {
      Eastern: [{ name: "Eastern", data: easternStandingsData, format: "Conference" }],
      Western: [{ name: "Western", data: westernStandingsData, format: "Conference" }],
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
    <Container>
      <Row className="mb-2">
        <SlidingToggle
          options={[
            { label: "Conference", value: "conference" as StandingsView },
            { label: "Division", value: "division" as StandingsView },
          ]}
          value={view}
          onChange={setView}
        />
      </Row>
      <Row className="mb-2">
        <SlidingToggle
          options={[
            { label: "Eastern", value: "Eastern" as Conference },
            { label: "Western", value: "Western" as Conference },
          ]}
          value={conference}
          onChange={setConference}
        />
      </Row>
      {standingsLookup[view][conference].map((entry) => (
        <Row key={entry.name}>
          <StandingsContainer
            standingsName={entry.name}
            standingsData={entry.data}
            standingFormat={entry.format}
          />
        </Row>
      ))}
    </Container>
  );
}
