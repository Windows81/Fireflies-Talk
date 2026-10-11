import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { IconX } from "@/assets/svg";
import { Button } from "@/components/Button";
import type { MarkdownStyle } from "@/components/Markdown";
import { Markdown } from "@/components/Markdown";
import { Text } from "@/components/Typography";
import { createStyles, useTheme, vars } from "@/styles";
import type { UpdateStatus } from "electron/src/types";

const DISMISSED_UPDATE_REMINDER_MS = 24 * 60 * 60 * 1000;

export const UpdateAppCard = () => {
  const theme = useTheme();
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
  const [dismissedUpdatedVersion, setDismissedUpdatedVersion] = useState<
    string | null
  >(null);
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false);
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);

  useEffect(() => {
    const updater = window.electron?.updater;
    if (!updater) return;

    let isMounted = true;
    updater
      .getStatus()
      .then((nextStatus) => {
        if (isMounted) {
          setStatus(nextStatus);
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus(null);
        }
      });

    const unsubscribe = updater.onStatusChanged((nextStatus) => {
      setStatus(nextStatus);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const availableVersion = status?.updateInfo?.version ?? null;
  const updateReadyKey = availableVersion ?? "downloaded";
  const postUpdateReleaseNotes = status?.postUpdateReleaseNotes ?? null;
  const releaseNotes = postUpdateReleaseNotes?.releaseNotes ?? null;
  const isUpdateReadyDismissed = dismissedVersion === updateReadyKey;
  const isUpdateReadyVisible = Boolean(
    status?.updateDownloaded && !isUpdateReadyDismissed,
  );
  const isPostUpdateVisible = Boolean(
    postUpdateReleaseNotes &&
      dismissedUpdatedVersion !== postUpdateReleaseNotes.version,
  );
  const mode = isUpdateReadyVisible
    ? "updateReady"
    : isPostUpdateVisible
      ? "postUpdate"
      : null;
  const isReleaseNotesExpanded = Boolean(releaseNotes) && isReleaseNotesOpen;
  const isCompactPostUpdate = mode === "postUpdate" && !releaseNotes;

  useEffect(() => {
    if (!status?.updateDownloaded) {
      setIsInstallingUpdate(false);
    }
  }, [status?.updateDownloaded]);

  useEffect(() => {
    if (!dismissedVersion) return;

    const timeout = setTimeout(() => {
      setDismissedVersion(null);
    }, DISMISSED_UPDATE_REMINDER_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [dismissedVersion]);

  if (!mode) {
    return null;
  }

  const installUpdate = async () => {
    if (!window.electron?.updater) return;

    setIsInstallingUpdate(true);
    try {
      const result = await window.electron.updater.installUpdate();
      if (!result.success) {
        setIsInstallingUpdate(false);
      }
    } catch {
      setIsInstallingUpdate(false);
    }
  };

  const close = () => {
    if (mode === "postUpdate") {
      dismissPostUpdateReleaseNotes();
      return;
    }

    setDismissedVersion(updateReadyKey);
  };

  const dismissPostUpdateReleaseNotes = () => {
    if (postUpdateReleaseNotes) {
      setDismissedUpdatedVersion(postUpdateReleaseNotes.version);
    }
    setIsReleaseNotesOpen(false);
    setStatus((currentStatus) =>
      currentStatus
        ? { ...currentStatus, postUpdateReleaseNotes: null }
        : currentStatus,
    );
    void window.electron?.updater.clearPostUpdateReleaseNotes?.();
  };

  const showReleaseNotes = () => {
    setIsReleaseNotesOpen(true);
  };

  return (
    <View
      style={[
        styles.card(theme),
        isCompactPostUpdate && styles.compactCard,
        mode === "postUpdate" && isReleaseNotesExpanded && styles.expandedCard,
      ]}
    >
      <Button
        accessibilityLabel="Close update prompt"
        Icon={IconX}
        onPress={close}
        size="xs"
        style={styles.closeButton}
        variant="transparentNeutral"
      />
      <View style={[styles.topRow, isCompactPostUpdate && styles.compactRow]}>
        <View
          style={[
            styles.textContent,
            isCompactPostUpdate && styles.compactTextContent,
          ]}
        >
          {mode === "updateReady" && (
            <Text color="textSecondary" variant="title2Weight">
              Update is ready
            </Text>
          )}
          {mode === "postUpdate" ? (
            <>
              <Text color="textSecondary" variant="title2Weight">
                Updated to latest version!
              </Text>
              {!isReleaseNotesExpanded && releaseNotes ? (
                <Text
                  color="commandPrimaryDefault"
                  onPress={showReleaseNotes}
                  style={styles.releaseNotesLink}
                  variant="body2Regular"
                >
                  See release notes
                </Text>
              ) : null}
            </>
          ) : (
            <Text color="textMuted" numberOfLines={2} variant="body2Regular">
              Restart now to apply the latest improvements
            </Text>
          )}
        </View>
      </View>
      {mode === "postUpdate" && isReleaseNotesExpanded && releaseNotes ? (
        <ScrollView
          style={styles.releaseNotes}
          contentContainerStyle={styles.releaseNotesContent}
        >
          <Markdown color="textMuted" style={releaseNotesMarkdownStyle}>
            {releaseNotes}
          </Markdown>
        </ScrollView>
      ) : null}
      {mode === "updateReady" ? (
        <View style={styles.bottomRow}>
          <Button
            disabled={isInstallingUpdate}
            onPress={installUpdate}
            size="sm"
            variant="primary"
          >
            Restart Now
          </Button>
        </View>
      ) : null}
    </View>
  );
};

const releaseNotesMarkdownStyle: Partial<MarkdownStyle> = {
  body: vars.typography.body2Regular,
  heading1: {
    ...vars.typography.title3Weight,
    marginBottom: 8,
  },
  heading2: {
    ...vars.typography.body1Weight,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 8,
    flexWrap: "wrap",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    width: "100%",
  },
  list_item: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  bullet_list_icon: {
    marginLeft: 8,
    marginRight: 8,
  },
  ordered_list_icon: {
    marginLeft: 8,
    marginRight: 8,
  },
};

const styles = createStyles({
  card: (theme) => ({
    position: "absolute",
    left: 40,
    bottom: 40,
    width: 300,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticPage,
    backgroundColor: theme.colors.interactiveNeutral1Disabled,
    overflow: "hidden",
    flexDirection: "column",
    alignItems: "flex-start",
    paddingTop: 16,
    paddingBottom: 12,
    zIndex: 3,
    gap: 16,
  }),
  expandedCard: {
    width: 420,
    maxHeight: 420,
  },
  compactCard: {
    paddingTop: 10,
    paddingBottom: 10,
    gap: 0,
  },
  topRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingRight: 44,
    gap: 20,
  },
  compactRow: {
    alignItems: "center",
  },
  textContent: {
    alignSelf: "stretch",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
  },
  compactTextContent: {
    justifyContent: "center",
  },
  bottomRow: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    gap: 8,
  },
  closeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    minHeight: 32,
    width: 32,
    zIndex: 1,
  },
  releaseNotesLink: {
    textDecorationLine: "underline",
  },
  releaseNotes: {
    alignSelf: "stretch",
    maxHeight: 260,
    paddingHorizontal: 16,
  },
  releaseNotesContent: {
    paddingBottom: 4,
  },
});
