import {useState, useEffect} from 'react';

const [lotteryOddsChange, setLotteryOddsChange] = useState("")

const DraftLotteryOddsBlock = (props) => {
    return (
        <div className="generic-block">
            <div className="block-picture">

            </div>
            <div className="block-info">
                <p>{props.teamName}</p>
                <p>{props.lotterOdds}</p>
            </div>
        </div>
    );
}
export default DraftLotteryOddsBlock;
