import { getTeamLogoUrl } from '@/lib/teamLogo';
import { useTheme } from '@/lib/ThemeContext';

export interface TeamLogoProps {
  triCode: string;
  className?: string;
}

/** A team's NHL logo, drawn for the current theme. Decorative: pair it with the team's name. */
export default function TeamLogo({ triCode, className }: TeamLogoProps) {
  const { theme } = useTheme();
  return (
    <img className={className} src={getTeamLogoUrl(triCode, theme)} alt="" />
  );
}
