import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { type FC, type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

interface PlaceholderProps {
  icon: ReactNode;
  title: string;
  description: string;
  // Layout override for the outer container (e.g. flex/min-height per context).
  style?: StyleProp<ViewStyle>;
}

/**
 * Centered empty-state placeholder: a large icon above a title and description.
 * Used for "in progress" / "nothing here yet" states such as AI notes and
 * meeting prep.
 */
export const Placeholder: FC<PlaceholderProps> = ({
  icon,
  title,
  description,
  style,
}) => {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.content}>
        {icon}
        <View style={styles.copy}>
          <Text color="textPrimary" variant="title2Regular" style={styles.text}>
            {title}
          </Text>
          <Text color="textMuted" variant="body2Regular" style={styles.text}>
            {description}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = createStyles({
  root: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    alignItems: "center",
    gap: 32,
  },
  copy: {
    alignItems: "center",
    gap: 8,
  },
  text: {
    textAlign: "center",
  },
});
