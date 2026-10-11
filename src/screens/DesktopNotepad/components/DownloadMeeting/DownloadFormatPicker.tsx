import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { Pressable, View } from "react-native";

export const DownloadFormatPicker: FC<{
  formats: string[];
  value: string;
  onChange: (format: string) => void;
}> = ({ formats, value, onChange }) => {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {formats.map((format) => {
        const selected = format === value;
        return (
          <Pressable
            key={format}
            style={[
              styles.chip,
              selected ? styles.chipSelected : styles.chipIdle(theme),
            ]}
            onPress={() => onChange(format)}
          >
            <Text
              variant="body2Regular"
              color={
                selected ? "commandPrimaryDefault" : "commandNeutralDefault"
              }
            >
              {format}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = createStyles({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  chipIdle: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Default,
    borderColor: theme.colors.borderInteractiveDefault,
  }),
  chipSelected: {
    backgroundColor: DESKTOP_THEME.purple1100,
    borderColor: DESKTOP_THEME.purple500,
  },
});
