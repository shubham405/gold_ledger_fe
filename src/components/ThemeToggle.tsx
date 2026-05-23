import { useTheme } from '../context/ThemeContext';

type Props = {
  className?: string;
};

export function ThemeToggle({ className = '' }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle${className ? ` ${className}` : ''}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className="theme-toggle__icon" aria-hidden>
        {isDark ? '☀' : '☾'}
      </span>
      <span className="theme-toggle__label">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
