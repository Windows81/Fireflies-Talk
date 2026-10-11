import { createStyles } from "@/styles";
import type { FC, ReactNode } from "react";
import { View, type ViewProps } from "react-native";

export const styles = createStyles({
  fabs: {
    position: "absolute",
    bottom: 16,
    right: 16,
    gap: 12,
  },
});

interface FabButtonContainerProps extends ViewProps {
  children: ReactNode;
}

export const FabButtonContainer: FC<FabButtonContainerProps> = ({
  children,
  ...props
}) => {
  return (
    <View {...props} style={[styles.fabs, props.style]}>
      {children}
    </View>
  );
};
