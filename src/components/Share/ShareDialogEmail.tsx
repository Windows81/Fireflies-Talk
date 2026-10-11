import { IconX } from "@/assets/svg";
import { Fonts, createStyles, useTheme } from "@/styles";
import { isEmail } from "@/utils/email";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useMemo, useState, type FC } from "react";
import type { ListRenderItem } from "react-native";
import { FlatList, TextInput, TouchableOpacity, View } from "react-native";
import type { AutocompleteProps } from "../Autocomplete";
import { Autocomplete } from "../Autocomplete";
import { Avatar } from "../Avatar";
import { toast } from "../Toast";
import { Text } from "../Typography";
import type { ShareDialogEmailProps } from "./types";

const LIST_ITEM_HEIGHT = 52;

const EmailUserListItem: FC<{
  email: string;
  name?: string;
  picture?: string;
  onRemove?: () => void;
}> = ({ email, name, picture, onRemove }) => {
  const theme = useTheme();
  return (
    <View style={styles.listItem}>
      <Avatar size={32} name={name || email} picture={picture} shape="square" />
      <View style={styles.listItemContent}>
        <Text color="textPrimary" variant="body2Regular">
          {name || email}
        </Text>
        {name && (
          <Text color="textHint" variant="body3Regular">
            {email}
          </Text>
        )}
      </View>
      {onRemove && (
        <TouchableOpacity style={styles.clear} onPress={onRemove}>
          <IconX width={20} height={20} color={theme.colors.textHint} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export const ShareDialogEmail: FC<
  ShareDialogEmailProps & {
    selectedEmails: string[];
    setSelectedEmails: Dispatch<SetStateAction<string[]>>;
  }
> = ({ suggestedEmails, profileMap, selectedEmails, setSelectedEmails }) => {
  const theme = useTheme();

  const addSelectedEmail = useCallback(
    (email: string) => {
      setSelectedEmails((emails) =>
        !emails.includes(email) ? [...emails, email] : emails,
      );
    },
    [setSelectedEmails],
  );

  const removeSelectedEmail = useCallback(
    (email: string) => {
      setSelectedEmails((emails) => emails.filter((e) => e !== email));
    },
    [setSelectedEmails],
  );

  const renderItem = useCallback<ListRenderItem<string>>(
    ({ item }) => {
      return (
        <EmailUserListItem
          key={item}
          email={item}
          {...profileMap?.[item]}
          onRemove={() => removeSelectedEmail(item)}
        />
      );
    },
    [profileMap, removeSelectedEmail],
  );

  const renderOption = useCallback<AutocompleteProps["renderOption"]>(
    ({ item, onPress }) => {
      return (
        <TouchableOpacity onPress={onPress}>
          <EmailUserListItem email={item} {...profileMap?.[item]} />
        </TouchableOpacity>
      );
    },
    [profileMap],
  );

  const [inputValue, setInputValue] = useState("");
  const onAutocompleteSubmit = useCallback<
    AutocompleteProps["onSubmitEditing"]
  >(
    (event) => {
      const email = event.nativeEvent.text.trim();
      if (!isEmail(email)) {
        toast({
          message: "Please enter a valid email address",
        });
        return;
      }
      setInputValue("");
      if (email) addSelectedEmail(email);
    },
    [addSelectedEmail],
  );

  const options = useMemo(() => {
    return (
      suggestedEmails
        ?.filter((email) => !selectedEmails.includes(email))
        ?.sort((a, b) => a.localeCompare(b)) || []
    );
  }, [suggestedEmails, selectedEmails]);

  return (
    <View style={styles.root}>
      <Autocomplete
        value={inputValue}
        onChangeText={setInputValue}
        onSubmitEditing={onAutocompleteSubmit}
        renderInput={(props) => (
          <TextInput
            placeholderTextColor={theme.colors.textHint}
            placeholder="Add emails or people..."
            style={styles.input(theme)}
            autoComplete="email"
            {...props}
          />
        )}
        portalHostname="ShareDialogPortalHost"
        options={options}
        renderOption={renderOption}
        height={300}
      />
      <FlatList data={selectedEmails} renderItem={renderItem} />
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  input: (theme) => ({
    borderBottomColor: theme.colors.borderStaticDefault,
    borderBottomWidth: 1,
    backgroundColor: theme.colors.layerDefault,
    color: theme.colors.textPrimary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    // font
    fontFamily: Fonts.inter["400"].regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.18,
  }),
  listItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
    minHeight: LIST_ITEM_HEIGHT,
  },
  listItemContent: {
    flex: 1,
  },
  clear: {
    padding: 4,
  },
});
