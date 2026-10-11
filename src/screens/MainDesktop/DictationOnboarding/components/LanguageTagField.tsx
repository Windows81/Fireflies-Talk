import { Tag } from "@/components/Tag";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { withAlpha } from "@/styles/color";
import { forwardRef, type FC } from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface LanguageHintTagProps {
  language: { code: string; label: string };
  onPress: () => void;
  onRemove?: (code: string) => void;
}

interface LanguageTagFieldProps {
  languages: { code: string; label: string }[];
  expanded: boolean;
  /** Id of the dropdown this field opens, for `aria-controls`. */
  controls: string;
  /** Auto-detect stands in for the picked languages rather than listing them. */
  autoDetect: boolean;
  onPress: () => void;
  /** Arrow Down on the focused field, the keyboard's way of opening a list. */
  onOpenRequest: () => void;
  onRemove: (code: string) => void;
}

const LanguageHintTag: FC<LanguageHintTagProps> = ({
  language,
  onPress,
  onRemove,
}) => {
  const handleClear = onRemove ? () => onRemove(language.code) : undefined;

  return (
    <Tag onPress={onPress} onClear={handleClear}>
      {language.label}
    </Tag>
  );
};

export const LanguageTagField = forwardRef<View, LanguageTagFieldProps>(
  function LanguageTagField(
    {
      languages,
      expanded,
      controls,
      autoDetect,
      onPress,
      onOpenRequest,
      onRemove,
    },
    ref,
  ) {
    const theme = useTheme();
    const onRemoveLanguage = languages.length > 1 ? onRemove : undefined;

    const handleKeyDown = (event: {
      key?: string;
      preventDefault?: () => void;
    }) => {
      if (event.key !== "ArrowDown" || expanded) return;
      event.preventDefault?.();
      onOpenRequest();
    };
    // Web-only: RN's Pressable types do not know about keydown.
    const keyboardProps = { onKeyDown: handleKeyDown };

    return (
      <View style={styles.field(theme)}>
        {/* Behind the tags rather than around them: as an ancestor it would
            also fire when a tag's clear button is pressed, toggling the
            dropdown on every removal. Tags call onPress themselves to keep the
            whole field opening the list. */}
        <Pressable
          ref={ref}
          style={({ focused }: { pressed: boolean; focused?: boolean }) => [
            StyleSheet.absoluteFill,
            styles.combobox,
            focused && !expanded && styles.comboboxFocused(theme),
          ]}
          onPress={onPress}
          {...keyboardProps}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={expanded}
          aria-controls={controls}
          aria-label="Languages you speak"
        />
        {autoDetect ? (
          <Tag onPress={onPress}>Auto-detect</Tag>
        ) : (
          languages.map((language) => (
            <LanguageHintTag
              key={language.code}
              language={language}
              onPress={onPress}
              onRemove={onRemoveLanguage}
            />
          ))
        )}
        {!autoDetect && (
          <View style={styles.placeholder} pointerEvents="none">
            <Text variant="body2Regular" color="textMuted">
              Add more languages
            </Text>
          </View>
        )}
      </View>
    );
  },
);

const styles = createStyles({
  field: (theme) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    minHeight: 44,
    padding: 12,
    backgroundColor: withAlpha(theme.colors.textPrimary, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.textPrimary, 0.06),
    borderRadius: 8,
    // SAFETY: React Native ViewStyle omits cursor; desktop web honors it.
    cursor: "pointer" as never,
  }),
  // Drawn one pixel out so the ring sits on the field's own border.
  combobox: {
    margin: -1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  comboboxFocused: (theme) => ({
    borderColor: theme.colors.borderInteractiveActive,
  }),
  placeholder: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 120,
  },
});
