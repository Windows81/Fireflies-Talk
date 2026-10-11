import { IconCheck, IconChevronDown } from "@/assets/svg";
import { MenuItem, MenuPopover } from "@/components/Menu";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { useRef, useState, type FC } from "react";
import { Pressable, View } from "react-native";
import type { NotepadTaskFilter } from "../../hooks/useNotepadTasks";
import { TaskProgressRing } from "./TaskProgressRing";

const FILTER_LABEL: Record<NotepadTaskFilter, string> = {
  all: "All Tasks",
  my: "My Tasks",
};

const FILTER_OPTIONS: NotepadTaskFilter[] = ["all", "my"];

export const NotepadTasksFilterHeader: FC<{
  filter: NotepadTaskFilter;
  setFilter: (filter: NotepadTaskFilter) => void;
  counts: Record<NotepadTaskFilter, number>;
  completed: number;
}> = ({ filter, setFilter, counts, completed }) => {
  const theme = useTheme();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.row}>
      <TaskProgressRing completed={completed} total={counts[filter]} />
      <View ref={triggerRef}>
        <Pressable style={styles.dropdown} onPress={() => setOpen(true)}>
          <Text variant="body1Regular" color="commandNeutralDefault">
            {FILTER_LABEL[filter]} ({counts[filter]})
          </Text>
          <View style={open ? styles.chevronOpen : undefined}>
            <IconChevronDown
              width={16}
              height={16}
              color={theme.colors.commandNeutralDefault}
            />
          </View>
        </Pressable>
      </View>
      <MenuPopover
        isOpen={open}
        close={() => setOpen(false)}
        triggerRef={triggerRef}
        width={180}
      >
        {FILTER_OPTIONS.map((option) => {
          const disabled = option === "my" && counts.my === 0;
          return (
            <MenuItem
              key={option}
              disabled={disabled}
              onPress={() => {
                setFilter(option);
                setOpen(false);
              }}
            >
              <View style={[styles.option, disabled && styles.optionDisabled]}>
                <Text variant="body2Regular" color="textSecondary">
                  {FILTER_LABEL[option]} - {counts[option]}
                </Text>
                {filter === option && (
                  <IconCheck
                    width={16}
                    height={16}
                    color={theme.colors.commandNeutralDefault}
                  />
                )}
              </View>
            </MenuItem>
          );
        })}
      </MenuPopover>
    </View>
  );
};

const styles = createStyles({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  option: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionDisabled: {
    opacity: 0.4,
  },
});
