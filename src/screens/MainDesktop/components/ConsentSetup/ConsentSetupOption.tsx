import { Checkbox } from "@/components/Checkbox";
import { HoverTooltip } from "@/components/HoverTooltip";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC, PropsWithChildren, ReactNode } from "react";
import { View } from "react-native";
import type { SvgProps } from "react-native-svg";

interface ConsentSetupOptionProps {
  Icon: FC<SvgProps>;
  label: string;
  /** Dimmed qualifier after the label, e.g. "— only". */
  note?: string;
  /** Sits between the label and the checkbox, e.g. the consent preview button. */
  accessory?: ReactNode;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  /**
   * Held on by the team's admins: labelled, explained on hover, and the box
   * cannot be unticked.
   */
  required?: boolean;
}

/**
 * One opt-in row of the consent setup modal. Children trail the label, for the
 * app logos that qualify where a notice can be delivered.
 */
export const ConsentSetupOption: FC<
  PropsWithChildren<ConsentSetupOptionProps>
> = ({
  Icon,
  label,
  note,
  accessory,
  checked,
  onCheckedChange,
  required = false,
  children,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.root(theme)}>
      <View style={styles.content}>
        <Icon width={16} height={16} color={theme.colors.textSecondary} />
        <View style={styles.label}>
          <Text variant="body2Regular" color="textSecondary">
            {label}
            {!!note && (
              <Text variant="body2Regular" color="textHint">{` ${note}`}</Text>
            )}
          </Text>
          {children}
        </View>
      </View>
      <View style={styles.trailing}>
        {accessory}
        <HoverTooltip
          label="Your admin has enforced this"
          disabled={!required}
          align="end"
        >
          <View style={styles.trailing}>
            {required && (
              <Text variant="body2Regular" color="textHint">
                Required
              </Text>
            )}
            <Checkbox
              value={checked}
              onValueChange={onCheckedChange}
              disabled={required}
              size={16}
              style={styles.checkbox}
              aria-label={label}
            />
          </View>
        </HoverTooltip>
      </View>
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.layerStrong,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    boxShadow: "0px 4px 3px rgba(0, 0, 0, 0.1)",
  }),
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  // Keeps the 16px box on the design's 44px row while leaving a 32px hit area.
  // Longhands, not `padding`: the Checkbox's own paddingVertical would win.
  checkbox: {
    minHeight: 0,
    paddingVertical: 8,
    paddingHorizontal: 8,
    margin: -8,
  },
});
