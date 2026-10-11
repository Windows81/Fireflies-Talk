import { IconCheck, IconChevronDown, IconX } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { DETECTABLE_PLATFORM_NAMES } from "@/features/desktop-meeting-detection/meetingPlatforms";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { useBooleanState } from "@/utils/states";
import { useRef, useState, type FC } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";

const MAX_VISIBLE = 8;

interface TriggerLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AppExclusionPickerProps {
  label: string;
  excludedApps: string[];
  onChangeExcludedApps: (apps: string[]) => void;
}

export const AppExclusionPicker: FC<AppExclusionPickerProps> = ({
  label,
  excludedApps,
  onChangeExcludedApps,
}) => {
  const theme = useTheme();
  const [isOpen, open, close] = useBooleanState();
  const [layout, setLayout] = useState<TriggerLayout | null>(null);
  const triggerRef = useRef<View>(null);

  const openWithLayout = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setLayout({ x, y, width, height });
      open();
    });
  };

  const removeApp = (app: string) => {
    onChangeExcludedApps(excludedApps.filter((a) => a !== app));
  };

  const toggleApp = (app: string) => {
    if (excludedApps.includes(app)) {
      onChangeExcludedApps(excludedApps.filter((a) => a !== app));
    } else {
      onChangeExcludedApps([...excludedApps, app]);
    }
  };

  const overflow =
    excludedApps.length > MAX_VISIBLE ? excludedApps.length - MAX_VISIBLE : 0;
  const visibleApps =
    overflow > 0 ? excludedApps.slice(0, MAX_VISIBLE) : excludedApps;

  return (
    <View style={styles.container(theme)}>
      <Text variant="body2Regular" color="textMuted">
        {label}
      </Text>

      <Pressable
        ref={triggerRef}
        onPress={openWithLayout}
        style={[styles.trigger(theme), isOpen && styles.triggerOpen(theme)]}
      >
        <View style={styles.pillsWrap}>
          {excludedApps.length === 0 ? (
            <Text variant="body2Regular" color="textHint">
              Select apps...
            </Text>
          ) : (
            <>
              {visibleApps.map((app) => (
                <View key={app} style={styles.pill(theme)}>
                  <Text variant="body3Regular" color="textSecondary">
                    {app}
                  </Text>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      removeApp(app);
                    }}
                    hitSlop={6}
                  >
                    <IconX
                      width={10}
                      height={10}
                      color={theme.colors.textMuted}
                    />
                  </Pressable>
                </View>
              ))}
              {overflow > 0 && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    openWithLayout();
                  }}
                  style={styles.pillOverflow(theme)}
                >
                  <Text variant="body3Regular" color="textSecondary">
                    +{overflow} others
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>
        <IconChevronDown
          width={16}
          height={16}
          color={theme.colors.textMuted}
        />
      </Pressable>

      {/* Dropdown to add/remove apps */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={close}
      >
        <Pressable style={styles.backdrop} onPress={close} />
        {layout && (
          <View
            style={[
              styles.dropdown,
              {
                top: layout.y + layout.height + 4,
                left: layout.x,
                width: layout.width,
              },
            ]}
          >
            <ScrollView
              style={styles.dropdownScroll}
              showsVerticalScrollIndicator={false}
            >
              {DETECTABLE_PLATFORM_NAMES.map((app) => {
                const selected = excludedApps.includes(app);
                return (
                  <Pressable
                    key={app}
                    onPress={() => toggleApp(app)}
                    // @ts-expect-error — hovered is valid on web/desktop
                    style={({ hovered }: { hovered?: boolean }) => [
                      styles.option,
                      hovered && styles.optionHover(theme),
                    ]}
                  >
                    <Text variant="body2Regular" color="textSecondary">
                      {app}
                    </Text>
                    {selected && (
                      <IconCheck
                        width={16}
                        height={16}
                        color={theme.colors.commandPrimaryDefault}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = createStyles({
  container: (theme) => ({
    flexDirection: "column",
    gap: 8,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.borderInteractiveDefault,
    paddingLeft: 16,
    marginTop: 4,
  }),
  trigger: (theme) => ({
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderInteractiveDefault,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.layerDefault,
  }),
  triggerOpen: (theme) => ({
    borderColor: theme.colors.commandPrimaryDefault,
  }),
  pillsWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.interactiveNeutral1Hover,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  }),
  pillOverflow: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.interactiveNeutral1Hover,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  }),
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dropdown: {
    position: "absolute",
    backgroundColor: DESKTOP_THEME.grey1000,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey800,
    shadowColor: DESKTOP_THEME.grey900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownScroll: {
    maxHeight: 240,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Hover,
  }),
});
