import IndividualLeadersBlock from "./IndividualLeadersBlock";

const IndividualLeaders = () => {
    return(
        <div>
            <div className="header-div">
                <h2>Individual Leaders</h2>
            </div>
            <div className="clear-div"></div>
            <div>
                <IndividualLeadersBlock playerName="Claude Giroux" infoName="Assists Leader"></IndividualLeadersBlock>
                <IndividualLeadersBlock playerName="Sidney Crosby" infoName="Scoring Leader"></IndividualLeadersBlock>
            </div>
        </div>
    );
}
export default IndividualLeaders;