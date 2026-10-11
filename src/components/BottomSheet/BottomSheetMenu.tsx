import { createStyles, useTheme } from "@/styles";
import type { ReactNode } from "react";
import { type FC } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SvgProps } from "react-native-svg";
import { Text } from "../Typography";
import { BottomSheetFF } from "./BottomSheet";

interface MenuItem {
  Icon?: FC<SvgProps>;
  iconBackgroundColor?: string;
  label: string;
  right?: ReactNode;
  onPress: () => void;
}

const ITEM_HEIGHT = 72;
const DEFAULT_BOTTOM_PADDING = 24;

export const BottomSheetMenuModal: FC<{
  isOpen: boolean;
  close: () => void;
  items: MenuItem[];
  title?: string;
}> = ({ isOpen, close, items, title }) => {
  const theme = useTheme();

  const safeAreaInsets = useSafeAreaInsets();

  return (
    <BottomSheetFF.Root isOpen={isOpen} close={close}>
      <BottomSheetFF.View
        style={[
          styles.menu,
          { paddingBottom: safeAreaInsets.bottom || DEFAULT_BOTTOM_PADDING },
        ]}
      >
        {title && (
          <Text
            variant={"title1Weight"}
            color={"textSecondary"}
            style={styles.title}
          >
            {title}
          </Text>
        )}
        {items.map(({ Icon, right, label, onPress, iconBackgroundColor }) => (
          <Pressable
            key={label}
            onPress={() => {
              close();
              onPress();
            }}
            style={({ pressed }) => [
              styles.item(theme),
              pressed && { backgroundColor: theme.colors.layerStrong },
            ]}
          >
            {Icon && (
              <View
                style={[
                  styles.iconBackground,
                  {
                    backgroundColor: iconBackgroundColor ?? "transparent",
                  },
                ]}
              >
                <Icon
                  color={
                    iconBackgroundColor
                      ? theme.colors.commandContrastDefault
                      : theme.colors.textSecondary
                  }
                  width={24}
                  height={24}
                />
              </View>
            )}
            <View style={styles.itemLabel}>
              <Text
                variant="body1Regular"
                color="textSecondary"
                numberOfLines={1}
                style={styles.itemText}
              >
                {label}
              </Text>
              {right}
            </View>
          </Pressable>
        ))}
      </BottomSheetFF.View>
    </BottomSheetFF.Root>
  );
};

const styles = createStyles({
  menu: {
    flexDirection: "column",
    gap: 8,
  },
  title: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  item: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: ITEM_HEIGHT,
    marginHorizontal: 16,
    backgroundColor: theme.colors.interactiveNeutral2Default,
  }),
  itemLabel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemText: {
    flexShrink: 1,
  },
});
