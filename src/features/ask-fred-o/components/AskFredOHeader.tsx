import { IconClock, IconPlus, IconX } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { GlassAction } from "./primitives/GlassAction";
import { GlassPill } from "./primitives/GlassPill";

interface AskFredOHeaderProps {
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
  onNewChat: () => void;
  close?: () => void;
}

export const AskFredOHeader: FC<AskFredOHeaderProps> = ({
  isHistoryOpen,
  onToggleHistory,
  onNewChat,
  close,
}) => (
  <View style={styles.root} pointerEvents="box-none">
    <View style={styles.leading} pointerEvents="box-none">
      {close && (
        <GlassPill>
          <GlassAction Icon={IconX} label="Close" onPress={close} />
        </GlassPill>
      )}
      {isHistoryOpen && (
        <Text color="textPrimary" variant="title3Weight">
          Your conversations
        </Text>
      )}
    </View>

    <GlassPill>
      <GlassAction
        Icon={IconPlus}
        label="New conversation"
        onPress={onNewChat}
      />
      <GlassAction
        Icon={IconClock}
        label={isHistoryOpen ? "Back to conversation" : "Conversation history"}
        onPress={onToggleHistory}
        active={isHistoryOpen}
      />
    </GlassPill>
  </View>
);

const styles = createStyles({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  leading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
