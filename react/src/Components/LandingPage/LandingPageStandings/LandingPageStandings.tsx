import { Container, Row } from "react-bootstrap";
import { useState } from "react";
import StandingsContainer from "./StandingsContainer";
import SlidingToggle from "./SlidingToggle";
import React from "react";
import { useStandingsData } from "../../../Data/Context/StandingsContext";

type Conference = "Eastern" | "Western";
type StandingsView = "conference" | "division";

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

      {view === "conference" && conference === "Eastern" && (
        <Row>
          <StandingsContainer
            key="easternStandings"
            standingsName="Eastern"
            standingsData={easternStandingsData}
            standingFormat="Conference"
          />
        </Row>
      )}
      {view === "conference" && conference === "Western" && (
        <Row>
          <StandingsContainer
            key="westernStandings"
            standingsName="Western"
            standingsData={westernStandingsData}
            standingFormat="Conference"
          />
        </Row>
      )}
      {view === "division" && conference === "Eastern" && (
        <>
          <Row>
            <StandingsContainer
              key="metropolitanStandings"
              standingsName="Metro"
              standingsData={metropolitanStandings}
              standingFormat="Division"
            />
          </Row>
          <Row>
            <StandingsContainer
              key="atlanticStandings"
              standingsName="Atlantic"
              standingsData={atlanticStandings}
              standingFormat="Division"
            />
          </Row>
        </>
      )}
      {view === "division" && conference === "Western" && (
        <>
          <Row>
            <StandingsContainer
              key="centralStandings"
              standingsName="Central"
              standingsData={centralStandings}
              standingFormat="Division"
            />
          </Row>
          <Row>
            <StandingsContainer
              key="pacificStandings"
              standingsName="Pacific"
              standingsData={pacificStandings}
              standingFormat="Division"
            />
          </Row>
        </>
      )}
    </Container>
  );
}
