import { useEffect } from "react";
import { beginStep, endStep, type PlayLocation } from "@/lib/auth/scoring";

export function useStepTelemetry(username: string | undefined, role: string | undefined, location: PlayLocation) {
  const { area, missionId, missionTitle, stepId, stepTitle } = location;
  useEffect(() => {
    if (role !== "student" || !username) return;
    beginStep(username, { area, missionId, missionTitle, stepId, stepTitle });
    return () => endStep(username);
  }, [username, role, area, missionId, missionTitle, stepId, stepTitle]);
}
