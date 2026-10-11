import { Avatar } from "@/components/Avatar";
import { Text } from "@/components/Typography";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

const ROWS = [
  { name: "Maya Chen", time: "00:12", words: ["78%", "52%"] },
  { name: "Daniel Ortiz", time: "00:41", words: ["64%"] },
  { name: "Priya Nair", time: "01:05", words: ["85%", "40%"] },
  { name: "Daniel Ortiz", time: "01:38", words: ["58%"] },
] as const;

/**
 * Static illustration of a transcript whose rows carry participant names
 * instead of "Speaker 1, Speaker 2". Purely decorative, nothing is live.
 */
export const TranscriptMockPanel: FC = () => (
  <View style={styles.root}>
    <View style={styles.mock}>
      <View style={styles.header}>
        <Text variant="label2Weight" color="textPrimary" fontSize={12}>
          Transcript
        </Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text variant="label3Weight" fontSize={10} style={styles.liveLabel}>
            LIVE
          </Text>
        </View>
      </View>

      {ROWS.map((row, index) => (
        <View key={`${row.name}-${row.time}`} style={styles.row}>
          <Avatar name={row.name} size={24} />
          <View style={styles.rowBody}>
            <View style={styles.rowMeta}>
              <Text variant="label2Weight" color="textPrimary" fontSize={12}>
                {row.name}
              </Text>
              <Text variant="label3Regular" color="textMuted" fontSize={10}>
                {row.time}
              </Text>
            </View>
            {row.words.map((width, lineIndex) => (
              <View
                key={lineIndex}
                style={[
                  styles.skeletonBar,
                  { width },
                  index === ROWS.length - 1 && styles.skeletonBarActive,
                ]}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DESKTOP_THEME.grey950,
  },
  mock: {
    position: "absolute",
    width: 335,
    height: 362,
    right: 33,
    top: 33,
    backgroundColor: DESKTOP_THEME.grey1100,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: DESKTOP_THEME.grey1010,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 40,
    backgroundColor: DESKTOP_THEME.grey1010,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DESKTOP_THEME.green600,
  },
  liveLabel: {
    color: DESKTOP_THEME.green600,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  rowBody: {
    flex: 1,
    gap: 8,
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  skeletonBar: {
    height: 8,
    borderRadius: 40,
    backgroundColor: DESKTOP_THEME.grey1010,
  },
  skeletonBarActive: {
    backgroundColor: DESKTOP_THEME.purple600,
  },
});
