import {
  IconBookOpen,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconCopy,
  IconList,
  IconSparkles,
  IconStarPurple,
} from "@/assets/svg";
import { BottomSheetMenuModal } from "@/components/BottomSheet";
import type { MarkdownInstance } from "@/components/Markdown";
import { Markdown } from "@/components/Markdown";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { SummarySectionKey } from "@/constants";
import type { Meeting, MeetingSummarySection } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { copyAsHtml } from "@/utils/clipboard";
import { useBooleanState } from "@/utils/states";
import type { FC } from "react";
import { useCallback, useRef, useState } from "react";
import type { AccessibilityProps, LayoutChangeEvent } from "react-native";
import { TouchableOpacity, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { useExternalLinkHandler } from "../utils/external-link";
import { AiAppDialog } from "./AiAppDialog";

const sectionKeyIconMap: Record<string, FC<SvgProps> | undefined> = {
  [SummarySectionKey.OVERVIEW]: IconSparkles,
  [SummarySectionKey.ACTION_ITEMS]: IconCheck,
  [SummarySectionKey.OUTLINE]: IconBookOpen,
  [SummarySectionKey.SHORTHAND_BULLET]: IconList,
};

const HeaderButton: FC<
  {
    Icon: FC<SvgProps>;
    title: string;
    onPress: () => void;
  } & AccessibilityProps
> = ({ Icon, title, onPress, ...props }) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={styles.headerButton}
      onPress={onPress}
      aria-label={title}
      role="button"
      {...props}
    >
      <Icon
        width={20}
        height={20}
        strokeWidth={1.5}
        color={theme.colors.commandNeutralDefault}
      />
    </TouchableOpacity>
  );
};

export const SummarySection: FC<{
  section: MeetingSummarySection;
  meeting: Meeting;
  onCopyAll: () => void;
}> = ({ section, meeting, onCopyAll }) => {
  const markdownRef = useRef<MarkdownInstance>(null);

  const { key: sectionKey, title, isAiApp, value } = section;

  const [open, setOpen] = useState(true);
  const theme = useTheme();

  const [isOpenAiAppBanner, openAiAppBanner, closeAiAppBanner] =
    useBooleanState();

  const heightRef = useRef<number | null>(null);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    heightRef.current = Math.max(
      event.nativeEvent.layout.height,
      heightRef.current || 0,
    );
  }, []);

  const onToggle = () => {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  };

  const onCopy = () => {
    if (!markdownRef.current) return;
    const html = markdownRef.current.getHtml();

    copyAsHtml(html).then(
      () => {
        toast({
          message: "Copied to clipboard",
        });
      },
      (error) => {
        toast({
          title: "Failed to copy",
          message: error.message,
          type: "error",
        });
      },
    );
  };

  const onLinkPress = useExternalLinkHandler(meeting);

  const Icon = sectionKeyIconMap[sectionKey];

  const [isCopyMenuOpen, openCopyMenu, closeCopyMenu] = useBooleanState();

  return (
    <>
      <View>
        <View style={styles.sectionHeader}>
          <View style={styles.titleWrapper}>
            {Icon && (
              <Icon width={20} height={20} color={theme.colors.textPrimary} />
            )}
            <Text variant="title2Weight" numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            {isAiApp && (
              <TouchableOpacity
                style={styles.aiAppTag(theme)}
                onPress={openAiAppBanner}
              >
                <IconStarPurple />
                <Text variant="label3Weight" color="textBrand">
                  AI SKILL
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {open && (
            <HeaderButton
              Icon={IconCopy}
              title="Copy summary sections"
              onPress={openCopyMenu}
            />
          )}
          <HeaderButton
            Icon={open ? IconChevronUp : IconChevronDown}
            title={open ? "Collapse" : "Expand"}
            aria-expanded={open}
            aria-controls={`description-section-${sectionKey}`}
            onPress={onToggle}
          />
        </View>
        <View
          style={{
            overflow: "hidden",
            height: open ? "auto" : 0,
          }}
        >
          <View
            id={`description-section-${sectionKey}`}
            // role="region"
            aria-hidden={!open}
            onLayout={onLayout}
          >
            {value && (
              <Markdown
                ref={markdownRef}
                onLinkPress={onLinkPress}
                color="textSecondary"
              >
                {value}
              </Markdown>
            )}
          </View>
        </View>
      </View>
      <AiAppDialog
        isOpenAiAppBanner={isOpenAiAppBanner}
        closeAiAppBanner={closeAiAppBanner}
      />
      <BottomSheetMenuModal
        isOpen={isCopyMenuOpen}
        close={closeCopyMenu}
        items={[
          {
            label: `Copy "${title}"`,
            onPress: () => {
              closeCopyMenu();
              onCopy();
            },
          },
          {
            label: "Copy All",
            onPress: () => {
              closeCopyMenu();
              onCopyAll();
            },
          },
        ]}
      />
    </>
  );
};

const styles = createStyles({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    minHeight: 28,
    gap: 8,
  },
  headerButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  title: {
    flexShrink: 1,
    flexGrow: 0,
  },
  aiAppTag: (theme) => ({
    backgroundColor: theme.colors.layerBrandLight2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  }),
});
