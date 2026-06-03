import React from "react";
import { ScheduledGame } from "../../Data/Models/scheduledGame";
import { useTheme } from "../../Data/Context/ThemeContext";
import {
  convertUTCToLocal,
  hasScore,
  isGameInProgress,
  getGameStatusLabel,
} from "../../Data/Helpers/gameStatusHelper";
import styles from "../../style/ScheduleCalendar.module.css";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Returns the logo URL variant for the active theme. NHL logo URLs are stored as
 * `_light.svg`; dark mode uses the matching `_dark.svg` asset.
 */
function themedLogoUrl(logoUrl: string, theme: string): string {
  const logoSuffix = theme === "dark" ? "dark" : "light";
  return logoUrl.replace("_light.svg", `_${logoSuffix}.svg`);
}

type GameChipProps = {
  game: ScheduledGame;
  isGameCompleted: (game: ScheduledGame) => boolean;
  onSelect: (game: ScheduledGame) => void;
};

/**
 * Compact matchup card for week/month calendar cells. Stacks the two teams
 * (away over home) so abbreviations stay readable in narrow columns, with the
 * score aligned right per team and the start time / status on its own line.
 */
export default function GameChip({ game, isGameCompleted, onSelect }: GameChipProps) {
  const { theme } = useTheme();
  const homeLogo = themedLogoUrl(game.homeLogo, theme);
  const awayLogo = themedLogoUrl(game.awayLogo, theme);

  const completed = isGameCompleted(game);
  const live = isGameInProgress(game);
  const scored = hasScore(game);
  const statusLabel = getGameStatusLabel(game);

  const matchup = `${game.awayTeam} @ ${game.homeTeam}`;
  const label = scored
    ? `${matchup}, ${game.awayScore}–${game.homeScore}`
    : `${matchup}, ${convertUTCToLocal(game.gameTime)}`;

  return (
    <button
      type="button"
      className={cx(
        styles["game-chip"],
        completed && styles["game-chip--clickable"],
        live && styles["game-chip--live"],
      )}
      onClick={() => completed && onSelect(game)}
      disabled={!completed}
      title={matchup}
      aria-label={label}
    >
      <span className={styles["game-chip__team"]}>
        <img src={awayLogo} alt="" aria-hidden="true" />
        <span className={styles["game-chip__abbrev"]}>{game.awayTeam}</span>
        {scored && (
          <span className={styles["game-chip__score"]}>{game.awayScore}</span>
        )}
      </span>

      <span className={styles["game-chip__team"]}>
        <img src={homeLogo} alt="" aria-hidden="true" />
        <span className={styles["game-chip__abbrev"]}>{game.homeTeam}</span>
        {scored && (
          <span className={styles["game-chip__score"]}>{game.homeScore}</span>
        )}
      </span>

      <span
        className={cx(styles["game-chip__meta"], live && styles["game-chip__meta--live"])}
      >
        {scored ? statusLabel : convertUTCToLocal(game.gameTime)}
      </span>
    </button>
  );
}
