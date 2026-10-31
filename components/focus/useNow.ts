"use client";

import { useEffect, useState } from "react";

/** Current time, refreshed every second while `on`. Kept local so only the caller re-renders. */
export function useNow(on = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const first = setTimeout(() => setNow(Date.now()), 0);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [on]);
  return now;
}
