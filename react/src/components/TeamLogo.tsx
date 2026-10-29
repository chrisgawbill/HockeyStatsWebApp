import { getTeamLogoUrl } from '@/lib/teamLogo';
import { useTheme } from '@/lib/ThemeContext';

export interface TeamLogoProps {
  triCode: string;
  league?: 'nhl' | 'ahl';
  className?: string;
}

/** A team's logo (NHL by default), drawn for the current theme. Decorative: pair it with the team's name. */
export default function TeamLogo({
  triCode,
  league = 'nhl',
  className,
}: TeamLogoProps) {
  const { theme } = useTheme();
  return (
    <img
      className={className}
      src={getTeamLogoUrl(triCode, theme, league)}
      alt=""
    />
  );
}
