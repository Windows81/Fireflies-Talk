import {
  useNavigation,
  useRoute,
  type RouteProp,
  type ParamListBase,
} from "@react-navigation/native";
import { useCallback } from "react";

type ParamList = ParamListBase;

export const useRouteParamState = <T = unknown>(paramKey: string) => {
  const route = useRoute<RouteProp<ParamList>>();
  const navigation = useNavigation();

  const value = route.params
    ? ((route.params as Record<string, unknown>)[paramKey] as T)
    : undefined;

  const setValue = useCallback(
    (newValue: T) => {
      if (newValue !== value) {
        navigation.setParams({ [paramKey]: newValue });
      }
    },
    [navigation, paramKey, value],
  );

  return [value, setValue] as const;
};
