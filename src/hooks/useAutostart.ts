import { useCallback, useEffect, useState } from "react";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { load } from "@tauri-apps/plugin-store";

const STORE_FILE = "settings.json";
const INIT_KEY = "autostart_initialized";

export function useAutostart() {
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const store = await load(STORE_FILE);
        const initialized = await store.get<boolean>(INIT_KEY);

        if (!initialized) {
          await enable();
          await store.set(INIT_KEY, true);
          await store.save();
          setAutostartEnabled(true);
        } else {
          const enabled = await isEnabled();
          setAutostartEnabled(enabled);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const toggle = useCallback(async () => {
    setLoading(true);
    try {
      if (autostartEnabled) {
        await disable();
        setAutostartEnabled(false);
      } else {
        await enable();
        setAutostartEnabled(true);
      }
    } finally {
      setLoading(false);
    }
  }, [autostartEnabled]);

  return { autostartEnabled, toggle, loading };
}
