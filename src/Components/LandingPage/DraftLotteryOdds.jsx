import DraftLotteryOddsBlock from "./DraftLotteryOddsBlock";
import { ScrollMenu, VisibilityContext } from 'react-horizontal-scrolling-menu';
import 'react-horizontal-scrolling-menu/dist/styles.css';
const items = [{id:1, team: "Philadelphia Flyers", odds: 13.00},{id:2, team: "Columbus Blue Jackets", odds: 12.00}]
const DraftLotteryOdds = (props) => {
    const LeftArrow = () => {
        const { isFirstItemVisible, scrollPrev } =
          React.useContext(VisibilityContext);
      
        return (
          <Arrow disabled={isFirstItemVisible} onClick={() => scrollPrev()}>
            Left
          </Arrow>
        );
      }
      
      const RightArrow = () => {
        const { isLastItemVisible, scrollNext } = React.useContext(VisibilityContext);
      
        return (
          <Arrow disabled={isLastItemVisible} onClick={() => scrollNext()}>
            Right
          </Arrow>
        );
      }
    return(
        <div>
            <div className="header-div">
                <h2>Draft Lottery Odds</h2>
            </div>
            <div className="clear-div"></div>
            <div>
                <ScrollMenu LeftArrow={LeftArrow} RightArrow={RightArrow}>
                    {items.map(({id}) => (
                        <DraftLotteryOddsBlock teamName={items.team} lotteryOdds={items.odds}></DraftLotteryOddsBlock>
                    ))}
                </ScrollMenu>
            </div>
        </div>
    );
}
export default DraftLotteryOdds;