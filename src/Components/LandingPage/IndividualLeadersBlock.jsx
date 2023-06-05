const IndividualLeadersBlock = (props) => {
    return(
        <div className="generic-block">
            <div className="block-picture">

            </div>
            <div className="block-info">
                <p>{props.playerName}</p>
                <p>{props.infoName}</p>
            </div>
        </div>
    )
}
export default IndividualLeadersBlock;