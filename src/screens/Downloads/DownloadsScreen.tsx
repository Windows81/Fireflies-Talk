import { IconRefreshCcw, IconTrash, IconX } from "@/assets/svg";
import { Button } from "@/components/Button";
import { ConfirmationDialog } from "@/components/Dialog";
import { LinkView } from "@/components/Link";
import { Separator } from "@/components/Separator";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import { useAuth } from "@/features/auth";
import {
  cancelDownload,
  deleteDownload,
  DownloadStatus,
  enqueueDownload,
  useDownloads,
  type DownloadEntry,
} from "@/features/downloads";
import { useBooleanState } from "@/utils/states";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { format } from "date-fns";
import prettyBytes from "pretty-bytes";
import { useState, type FC } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ParamList } from "../types";
import { EnableAutoDownloadCard } from "./components/EnableAutoDownloadCard";
import { StorageSummaryCard } from "./components/StorageSummaryCard";

const formatDate = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : format(date, "MMM d, yyyy");
};

const statusLabel = (entry: DownloadEntry) => {
  switch (entry.status.state) {
    case DownloadStatus.IN_PROGRESS:
      return `Downloading ${Math.round(entry.status.progress * 100)}%`;
    case DownloadStatus.FAILED:
      return "Download failed";
    default:
      return "Waiting…";
  }
};

const DownloadingItem: FC<{ entry: DownloadEntry }> = ({ entry }) => (
  <View style={styles.item}>
    <View style={styles.itemDetail}>
      <Text variant="label1Weight" color="textSecondary" numberOfLines={1}>
        {entry.snapshot.title || "Untitled meeting"}
      </Text>
      <Text variant="label2Regular" color="textHint">
        {statusLabel(entry)}
      </Text>
    </View>
    {entry.status.state === DownloadStatus.FAILED && (
      <Button
        Icon={IconRefreshCcw}
        variant="transparentNeutral"
        size="xs"
        aria-label="Retry download"
        onPress={() =>
          enqueueDownload({
            meetingId: entry.meetingId,
            isManual: entry.isManual,
            target: entry.target,
            snapshot: entry.snapshot,
          })
        }
      />
    )}
    <Button
      Icon={IconX}
      variant="transparentNeutral"
      size="xs"
      aria-label="Cancel download"
      onPress={() => cancelDownload(entry.meetingId)}
    />
  </View>
);

const SavedItem: FC<{
  entry: DownloadEntry;
  onDelete: (entry: DownloadEntry) => void;
}> = ({ entry, onDelete }) => (
  <View style={styles.item}>
    <LinkView
      style={styles.itemDetail}
      href={{
        pathname: RouteNames.Notepad,
        params: { id: entry.meetingId, ref: "downloads" },
      }}
      animated
    >
      <Text variant="label1Weight" color="textSecondary" numberOfLines={1}>
        {entry.snapshot.title || "Untitled meeting"}
      </Text>
      <Text variant="label2Regular" color="textHint">
        {[
          formatDate(entry.snapshot.date ?? entry.snapshot.startTime),
          entry.status.state === DownloadStatus.COMPLETE
            ? prettyBytes(entry.status.sizeBytes)
            : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </Text>
    </LinkView>
    <Button
      Icon={IconTrash}
      variant="transparentNeutral"
      size="xs"
      aria-label="Delete download"
      onPress={() => onDelete(entry)}
    />
  </View>
);

export const DownloadsScreen: FC<
  NativeStackScreenProps<ParamList, "Downloads">
> = () => {
  const insets = useSafeAreaInsets();
  const index = useDownloads((s) => s.index);
  const userId = useAuth((s) => s.user?.id);
  const [entryToDelete, setEntryToDelete] = useState<DownloadEntry | null>(
    null,
  );
  const [isOpenDeleteAll, openDeleteAll, closeDeleteAll] = useBooleanState();

  const manual = index.filter((e) => e.isManual && e.userId === userId);
  const saved = manual
    .filter((e) => e.status.state === DownloadStatus.COMPLETE)
    .sort(
      (a, b) =>
        new Date(b.snapshot.date ?? 0).getTime() -
        new Date(a.snapshot.date ?? 0).getTime(),
    );
  const downloading = manual.filter(
    (e) => e.status.state !== DownloadStatus.COMPLETE,
  );

  return (
    <>
      <FlatList
        style={styles.root}
        contentContainerStyle={styles.content}
        data={saved}
        keyExtractor={(entry) => entry.meetingId}
        renderItem={({ item }) => (
          <SavedItem entry={item} onDelete={setEntryToDelete} />
        )}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <View style={styles.header}>
            <StorageSummaryCard />
            <Text variant="label3Regular" color="textHint">
              Deleting a download only removes offline access on this device.
              Nothing is deleted from your Fireflies account.
            </Text>
            <View />
            <View style={styles.sectionHeader}>
              <Text fontWeight="500" fontSize={16}>
                Your Downloads
              </Text>
              {saved.length > 0 && (
                <Button
                  variant="transparentNeutral"
                  size="xs"
                  onPress={openDeleteAll}
                >
                  Delete all
                </Button>
              )}
            </View>
            {downloading.length > 0 && (
              <View style={styles.section}>
                <Text fontWeight="500" fontSize={16}>
                  Downloading
                </Text>
                {downloading.map((entry) => (
                  <DownloadingItem key={entry.meetingId} entry={entry} />
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <Text variant="body2Regular" color="textMuted">
            Meetings you save offline appear here.
          </Text>
        }
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <EnableAutoDownloadCard />
      </View>

      <ConfirmationDialog
        title="Remove download"
        isOpen={!!entryToDelete}
        close={() => setEntryToDelete(null)}
        confirmText="Remove"
        onConfirm={() =>
          entryToDelete && deleteDownload(entryToDelete.meetingId)
        }
      >
        {`Remove "${entryToDelete?.snapshot.title ?? "this meeting"}" from this device?`}
      </ConfirmationDialog>
      <ConfirmationDialog
        title="Delete all saved meetings"
        isOpen={isOpenDeleteAll}
        close={closeDeleteAll}
        confirmText="Delete all"
        onConfirm={() => saved.forEach((e) => deleteDownload(e.meetingId))}
      >
        {`This removes offline access to ${saved.length} meetings on this device.`}
      </ConfirmationDialog>
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    gap: 12,
    marginBottom: 12,
  },
  section: {
    gap: 12,
  },
  footer: {
    paddingHorizontal: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  itemDetail: {
    flex: 1,
    gap: 2,
  },
});
