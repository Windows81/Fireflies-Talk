// Dropdown.tsx
import {
  IconChevronDown,
  IconChevronUp,
  IconHeadphone,
  IconSparkles,
} from "@/assets/svg";
import { createStyles, useTheme } from "@/styles";
import { BlurView } from "expo-blur";
import { useMemo, useRef, useState } from "react";
import {
  View,
  Modal,
  Pressable,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle,
  type LayoutRectangle,
} from "react-native";
import * as NativeCode from "modules/native-code";
import { useLiveScreenContext } from "../Context/LiveScreenContext";
import { Button, useWebHover } from "@/components/Button";
import { useKnowledgebase } from "src/hooks/useKnowledgebase";
import { KnowledgebaseSelector } from "./KnowledgebaseSelector";
import { Config } from "@/constants";
import type { AssistMode } from "src/features/live/types";
import { ASSIST_MODES } from "src/features/live/types";
import { Text } from "@/components/Typography";
import { HoverTooltip } from "@/components/HoverTooltip";
import { MEETING_SOURCE } from "@/features/meeting";
import { TRACKING_EVENTS, tracker } from "@/tracking";

type Option = {
  label: string;
  description?: string;
  value: string;
  icon?: React.FC<{
    width?: number;
    height?: number;
    stroke?: string;
    fill?: string;
    color?: string;
  }>;
};

const options: Option[] = [
  { label: "General Assist", value: ASSIST_MODES.GENERAL, icon: IconSparkles },
  {
    label: "Sales Assist",
    value: ASSIST_MODES.SALES,
    icon: IconHeadphone,
  },
];

type DropdownProps = {
  options: Option[];
  selected?: Option | null;
  onSelect: (opt: Option) => void;
  triggerStyle?: ViewStyle;
  triggerTextStyle?: TextStyle;
  menuStyle?: ViewStyle;
  menuItemStyle?: ViewStyle;
  menuItemTextStyle?: TextStyle;
  offset?: number;
  onToggleKnowledgebaseSelector?: (toggle: boolean) => void;
  isCompactMode?: boolean;
  disabledValues?: Set<string>;
  disabledTooltips?: Record<string, string>;
};

const DropdownItem = ({
  opt,
  onPress,
  onOpenKBSelector,
  menuItemStyle,
  menuItemTextStyle,
  isSelected,
  disabled,
  disabledTooltip,
}: {
  opt: Option;
  isSelected: boolean;
  onPress: (opt: Option) => void;
  onOpenKBSelector: () => void;
  menuItemStyle?: ViewStyle;
  menuItemTextStyle?: TextStyle;
  disabled?: boolean;
  disabledTooltip?: string;
}) => {
  const { isHovered: isHoveredTrigger, webHoverProps: webHoverPropsTrigger } =
    useWebHover();
  const { knowledgeBases } = useLiveScreenContext();
  const { data: knowledgeBaseList } = useKnowledgebase();

  const theme = useTheme();

  const getIconStyles = (opt: Option) => {
    if (opt.value === ASSIST_MODES.SALES) {
      return {
        width: 17,
        height: 17,
        color: theme.colors.informationStaticYellowSolid,
        stroke: theme.colors.informationStaticYellowSolid,
        strokeWidth: 1.25,
      };
    } else if (opt.value === ASSIST_MODES.GENERAL) {
      return {
        width: 17,
        height: 17,
        color: theme.colors.rainbowStaticCyanSolid,
      };
    }
    return {
      width: 17,
      height: 17,
      color: theme.colors.textMuted,
    };
  };
  const Icon = opt.icon || null;

  const buttonPrps = useMemo(() => {
    if (opt.value !== ASSIST_MODES.SALES) return {};

    if (!knowledgeBaseList?.length) {
      return {
        description: "Add knowledge base to use.",
        cta: "Upload",
        onClick: () => {
          NativeCode.openInBrowser(
            `${Config.DASHBOARD_URL}/settings#KnowledgeBase`,
          );
        },
      };
    } else if (!knowledgeBases.length && knowledgeBaseList?.length) {
      return {
        description: "Select knowledge base for\npersonalized suggestion.",
        cta: "Select",
        onClick: () => {
          onOpenKBSelector();
        },
      };
    } else if (knowledgeBases.length && knowledgeBaseList?.length)
      return {
        description: `${knowledgeBases.length} Knowledge ${knowledgeBases.length > 1 ? "bases" : "base"} selected`,
        cta: "Edit",
        onClick: () => {
          onOpenKBSelector();
        },
      };
  }, [knowledgeBaseList?.length, knowledgeBases.length, onOpenKBSelector, opt]);

  const content = (
    <Pressable
      {...webHoverPropsTrigger}
      onPress={disabled ? undefined : () => onPress(opt)}
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.menuItem,
        menuItemStyle,
        !disabled && pressed && styles.menuItemPressed(theme),
        !disabled &&
          (isHoveredTrigger || isSelected) &&
          styles.menuItemHovered(theme),
        disabled && styles.menuItemDisabled,
      ]}
    >
      <View style={styles.menuItemIconContainer}>
        {Icon && <Icon {...getIconStyles(opt)} />}
        <View style={styles.menuItemTextContainer}>
          <Text
            variant="body2Regular"
            style={[menuItemTextStyle, disabled && styles.menuItemTextDisabled]}
          >
            {opt.label}
          </Text>
          {!disabled && (
            <Text
              variant="body3Regular"
              color="commandNeutralDisabled"
              style={[menuItemTextStyle]}
            >
              {buttonPrps?.description}
            </Text>
          )}
        </View>
      </View>
      {!disabled && buttonPrps?.onClick && (
        <Button variant="transparentNeutral" onPress={buttonPrps?.onClick}>
          {buttonPrps?.cta}
        </Button>
      )}
    </Pressable>
  );

  if (disabled && disabledTooltip) {
    return (
      <HoverTooltip label={disabledTooltip} position="bottom" align="start">
        {content}
      </HoverTooltip>
    );
  }

  return content;
};

export default function Dropdown({
  options,
  selected = null,
  onSelect,
  triggerStyle,
  triggerTextStyle,
  menuStyle,
  menuItemStyle,
  menuItemTextStyle,
  offset = 8,
  onToggleKnowledgebaseSelector,
  isCompactMode = false,
  disabledValues,
  disabledTooltips,
}: DropdownProps) {
  const triggerRef = useRef<View | null>(null);
  const theme = useTheme();
  const { data: knowledgeBaseList } = useKnowledgebase();
  const { knowledgeBases, setKnowledgeBases, assistMode } =
    useLiveScreenContext();
  const [selectedOption, setSelectedOption] = useState<Option | null>(selected);
  const [openKnowledgebaseSelector, setOpenKnowledgebaseSelector] =
    useState(false);

  const [visible, setVisible] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState<LayoutRectangle | null>(
    null,
  );

  const openKnowledgebaseSelectorModal = () => {
    close();
    setOpenKnowledgebaseSelector(true);
    onToggleKnowledgebaseSelector?.(true);
  };

  const closeKnowledgebaseSelector = () => {
    setOpenKnowledgebaseSelector(false);
    onToggleKnowledgebaseSelector?.(false);
  };

  const openSettingsPage = () => {
    NativeCode.openInBrowser(`${Config.DASHBOARD_URL}/settings#KnowledgeBase`);
  };

  const open = () => {
    if (!triggerRef.current) return;
    requestAnimationFrame(() => {
      if (triggerRef.current) {
        triggerRef.current.measureInWindow(
          (x: number, y: number, width: number, height: number) => {
            setTriggerLayout({ x, y, width, height });
            setVisible(true);
          },
        );
      }
    });
  };

  const close = () => {
    setVisible(false);
    setTriggerLayout(null);
  };

  const handleSelect = (opt: Option) => {
    const isSalesMode = opt.value === ASSIST_MODES.SALES;
    const isCurrentlySales = assistMode === ASSIST_MODES.SALES;
    const hasKBSelected = knowledgeBases.length > 0;
    const hasKBToSelect = Number(knowledgeBaseList?.length) > 0;

    // If selecting the same option, just close
    if (opt.value === selectedOption?.value) {
      close();
      return;
    }

    // If Sales mode and no KB to select, redirect to dashboard
    if (isSalesMode && !hasKBToSelect) {
      openSettingsPage();
      close();
      return;
    }

    // If Sales mode and (no KB selected OR currently in Sales mode), open KB selector
    if (isSalesMode && (!hasKBSelected || isCurrentlySales)) {
      setSelectedOption(opt);
      openKnowledgebaseSelectorModal();
      close();
      return;
    }

    // Otherwise, select the mode normally
    setSelectedOption(opt);
    onSelect(opt);
    close();
  };

  const Icon = selected?.icon || null;

  return (
    <>
      {openKnowledgebaseSelector && isCompactMode ? null : (
        <>
          <TouchableOpacity
            ref={triggerRef}
            onPress={open}
            accessibilityRole="button"
            activeOpacity={0.8}
            style={[styles.trigger, triggerStyle]}
          >
            {Icon && (
              <Icon
                width={12}
                height={12}
                stroke={theme.colors.layerContrast}
                color={theme.colors.layerContrast}
              />
            )}
            <Text style={[styles.triggerText(theme), triggerTextStyle]}>
              {selected?.label ?? "Select"}
            </Text>
            <View style={styles.chevronContainer}>
              {visible && (
                <IconChevronUp
                  width={12}
                  height={12}
                  color={theme.colors.layerContrast}
                />
              )}
              {!visible && (
                <IconChevronDown
                  width={12}
                  height={12}
                  color={theme.colors.layerContrast}
                />
              )}
            </View>
          </TouchableOpacity>

          <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={close}
          >
            <Pressable
              style={styles.overlay}
              onPress={close}
              nativeID="no-drag"
            />

            {triggerLayout && (
              <BlurView
                intensity={100}
                tint={
                  theme.name === "light" ? "light" : "systemThickMaterialDark"
                }
                style={[
                  styles.menuContainer(theme),
                  {
                    left: triggerLayout.x,
                    top: triggerLayout.y + triggerLayout.height + offset,
                  },
                ]}
              >
                <View style={[styles.menu(theme), menuStyle]}>
                  {options.map((opt) => (
                    <DropdownItem
                      key={opt.value}
                      opt={opt}
                      onPress={handleSelect}
                      onOpenKBSelector={openKnowledgebaseSelectorModal}
                      menuItemStyle={menuItemStyle}
                      menuItemTextStyle={menuItemTextStyle}
                      isSelected={selectedOption?.value === opt.value}
                      disabled={disabledValues?.has(opt.value)}
                      disabledTooltip={disabledTooltips?.[opt.value]}
                    />
                  ))}
                </View>
              </BlurView>
            )}
          </Modal>
        </>
      )}
      <KnowledgebaseSelector
        isOpen={openKnowledgebaseSelector}
        onClose={closeKnowledgebaseSelector}
        isCompactMode={isCompactMode}
        onUse={(selectedIds: string[]) => {
          setKnowledgeBases(selectedIds);
          tracker.track(TRACKING_EVENTS.KNOWLEDGE_BASE_SELECTED, {
            kbCount: selectedIds.length,
          });
          // If we're selecting Sales mode and KBs are selected, now select the mode
          if (selectedIds.length > 0) {
            const salesOption = options.find(
              (opt) => opt.value === ASSIST_MODES.SALES,
            ) as Option;
            onSelect(salesOption);
            setSelectedOption(salesOption);
          }
          closeKnowledgebaseSelector();
          setVisible(false);
        }}
      />
    </>
  );
}

const styles = createStyles({
  selectorRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "space-between",
  },
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  feedbackButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  triggerText: (theme) => ({
    color: theme.colors.textMuted,
    fontSize: 14,
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: -0.16,
  }),
  menuItemHovered: (theme) => ({
    backgroundColor: theme.colors.borderStaticPage,
  }),
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chevronContainer: {
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  menuContainer: (theme) => ({
    position: "absolute",
    border: `1px solid ${theme.colors.interactiveSecondaryDisabled}`,
    borderRadius: 8,
    background: theme.colors.interactiveSecondaryDisabled,
  }),
  menu: (theme) => ({
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.interactiveSecondaryDisabled,
    overflow: "hidden",
    border: `1px solid ${theme.colors.interactiveSecondaryDisabled}`,
    background: theme.colors.interactiveSecondaryDisabled,
    zIndex: 1000,
    width: 280,
    paddingVertical: 4,
    paddingHorizontal: 0,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  }),
  menuItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    alignSelf: "stretch",
    justifyContent: "space-between",
  },
  menuItemPressed: (theme) => ({
    backgroundColor: theme.colors.borderStaticPage,
  }),
  menuItemText: (theme) => ({
    color: theme.colors.textMuted,
  }),
  menuItemDescription: (theme) => ({
    color: theme.colors.commandNeutralDisabled,
    textAlign: "left",
  }),
  menuItemIconContainer: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  menuItemTextContainer: {
    flexDirection: "column",
    gap: 4,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemTextDisabled: {
    opacity: 0.7,
  },
});

const IS_SALES_ASSIST_AVAILABLE = true;

export const AssistModeSelector = ({
  onToggleKnowledgebaseSelector,
  isCompactMode = false,
  showCreditsHint = true,
}: {
  onToggleKnowledgebaseSelector?: (toggle: boolean) => void;
  isCompactMode?: boolean;
  showCreditsHint?: boolean;
}) => {
  const { assistMode, setAssistMode, meeting, knowledgeBases } =
    useLiveScreenContext();
  const theme = useTheme();
  const [selected, setSelected] = useState<Option | null>(
    options.find((opt) => opt.value === assistMode) || null,
  );

  const isDesktopRecord = meeting?.addedBy === MEETING_SOURCE.DESKTOP_RECORD;

  const disabledValues = useMemo(
    () => (isDesktopRecord ? new Set([ASSIST_MODES.SALES]) : undefined),
    [isDesktopRecord],
  );

  const disabledTooltips = useMemo(
    () =>
      isDesktopRecord
        ? {
            [ASSIST_MODES.SALES]:
              "System audio meetings don't support Sales Assist",
          }
        : undefined,
    [isDesktopRecord],
  );

  return (
    <View style={styles.selectorRow}>
      {IS_SALES_ASSIST_AVAILABLE ? (
        <Dropdown
          options={options}
          selected={selected}
          onToggleKnowledgebaseSelector={onToggleKnowledgebaseSelector}
          isCompactMode={isCompactMode}
          disabledValues={disabledValues}
          disabledTooltips={disabledTooltips}
          onSelect={(opt) => {
            setSelected(opt);
            setAssistMode(opt.value as AssistMode);
            if (opt.value === ASSIST_MODES.SALES) {
              tracker.track(TRACKING_EVENTS.SALES_ASSIST_SWITCHED, {
                isKBSelected: knowledgeBases.length > 0,
                kbCount: knowledgeBases.length,
              });
            }
          }}
        />
      ) : (
        <Text style={[styles.triggerText(theme)]}>Live Assist</Text>
      )}
      {showCreditsHint && (
        <Text fontSize={12} color="commandNeutralDisabled">
          Consumes AI credits
        </Text>
      )}
    </View>
  );
};
