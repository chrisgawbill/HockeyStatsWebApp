import { localTeamList } from '@/lib/teamListData';
import styles from '@/features/matchup/components/MatchupPage.module.css';

interface TeamSelectProps {
  label: string;
  value: string;
  onChange: (triCode: string) => void;
}

/** Labeled dropdown listing every NHL club. */
export default function TeamSelect({
  label,
  value,
  onChange,
}: TeamSelectProps) {
  return (
    <label className={styles.control}>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {localTeamList.map((team) => (
          <option key={team.triCode} value={team.triCode}>
            {team.fullName}
          </option>
        ))}
      </select>
    </label>
  );
}
