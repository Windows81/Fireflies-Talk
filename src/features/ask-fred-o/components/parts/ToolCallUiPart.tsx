import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { ToolCallUiPartComponentProps } from "@firefliesai/fred-react";
import type { FC } from "react";
import { View } from "react-native";
import { ExpandableRow } from "../primitives/ExpandableRow";
import { StatusIcon } from "../primitives/StatusIcon";
import {
  resolveFredPartStatus,
  statusIconConfig,
} from "../primitives/statusIconConfig";

export const ToolCallUiPart: FC<ToolCallUiPartComponentProps> = ({
  statusProps,
}) => {
  const theme = useTheme();
  const status = statusProps?.status;
  const message = statusProps?.message ?? "Working…";
  const history = statusProps?.history ?? [];
  const { labelColor } = statusIconConfig[resolveFredPartStatus(status)];

  const icon = <StatusIcon status={status} />;

  if (history.length <= 1) {
    return (
      <ExpandableRow icon={icon} label={message} labelColor={labelColor} />
    );
  }

  return (
    <ExpandableRow icon={icon} label={message} labelColor={labelColor}>
      <View style={styles.timeline(theme)}>
        {history.map((entry) => (
          <Text
            key={`${entry.timestamp}-${entry.status}-${entry.message}`}
            color="textHint"
            variant="label3Regular"
          >
            {entry.message}
          </Text>
        ))}
      </View>
    </ExpandableRow>
  );
};

const styles = createStyles({
  timeline: (theme) => ({
    flexDirection: "column",
    gap: 4,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.borderStaticMuted,
    paddingLeft: 12,
  }),
});
