import { HoverTooltip } from "@/components/HoverTooltip";
import { Text } from "@/components/Typography";
import { createStyles, FontStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { useCallback, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  TextInput as RNTextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
  type TextInputKeyPressEventData,
} from "react-native";
import { useDesktopNotepadContext } from "../DesktopNotepadContext";
import { useNotepadTitle } from "../hooks/useNotepadTitle";

const TITLE_LINE_HEIGHT = 32;

type TextSelectionRef = {
  setSelection?: (start: number, end: number) => void;
  setSelectionRange?: (start: number, end: number) => void;
};

export const NotepadMeetingTitle: FC = () => {
  const theme = useTheme();
  const inputRef = useRef<RNTextInput>(null);
  const { meeting } = useDesktopNotepadContext();
  const { canEdit, value, onChange, commit, displayTitle } =
    useNotepadTitle(meeting);

  // The title reads as ellipsized text until the owner clicks to rename it.
  const [editing, setEditing] = useState(false);
  const [height, setHeight] = useState(TITLE_LINE_HEIGHT);

  const setCursorToEnd = useCallback(() => {
    const length = value.length;
    requestAnimationFrame(() => {
      const current = inputRef.current as TextSelectionRef | null;
      if (!current) return;
      if (typeof current.setSelection === "function") {
        current.setSelection(length, length);
        return;
      }
      if (typeof current.setSelectionRange === "function") {
        current.setSelectionRange(length, length);
      }
    });
  }, [value.length]);

  const finishEditing = useCallback(() => {
    setEditing(false);
    commit();
  }, [commit]);

  // Enter commits the rename; a title must never contain a newline.
  const onKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (Platform.OS !== "web") return;
      const native = e.nativeEvent as TextInputKeyPressEventData & {
        preventDefault?: () => void;
      };
      if (native.key !== "Enter") return;
      native.preventDefault?.();
      inputRef.current?.blur();
    },
    [],
  );

  const onContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      setHeight(e.nativeEvent.contentSize.height);
    },
    [],
  );

  const startEditing = useCallback(() => {
    setEditing(true);
  }, []);

  if (!canEdit) {
    return (
      <Text variant="heading4Weight" color="commandNeutralDefault">
        {displayTitle}
      </Text>
    );
  }

  if (!editing) {
    return (
      <Pressable onPress={startEditing} style={styles.displayPressable}>
        <HoverTooltip label="Rename" position="top" align="start">
          <Text
            variant="heading4Weight"
            color="commandNeutralDefault"
            numberOfLines={1}
            style={styles.displayText}
          >
            {value}
          </Text>
        </HoverTooltip>
      </Pressable>
    );
  }

  return (
    <View style={styles.editWrap(theme)}>
      <RNTextInput
        ref={inputRef}
        nativeID="notepad-title-input"
        value={value}
        onChangeText={onChange}
        onBlur={finishEditing}
        onFocus={setCursorToEnd}
        onKeyPress={onKeyPress}
        onContentSizeChange={onContentSizeChange}
        autoFocus
        multiline
        selectTextOnFocus={false}
        cursorColor={theme.colors.layerContrast}
        style={[
          FontStyles.heading4Weight,
          styles.input,
          {
            color: theme.colors.commandNeutralDefault,
            height: Math.max(TITLE_LINE_HEIGHT, height),
          },
        ]}
      />
    </View>
  );
};

const styles = createStyles({
  displayPressable: {
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  displayText: {
    maxWidth: "100%",
  },
  editWrap: (theme) => ({
    width: "100%",
    backgroundColor: theme.colors.layerAlphaDefault,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  }),
  input: {
    width: "100%",
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    outlineWidth: 0,
    ...(Platform.OS === "web" && { outline: "none" }),
  },
});
