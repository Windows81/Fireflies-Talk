import { useTheme } from "@/styles";
import { forwardRef, useState } from "react";
import {
  RefreshControl as RNRefreshControl,
  type RefreshControlProps as RNRefreshControlProps,
} from "react-native";

export type RefreshControlProps = Omit<
  RNRefreshControlProps,
  "onRefresh" | "refreshing"
> & {
  onRefresh: () => any | Promise<any>;
  refreshing?: boolean;
};

export const RefreshControl = forwardRef<RNRefreshControl, RefreshControlProps>(
  function RefreshControl(
    { onRefresh: onRefreshProps, refreshing: refreshingProps, ...props },
    ref,
  ) {
    const theme = useTheme();

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = () => {
      const ret = onRefreshProps();
      if (!!ret && "then" in ret) {
        setRefreshing(true);
        ret.finally(() => {
          setRefreshing(false);
        });
      }
    };

    return (
      <RNRefreshControl
        refreshing={refreshingProps || refreshing}
        onRefresh={onRefresh}
        colors={[theme.colors.layerBrand]}
        progressBackgroundColor={theme.colors.pageBackground}
        ref={ref}
        {...props}
      />
    );
  },
);
