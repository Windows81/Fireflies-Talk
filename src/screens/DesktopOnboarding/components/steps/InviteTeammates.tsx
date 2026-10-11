import { IconX } from "@/assets/svg";
import { Avatar } from "@/components/Avatar";
import { Text } from "@/components/Typography";
import {
  TeamOnboardingSuggestionType,
  useGetTeamOnboardingSuggestion,
} from "@/features/onboarding";
import { useGetInviteSuggestionsQuery } from "@/graphql";
import { useOnboarding } from "../../OnboardingContext";
import { createStyles, Fonts } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import {
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

function parseEmailsFromInput(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter(isValidEmail);
}

type SuggestionItem = {
  email: string;
  name?: string | null;
  picture?: string | null;
};

export const DesktopInviteTeammates: FC = () => {
  const { inviteEmails, setInviteEmails } = useOnboarding();
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [blurTimer, setBlurTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const { teamOnboardingSuggestion } = useGetTeamOnboardingSuggestion();
  const isInviteSuggestion =
    teamOnboardingSuggestion?.suggestion ===
    TeamOnboardingSuggestionType.INVITE_SUGGESTION;
  const { data: inviteSuggestionsData } = useGetInviteSuggestionsQuery({
    skip: !isInviteSuggestion,
  });

  const suggestionList = useMemo((): SuggestionItem[] => {
    const suggestions = inviteSuggestionsData?.inviteSuggestions;
    if (!suggestions) return [];
    const mapItems = (
      items:
        | ReadonlyArray<{
            email?: string | null;
            name?: string | null;
            picture?: string | null;
          }>
        | null
        | undefined,
    ): SuggestionItem[] =>
      (items ?? []).flatMap((item) =>
        item?.email
          ? [{ email: item.email, name: item.name, picture: item.picture }]
          : [],
      );
    return [
      ...mapItems(suggestions.users?.items),
      ...mapItems(suggestions.nonUsers?.items),
    ];
  }, [inviteSuggestionsData?.inviteSuggestions]);

  const filteredSuggestions = useMemo(() => {
    const available =
      inviteEmails.length === 0
        ? suggestionList
        : (() => {
            const addedSet = new Set(inviteEmails.map((e) => e.toLowerCase()));
            return suggestionList.filter(
              (s) => !addedSet.has(s.email.toLowerCase()),
            );
          })();
    const q = inputValue.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (s) =>
        s.email.toLowerCase().includes(q) ||
        (s.name && s.name.toLowerCase().includes(q)),
    );
  }, [suggestionList, inviteEmails, inputValue]);

  const showDropdown =
    isInviteSuggestion && isFocused && filteredSuggestions.length > 0;

  const addEmails = useCallback(
    (newEmails: string[]) => {
      if (newEmails.length === 0) return;
      setInviteEmails((prev) => {
        const set = new Set(prev);
        newEmails.forEach((e) => set.add(e.trim().toLowerCase()));
        return Array.from(set);
      });
    },
    [setInviteEmails],
  );

  const removeEmail = useCallback(
    (index: number) => {
      setInviteEmails((prev) => prev.filter((_, i) => i !== index));
    },
    [setInviteEmails],
  );

  const selectSuggestion = useCallback(
    (item: SuggestionItem) => {
      addEmails([item.email]);
      setInputValue("");
    },
    [addEmails],
  );

  const handleFocus = useCallback(() => {
    if (blurTimer) {
      clearTimeout(blurTimer);
      setBlurTimer(null);
    }
    setIsFocused(true);
  }, [blurTimer]);

  const handleBlur = useCallback(() => {
    const timer = setTimeout(() => {
      setIsFocused(false);
      setBlurTimer(null);
    }, 150);
    setBlurTimer(timer);
  }, []);

  useEffect(
    () => () => {
      if (blurTimer) clearTimeout(blurTimer);
    },
    [blurTimer],
  );

  const flushInput = useCallback(() => {
    const parsed = parseEmailsFromInput(inputValue);
    if (parsed.length > 0) {
      addEmails(parsed);
      setInputValue("");
    }
  }, [inputValue, addEmails]);

  const handleInputBlur = useCallback(() => {
    handleBlur();
    flushInput();
  }, [handleBlur, flushInput]);

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const key = e.nativeEvent.key;
      if (key === "Enter" || key === "Tab" || key === ",") {
        e.preventDefault?.();
        flushInput();
      }
      if (key === "Backspace" && !inputValue && inviteEmails.length > 0) {
        removeEmail(inviteEmails.length - 1);
      }
    },
    [flushInput, inputValue, inviteEmails.length, removeEmail],
  );

  return (
    <View style={styles.optionsContainer}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
        ]}
      >
        {inviteEmails.map((email, index) => (
          <View key={`${email}-${index}`} style={styles.chip}>
            <Text style={styles.chipText} numberOfLines={1}>
              {email}
            </Text>
            <TouchableOpacity
              onPress={() => removeEmail(index)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.chipRemove}
              accessibilityLabel={`Remove ${email}`}
            >
              <IconX width={14} height={14} color={DESKTOP_THEME.grey100} />
            </TouchableOpacity>
          </View>
        ))}
        <TextInput
          nativeID="invite-teammates-email-input"
          value={inputValue}
          onChangeText={setInputValue}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleInputBlur}
          placeholder="Emails, separate with comma, tab or enter"
          placeholderTextColor={DESKTOP_THEME.grey700}
          style={styles.input}
          cursorColor={DESKTOP_THEME.grey100}
          blurOnSubmit={false}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
      </View>
      {showDropdown && (
        <View style={styles.dropdown}>
          <ScrollView
            style={styles.dropdownScroll}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {filteredSuggestions.map((item) => (
              <Pressable
                key={item.email}
                style={({ pressed }) => [
                  styles.suggestionRow,
                  pressed && styles.suggestionRowPressed,
                ]}
                onPress={() => selectSuggestion(item)}
              >
                <Avatar
                  name={item.name ?? item.email}
                  picture={item.picture}
                  size={24}
                  shape="square"
                />
                <View style={styles.suggestionTextWrap}>
                  {item.name ? (
                    <>
                      <Text style={styles.suggestionName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.suggestionEmail,
                          styles.suggestionEmailSecondary,
                        ]}
                        numberOfLines={1}
                      >
                        {item.email}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.suggestionEmail} numberOfLines={1}>
                      {item.email}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = createStyles({
  optionsContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    marginTop: 20,
    flex: 0.7,
    gap: 24,
  },
  inputContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    width: "100%",
    maxWidth: 460,
    minHeight: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: DESKTOP_THEME.grey1000,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey900,
  },
  inputContainerFocused: {
    borderColor: DESKTOP_THEME.grey500,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    backgroundColor: DESKTOP_THEME.purple1100,
    borderRadius: 4,
    maxWidth: "100%",
  },
  chipText: {
    color: DESKTOP_THEME.grey100,
    fontSize: 14,
    fontFamily: Fonts.dmSans["500"].regular,
    flexShrink: 1,
  },
  chipRemove: {
    padding: 2,
  },
  input: {
    flex: 1,
    minWidth: 200,
    minHeight: 20,
    color: DESKTOP_THEME.grey100,
    fontSize: 14,
    fontFamily: Fonts.dmSans["500"].regular,
    padding: 0,
    borderWidth: 0,
    borderColor: "transparent",
    outlineWidth: 0,
  },
  dropdown: {
    width: "100%",
    maxWidth: 432,
    maxHeight: 240,
    backgroundColor: DESKTOP_THEME.grey1000,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey800,
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownScroll: {
    maxHeight: 240,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  suggestionRowPressed: {
    backgroundColor: DESKTOP_THEME.grey900,
  },
  suggestionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  suggestionName: {
    color: DESKTOP_THEME.grey100,
    fontSize: 14,
    fontFamily: Fonts.dmSans["500"].regular,
  },
  suggestionEmail: {
    color: DESKTOP_THEME.grey500,
    fontSize: 12,
    fontFamily: Fonts.dmSans["400"].regular,
  },
  suggestionEmailSecondary: {
    marginTop: 2,
  },
});
