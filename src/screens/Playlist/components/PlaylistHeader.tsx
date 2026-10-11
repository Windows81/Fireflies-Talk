import { IconPlay, IconSoundbite } from "@/assets/svg";
import { LinkButton } from "@/components/Button";
import { SkeletonLoading } from "@/components/Loading";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import type { Playlist } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { getUniqueColor } from "@/utils/color";
import { toHHMMSS } from "@/utils/time";
import { LinearGradient } from "expo-linear-gradient";
import { type FC } from "react";
import { Platform, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const PlaylistHeader: FC<{
  playlist: Playlist;
  animY: SharedValue<number>;
}> = ({ playlist, animY }) => {
  const theme = useTheme();

  const ranColor = getUniqueColor(playlist.name);

  const animStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(
        animY.value,
        [0, HEADER_HEIGHT - 50],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            animY.value,
            [0, HEADER_HEIGHT],
            [0, HEADER_HEIGHT * 0.5],
          ),
        },
      ],
    }),
    [],
  );

  const animContentStyle = useAnimatedStyle(
    () => ({
      transform: [
        { scale: interpolate(animY.value, [0, HEADER_HEIGHT], [1, 0.5]) },
      ],
    }),
    [],
  );

  return (
    <AnimatedLinearGradient
      colors={[theme.colors.layerStrong, theme.colors.borderStaticTransparent]}
      start={[0.5, 0]}
      end={[0.5, 1]}
      style={[styles.root(theme), Platform.OS !== "web" && animStyle]}
    >
      <Animated.View
        style={[styles.content, Platform.OS !== "web" && animContentStyle]}
      >
        <View style={[styles.block, { backgroundColor: ranColor }]}>
          <IconSoundbite fill={theme.colors.layerDefault} color={ranColor} />
        </View>
        <View style={styles.metadata}>
          <Text
            color="textPrimary"
            variant="title1Weight"
            style={styles.textCenter}
          >
            {playlist.name}
          </Text>
          <Text
            variant="body2Regular"
            color="textHint"
            style={styles.textCenter}
          >
            {playlist.user?.name} · {playlist.count || 0} soundbites ·{" "}
            {toHHMMSS(playlist.duration || 0)}
          </Text>
        </View>
        {playlist.bites ? (
          !!playlist.bites.length && (
            <LinkButton
              Icon={IconPlay}
              href={{
                pathname: RouteNames.Bite,
                params: {
                  id: playlist.bites?.[0].id as string,
                  playlist: playlist.id,
                },
              }}
            >
              Play
            </LinkButton>
          )
        ) : (
          <SkeletonLoading width={84} height={40} />
        )}
      </Animated.View>
    </AnimatedLinearGradient>
  );
};

export const PlaylistHeaderSkeleton: FC = () => {
  const theme = useTheme();

  return (
    <LinearGradient
      colors={[theme.colors.layerStrong, theme.colors.borderStaticTransparent]}
      start={[0.5, 0]}
      end={[0.5, 1]}
      style={[styles.root(theme)]}
    >
      <View style={[styles.content]}>
        <SkeletonLoading width={56} height={56} />
        <View style={styles.metadata}>
          <SkeletonLoading height={28} width={180} />
          <SkeletonLoading height={20} width={100} />
        </View>
        <SkeletonLoading width={84} height={40} />
      </View>
    </LinearGradient>
  );
};

export const HEADER_HEIGHT = 260;

const styles = createStyles({
  root: (theme) => ({
    borderColor: theme.colors.borderStaticDefault,
    borderTopWidth: 1,
    zIndex: 0,
    height: HEADER_HEIGHT,
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  }),
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: "center",
    gap: 24,
    justifyContent: "flex-start",
  },
  metadata: {
    gap: 4,
    alignItems: "center",
  },
  block: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  textCenter: {
    textAlign: "center",
  },
});
