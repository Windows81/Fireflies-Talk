import type { Theme } from "@/styles";
import { createStyles, useTheme, vars } from "@/styles";
import type { FC, ReactNode } from "react";
import type { ImageSourcePropType } from "react-native";
import { Image, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { Text } from "../Typography";

export const MessageView: FC<{
  header?: ReactNode;
  headerImage?: ImageSourcePropType;
  headerImageDark?: ImageSourcePropType;
  Icon?: FC<SvgProps>;
  iconColor?: keyof Theme["colors"];
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: "error";
}> = ({
  header,
  headerImage,
  headerImageDark,
  Icon,
  iconColor,
  title,
  description,
  action,
}) => {
  const theme = useTheme();
  const resolvedHeaderImage =
    theme.name !== "light" && headerImageDark ? headerImageDark : headerImage;

  return (
    <View style={styles.root}>
      {Boolean(header || resolvedHeaderImage) && (
        <View style={styles.header}>
          {header}
          {resolvedHeaderImage && (
            <Image style={styles.image} source={resolvedHeaderImage} alt="" />
          )}
        </View>
      )}
      {Icon && (
        <View style={styles.icon(theme)}>
          <Icon
            width={20}
            height={20}
            color={theme.colors[iconColor ?? "textPrimary"]}
          />
        </View>
      )}
      <View style={styles.message}>
        <View style={styles.texts}>
          {title && (
            <Text
              variant="title2Regular"
              color="textPrimary"
              style={styles.text}
            >
              {title}
            </Text>
          )}
          {description && (
            <Text color="textMuted" variant="body2Regular" style={styles.text}>
              {description}
            </Text>
          )}
        </View>
      </View>
      {action && <View style={styles.actions}>{action}</View>}
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  header: {
    width: 300,
    alignItems: "center",
  },
  image: {
    width: "100%",
    objectFit: "contain",
  },
  icon: (theme) => ({
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    backgroundColor: theme.colors.layerDefault,
    ...vars.elevations[1],
  }),
  message: {},
  texts: {
    flexDirection: "column",
    gap: 8,
  },
  text: {
    textAlign: "center",
  },
  actions: {
    gap: 8,
  },
});
