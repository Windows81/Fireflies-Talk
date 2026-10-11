import { IconArrowDown, IconArrowUp } from "@/assets/svg";
import { SkeletonLoading } from "@/components/Loading";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";

export const StatsCard: FC<{
  title: string;
  value: number | undefined;
  formatter?: (value: number) => number | string;
  diffPct?: number | null;
}> = ({ title, value, diffPct, formatter }) => {
  const trend = diffPct
    ? diffPct > 0
      ? "increasing"
      : diffPct < 0
        ? "decreasing"
        : "same"
    : "same";

  const theme = useTheme();

  return (
    <View style={styles.root(theme)} accessible>
      <Text fontWeight="500" color="textSecondary">
        {title}
      </Text>
      <View style={styles.stats}>
        {typeof value === "number" ? (
          <Text fontSize={24}>{formatter ? formatter(value) : value}</Text>
        ) : (
          <SkeletonLoading width={64} height={31} />
        )}
        {typeof diffPct === "number" && (
          <View style={styles.statPct}>
            <Text style={styles[trend](theme)}>{diffPct}%</Text>
            {trend === "increasing" && (
              <IconArrowUp
                color={theme.colors.informationStaticGreenText}
                width={16}
                height={16}
                accessibilityLabel="increase"
              />
            )}
            {trend === "decreasing" && (
              <IconArrowDown
                color={theme.colors.informationStaticRedText}
                width={16}
                height={16}
                accessibilityLabel="decrease"
              />
            )}
          </View>
        )}
      </View>
      {typeof diffPct === "number" && (
        <Text color="textHint">vs. previous time period</Text>
      )}
    </View>
  );
};

export const MultiStatsCard: FC<{
  title: string;
  values: {
    value: number | undefined;
    label: string;
    color: string;
    suffix?: string;
  }[];
}> = ({ title, values }) => {
  const theme = useTheme();

  return (
    <View style={styles.root(theme)}>
      <Text fontWeight="500" color="textSecondary">
        {title}
      </Text>
      <View style={styles.stats}>
        {values.map(({ value, color, label, suffix }) => (
          <View style={styles.column} key={label} accessible>
            {typeof value === "number" ? (
              <Text fontSize={24} style={{ color }}>
                {value}
                {suffix}
              </Text>
            ) : (
              <SkeletonLoading width={36} height={31} />
            )}
            <Text style={{ color }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    backgroundColor: theme.colors.layerSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    borderRadius: 8,
    padding: 16,
    gap: 4,
  }),
  stats: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  statPct: {
    flexDirection: "row",
    gap: 2,
    paddingBottom: 4,
  },
  increasing: (theme) => ({
    color: theme.colors.informationStaticGreenText,
  }),
  decreasing: (theme) => ({
    color: theme.colors.informationStaticRedText,
  }),
  same: () => ({
    color: "rgb(144, 149, 157)",
  }),
  column: {
    flexDirection: "column",
    alignItems: "center",
    marginRight: 8,
  },
});
