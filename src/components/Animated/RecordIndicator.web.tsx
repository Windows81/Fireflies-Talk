import { createStyles, useTheme } from "@/styles";
import { type FC } from "react";
import { View } from "react-native";

if (typeof document !== "undefined") {
  const styleId = "record-indicator-pulse-keyframes";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes record-pulse {
        0%, 33% { opacity: 1; }
        50% { opacity: 0; }
        67%, 100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
}

type RecordIndicatorProps = {
  invisible?: boolean;
  size?: number;
};

export const RecordIndicator: FC<RecordIndicatorProps> = ({
  invisible = false,
  size = 12,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.indicator(theme),
        invisible && { opacity: 0 },
        { width: size, height: size },
      ]}
    >
      <View
        style={[
          styles.dot(theme),
          { width: size, height: size },
          {
            animation: "record-pulse 2.8s ease-in-out infinite",
          } as any,
        ]}
      />
    </View>
  );
};

const styles = createStyles({
  indicator: (theme) => ({
    borderColor: theme.colors.informationStaticRedSolid,
    borderRadius: 9999,
    borderWidth: 1,
  }),
  dot: (theme) => ({
    backgroundColor: theme.colors.informationStaticRedSolid,
    borderRadius: 9999,
    marginLeft: -1,
    marginTop: -1,
  }),
});
