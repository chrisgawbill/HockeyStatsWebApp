import QuickLinksBlock from "./QuickLinksBlock";

const QuickLinks = () => {
    return (
        <div>
            <div className="header-div">
                <h1>Quick Links</h1>
            </div>
            <div className="clear-div"></div>
            <div>
                <QuickLinksBlock title="Teams List"></QuickLinksBlock>
                <QuickLinksBlock title="Standings"></QuickLinksBlock>
            </div>
        </div>
    );
}
export default QuickLinks;