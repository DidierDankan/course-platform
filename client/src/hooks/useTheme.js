import { useCallback, useSyncExternalStore } from "react";

// The single source of truth is the <html data-theme> attribute: the inline script in
// client/index.html sets it before React mounts (no flash), and every useTheme() call
// reads it through useSyncExternalStore, so all components always agree.
// Keep THEMES, DEFAULT_THEME and STORAGE_KEY in sync with that inline script.
export const THEMES = ["brutal", "cinematic"];
export const DEFAULT_THEME = "brutal";
const STORAGE_KEY = "lumen-theme";

const isTheme = (value) => THEMES.includes(value);

const getSnapshot = () => {
  const current = document.documentElement.dataset.theme;
  return isTheme(current) ? current : DEFAULT_THEME;
};
const getServerSnapshot = () => DEFAULT_THEME;

// Change the theme for the whole app. Any component (or another tab) can call this;
// the attribute observer below then notifies every useTheme() subscriber.
export function applyTheme(next, { persist = true } = {}) {
  if (!isTheme(next)) return;
  document.documentElement.dataset.theme = next;
  if (!persist) return;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // storage blocked (private mode, disabled cookies): the theme still applies for this visit
  }
}

// One observer and one storage listener for the whole app, however many components subscribe.
const listeners = new Set();
let observer = null;

const notify = () => listeners.forEach((listener) => listener());

// The storage event only fires in OTHER tabs: follow their change, without writing it back.
const onStorage = (event) => {
  if (event.key === STORAGE_KEY && isTheme(event.newValue)) applyTheme(event.newValue, { persist: false });
};

function subscribe(listener) {
  listeners.add(listener);
  if (listeners.size === 1) {
    observer = new MutationObserver(notify);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      observer?.disconnect();
      observer = null;
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next) => applyTheme(next), []);
  const toggleTheme = useCallback(() => {
    applyTheme(getSnapshot() === "brutal" ? "cinematic" : "brutal");
  }, []);

  return { theme, setTheme, toggleTheme, themes: THEMES };
}
