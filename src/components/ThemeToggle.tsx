import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { translations } from '../i18n/translations';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-xl transition-all duration-200 shadow-sm hover:shadow group"
      aria-label={translations.theme.toggleTheme}
    >
      <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
        {theme === 'dark' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </div>
      <span className="font-medium">{translations.theme[theme]}</span>
    </button>
  );
}
