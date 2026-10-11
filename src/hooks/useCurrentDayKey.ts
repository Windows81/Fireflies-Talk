import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { nextDayCheckDelayMs, toDayKey } from "./dictationDayClock";

/**
 * Today's local day key, re-rendering when the calendar day turns over. Views
 * that derive dates from `new Date()` need this in their dependencies, or a
 * window left open overnight keeps yesterday's streak, grid and day labels.
 */
export const useCurrentDayKey = (): string => {
  const [dayKey, setDayKey] = useState(() => toDayKey(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const check = () => {
      setDayKey(toDayKey(new Date()));
      timer = setTimeout(check, nextDayCheckDelayMs(new Date()));
    };

    check();
    // Waking or refocusing can cross a rollover the timer slept through.
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") setDayKey(toDayKey(new Date()));
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return dayKey;
};
