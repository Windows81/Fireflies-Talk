import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { SubagentPartComponentProps } from "@firefliesai/fred-react";
import type { FC } from "react";
import { View } from "react-native";
import { useAutoExpand } from "../../hooks/useAutoExpand";
import { ExpandableRow } from "../primitives/ExpandableRow";
import { StatusIcon } from "../primitives/StatusIcon";
import {
  resolveFredPartStatus,
  statusIconConfig,
} from "../primitives/statusIconConfig";

export const SubagentPart: FC<SubagentPartComponentProps> = ({
  name,
  title,
  status,
  error,
  nestedContentNodes,
}) => {
  const theme = useTheme();
  const resolvedStatus = resolveFredPartStatus(status);
  const [isOpen, setIsOpen] = useAutoExpand(
    resolvedStatus !== "completed" || !!error,
  );
  const { labelColor } = statusIconConfig[resolvedStatus];

  return (
    <View style={styles.card(theme)}>
      <ExpandableRow
        icon={<StatusIcon status={status} />}
        label={title ?? `Agent: ${name}`}
        labelColor={labelColor}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <View style={styles.body}>
          {nestedContentNodes}
          {!!error && (
            <Text color="informationStaticRedText" variant="body2Regular">
              {error}
            </Text>
          )}
        </View>
      </ExpandableRow>
    </View>
  );
};

const styles = createStyles({
  card: (theme) => ({
    backgroundColor: theme.colors.layerSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticMuted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 4,
  }),
  body: {
    flexDirection: "column",
    gap: 2,
  },
});
