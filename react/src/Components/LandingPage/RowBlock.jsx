import "../../style/LandingPage/LandingPageBlock.css";
import {useState, useEffect} from 'react';
const RowBlock = (props) => {
    const [blockPictureColor, setBlockPictureColor] = useState("transparent")
    useEffect(() => {
        if(props.rowInfo === "draftLotteryOdds"){
            let draftLotteryOddsColor = props.infoName.split("(");
            draftLotteryOddsColor = draftLotteryOddsColor[1].split(")");
            
            if(draftLotteryOddsColor[0] === "UP"){
                setBlockPictureColor("lightgreen")
            }else{
                setBlockPictureColor("#c72845")
            }
        }
    },[props.rowInfo])
    return(
        <div className="generic-block">
            <div className="block-picture" style={{backgroundColor: blockPictureColor}}>
                <img src={props.image}></img>
            </div>
            <div className="block-info">
                <span className="block-info-name">{props.playerName}</span>
                <p className="block-info-info">{props.infoName}</p>
            </div>
            <div className="clear-div"></div>
        </div>
    )
}
export default RowBlock;