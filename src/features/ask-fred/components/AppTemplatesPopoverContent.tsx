import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createStyles, useTheme } from "@/styles";
import { Text } from "@/components/Typography";
import type { AppSettings, AppTemplate } from "@/graphql";
import { IconSparkle3 } from "@/assets/svg";

const gradientColorPallet = [
  ["#7DA9EB", "#1A4280"],
  ["#B67AEF", "#441A80"],
  ["#EF76CF", "#701357"],
  ["#EF7676", "#701313"],
  ["#EFCF76", "#704E13"],
  ["#CBEF76", "#4F7013"],
  ["#7AEF76", "#13704E"],
  ["#76EFC9", "#136270"],
  ["#8476EF", "#341370"],
  ["#EFB476", "#703213"],
];

const ICON_SIZE = 20;
const ICON_BORDER_RADIUS = 4;
/** Approximate height of each aiApp row for scroll-into-view */
const LIST_ITEM_HEIGHT = 40;

/** Text after "/" with no spaces, used to filter templates. Only applies when input starts with "/" (user typed / in empty input). */
export const getSlashFilterQuery = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return "";
  return trimmed.slice(1).replace(/\s/g, "").toLowerCase();
};

export const filterTemplatesByQuery = (
  templates: (AppTemplate | AppSettings)[],
  query: string,
): (AppTemplate | AppSettings)[] => {
  if (!query) return templates.slice(0, 7);
  const q = query.toLowerCase().replace(/\s/g, "");
  return templates.filter(
    (t) => t.title && t.title.toLowerCase().replace(/\s/g, "").includes(q),
  );
};

const popoverStyles = createStyles({
  content: {
    paddingTop: 16,
    paddingBottom: 12,
    borderRadius: 8,
  },
  heading: {
    marginBottom: 10,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
  },
  hint: {
    paddingVertical: 8,
    marginLeft: 16,
  },
  listScroll: {
    maxHeight: 280,
  },
  listWrap: {
    gap: 0,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
    borderRadius: 8,
  },
  listItemPressed: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryDisabled,
    borderRadius: 0,
  }),
  listItemIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_BORDER_RADIUS,
    justifyContent: "center",
    alignItems: "center",
  },
  listItemIconInner: {
    opacity: 1,
  },
  listItemLabel: {
    flex: 1,
  },
});

export const AppTemplatesPopoverContent: FC<{
  onSelectTemplate: (aiApp: AppTemplate | AppSettings) => void;
  onClose: () => void;
  filteredAIApps: (AppTemplate | AppSettings)[];
  selectedIndex: number;
  loading?: boolean;
}> = ({
  onSelectTemplate,
  onClose,
  filteredAIApps,
  selectedIndex,
  loading = false,
}) => {
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (loading || filteredAIApps.length === 0) return;
    const clamped = Math.max(
      0,
      Math.min(selectedIndex, filteredAIApps.length - 1),
    );
    const y = clamped * LIST_ITEM_HEIGHT;
    scrollViewRef.current?.scrollTo({ y, animated: true });
  }, [selectedIndex, loading, filteredAIApps.length]);

  return (
    <View style={popoverStyles.content}>
      <Text
        variant="body3Regular"
        color="textHint"
        style={popoverStyles.heading}
      >
        AI SKILLS
      </Text>
      {loading ? (
        <Text
          variant="body2Regular"
          color="textHint"
          style={popoverStyles.hint}
        >
          Loading...
        </Text>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={popoverStyles.listScroll}
          contentContainerStyle={popoverStyles.listWrap}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredAIApps.length === 0 ? (
            <Text
              variant="body2Regular"
              color="textHint"
              style={popoverStyles.hint}
            >
              No matching skills
            </Text>
          ) : (
            filteredAIApps.map(
              (aiApp: AppTemplate | AppSettings, index: number) => (
                <Pressable
                  key={aiApp.id}
                  onPress={() => {
                    onSelectTemplate(aiApp);
                    onClose();
                  }}
                  {...({
                    onMouseEnter: () => setHoveredIndex(index),
                    onMouseLeave: () => setHoveredIndex(null),
                  } as React.ComponentProps<typeof Pressable>)}
                  style={({ pressed }) => [
                    popoverStyles.listItem,
                    (pressed ||
                      index === selectedIndex ||
                      hoveredIndex === index) &&
                      popoverStyles.listItemPressed(theme),
                  ]}
                >
                  <LinearGradient
                    colors={
                      gradientColorPallet[
                        index % gradientColorPallet.length
                      ] as [string, string]
                    }
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={popoverStyles.listItemIcon}
                  >
                    <IconSparkle3
                      width={16}
                      height={16}
                      fill="#FFFFFF"
                      color="#FFFFFF"
                      style={popoverStyles.listItemIconInner}
                    />
                  </LinearGradient>
                  <Text
                    variant="body2Regular"
                    color="textSecondary"
                    style={popoverStyles.listItemLabel}
                    numberOfLines={1}
                  >
                    {aiApp.title}
                  </Text>
                </Pressable>
              ),
            )
          )}
        </ScrollView>
      )}
    </View>
  );
};
