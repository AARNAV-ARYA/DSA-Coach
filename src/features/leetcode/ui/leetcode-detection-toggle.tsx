import { useEffect, useState } from 'react';

const leetCodeOriginPattern = 'https://leetcode.com/*';

const isPermissionsApiAvailable = (): boolean =>
  typeof chrome !== 'undefined' && chrome.permissions !== undefined;

export function LeetCodeDetectionToggle(): React.ReactNode {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(isPermissionsApiAvailable);

  useEffect(() => {
    if (!isPermissionsApiAvailable()) return;

    void chrome.permissions.contains({ origins: [leetCodeOriginPattern] }).then((enabled) => {
      setIsEnabled(enabled);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return null;

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-sm font-semibold text-foreground">LeetCode detection</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Detects the problem number, title, difficulty, and URL only on LeetCode problem pages.
      </p>
      <div className="mt-4">
        {isEnabled ? (
          <p className="text-sm font-medium text-accent">Enabled for LeetCode</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Reload this extension from Chrome’s Extensions page to grant LeetCode access.
          </p>
        )}
      </div>
    </section>
  );
}
