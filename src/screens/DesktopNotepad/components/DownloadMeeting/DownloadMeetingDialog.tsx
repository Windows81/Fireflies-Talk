import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Dialog } from "@/components/Dialog";
import { useAuth } from "@/features/auth";
import { createStyles, useTheme } from "@/styles";
import { isPaidUser } from "@firefliesai/payments-ff.utils";
import { useMemo, useState, type FC } from "react";
import { View } from "react-native";
import type { DesktopNotepadMeeting } from "../../types";
import { getValidDownloadTabs, type DownloadTabValue } from "./constants";
import { DownloadFormatPicker } from "./DownloadFormatPicker";
import { DownloadTabBar } from "./DownloadTabBar";
import { useDownloadMeeting } from "./useDownloadMeeting";

const DownloadMeetingContent: FC<{
  meeting: DesktopNotepadMeeting;
  close: () => void;
  onUpgradeRequired: (format: string) => void;
}> = ({ meeting, close, onUpgradeRequired }) => {
  const validTabs = useMemo(() => getValidDownloadTabs(meeting), [meeting]);

  const [activeTab, setActiveTab] = useState<DownloadTabValue>(
    validTabs[0]?.value ?? "transcript",
  );
  const activeConfig =
    validTabs.find((tab) => tab.value === activeTab) ?? validTabs[0];

  const [selectedFormat, setSelectedFormat] = useState(
    activeConfig?.formats[0] ?? "",
  );
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [includeSpeaker, setIncludeSpeaker] = useState(false);
  const [includeAIApps, setIncludeAIApps] = useState(true);
  const [removeBranding, setRemoveBranding] = useState(false);

  const { isProcessing, download } = useDownloadMeeting(meeting, close);

  const { user } = useAuth();
  const isEntitled = !!user?.paidUser && isPaidUser(user.paidUser);

  const changeTab = (tab: DownloadTabValue) => {
    setActiveTab(tab);
    const next = validTabs.find((item) => item.value === tab);
    setSelectedFormat(next?.formats[0] ?? "");
  };

  // SRT requires timings, so the toggle is forced on and locked for that format.
  const timestampLocked =
    activeTab === "transcript" && selectedFormat === "SRT";

  const onDownload = () => {
    if (!isEntitled) {
      onUpgradeRequired(selectedFormat);
      return;
    }
    download({
      tab: activeTab,
      format: selectedFormat,
      includeTimestamp,
      includeSpeaker,
      includeAIApps,
      removeBranding,
    });
  };

  return (
    <>
      <Dialog.Header wrapperStyle={styles.header}>
        Download Meeting
      </Dialog.Header>
      <DownloadTabBar tabs={validTabs} value={activeTab} onChange={changeTab} />

      <View style={styles.formatSection}>
        <DownloadFormatPicker
          formats={activeConfig?.formats ?? []}
          value={selectedFormat}
          onChange={setSelectedFormat}
        />
      </View>

      {activeTab === "transcript" && (
        <View style={styles.toggles}>
          <Checkbox
            size={16}
            style={styles.toggle}
            labelColor="commandHintDefault"
            label="Include timestamp"
            value={timestampLocked ? true : includeTimestamp}
            disabled={timestampLocked}
            onValueChange={setIncludeTimestamp}
          />
          <Checkbox
            size={16}
            style={styles.toggle}
            labelColor="commandHintDefault"
            label="Show speaker name"
            value={includeSpeaker}
            onValueChange={setIncludeSpeaker}
          />
          <Checkbox
            size={16}
            style={styles.toggle}
            labelColor="commandHintDefault"
            label="Remove Fireflies branding"
            value={removeBranding}
            onValueChange={setRemoveBranding}
          />
        </View>
      )}

      {activeTab === "summary" && (
        <View style={styles.toggles}>
          <Checkbox
            size={16}
            style={styles.toggle}
            labelColor="commandHintDefault"
            label="Include AI Skills"
            value={includeAIApps}
            onValueChange={setIncludeAIApps}
          />
          <Checkbox
            size={16}
            style={styles.toggle}
            labelColor="commandHintDefault"
            label="Include timestamps"
            value={includeTimestamp}
            onValueChange={setIncludeTimestamp}
          />
          <Checkbox
            size={16}
            style={styles.toggle}
            labelColor="commandHintDefault"
            label="Remove Fireflies branding"
            value={removeBranding}
            onValueChange={setRemoveBranding}
          />
        </View>
      )}

      <Dialog.Actions>
        <Button
          variant="primary"
          size="sm"
          disabled={isProcessing || !selectedFormat}
          onPress={onDownload}
        >
          {isProcessing ? "Downloading..." : "Download"}
        </Button>
      </Dialog.Actions>
    </>
  );
};

export const DownloadMeetingDialog: FC<{
  meeting: DesktopNotepadMeeting;
  isOpen: boolean;
  close: () => void;
  onUpgradeRequired: (format: string) => void;
}> = ({ meeting, isOpen, close, onUpgradeRequired }) => {
  const theme = useTheme();
  return (
    <Dialog.Root
      variant="basic"
      isOpen={isOpen}
      close={close}
      style={styles.dialog(theme)}
    >
      {isOpen && (
        <DownloadMeetingContent
          meeting={meeting}
          close={close}
          onUpgradeRequired={onUpgradeRequired}
        />
      )}
    </Dialog.Root>
  );
};

const styles = createStyles({
  dialog: (theme) => ({
    width: 520,
    maxWidth: 520,
    backgroundColor: theme.colors.layerMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
  }),
  formatSection: {
    padding: 24,
  },
  toggles: {
    paddingHorizontal: 24,
    paddingBottom: 4,
    gap: 10,
  },
  toggle: {
    gap: 12,
    minHeight: 0,
    paddingVertical: 2,
  },
  header: {
    paddingBottom: 8,
  },
});
