import { IconX } from "@/assets/svg";
import { LinkView } from "@/components/Link";
import { LoadingSpinner } from "@/components/Loading";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import { useUpload } from "@/features/upload";
import { createStyles, useTheme } from "@/styles";
import { isDesktop } from "@/utils/device";
import { useEffect, useState, type FC } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const OngoingUploadNotificationBar: FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const { uploads } = useUpload();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (uploads.length === 0) return;
    const itv = setInterval(() => {
      const [totalBytesSent, totalBytesExpectedToSend] = uploads.reduce(
        ([sent, total], task) => {
          return [
            sent + task.progress.totalBytesSent,
            total + task.progress.totalBytesExpectedToSend,
          ];
        },
        [0, 0],
      );

      const nextProgress = totalBytesSent / totalBytesExpectedToSend;
      setProgress(nextProgress);
    }, 1000);
    return () => {
      clearInterval(itv);
    };
  }, [uploads]);

  const hasFailedUploads = uploads.some((task) => task.status === "failed");

  return (
    <LinkView
      style={[styles.root(theme), { paddingTop: insets.top }]}
      href={RouteNames.Upload}
    >
      <View style={styles.container}>
        {hasFailedUploads ? (
          <IconX
            color={theme.colors.informationStaticRedText}
            width={16}
            height={16}
          />
        ) : (
          <LoadingSpinner />
        )}
        <Text
          color={hasFailedUploads ? "informationStaticRedText" : "textBrand"}
        >
          Uploading ·{" "}
          {hasFailedUploads ? "Failed" : `${Math.ceil(progress * 100)} %`}
        </Text>
      </View>
    </LinkView>
  );
};

export const useOngoingUploadNotificationBarVisible = () => {
  return useUpload((state) => Boolean(state.uploads.length));
};

const styles = createStyles({
  root: (theme) => ({
    backgroundColor: isDesktop
      ? theme.colors.layerStrong
      : theme.colors.layerBrandLight2,
    zIndex: 1,
  }),
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
});
