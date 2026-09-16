import styles from '@/components/QuickLinks.module.css';
import { Link } from 'react-router-dom';

export default function QuickLinks() {
  return (
    <div id="quick-links-container">
      <div className={styles['landing-header']}>
          <h2>Quick Links</h2>
      </div>
      <div className="ds-grid">
        <div>
          <Link to="/teamList">
            <button className={`ds-button ${styles['quick-links-btn']}`}>
              Teams List
            </button>
          </Link>
        </div>
        <div>
          <Link to="/standings">
            <button className={`ds-button ${styles['quick-links-btn']}`}>
              Standings
            </button>
          </Link>
        </div>
        <div>
          <Link to="/board-game">
            <button className={`ds-button ${styles['quick-links-btn']}`}>
              Board Game
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
