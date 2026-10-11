import { Text } from "@/components/Typography";
import { Select } from "@/components/Input";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { AUTO_JOIN_OPTIONS, SEND_NOTES_TO_OPTIONS } from "@/constants";
import { useGetCurrentUserQuery } from "@/graphql";
import { DESKTOP_THEME } from "@/styles/color";
import { useOnboarding } from "../../OnboardingContext";

export const DesktopAutoJoinAndRecap: FC = () => {
  const { autoJoin, setAutoJoin, sendNotesTo, setSendNotesTo } =
    useOnboarding();
  const { data: dataUser } = useGetCurrentUserQuery();

  return (
    <View style={styles.optionsContainer}>
      <View style={styles.field}>
        <Text style={styles.label} numberOfLines={1}>
          Notetaker will join:
        </Text>
        <Select
          value={autoJoin}
          onValueChange={setAutoJoin}
          options={AUTO_JOIN_OPTIONS(dataUser?.user)}
          style={styles.selectTrigger}
          hoverStyle={styles.selectTriggerHover}
          textProps={{ style: styles.selectText }}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label} variant="body2Regular" numberOfLines={1}>
          Send notes to:
        </Text>
        <Select
          value={sendNotesTo}
          onValueChange={setSendNotesTo}
          options={SEND_NOTES_TO_OPTIONS(dataUser?.user)}
          style={styles.selectTrigger}
          hoverStyle={styles.selectTriggerHover}
          textProps={{ style: styles.selectText }}
        />
      </View>
    </View>
  );
};

const styles = createStyles({
  optionsContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    marginTop: 12,
    flex: 0.7,
    gap: 24,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 620,
  },
  label: {
    color: DESKTOP_THEME.grey500,
    width: 190,
  },
  selectTrigger: {
    backgroundColor: DESKTOP_THEME.grey1000,
    borderColor: DESKTOP_THEME.grey800,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    minHeight: 40,
    width: 340,
  },
  selectTriggerHover: {
    backgroundColor: DESKTOP_THEME.grey700,
    borderColor: DESKTOP_THEME.grey700,
  },
  selectText: {
    color: DESKTOP_THEME.grey100,
  },
});
