import "../../style/LandingPageStyle.css";
import {useState, useEffect} from 'react';
const RowBlock = (props) => {
    return(
        <div className="generic-block">
            <div className="block-picture">
                <img src={props.image}></img>
            </div>
            <div className="block-info">
                <p>{props.playerName}</p>
                <p>{props.infoName}</p>
            </div>
            <div className="clear-div"></div>
        </div>
    )
}
export default RowBlock;