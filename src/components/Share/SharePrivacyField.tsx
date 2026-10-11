import { createStyles, useTheme } from "@/styles";
import { useBooleanState } from "@/utils/states";
import { useState, type FC } from "react";
import { View } from "react-native";
import { TextButton } from "../Button";
import { SelectPopover } from "../Input";
import { Text } from "../Typography";
import type { SharePrivacyFieldProps } from "./types";

export const SharePrivacyField: FC<SharePrivacyFieldProps> = ({
  value,
  options,
  loading,
  canChange,
  onChange,
}) => {
  const [localValue, setLocalValue] = useState(value);

  const current = options.find((option) => option.value === localValue);

  const [isOpenChange, openChange, closeChange] = useBooleanState();

  const setOption = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
    closeChange();
  };

  const theme = useTheme();

  return (
    <>
      <View style={styles.root}>
        {current?.Icon && (
          <View style={styles.currentIcon(theme)}>
            <current.Icon
              color={theme.colors.textSecondary}
              width={20}
              height={20}
            />
          </View>
        )}
        <View style={styles.current}>
          <Text
            variant="title2Weight"
            color="textPrimary"
            aria-label={`Privacy: ${current?.label}`}
          >
            {current?.label}
          </Text>
          <Text variant="body3Regular" color="textHint">
            {current?.description}
          </Text>
        </View>
        {canChange && (
          <TextButton
            variant="secondary"
            onPress={openChange}
            disabled={loading}
            aria-label="Change privacy"
          >
            Change
          </TextButton>
        )}
      </View>
      <SelectPopover
        isOpen={isOpenChange}
        close={closeChange}
        options={options}
        value={localValue}
        onValueChange={setOption}
        aria-label="Change privacy"
      />
    </>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  current: {
    alignItems: "flex-start",
    flex: 1,
  },
  currentIcon: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral3Default,
    borderRadius: 8,
    padding: 8,
  }),
});
