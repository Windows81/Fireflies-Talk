import { IconChevronDown } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { countries } from "@firefliesai/shared-libs.utils";
import type { FC } from "react";
import { Pressable, View } from "react-native";

interface CountryDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (code: string) => void;
  selectedLabel: string;
}

export const CountryDropdown: FC<CountryDropdownProps> = ({
  isOpen,
  onToggle,
  onSelect,
  selectedLabel,
}) => (
  <View style={styles.wrap}>
    <Pressable style={styles.trigger} onPress={onToggle}>
      <Text variant="body2Regular" color="textSecondary">
        {selectedLabel}
      </Text>
      <IconChevronDown width={16} height={16} color={DESKTOP_THEME.grey500} />
    </Pressable>
    {isOpen && (
      <View style={styles.menu}>
        {countries.map((c) => (
          <Pressable
            key={c.code}
            style={styles.item}
            onPress={() => onSelect(c.code)}
          >
            <Text variant="body2Regular" color="textSecondary">
              {c.name}
            </Text>
          </Pressable>
        ))}
      </View>
    )}
  </View>
);

const styles = createStyles({
  wrap: {
    position: "relative",
    zIndex: 10,
  },
  trigger: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingRight: 8,
    backgroundColor: DESKTOP_THEME.grey900,
    borderColor: "#2F2F32",
    borderWidth: 1,
    borderRadius: 4,
  },
  menu: {
    position: "absolute",
    top: 44,
    left: 0,
    right: 0,
    maxHeight: 240,
    backgroundColor: DESKTOP_THEME.grey1000,
    borderColor: "#2F2F32",
    borderWidth: 1,
    borderRadius: 4,
    overflow: "scroll" as never,
    zIndex: 20,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
