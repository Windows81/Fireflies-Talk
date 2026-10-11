import { IconX } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { getAssigneePillColors } from "@/utils/color";
import type { FC } from "react";
import type { GestureResponderEvent } from "react-native";
import { Pressable, StyleSheet } from "react-native";
import { useRowHover } from "../../hooks/useRowHover";

export const NotepadTaskAssignee: FC<{
  label: string;
  dimmed?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
}> = ({ label, dimmed = false, onPress, onRemove }) => {
  const { background, text } = getAssigneePillColors(label);
  // mouseenter/mouseleave hover (not RNW's onHoverIn/Out) so the reveal stays on
  // while the cursor is over the nested remove button — otherwise the descendant
  // Pressable's hover lock turns this off and the "x" vanishes on approach.
  const { ref, isHovered } = useRowHover();
  const showRemove = !!onRemove && isHovered && !dimmed;

  const remove = (event: GestureResponderEvent) => {
    event.stopPropagation?.();
    onRemove?.();
  };

  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.pill,
        { backgroundColor: background },
        showRemove && styles.pillRemovable,
      ]}
    >
      <Text
        variant="body2Regular"
        numberOfLines={1}
        style={{
          color: dimmed
            ? "rgba(255, 255, 255, 0.3)"
            : showRemove
              ? "rgba(255, 255, 255, 0.6)"
              : text,
        }}
      >
        {label}
      </Text>
      {showRemove && (
        <Pressable onPress={remove} hitSlop={4} style={styles.remove}>
          <IconX width={12} height={12} color="rgba(255, 255, 255, 0.6)" />
        </Pressable>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 132,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillRemovable: {
    gap: 4,
    paddingRight: 4,
  },
  remove: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
