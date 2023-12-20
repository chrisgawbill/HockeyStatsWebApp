import React from "react";
import "../../style/LandingPage/LandingPageBlock.css";
import {useState, useEffect} from 'react';

interface RowBlockProps{
    playerName:string,
    infoName:string,
    image:string,
    rowInfo:string
}
export default function RowBlock({playerName, infoName, image, rowInfo}:RowBlockProps){
    const [blockPictureColor, setBlockPictureColor] = useState("transparent")
    useEffect(() => {
        if(rowInfo === "draftLotteryOdds"){
            let draftLotteryOddsColor = infoName.split("(");
            draftLotteryOddsColor = draftLotteryOddsColor[1].split(")");
            const trend = draftLotteryOddsColor[0]
            if(trend === "UP"){
                setBlockPictureColor("lightgreen");
            }else if(trend === "DOWN") {
                setBlockPictureColor("#ff6666");
            }else{
                setBlockPictureColor("#ff9900");
            }
        }
    }, []);
    return(
        <div className="generic-block">
            <div className="block-picture" style={{backgroundColor: blockPictureColor}}>
                <img src={image} alt=""></img>
            </div>
            <div className="block-info">
                <span className="block-info-name">{playerName}</span>
                <p className="block-info-info">{infoName}</p>
            </div>
            <div className="clear-div"></div>
        </div>
    );
}