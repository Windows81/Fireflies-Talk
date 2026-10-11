import { RouteNames } from "@/constants";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ParamList } from "../types";
import { isDesktop } from "@/utils/device";

export const useExitOnboarding = () => {
  const redirectRef = useRef(false);
  const navigation = useNavigation() as NativeStackNavigationProp<ParamList>;
  return useCallback(() => {
    if (!redirectRef.current) {
      redirectRef.current = true;
      navigation.reset({
        index: 0,
        routes: [
          { name: isDesktop ? RouteNames.MainDesktop : RouteNames.Main },
        ],
      });
    }
  }, [navigation]);
};

// after completing an onboarding step, it is possible
// that one of the shouldShowOnboarding flags is set to false
// unexpectedly remove a step from the onboarding flow
// while they are still on that screen
// this makes sure it won't happen
export const useEverTrue = (val: boolean) => {
  const [everTrue, setEverTrue] = useState(val);
  useEffect(() => {
    if (val) setEverTrue(true);
  }, [val]);
  return everTrue;
};
