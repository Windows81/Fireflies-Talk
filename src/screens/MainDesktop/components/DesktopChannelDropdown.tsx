import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconVideo,
} from "@/assets/svg";
import { MenuPopover } from "@/components/Menu";
import { Text } from "@/components/Typography";
import {
  useDesktopHomeChannels,
  type DesktopHomeChannelId,
} from "@/features/channel";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { useBooleanState } from "@/utils/states";
import type { FC } from "react";
import { useRef } from "react";
import { Pressable, View } from "react-native";

interface DesktopChannelDropdownProps {
  selectedChannelId: DesktopHomeChannelId;
  onSelectChannel: (channelId: DesktopHomeChannelId) => void;
}

export const DesktopChannelDropdown: FC<DesktopChannelDropdownProps> = ({
  selectedChannelId,
  onSelectChannel,
}) => {
  const channels = useDesktopHomeChannels();
  const triggerRef = useRef<View>(null);
  const [isOpen, open, close] = useBooleanState(false);

  const selectedChannel = channels.find(
    (channel) => channel.id === selectedChannelId,
  );
  const triggerColor = isOpen ? DESKTOP_THEME.purple400 : DESKTOP_THEME.grey400;

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={isOpen ? close : open}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={`Meetings channel: ${selectedChannel?.label}`}
      >
        <IconVideo width={20} height={20} color={triggerColor} />
        <Text variant="body2Regular" style={{ color: triggerColor }}>
          {selectedChannel?.label}
        </Text>
        {isOpen ? (
          <IconChevronUp width={16} height={16} color={triggerColor} />
        ) : (
          <IconChevronDown width={16} height={16} color={triggerColor} />
        )}
      </Pressable>

      <MenuPopover
        isOpen={isOpen}
        close={close}
        triggerRef={triggerRef}
        width={182}
        align="start"
        style={{
          backgroundColor: DESKTOP_THEME.grey1010,
          borderColor: DESKTOP_THEME.grey950,
          borderWidth: 1,
          paddingVertical: 4,
          boxShadow:
            "0px 12px 12px -4px rgba(16, 24, 40, 0.06), 0px 4px 6px -2px rgba(16, 24, 40, 0.04)",
        }}
      >
        {channels.map((channel) => {
          const isSelected = channel.id === selectedChannelId;
          return (
            <Pressable
              key={channel.id}
              onPress={() => {
                onSelectChannel(channel.id);
                close();
              }}
            >
              {(state) => {
                const hovered = (state as { hovered?: boolean }).hovered;
                return (
                  <View
                    style={[styles.menuItem, hovered && styles.menuItemHovered]}
                  >
                    <Text
                      variant="body2Regular"
                      style={styles.menuItemLabel}
                      numberOfLines={1}
                    >
                      {channel.label}
                    </Text>
                    {isSelected && (
                      <IconCheck
                        width={16}
                        height={16}
                        color={DESKTOP_THEME.grey500}
                      />
                    )}
                  </View>
                );
              }}
            </Pressable>
          );
        })}
      </MenuPopover>
    </>
  );
};

const styles = createStyles({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 32,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  menuItemHovered: {
    backgroundColor: "rgba(255, 255, 255, 0.09)",
  },
  menuItemLabel: {
    flex: 1,
    color: DESKTOP_THEME.grey500,
  },
});
