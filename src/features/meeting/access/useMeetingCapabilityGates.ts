import { Capability } from "@/graphql";
import { useMeetingCapability } from "./useMeetingCapability";

type CapabilityGate = "download" | "export" | "delete" | "editTranscript";

const ALL_GATES: Record<CapabilityGate, true> = {
  download: true,
  export: true,
  delete: true,
  editTranscript: true,
};

// Hooks stay unconditional; a gate not in `needs` passes undefined so the
// underlying query is skipped. Callers request only what a surface uses.
export const useMeetingCapabilityGates = (
  meetingId: string | undefined,
  needs: Partial<Record<CapabilityGate, boolean>> = ALL_GATES,
) => {
  const { denied: downloadDenied } = useMeetingCapability(
    needs.download ? Capability.MeetingDownload : undefined,
    meetingId,
  );
  const { denied: exportDenied } = useMeetingCapability(
    needs.export ? Capability.MeetingExport : undefined,
    meetingId,
  );
  const { denied: deleteDenied } = useMeetingCapability(
    needs.delete ? Capability.MeetingDelete : undefined,
    meetingId,
  );
  const { denied: editDenied } = useMeetingCapability(
    needs.editTranscript ? Capability.MeetingEditTranscript : undefined,
    meetingId,
  );

  return { downloadDenied, exportDenied, deleteDenied, editDenied };
};
