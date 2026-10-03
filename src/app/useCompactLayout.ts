import { useSyncExternalStore } from "react";

// Keep this query aligned with the compact landscape media rules in component CSS.
const QUERY = "(orientation: landscape) and (max-width: 900px), (orientation: landscape) and (max-height: 680px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function useCompactLayout() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
