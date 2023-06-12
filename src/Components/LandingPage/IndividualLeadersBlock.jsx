import "../../style/LandingPageStyle.css";
const IndividualLeadersBlock = (props) => {
    return(
        <div className="generic-block">
            <div className="block-picture">
                <img src="https://cdn.theathletic.com/cdn-cgi/image/width=128,height=128,fit=cover,format=auto/app/uploads/2023/01/10135633/USATSI_19686361-1024x683.jpg"></img>
            </div>
            <div className="block-info">
                <p>{props.playerName}</p>
                <p>{props.infoName}</p>
            </div>
            <div className="clear-div"></div>
        </div>
    )
}
export default IndividualLeadersBlock;