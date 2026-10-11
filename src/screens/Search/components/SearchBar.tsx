import { IconArrowLeft, IconSearch } from "@/assets/svg";
import { TextInput } from "@/components/Input";
import { HeaderIconButton } from "@/components/Layout";
import { isDesktop } from "@/utils/device";
import { useNavigation } from "@react-navigation/native";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

const PLACEHOLDERS = {
  bite: "Search your soundbites",
  playlist: "Search your playlists",
  meeting: "Search your meetings",
};

const MACOS_TRAFFIC_LIGHT_MARGIN = 83;
const WINDOWS_HEADER_MARGIN = 4;

export const SearchBar: FC<{
  value: string;
  onChangeText: (value: string) => void;
  onSubmit?: (value: string) => void;
  entity: "bite" | "playlist" | "meeting";
}> = ({ value, onChangeText, onSubmit, entity }) => {
  const navigation = useNavigation();

  return (
    <View
      style={[
        styles.root,
        isDesktop && {
          marginLeft:
            window.electron?.platform === "darwin"
              ? MACOS_TRAFFIC_LIGHT_MARGIN
              : WINDOWS_HEADER_MARGIN,
        },
      ]}
    >
      <HeaderIconButton
        Icon={IconArrowLeft}
        onPress={navigation.goBack}
        label="Back"
      />
      <TextInput
        variant="search"
        value={value}
        onValueChange={onChangeText}
        onSubmitEditing={(e) => onSubmit?.(e.nativeEvent.text.trim())}
        onClear={() => onSubmit?.("")}
        clearable
        Icon={IconSearch}
        placeholder={PLACEHOLDERS[entity]}
        returnKeyType="search"
        style={styles.input}
        autoFocus
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    height: 56,
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
  },
  input: {
    flex: 1,
  },
});
