import { useThemeStore, type Theme } from '@/features/theme/model/theme-store';
import { cn } from '@/shared/lib/cn';

const options: Array<{ label: string; value: Theme }> = [
  { label: 'Light', value: 'light' },
  { label: 'System', value: 'system' },
  { label: 'Dark', value: 'dark' },
];

export function ThemeToggle(): React.ReactNode {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <div aria-label="Color theme" className="flex rounded-xl bg-muted p-1" role="group">
      {options.map((option) => (
        <button
          aria-pressed={theme === option.value}
          className={cn(
            'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
            theme === option.value
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          key={option.value}
          onClick={() => void setTheme(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
