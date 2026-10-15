import { useEffect, useState } from 'react';

/** The current time as a Date, refreshed every `everyMs` milliseconds (once a minute by default). */
export function useNow(everyMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(timer);
  }, [everyMs]);

  return now;
}
