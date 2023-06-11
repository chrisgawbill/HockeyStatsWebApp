import "../../style/LandingPageStyle.css";
const IndividualLeadersBlock = (props) => {
    return(
        <div class="generic-block">
            <div class="block-picture">

            </div>
            <div class="block-info">
                <p>{props.playerName}</p>
                <p>{props.infoName}</p>
            </div>
            <div class="clear-div"></div>
        </div>
    )
}
export default IndividualLeadersBlock;