import { IconSearch } from "@/assets/svg";
import { TextInput } from "@/components/Input";
import { useState, type FC } from "react";
import { StyleSheet, View } from "react-native";

export const TranscriptSearchHeader: FC<{
  search: string;
  setSearch: (search: string) => void;
}> = ({ setSearch }) => {
  const [value, setValue] = useState("");

  return (
    <View style={styles.transcriptSearch}>
      <TextInput
        Icon={IconSearch}
        placeholder="Search"
        variant="filled"
        onSubmitEditing={(e) => {
          setSearch(e.nativeEvent.text);
        }}
        clearable
        value={value}
        onValueChange={setValue}
        onClear={() => {
          setSearch("");
        }}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  transcriptSearch: {
    padding: 16,
  },
});
