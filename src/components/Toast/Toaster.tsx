import { IconAlertCircle, IconCheck, IconWarning, IconX } from "@/assets/svg";
import { createStyles, useTheme, vars } from "@/styles";
import type { FC } from "react";
import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../Typography";
import { emitter } from "./store";
import type { ToastData } from "./types";
import { isDesktop } from "@/utils/device";

export const Toaster: FC<{ containerRef?: React.RefObject<View | null> }> = ({
  containerRef,
}) => {
  const [open, setOpen] = useState(false);

  const [toast, setToast] = useState<ToastData>();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const onToast = (data: string | ToastData) => {
      if (timeout) clearTimeout(timeout);
      setOpen(false);
      timeout = setTimeout(() => {
        if (typeof data === "string") {
          data = { message: data };
        }
        const dataObj = data as ToastData;

        // Only show toast if:
        // 1. This Toaster has a containerRef AND the toast's containerRef matches it
        // 2. This Toaster has NO containerRef AND the toast also has NO containerRef (app-wide toast)
        const shouldShow = containerRef
          ? dataObj.containerRef === containerRef
          : !dataObj.containerRef;

        if (shouldShow) {
          setToast(dataObj);
          setOpen(true);
        }
      }, 100);
    };

    emitter.on("toast", onToast);
    return () => {
      if (timeout) clearTimeout(timeout);
      emitter.off("toast", onToast);
    };
  }, [containerRef]);

  useEffect(() => {
    if (!open) return;
    if (toast && Platform.OS !== "web")
      AccessibilityInfo.announceForAccessibility(toast.message);
    const timeout = setTimeout(() => {
      setOpen(false);
    }, toast?.duration || 3000);
    return () => {
      clearTimeout(timeout);
    };
  }, [open, toast]);

  const theme = useTheme();
  // Dark: the contrast tokens flip to a white toast; keep it a dark surface.
  const textColor = theme.name === "dark" ? "textPrimary" : "textContrast";

  const insets = useSafeAreaInsets();

  if (!open) return null;

  const iconNodes = {
    success: (
      <IconCheck color={theme.colors[textColor]} width={20} height={20} />
    ),
    info: (
      <IconAlertCircle
        color={theme.colors.informationStaticBlueSolid}
        width={20}
        height={20}
      />
    ),
    warning: (
      <IconWarning
        color={theme.colors.informationStaticYellowSolid}
        width={20}
        height={20}
      />
    ),
    error: (
      <IconAlertCircle
        color={theme.colors.informationStaticRedSolid}
        width={20}
        height={20}
      />
    ),
  } as const;

  const iconNode = toast?.type ? iconNodes[toast.type] : null;
  const actionColor =
    toast?.action?.color ??
    (isDesktop
      ? theme.colors.interactivePrimaryDefault
      : theme.colors.rainbowStaticPurpleSolid);
  const toastActionsNode = toast?.action ? (
    <Pressable
      onPress={() => {
        toast.action?.onPress();
        setOpen(false);
      }}
      hitSlop={8}
    >
      <Text variant="label2Weight" style={{ color: actionColor }}>
        {toast.action.label}
      </Text>
    </Pressable>
  ) : null;

  const hasTitle = !!toast?.title;

  return (
    <Animated.View
      role="alert"
      style={[
        styles.root(theme),
        {
          bottom: insets.bottom + 12 + (toast?.bottomOffset ?? 0),
        },
        hasTitle ? styles.rootLarge : styles.rootRegular,
      ]}
      entering={FadeInDown.duration(300)}
      exiting={FadeOutDown.duration(300)}
    >
      {hasTitle ? (
        <View style={styles.containerLarge}>
          {iconNode}
          <View style={styles.contentLarge}>
            <View style={styles.row}>
              <Text variant="body2Weight" color={textColor}>
                {toast.title}
              </Text>
              <Text variant="body3Regular" color={textColor}>
                {toast.message}
              </Text>
            </View>
            {toastActionsNode}
          </View>
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.content}>
            {iconNode}
            <Text variant="body2Regular" color={textColor} style={styles.text}>
              {toast?.message}
            </Text>
          </View>
          {toastActionsNode}
        </View>
      )}
      <TouchableOpacity
        aria-label="Close"
        onPress={() => setOpen(false)}
        role="button"
      >
        <IconX
          color={
            isDesktop
              ? theme.colors.commandNeutralHover
              : theme.colors.commandHintDefault
          }
          width={20}
          height={20}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const toast = (data: string | ToastData) => {
  return emitter.emit("toast", data);
};

const styles = createStyles({
  root: (theme) => ({
    position: "absolute",
    alignSelf: "center",
    bottom: 12,
    marginHorizontal: 12,
    zIndex: 200,
    maxWidth: 500,
    backgroundColor:
      theme.name === "dark"
        ? theme.colors.layerStrong
        : theme.colors.layerContrast,
    // Dark: the shadow vanishes against the page, so a border marks the edge.
    ...(theme.name === "dark" && {
      borderWidth: 1,
      borderColor: theme.colors.borderStaticDefault,
    }),
    flexDirection: "row",
    ...vars.elevations[2],
  }),
  rootRegular: {
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  rootLarge: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  containerLarge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    flex: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  contentLarge: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
  },
  row: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
  },
  text: {
    flex: 1,
  },
});
