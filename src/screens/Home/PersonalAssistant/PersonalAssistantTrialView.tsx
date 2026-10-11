import { Switch } from "@/components/Switch";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { type FC, type ReactNode } from "react";
import { View, type ViewStyle } from "react-native";

interface PersonalAssistantTrialViewProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  backgroundColor: string;
  borderColor?: string;
  isOn: boolean;
  onToggle: (next: boolean) => void;
  onDismiss?: () => void;
}

export const PersonalAssistantTrialView: FC<
  PersonalAssistantTrialViewProps
> = ({
  title,
  subtitle,
  icon,
  backgroundColor,
  borderColor,
  isOn,
  onToggle,
  onDismiss,
}) => {
  const containerStyle: ViewStyle = {
    backgroundColor,
    ...(borderColor ? { borderColor, borderWidth: 1 } : null),
  };

  return (
    <View style={[styles.root, containerStyle]}>
      <View style={styles.iconCol}>{icon}</View>
      <View style={styles.body}>
        <Text variant="body2Weight" color="textPrimary">
          {title}
        </Text>
        <Text variant="body2Regular" color="textSecondary">
          {subtitle}
          {onDismiss ? (
            <>
              {" "}
              <Text
                variant="body2Regular"
                color="textSecondary"
                style={styles.dismissText}
                onPress={onDismiss}
                accessibilityRole="button"
              >
                Dismiss
              </Text>
            </>
          ) : null}
        </Text>
      </View>
      <Switch
        value={isOn}
        onValueChange={onToggle}
        accessibilityLabel="Toggle Personal Assistant"
      />
    </View>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconCol: {
    paddingTop: 2,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  dismissText: {
    textDecorationLine: "underline",
  },
});
