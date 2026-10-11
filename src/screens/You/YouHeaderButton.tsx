import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { LinkView } from "@/components/Link";
import { RouteNames } from "@/constants";
import { useAuth } from "@/features/auth";
import { isDesktop } from "@/utils/device";
import { useBooleanState } from "@/utils/states";
import type { FC } from "react";
import { useRef } from "react";
import type { View } from "react-native";
import { StyleSheet } from "react-native";
import type { DesktopSettingsContent } from "../types";
import { ProfileMenu } from "./ProfileMenu";

type YouHeaderProps = {
  avatarSize?: 20 | 24 | 32 | 40 | 48;
  settingsContent?: DesktopSettingsContent;
};

export const YouHeaderButton: FC<YouHeaderProps> = ({
  avatarSize = 24,
  settingsContent,
}) => {
  const { user } = useAuth();
  const [isMenuOpen, openMenu, closeMenu] = useBooleanState();
  const buttonRef = useRef<View>(null);

  if (!user) return null;

  // On desktop, show profile menu
  if (isDesktop) {
    return (
      <>
        <Button
          ref={buttonRef}
          variant="transparentNeutral"
          onPress={openMenu}
          aria-label={`User: ${user?.name}`}
          style={styles.button}
        >
          <Avatar
            size={avatarSize}
            name={user.name}
            picture={user.photoUrl}
            shape="square"
          />
        </Button>
        <ProfileMenu
          isOpen={isMenuOpen}
          close={closeMenu}
          triggerRef={buttonRef}
          settingsContent={settingsContent}
        />
      </>
    );
  }

  // On mobile, navigate to You screen
  return (
    <LinkView
      style={styles.button}
      aria-label={`User: ${user?.name}`}
      href={RouteNames.You}
      animated="highlight"
    >
      <Avatar
        size={avatarSize}
        name={user.name}
        picture={user.photoUrl}
        shape="square"
      />
    </LinkView>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    padding: 0,
  },
});
