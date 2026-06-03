import { Row, Col, ButtonGroup, Button } from 'react-bootstrap';
import { ScheduledGame } from '../../Data/Models/scheduledGame';
import { useTheme } from '../../Data/Context/ThemeContext';
import {
  convertUTCToLocal,
  hasScore,
  isGameInProgress,
  getGameStatusLabel,
} from '../../Data/Helpers/gameStatusHelper';
import styles from '../../style/SchedulePage.module.css';

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Returns the logo URL variant for the active theme. NHL logo URLs are stored as
 * `_light.svg`; dark mode uses the matching `_dark.svg` asset.
 */
function themedLogoUrl(logoUrl: string, theme: string): string {
  const logoSuffix = theme === 'dark' ? 'dark' : 'light';
  return logoUrl.replace('_light.svg', `_${logoSuffix}.svg`);
}

type ScheduleCardProps = {
  game: ScheduledGame;
  isGameCompleted: (game: ScheduledGame) => boolean;
  goToGameDetails: (game: ScheduledGame) => void;
};

/**
 * Opens the NHL ticket URL in a new tab. The caller supplies the already-vetted
 * ticket URL from the ScheduledGame model and no value is returned.
 */
function handleTicketClick(ticketLink: string) {
  window.open(ticketLink, '_blank');
}

/**
 * The tall, full-width game card used in the schedule's day view. Shows the
 * matchup, score or start time, playoff badge, venue, tickets, and broadcasts;
 * a completed game is clickable through to its detail page.
 */
function ScheduleCard({
  game,
  isGameCompleted,
  goToGameDetails,
}: ScheduleCardProps) {
  const { theme } = useTheme();
  const homeLogo = themedLogoUrl(game.homeLogo, theme);
  const awayLogo = themedLogoUrl(game.awayLogo, theme);
  const statusLabel = getGameStatusLabel(game);
  return (
    <div
      key={game.gameId}
      className={cx(
        styles['game-card'],
        isGameCompleted(game) && styles['game-card--clickable'],
      )}
      onClick={() => isGameCompleted(game) && goToGameDetails(game)}
    >
      <Row key={game.gameId} className={styles['game-row']}>
        <Col className={styles['team-info']}>
          <img src={homeLogo} alt="home_logo" />
          <h3>{game.homeTeam}</h3>
        </Col>
        <Col className={styles['vs']}>
          {game.isPlayoff && (
            <div className={styles['game-playoff-badge']}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="16px"
                viewBox="0 -960 960 960"
                width="16px"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M280-120v-80h160v-124q-49-11-87.5-41.5T296-442q-75-9-125.5-65.5T120-640v-40q0-33 23.5-56.5T200-760h80v-80h400v80h80q33 0 56.5 23.5T840-680v40q0 76-50.5 132.5T664-442q-18 46-56.5 76.5T520-324v124h160v80H280Zm0-408v-152h-80v40q0 38 22 68.5t58 43.5Zm285 93q35-35 35-85v-240H360v240q0 50 35 85t85 35q50 0 85-35Zm115-93q36-13 58-43.5t22-68.5v-40h-80v152Zm-200-52Z" />
              </svg>
              <span>
                {game.playoffRound != null
                  ? `R${game.playoffRound}`
                  : 'Playoffs'}
                {game.seriesWins != null
                  ? ` · ${game.seriesWins}`
                  : game.playoffRound != null
                    ? ' · Playoffs'
                    : ''}
              </span>
            </div>
          )}
          {hasScore(game) ? (
            <>
              <p className={styles['game-final-score']}>
                {game.homeScore} – {game.awayScore}
              </p>
              {statusLabel && (
                <span
                  className={cx(
                    styles['game-period-chip'],
                    (game.periodType === 'OT' || game.periodType === 'SO') &&
                      styles['overtime'],
                    isGameInProgress(game) && styles['live'],
                  )}
                >
                  {statusLabel}
                </span>
              )}
            </>
          ) : (
            <>
              <h3>VS</h3>
              <p className={styles['game-time']}>
                {convertUTCToLocal(game.gameTime)}
              </p>
            </>
          )}
        </Col>
        <Col className={styles['team-info']}>
          <h3>{game.awayTeam}</h3>
          <img src={awayLogo} alt="away_logo" />
        </Col>
      </Row>
      <Row className={styles['game-details']}>
        <Col xs={12} sm={4}>
          <p>Venue: {game.venue}</p>
        </Col>
        <Col xs={12} sm={4} className="text-center">
          <ButtonGroup className={styles['md3-btn-group']}>
            {game.ticketLink !== '' ? (
              <Button
                className="btn btn-primary"
                onClick={() => handleTicketClick(game.ticketLink)}
              >
                Tickets
              </Button>
            ) : (
              <></>
            )}
          </ButtonGroup>
        </Col>
        <Col xs={12} sm={4}>
          <p>
            Broadcasts:{' '}
            {game.broadcasts
              .map(
                (broadcast) =>
                  `${broadcast.broadcasterName} (${broadcast.broadcastCountry}) `,
              )
              .join(',')}
          </p>
        </Col>
      </Row>
    </div>
  );
}
export default ScheduleCard;
