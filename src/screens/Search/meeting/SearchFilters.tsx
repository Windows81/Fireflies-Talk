import { IconChevronDown } from "@/assets/svg";
import {
  CHIP_SELECTED_COLOR,
  CHIP_UNSELECTED_COLOR,
  Chip,
} from "@/components/Chip";
import { useTheme } from "@/styles";
import type { FC } from "react";
import { ScrollView, StyleSheet } from "react-native";
import type { SvgProps } from "react-native-svg";
import { DEFAULT_SCOPE } from "./constants";

export const SearchFilters: FC<{
  matchTitleOnly: boolean;
  setMatchTitleOnly: (value: boolean) => void;
  scope: string;
  scopeLabel: string;
  ScopeIcon?: FC<SvgProps>;
  onOpenMore: () => void;
}> = ({
  matchTitleOnly,
  setMatchTitleOnly,
  scope,
  scopeLabel,
  ScopeIcon,
  onOpenMore,
}) => {
  const theme = useTheme();
  const hasScope = scope !== DEFAULT_SCOPE;
  const accent =
    theme.colors[hasScope ? CHIP_SELECTED_COLOR : CHIP_UNSELECTED_COLOR];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bar}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Chip
        selected={matchTitleOnly}
        onPress={() => setMatchTitleOnly(!matchTitleOnly)}
      >
        Title only
      </Chip>
      <Chip
        selected={hasScope}
        onPress={onOpenMore}
        role="button"
        leading={
          hasScope && ScopeIcon ? (
            <ScopeIcon width={16} height={16} color={accent} />
          ) : undefined
        }
        trailing={<IconChevronDown width={16} height={16} color={accent} />}
      >
        {scopeLabel}
      </Chip>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexGrow: 0,
  },
  content: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
});
