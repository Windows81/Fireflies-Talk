import { useState } from "react";
import {
  useFetchScheduledMaintenanceQuery,
  type FetchScheduledMaintenanceQuery,
} from "@/graphql";

type ScheduledMaintenance = NonNullable<
  FetchScheduledMaintenanceQuery["fetchScheduledMaintenance"]
>;

const MESSAGE_PATTERNS = {
  link: /\(([^)]+)\)\[<([^>]+)>\]/g,
  bold: /\*([^*]+)\*/g,
};

function formatMaintenanceMessage(message: string): string {
  return message
    .replace(MESSAGE_PATTERNS.link, "[$1]($2)")
    .replace(MESSAGE_PATTERNS.bold, "**$1**");
}

function getMaintenanceMessage(maintenance: ScheduledMaintenance): string {
  if (maintenance.message && maintenance.message.length > 0) {
    return formatMaintenanceMessage(maintenance.message);
  }
  const date = maintenance.endDate
    ? new Date(maintenance.endDate).toLocaleDateString()
    : null;
  return `We are currently undergoing maintenance${date ? ` until ${date}` : ""} which might cause some inconsistencies. Bear with us.`;
}

export function useHasActiveMaintenance(target?: string) {
  const { data } = useFetchScheduledMaintenanceQuery({
    variables: target ? { target } : {},
  });

  return !!data?.fetchScheduledMaintenance?.isActive;
}

export function useMaintenanceMessage(target?: string) {
  const [dismissed, setDismissed] = useState(false);

  const { data } = useFetchScheduledMaintenanceQuery({
    variables: target ? { target } : {},
  });

  const maintenance = data?.fetchScheduledMaintenance;
  const message = maintenance?.isActive
    ? getMaintenanceMessage(maintenance)
    : null;
  const visible = !dismissed && !!message;

  const dismiss = () => setDismissed(true);

  return { visible, message, dismiss };
}
