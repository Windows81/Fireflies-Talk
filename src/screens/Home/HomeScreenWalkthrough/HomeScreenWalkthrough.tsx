import { useAuth } from "@/features/auth";
import { useEffect, type FC } from "react";
import { useHomeScreenWalkthrough } from "./store";

const START_DELAY_MS = 800;

export const HomeScreenWalkthrough: FC = () => {
  const { user } = useAuth();
  const start = useHomeScreenWalkthrough((s) => s.start);
  const completed = useHomeScreenWalkthrough((s) => s.completed);

  useEffect(() => {
    if (!user || completed) return;
    const timer = setTimeout(start, START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [user, completed, start]);

  return null;
};
