import { useCallback } from "react";
import type {
  NativeStackNavigationOptions,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import type { ParamListBase } from "@react-navigation/native";
import { RouteNames } from "@/constants";
import { isDesktop } from "@/utils/device";
import { DesktopHeaderLeft } from "../components";
import { View } from "react-native";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { useDesktopZoom } from "@/hooks/useDesktopZoom";

type Args = {
  baseOptions: NativeStackNavigationOptions;
  recorderMargin: number;
};

export const useDesktopScreenOptions = ({
  baseOptions,
  recorderMargin,
}: Args) => {
  const theme = useTheme();
  const zoom = useDesktopZoom();
  return useCallback(
    ({
      navigation,
    }: {
      navigation: NativeStackNavigationProp<ParamListBase>;
    }) => {
      const common: NativeStackNavigationOptions = {
        ...baseOptions,
        contentStyle: {
          // The floating recorder card is mobile-only (LiveRecordController is
          // gated on !isDesktop in Navigator), so on desktop this margin just
          // reserves empty space — an unwanted black footer while recording.
          marginBottom: isDesktop ? 0 : recorderMargin,
        },
      };

      if (!isDesktop) return common;

      const desktopEnhancements: NativeStackNavigationOptions = {
        header: (props) => {
          const tintColor =
            props.options.headerTintColor ?? theme.colors.layerContrast;

          // Determine what to render for headerLeft
          let headerLeftElement: React.ReactNode = null;
          let showHeaderLeft = false;

          if (props.options.headerLeft === undefined) {
            // Default: render DesktopHeaderLeft
            showHeaderLeft = true;
            headerLeftElement = (
              <DesktopHeaderLeft
                canGoBack
                onGoBack={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate(RouteNames.MainDesktop);
                  }
                }}
                tintColor={tintColor}
              />
            );
          } else if (props.options.headerLeft === null) {
            // Explicitly null: render nothing
            showHeaderLeft = false;
          } else if (typeof props.options.headerLeft === "function") {
            // Custom function: call it with appropriate props
            showHeaderLeft = true;
            headerLeftElement = props.options.headerLeft({
              canGoBack: navigation.canGoBack(),
              tintColor: tintColor,
            });
          }

          // Determine what to render for headerTitle
          let headerTitleElement: React.ReactNode = null;

          if (props.options.headerTitle === undefined) {
            // Default: render nothing (just flex spacer)
            headerTitleElement = null;
          } else if (typeof props.options.headerTitle === "function") {
            // Custom function: call it with children and tintColor
            headerTitleElement = props.options.headerTitle({
              children: props.options.title ?? props.route.name,
              tintColor: tintColor,
            });
          } else {
            // React node (string or element): render directly
            headerTitleElement = props.options.headerTitle;
          }

          return (
            <View nativeID="drag-region" style={styles.header(theme)}>
              {/* Left section: Back button (if applicable) + Page title */}
              {showHeaderLeft ? (
                <>
                  {headerLeftElement}
                  {!headerTitleElement && (
                    <Text variant="title2Regular">
                      {props.options.title ?? props.route.name}
                    </Text>
                  )}
                </>
              ) : (
                !headerTitleElement && (
                  <View style={[styles.titleContainer, titleClearance(zoom)]}>
                    <Text variant="title2Regular">
                      {props.options.title ?? props.route.name}
                    </Text>
                  </View>
                )
              )}

              {/* Center section: Custom header title if provided, otherwise just flex spacer */}
              <View style={styles.headerTitleWrapper}>
                {headerTitleElement}
              </View>

              {/* Right section: Custom header right buttons */}
              {props.options.headerRight && (
                <View nativeID="no-drag">
                  {props.options.headerRight({
                    tintColor: props.options.headerTintColor,
                    canGoBack: navigation.canGoBack(),
                  })}
                </View>
              )}
            </View>
          );
        },
      };

      return {
        ...common,
        ...desktopEnhancements,
      } as NativeStackNavigationOptions;
    },
    [baseOptions, recorderMargin, theme, zoom],
  );
};

const isMac = isDesktop && window.electron?.platform === "darwin";
const MACOS_TITLE_MARGIN = 83;

// The title clears the fixed-position native traffic lights. That offset lives
// in unscaled point space, so divide by the renderer zoom to keep it constant.
const titleClearance = (zoom: number) =>
  isMac ? { marginLeft: MACOS_TITLE_MARGIN / zoom } : {};

const styles = createStyles({
  header: (theme) => ({
    flexDirection: "row",
    height: 52,
    backgroundColor: theme.colors.pageBackground,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
  }),
  title: {
    flex: 1,
  },
  titleContainer: {
    // macOS clearance is applied dynamically via titleClearance() to stay
    // zoom-invariant; non-macOS keeps a small static inset.
    marginLeft: isMac ? undefined : 4,
  },
  headerTitleWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
