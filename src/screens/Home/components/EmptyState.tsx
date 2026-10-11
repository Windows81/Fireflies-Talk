import { IconPlus, IconServer } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { useOpenAddModal } from "@/features/global-modals";
import { useTheme } from "@/styles";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

export const EmptyState: FC<{
  title: string;
  description: string;
  openAddModalFromRef: string;
}> = ({ title, description, openAddModalFromRef }) => {
  const openAddModal = useOpenAddModal();
  const theme = useTheme();
  return (
    <View style={styles.root}>
      <View style={styles.leading}>
        <IconServer
          width={24}
          height={24}
          color={theme.colors.rainbowStaticPurpleSolid}
        />
        <Text variant="title1Regular" style={styles.text}>
          {title}
        </Text>
        <Text color="textMuted" variant="body2Regular" style={styles.text}>
          {description}
        </Text>
      </View>
      {openAddModal && (
        <Button
          variant="secondary"
          Icon={IconPlus}
          onPress={() => openAddModal(openAddModalFromRef)}
        >
          New
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    alignSelf: "stretch",
  },
  leading: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    alignSelf: "stretch",
  },
  text: {
    textAlign: "center",
  },
});
