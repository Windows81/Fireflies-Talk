import {
  IconFileText,
  IconFred,
  IconMessageCircle,
  IconPlus,
  IconSmartSearch,
  IconSoundbite,
} from "@/assets/svg";
import { HoverTooltip } from "@/components/HoverTooltip";
import { KeyboardAvoidingView, SectionHeader } from "@/components/Layout";
import { Text } from "@/components/Typography";
import { usePaywallConfig } from "@/features/billing";
import { useMeetingPrivacyOptions } from "@/features/meeting";
import type { Meeting } from "@/graphql";
import { Breakpoint, createStyles, useTheme, vars } from "@/styles";
import { useBooleanState } from "@/utils/states";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState, type FC } from "react";
import { TouchableOpacity, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { NotepadAskFred, AskFredAiModelSelect } from "@/features/ask-fred";
import { NotepadBites } from "./Bites";
import { useNotepadScreenContext } from "./NotepadScreenContext";
import { SmartSearchButton } from "./SmartSearch";
import {
  LoadingSmartSearch,
  NotepadSmartSearch,
  SmartSearchModal,
} from "./SmartSearch/SmartSearch";
import { NotepadThread } from "./Thread";
import {
  NotepadTranscript,
  NotepadTranscriptNoCaptions,
  TranscriptSearchHeader,
} from "./Transcript";
import { LoadingNotepadTranscript } from "./Transcript/NotepadTranscript";
import { HeaderRightDesktop } from "./components/Header";
import { layoutStyles } from "./styles";
import { MEETING_SOURCE } from "@/features/meeting";

export const notepadScreenDesktopNavigationOptions = ({
  meeting,
  openShare,
  openMenu,
  openCreateSoundbiteModal,
}: {
  meeting: Meeting;
  openShare: () => void;
  openMenu: () => void;
  openCreateSoundbiteModal: () => void;
}): NativeStackNavigationOptions => ({
  headerTitle({ children }) {
    return (
      <HeaderTitleDesktop meeting={meeting} openShare={openShare}>
        {children}
      </HeaderTitleDesktop>
    );
  },
  headerRight: () => (
    <HeaderRightDesktop
      meeting={meeting}
      openShare={openShare}
      openMenu={openMenu}
      openCreateSoundbite={openCreateSoundbiteModal}
    />
  ),
});

export const DesktopNotepadTranscript: FC = () => {
  const {
    meeting,
    smartSearchFilter,
    setSmartSearchFilter,
    search,
    setSearch,
    captions,
    trackViewingFeature,
  } = useNotepadScreenContext();

  const _setSearch = useCallback(
    (newSearch: string) => {
      // TODO: we currently not support filter both search and smart search
      setSmartSearchFilter({
        categories: null,
        sentiment: null,
        speakerIds: null,
      });
      setSearch(newSearch);
    },
    [setSmartSearchFilter, setSearch],
  );

  useEffect(() => {
    trackViewingFeature("transcript");
  }, [trackViewingFeature]);

  if (!meeting.captions?.length) {
    return <NotepadTranscriptNoCaptions meeting={meeting} />;
  }

  if (!meeting.captions.length) {
    return <NotepadTranscriptNoCaptions meeting={meeting} />;
  }

  if (!captions) {
    return <LoadingNotepadTranscript />;
  }

  return (
    <>
      <TranscriptSearchHeader search={search} setSearch={_setSearch} />
      <NotepadTranscript
        meeting={meeting}
        smartSearchFilter={smartSearchFilter}
        search={search}
        captions={captions}
        mediaDisabled={
          meeting.addedBy === MEETING_SOURCE.DESKTOP_RECORD ||
          (!meeting.audio_url && !meeting.video_url)
        }
      />
    </>
  );
};

const SidebarButton: FC<{
  title: string;
  Icon: FC<SvgProps>;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}> = ({ title, Icon, onPress, active, disabled }) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={[
        styles.sidebarButton,
        active && !disabled && styles.sidebarButtonActive(theme),
        disabled && styles.sidebarButtonDisabled,
      ]}
      aria-label={title}
      aria-disabled={disabled}
      role="button"
    >
      <Icon
        color={
          disabled
            ? theme.colors.commandNeutralDisabled
            : active
              ? theme.colors.commandPrimaryDefault
              : theme.colors.commandNeutralDefault
        }
        width={20}
        height={20}
      />
    </TouchableOpacity>
  );
};

const AskFredSidebarButton: FC<{
  onPress: () => void;
  active?: boolean;
}> = ({ onPress, active }) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.sidebarButton]}
      aria-label="AskFred"
      role="button"
    >
      <LinearGradient
        colors={["#997DFF", "#D89AFF"]}
        style={styles.askFredButtonGradient}
      >
        <View
          style={[
            styles.askFredButtonInner,
            active && styles.sidebarButtonActive(theme),
          ]}
        >
          <IconFred width={20} height={20} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const NotepadScreenDesktopSidebar: FC = () => {
  const {
    meeting,
    smartSearchFilter,
    setSmartSearchFilter,
    openCreateSoundbiteModal,
    aiModel,
    setAiModel,
    trackViewingFeature,
  } = useNotepadScreenContext();

  const theme = useTheme();

  const [currentSidebar, setCurrentSidebar] = useState<
    "smart-search" | "soundbite" | "thread" | "transcript" | "ask-fred"
  >(() => {
    if (theme.breakpoint === Breakpoint.Large) {
      return "smart-search";
    }
    return "transcript";
  });

  const [
    isOpenSmartSearchFilterModal,
    openSmartSearchFilterModal,
    closeSmartSearchFilterModal,
  ] = useBooleanState();

  useEffect(() => {
    // if user moves from large to small, and if they were on the transcript
    // we need to reset the sidebar to smart search
    if (theme.breakpoint === Breakpoint.Large) {
      setCurrentSidebar("smart-search");
      closeSmartSearchFilterModal();
    } else {
      setCurrentSidebar("transcript");
    }
  }, [theme.breakpoint, closeSmartSearchFilterModal]);

  const { hidePaidFeatures } = usePaywallConfig();

  return (
    <>
      <View style={layoutStyles.sideTabs(theme)}>
        {!hidePaidFeatures && (
          <AskFredSidebarButton
            onPress={() => setCurrentSidebar("ask-fred")}
            active={currentSidebar === "ask-fred"}
          />
        )}
        {theme.breakpoint !== Breakpoint.Large && (
          <SidebarButton
            title="Transcript"
            Icon={IconFileText}
            onPress={() => setCurrentSidebar("transcript")}
            active={currentSidebar === "transcript"}
          />
        )}
        {theme.breakpoint === Breakpoint.Large && !hidePaidFeatures && (
          <SidebarButton
            title="Smart search"
            Icon={IconSmartSearch}
            onPress={() => setCurrentSidebar("smart-search")}
            active={currentSidebar === "smart-search"}
          />
        )}
        <HoverTooltip
          label={
            meeting.addedBy === MEETING_SOURCE.DESKTOP_RECORD
              ? "Soundbites are not available for system recording"
              : undefined
          }
          position="bottom"
          align="start"
        >
          <SidebarButton
            title="Soundbites"
            Icon={IconSoundbite}
            onPress={() => {
              setCurrentSidebar("soundbite");
              trackViewingFeature("bites");
            }}
            active={currentSidebar === "soundbite"}
            disabled={meeting.addedBy === MEETING_SOURCE.DESKTOP_RECORD}
          />
        </HoverTooltip>
        <SidebarButton
          title="Comments"
          Icon={IconMessageCircle}
          onPress={() => setCurrentSidebar("thread")}
          active={currentSidebar === "thread"}
        />
      </View>
      <KeyboardAvoidingView style={layoutStyles.side(theme)}>
        {currentSidebar === "ask-fred" && (
          <>
            <SectionHeader
              title="AskFred"
              right={
                <AskFredAiModelSelect
                  aiModel={aiModel}
                  setAiModel={setAiModel}
                />
              }
            />
            <NotepadAskFred meeting={meeting} />
          </>
        )}
        {currentSidebar === "transcript" && (
          <>
            <SectionHeader title="Transcript" />
            <DesktopNotepadTranscript />
            {!hidePaidFeatures && (
              <View style={styles.fabs}>
                <SmartSearchButton
                  onPress={openSmartSearchFilterModal}
                  smartSearchFilter={smartSearchFilter}
                />
              </View>
            )}
          </>
        )}
        {currentSidebar === "smart-search" && (
          <>
            <SectionHeader title="Smart search" />
            <NotepadSmartSearch
              meeting={meeting}
              smartSearchFilter={smartSearchFilter}
              setSmartSearchFilter={setSmartSearchFilter}
              hasNoCaption={!meeting.captions?.length}
            />
          </>
        )}
        {currentSidebar === "soundbite" && (
          <>
            <SectionHeader
              title="Soundbites"
              right={
                <TouchableOpacity
                  aria-label="Create Soundbite"
                  onPress={openCreateSoundbiteModal}
                  role="button"
                >
                  <IconPlus
                    width={20}
                    height={20}
                    color={theme.colors.commandPrimaryDefault}
                  />
                </TouchableOpacity>
              }
            />
            <NotepadBites
              meeting={meeting}
              openCreateSoundbite={openCreateSoundbiteModal}
            />
          </>
        )}
        {currentSidebar === "thread" && (
          <>
            <SectionHeader title="Comments" />
            <NotepadThread meeting={meeting} />
          </>
        )}
      </KeyboardAvoidingView>
      <SmartSearchModal
        meeting={meeting}
        isOpen={isOpenSmartSearchFilterModal}
        close={closeSmartSearchFilterModal}
        smartSearchFilter={smartSearchFilter}
        setSmartSearchFilter={setSmartSearchFilter}
      />
    </>
  );
};

export const LoadingNotepadScreenDesktopSidebar: FC = () => {
  const theme = useTheme();

  return (
    <>
      <View style={layoutStyles.sideTabs(theme)}></View>
      <View style={layoutStyles.side(theme)}>
        {theme.breakpoint === Breakpoint.Large ? (
          <>
            <SectionHeader title="Smart search" />
            <LoadingSmartSearch />
          </>
        ) : (
          <>
            <SectionHeader title="Transcript" />
            <LoadingNotepadTranscript />
          </>
        )}
      </View>
    </>
  );
};

export const NotepadScreenDesktopTranscript: FC = () => {
  return (
    <>
      <SectionHeader title="Transcript" />
      <DesktopNotepadTranscript />
    </>
  );
};

export const LoadingNotepadScreenDesktopTranscript: FC = () => {
  return (
    <>
      <SectionHeader title="Transcript" />
      <LoadingNotepadTranscript />
    </>
  );
};

const HeaderTitleDesktop: FC<{
  children: string;
  meeting: Meeting;
  openShare: () => void;
}> = ({ children, meeting, openShare }) => {
  const theme = useTheme();
  const privacyOptions = useMeetingPrivacyOptions();

  const MEETING_PRIVACY_OPTION = privacyOptions.find(
    (option) => option.value === meeting.notesPrivacy,
  );

  return (
    <View style={styles.headerTitle}>
      <Text variant="title3Regular" color="commandNeutralDefault">
        {children}
      </Text>
      {MEETING_PRIVACY_OPTION?.Icon && (
        <TouchableOpacity
          aria-label={`Meeting privacy: ${MEETING_PRIVACY_OPTION.label}`}
          onPress={openShare}
          role="button"
        >
          <MEETING_PRIVACY_OPTION.Icon
            width={14}
            height={14}
            color={theme.colors.textMuted}
            strokeWidth={3}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = createStyles({
  sidebarButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  sidebarButtonActive: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryDefault,
  }),
  sidebarButtonDisabled: {
    opacity: 0.4,
  },
  headerTitle: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  askFredButtonGradient: {
    width: "100%",
    height: "100%",
    padding: 1.13,
  },
  askFredButtonInner: {
    borderRadius: 4,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: vars.colors.purple25,
  },
  fabs: {
    position: "absolute",
    bottom: 16,
    right: 16,
    gap: 12,
  },
});
