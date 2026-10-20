import { useTheme } from '@/lib/ThemeContext';
import styles from '@/components/PageHeader.module.css';

/** Button that switches the site between the light and dark themes. */
export default function ThemeToggle() {
  const { theme, setPreference } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className={styles['theme-toggle']}
      onClick={() => setPreference(nextTheme)}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      {nextTheme === 'dark' ? 'Dark' : 'Light'}
    </button>
  );
}
