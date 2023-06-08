import DraftLotteryOddsBlock from "./DraftLotteryOddsBlock";
// import { ScrollMenu, VisibilityContext } from "react-horizontal-scrolling-menu";
// import "react-horizontal-scrolling-menu/dist/styles.css";
// import Arrow from "./Arrow";
import React from "react";

const items = [
  { id: 1, team: "Philadelphia Flyers", odds: 13.0 },
  { id: 2, team: "Columbus Blue Jackets", odds: 12.0 },
  { id: 3, team: "Philadelphia Flyers", odds: 13.0 },
  { id: 4, team: "Columbus Blue Jackets", odds: 12.0 },
  { id: 4, team: "Columbus Blue Jackets", odds: 12.0 },
];
const DraftLotteryOdds = (props) => {
  return (
    <div>
      <div className="header-div">
        <h2>Draft Lottery Odds</h2>
      </div>
      <div className="clear-div"></div>
      <div class="horizontal-scrollable">
        <div class="row">
          {items.map((item) => (
            <DraftLotteryOddsBlock
              teamName={item.team}
              lotteryOdds={item.odds}
            ></DraftLotteryOddsBlock>
          ))}
        </div>
      </div>
    </div>
  );
};
export default DraftLotteryOdds;
