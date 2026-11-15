import { useEffect, useState } from 'react';
import type { Settings } from '../../shared/types';

/** The application settings (null until loaded); the chosen theme is applied to the document. */
export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    document.documentElement.dataset.theme = settings?.theme || 'light';
  }, [settings?.theme]);
  return { settings, setSettings };
}
