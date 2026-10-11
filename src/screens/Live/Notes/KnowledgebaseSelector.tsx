import { IconBookOpen, IconCheck } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { createStyles, useTheme } from "@/styles";
import {
  useKnowledgebase,
  type IKnowledgeBaseItem,
} from "src/hooks/useKnowledgebase";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { Text } from "@/components/Typography";
import { storage as localStorageOrMemory } from "@/features/storage";
import { useAuth } from "@/features/auth";
import { useLiveScreenContext } from "../Context/LiveScreenContext";

interface KnowledgebaseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onUse: (selectedIds: string[], makeDefault: boolean) => void;
  initialSelectedIds?: string[];
}

export const KnowledgebaseSelectorContent: FC<KnowledgebaseSelectorProps> = ({
  isOpen,
  onClose,
  onUse,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { data: knowledgeBaseList } = useKnowledgebase();
  const { knowledgeBases } = useLiveScreenContext();
  const [selectedIds, setSelectedIds] = useState<string[]>(knowledgeBases);
  const [makeDefault, setMakeDefault] = useState(false);
  const [isHovered, setIsHovered] = useState("");
  const store = localStorageOrMemory;
  const makeDefaultKey = `makeDefault-${user?.email}`;

  const handleToggleKnowledgeBase = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((kbId) => kbId !== id) : [...prev, id],
    );
  };

  const handleUse = () => {
    onUse(selectedIds, makeDefault);
    if (makeDefault) {
      store.setItem(makeDefaultKey, selectedIds.join(","));
    }
    onClose();
  };

  const getSourceCount = (kb: IKnowledgeBaseItem): number => {
    return (
      (kb.sources.files?.length || 0) +
      (kb.sources.websites?.length || 0) +
      (kb.sources.textSnippets?.length || 0)
    );
  };

  const getIconColor = (kb: IKnowledgeBaseItem): string => {
    if (
      kb.iconColor &&
      theme.colors[kb.iconColor as keyof typeof theme.colors]
    ) {
      return theme.colors[kb.iconColor as keyof typeof theme.colors] as string;
    }
    // Default colors based on index if no iconColor
    const defaultColors = [
      theme.colors.rainbowStaticCyanSolid,
      theme.colors.rainbowStaticOrangeSolid,
      theme.colors.rainbowStaticPurpleSolid,
      theme.colors.rainbowStaticTealSolid,
      theme.colors.rainbowStaticPinkSolid,
    ];
    const index =
      (knowledgeBaseList?.findIndex(
        (k: IKnowledgeBaseItem) => k.id === kb.id,
      ) || 0) % defaultColors.length;
    return defaultColors[index];
  };

  useEffect(() => {
    setMakeDefault(selectedIds.length > 0);
  }, [selectedIds.length]);

  useEffect(() => {
    setSelectedIds(knowledgeBases);
  }, [knowledgeBases]);

  if (!isOpen) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text variant="title2Weight" color="layerContrast">
          Select Knowledge Bases
        </Text>
        <Text variant="body2Regular" color="commandNeutralDisabled">
          Sales assist will suggest personalized suggestions.
        </Text>
      </View>

      <View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {knowledgeBaseList?.map((kb: IKnowledgeBaseItem) => {
            const isSelected = selectedIds.includes(kb.id || "");
            const sourceCount = getSourceCount(kb);
            const iconColor = getIconColor(kb);

            return (
              <Pressable
                key={kb.id}
                onPress={() => kb.id && handleToggleKnowledgeBase(kb.id)}
                onHoverIn={() => setIsHovered(kb.id || "")}
                onHoverOut={() => setIsHovered("")}
                style={({ pressed }) => [
                  styles.knowledgeBaseItem,
                  (pressed || isHovered === kb.id) &&
                    styles.knowledgeBaseItemPressed(theme),
                ]}
              >
                <View style={styles.knowledgeBaseContent}>
                  <View
                    style={[
                      styles.checkboxContainer(theme),
                      isSelected && styles.checkboxContainerSelected(theme),
                    ]}
                  >
                    {isSelected && (
                      <IconCheck
                        color={theme.colors.commandContrastDefault}
                        width={16}
                        height={16}
                      />
                    )}
                  </View>
                  <IconBookOpen width={20} height={20} color={iconColor} />
                  <View style={styles.knowledgeBaseInfo}>
                    <Text
                      variant="body2Regular"
                      color="textMuted"
                      style={styles.knowledgeBaseName}
                    >
                      {kb.name}
                    </Text>
                  </View>
                  <Text
                    variant="body3Regular"
                    color="commandNeutralDisabled"
                    style={styles.sourceCount}
                  >
                    {sourceCount} {sourceCount === 1 ? "Source" : "Sources"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.footer}>
          <View style={styles.defaultCheckboxRow}>
            <Pressable onPress={() => setMakeDefault(!makeDefault)}>
              <View
                style={[
                  styles.checkboxContainer(theme),
                  makeDefault && styles.checkboxContainerSelected(theme),
                ]}
              >
                <View>
                  {makeDefault && (
                    <IconCheck
                      color={theme.colors.commandContrastDefault}
                      width={16}
                      height={16}
                    />
                  )}
                </View>
              </View>
            </Pressable>
            <Text variant="body2Regular" color="textMuted">
              Make these default for Sales Assist
            </Text>
          </View>
          <View style={styles.buttonsContainer}>
            <Button size="sm" variant="secondary" onPress={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onPress={handleUse}
              Icon={IconCheck}
              disabled={selectedIds.length === 0}
            >
              Use
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
};

export const KnowledgebaseSelector: FC<{
  isOpen: boolean;
  onClose: () => void;
  onUse: (selectedIds: string[], makeDefault: boolean) => void;
  isCompactMode?: boolean;
}> = ({ isOpen, onClose, onUse, isCompactMode }) => {
  return (
    <>
      {isCompactMode ? (
        <KnowledgebaseSelectorContent
          isOpen={isOpen}
          onClose={onClose}
          onUse={onUse}
        />
      ) : (
        <Dialog.Root
          isOpen={isOpen}
          close={onClose}
          onDismiss={onClose}
          variant="basic"
        >
          <KnowledgebaseSelectorContent
            isOpen={isOpen}
            onClose={onClose}
            onUse={onUse}
          />
        </Dialog.Root>
      )}
    </>
  );
};

const styles = createStyles({
  root: {
    width: "100%",
  },
  header: {
    display: "flex",
    paddingTop: 16,
    paddingBottom: 8,
    paddingLeft: 24,
    paddingRight: 24,
    alignItems: "flex-start",
    gap: "8px",
    alignSelf: "stretch",
  },
  scrollView: {
    maxHeight: 200,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 8,
    paddingRight: 8,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
  },
  knowledgeBaseItem: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  knowledgeBaseItemPressed: (theme) => ({
    backgroundColor: theme.colors.borderStaticPage,
    borderRadius: 8,
  }),
  knowledgeBaseContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: 17,
    flex: 1,
  },
  checkboxContainer: (theme) => ({
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticPage,
    backgroundColor: theme.colors.interactiveSecondaryDefault,
    alignItems: "center",
    justifyContent: "center",
  }),
  checkboxContainerSelected: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryDefault,
    borderColor: theme.colors.interactivePrimaryDefault,
  }),
  knowledgeBaseInfo: {
    flex: 1,
    flexDirection: "column",
    gap: 4,
  },
  knowledgeBaseName: {
    fontSize: 14,
    lineHeight: 20,
  },
  sourceCount: {
    fontSize: 12,
    lineHeight: 16,
  },
  defaultCheckboxContainer: {
    width: 16,
    height: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    marginTop: 8,
  },
  footer: {
    display: "flex",
    paddingTop: 20,
    paddingBottom: 18,
    paddingLeft: 24,
    paddingRight: 24,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    gap: 32,
    alignSelf: "stretch",
  },
  buttonsContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 12,
  },
  defaultCheckboxRow: {
    gap: 12,
    flexDirection: "row",
  },
});
