// useCountdown.ts client/src/hooks/useCountdown.ts
// Counts down to a moment, updating every second:
//   const { hours, minutes, seconds } = useCountdown(endOfToday);

// STEP 33 (part 2): A countdown hook

import { useEffect, useState } from "react";

export const useCountdown = (target: Date) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const left = Math.max(0, target.getTime() - now);
  const totalSeconds = Math.floor(left / 1000);

  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    finished: left === 0,
  };
};
