import { IconChevronUp } from "@/assets/svg";
import { humanizeToolName } from "@/hooks/dictationAgenticAction";
import type { Theme } from "@/styles";
import type { FC } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { ActionJobStep } from "./dictationActionJob";
import { panelStyles } from "./dictationActionPanelStyles";
import { webkitNoDrag } from "./dictationPillStyles";
import { useNativeTitle } from "./useNativeTitle";

/**
 * What the run is doing now, with everything it did before folded away behind
 * the chevron beside it. The live line is the loud one; the trail is evidence.
 */
export const DictationActionSteps: FC<{
  status: string;
  history: ActionJobStep[];
  expanded: boolean;
  onToggle: () => void;
  theme: Theme;
}> = ({ status, history, expanded, onToggle, theme }) => {
  const statusRef = useNativeTitle(status);

  return (
    <>
      <View style={panelStyles.panelStatusRow}>
        <Text ref={statusRef} style={panelStyles.panelStatus} numberOfLines={3}>
          {status}
        </Text>
        {history.length ? (
          <Pressable
            testID="no-drag"
            accessibilityRole="button"
            accessibilityLabel={
              expanded
                ? "Hide earlier steps"
                : `Show ${history.length} earlier steps`
            }
            onPress={onToggle}
            style={[panelStyles.panelDisclosure, webkitNoDrag]}
          >
            <View style={!expanded && panelStyles.panelChevronDown}>
              <IconChevronUp
                width={12}
                height={12}
                color={theme.colors.textSecondary}
              />
            </View>
          </Pressable>
        ) : null}
      </View>

      {expanded && history.length ? (
        <ScrollView
          style={panelStyles.panelHistory}
          contentContainerStyle={panelStyles.panelHistoryContent}
          showsVerticalScrollIndicator={false}
        >
          {history.map((step) => (
            <View key={step.id} style={panelStyles.panelStep}>
              <Text style={panelStyles.panelStepText}>{step.message}</Text>
              {step.tool ? (
                <Text style={panelStyles.panelStepTool}>
                  {humanizeToolName(step.tool)}
                </Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : null}
    </>
  );
};
