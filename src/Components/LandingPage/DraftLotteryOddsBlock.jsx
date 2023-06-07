import {useState, useEffect} from 'react';


const DraftLotteryOddsBlock = (props) => {
    const [lotteryOddsChange, setLotteryOddsChange] = useState("")
    return (
        <div className="generic-block">
            <div className="block-picture">

            </div>
            <div className="block-info">
                <p>{props.teamName}</p>
                <p>{props.lotteryOdds}</p>
            </div>
        </div>
    );
}
export default DraftLotteryOddsBlock;
