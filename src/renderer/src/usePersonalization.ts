import { useEffect, useState } from 'react';
import { defaultAppearanceState, type AppearanceState } from '../../shared/appearance';
import { defaultIdentity, type Identity } from '../../shared/identity';
import { invoke } from './ipc';

/** The saved chat appearance and the user/assistant identity, loaded once at start-up. */
export function usePersonalization(onError: (message: string) => void) {
  const [appearance, setAppearance] = useState<AppearanceState>(defaultAppearanceState);
  const [identity, setIdentity] = useState<Identity>(defaultIdentity);
  useEffect(() => {
    void invoke('appearance:get')
      .then(setAppearance)
      .catch((e) => onError(String(e)));
  }, [onError]);
  useEffect(() => {
    void invoke('identity:get')
      .then(setIdentity)
      .catch((e) => onError(String(e)));
  }, [onError]);
  return { appearance, setAppearance, identity, setIdentity };
}
