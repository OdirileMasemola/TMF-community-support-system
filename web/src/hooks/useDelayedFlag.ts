import { useEffect, useState } from "react";

/** Returns true only after `active` has stayed true for `delay` ms, so quick loads do not flash a spinner. */
export function useDelayedFlag(active: boolean, delay = 150) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => {
      window.clearTimeout(timer);
      setVisible(false);
    };
  }, [active, delay]);

  return active && visible;
}
