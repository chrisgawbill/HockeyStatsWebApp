import '../../style/LandingPageStyle.css';
const QuickLinksBlock = (props) => {
    return(
        <div className = "quick-links-block">
            <p>{props.title}</p>
        </div>
    );
}
export default QuickLinksBlock;