import { IconSearch } from "@/assets/svg";
import { TextInput } from "@/components/Input";
import { HeaderSideContainer } from "@/components/Layout";
import { createStyles } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { useEffect, useState, type FC } from "react";
import { Dimensions } from "react-native";
import Animated, { SlideInRight, SlideOutRight } from "react-native-reanimated";

export const SearchInputHeader: FC<{
  setSearch: (search: string) => void;
  meeting: Meeting;
}> = ({ setSearch, meeting }) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    return () => setSearch("");
  }, [setSearch]);

  return (
    // TODO: need better solution for width
    <Animated.View
      style={{ width: Dimensions.get("window").width - 70 }}
      entering={SlideInRight.duration(300)}
      exiting={SlideOutRight.duration(300)}
    >
      <HeaderSideContainer>
        <TextInput
          value={value}
          onValueChange={setValue}
          autoFocus
          style={styles.input}
          Icon={IconSearch}
          onSubmitEditing={(e) => {
            const searchQuery = e.nativeEvent.text.trim();
            if (searchQuery) {
              tracker.track(TRACKING_EVENTS.NOTEPAD_TRANSCRIPT_SEARCHED, {
                queryLength: searchQuery.length,
                meetingId: meeting.id,
                from: "screen/header",
              });
            }
            setSearch(searchQuery);
          }}
          onClear={() => setSearch("")}
          clearable
          returnKeyType="search"
        />
      </HeaderSideContainer>
    </Animated.View>
  );
};

const styles = createStyles({
  input: {
    width: "100%",
  },
});
