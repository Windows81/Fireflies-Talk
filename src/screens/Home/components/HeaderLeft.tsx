import { IconHamburgerMenu } from "@/assets/svg";
import { HeaderSideContainer } from "@/components/Layout";
import { RouteNames } from "@/constants";
import { RootNavigation } from "@/screens/RootNavigation";
import { useTheme } from "@/styles";
import type { FC } from "react";
import { Pressable } from "react-native";

export const HeaderLeft: FC = () => {
  const theme = useTheme();

  return (
    <HeaderSideContainer forcePadding>
      <Pressable
        onPress={() =>
          RootNavigation.navigate(RouteNames.You, { fromLeft: true })
        }
        aria-label="Open profile"
      >
        <IconHamburgerMenu
          width={36}
          height={36}
          color={theme.colors.commandNeutralDefault}
        />
      </Pressable>
    </HeaderSideContainer>
  );
};
