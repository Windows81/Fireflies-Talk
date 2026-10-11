import { IconClose, IconFred } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { TouchableOpacity, View } from "react-native";

export const AskFredHeader: FC<{
  close?: () => void;
  title?: string;
}> = ({ close, title = "AskFred" }) => {
  const theme = useTheme();

  return (
    <>
      <View style={styles.header(theme)}>
        <View style={styles.headerLeft}>
          <IconFred width={27} height={27} />
          <Text fontWeight="500" fontSize={16}>
            {title}
          </Text>
        </View>
        {close && (
          <TouchableOpacity aria-label="Close" onPress={close} role="button">
            <IconClose color={theme.colors.commandNeutralDefault} />
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

const styles = createStyles({
  header: (theme) => ({
    borderBottomWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  }),
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
});
