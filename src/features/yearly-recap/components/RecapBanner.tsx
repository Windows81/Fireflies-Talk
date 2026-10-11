import { IconArrowRight } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { IconRewind } from "@/assets/svg";
import { useAuth } from "@/features/auth";
import { FEATURE_FLAGS, useFeatureValue } from "@/features/feature-flags";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useGetRewindDataQuery } from "@firefliesai/analytics-ff.graphql-client";
import { type FC } from "react";
import { Image, Platform, Pressable, View } from "react-native";
import imageRecapBackground from "./recap-background.png";

import { getMonth, getYear } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import * as WebBrowser from "expo-web-browser";
import { Config } from "@/constants";

function getSpecialYear(): string | undefined {
  const date = new Date();
  const month = getMonth(date);
  const year = getYear(date);

  if (month === 0) {
    // If in January, return the previous year
    return (year - 1).toString();
  } else if (month === 10 || month === 11) {
    // If in November or December, return current year
    return year.toString();
  }

  return undefined;
}

export const RecapBanner: FC<{
  screen: string;
}> = ({ screen }) => {
  const { user } = useAuth();
  const isOn = useFeatureValue(FEATURE_FLAGS.REWIND, false);
  const { data } = useGetRewindDataQuery({
    skip: !isOn || !user || Platform.OS === "web",
  });

  const loaded = Boolean(
    data?.rewindData?.calendarMeetingCount || data?.rewindData?.meetingCount,
  );

  const theme = useTheme();

  const open = () => {
    WebBrowser.openBrowserAsync(
      `${Config.LANDING_URL}/rewind/${data?.rewindData?.id}/embed`,
    );
    tracker.track(TRACKING_EVENTS.MOBILE_RECAP_BANNER_CLICKED, {
      screen,
    });
  };

  if (!loaded) return null;

  const recapYearText = (hidden: boolean) => {
    return (
      <Text
        style={hidden ? { opacity: 0 } : {}}
        variant="title3Weight"
      >{`Recap ${getSpecialYear()}`}</Text>
    );
  };

  return (
    <>
      <Pressable style={styles.root(theme)} onPress={open}>
        <Image source={imageRecapBackground} style={styles.image} alt="" />
        <View style={styles.content}>
          <IconRewind
            width={20}
            height={20}
            color={theme.colors.textContrast}
          />
          <View style={styles.textContainer}>
            <Text color="textContrast" variant="title3Weight">
              Your
            </Text>

            <MaskedView style={{ flex: 0 }} maskElement={recapYearText(false)}>
              <LinearGradient
                colors={["#e6ff4b", "#48deff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.75, y: 0.66 }}
              >
                {recapYearText(true)}
              </LinearGradient>
            </MaskedView>

            <Text color="textContrast" variant="title3Weight">
              {`is Here 🎉 `}
            </Text>

            <Text
              style={styles.textUnderline}
              color="textContrast"
              variant="title3Weight"
            >
              Take a look
            </Text>
          </View>

          <IconArrowRight
            color={theme.colors.textContrast}
            width={20}
            height={20}
          />
        </View>
      </Pressable>
    </>
  );
};

const styles = createStyles({
  root: (theme) => ({
    borderColor: theme.colors.rainbowInteractivePurpleDefault,
    borderWidth: 1,
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  }),
  textContainer: {
    flexDirection: "row",
    gap: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 6,
  },
  image: {
    objectFit: "cover",
    position: "absolute",
    height: "100%",
    width: "100%",
    top: 0,
    left: 0,
  },
  webview: {
    flex: 1,
  },
  close: {
    position: "absolute",
    top: 24,
    right: 24,
    zIndex: 1,
    padding: 20,
  },
  loading: {
    backgroundColor: "#282633",
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: "100%",
  },
  textUnderline: {
    textDecorationLine: "underline",
  },
});
