import { LoadingScreen } from "@/components/Loading";
import { AI_MODELS } from "@/constants";
import {
  MeetingBottomSheetMenu,
  MEETING_SOURCE,
  ShareMeetingDialog,
} from "@/features/meeting";
import { PlayerComponent, PlayerComponentContainer } from "@/features/player";
import type { Caption } from "@/features/transcript";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useBooleanState } from "@/utils/states";
import type { Soundbite } from "@firefliesai/bites-ff.graphql-client";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { useIsFocused } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FC } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { InteractionManager, KeyboardAvoidingView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ParamList } from "../types";
import { AskFredChatModal, AskFredThreadProvider } from "@/features/ask-fred";
import { NotepadCreateSoundbiteDialog } from "./Bites/NotepadBitesCreateDialog";
import { NotepadBitesCreatedDialog } from "./Bites/NotepadBitesCreatedDialog";
import { NotepadScreenContext } from "./NotepadScreenContext";
import {
  LoadingNotepadScreenDesktopSidebar,
  LoadingNotepadScreenDesktopTranscript,
  NotepadScreenDesktopSidebar,
  NotepadScreenDesktopTranscript,
  notepadScreenDesktopNavigationOptions,
} from "./NotepadScreenDesktopComponents";
import {
  NotepadScreenMobileOverlays,
  NotepadScreenMobileTabs,
  notepadScreenMobileNavigationOptions,
} from "./NotepadScreenMobileComponents";
import { SmartSearchModal, type SmartSearchFilterState } from "./SmartSearch";
import { NotepadSummary } from "./Summary";
import { LoadingNotepadSummary } from "./Summary/NotepadSummary";
import {
  LoadingMeetingMetadata,
  MeetingMetadata,
} from "./components/MeetingMetadata";
import { layoutStyles } from "./styles";
import { processCaptionsForFilter } from "./utils/captions";
import { useNotepadPlayer } from "./utils/player";

export const NotepadScreenContent: FC<{
  meeting: Meeting;
  initialTime?: number;
  navigation: NativeStackScreenProps<ParamList, "Notepad">["navigation"];
}> = ({ meeting, navigation, initialTime }) => {
  useNotepadPlayer(meeting, initialTime);

  const [captions, setCaptions] = useState<Caption[] | undefined>(undefined);
  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
      if (!meeting.captions) return;
      // delay processing captions to avoid jank
      processCaptionsForFilter(meeting.captions, setCaptions);
    });
    return () => interaction.cancel();
  }, [meeting.captions]);

  const [isOpenShare, openShare, closeShare] = useBooleanState();
  const [isOpenMenu, openMenu, closeMenu] = useBooleanState();
  const [smartSearchFilter, setSmartSearchFilter] =
    useState<SmartSearchFilterState>({
      categories: null,
      sentiment: null,
      speakerIds: null,
    });
  const [createdBite, setCreatedBite] = useState<Soundbite | null>(null);
  const [videoHidden, setVideoHidden] = useState(false);
  const [aiModel, setAiModel] = useState(AI_MODELS[0].value);

  const [search, setSearch] = useState<string>("");

  const [mobileOverlay, setMobileOverlay] = useState<
    "search" | "thread" | "add-soundbite" | null
  >(null);

  const [
    isOpenCreateSoundbiteModal,
    openCreateSoundbiteModal,
    closeCreateSoundbiteModal,
  ] = useBooleanState();

  const [isOpenAskFredModal, openAskFredModal, closeAskFredModal] =
    useBooleanState();

  const [isOpenSmartSearchModal, openSmartSearchModal, closeSmartSearchModal] =
    useBooleanState();

  const theme = useTheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: meeting.title,
      ...(theme.breakpoint === Breakpoint.Small
        ? notepadScreenMobileNavigationOptions({
            mobileOverlay,
            setMobileOverlay,
            openShare,
            openMenu,
            setSearch,
            meeting,
          })
        : notepadScreenDesktopNavigationOptions({
            meeting,
            openShare,
            openMenu,
            openCreateSoundbiteModal,
          })),
    });
  }, [
    navigation,
    meeting,
    theme.breakpoint,
    mobileOverlay,
    openShare,
    openMenu,
    openCreateSoundbiteModal,
  ]);

  const isFocused = useIsFocused();

  const trackedViewingTranscript = useRef(false);
  const trackedViewingBites = useRef(false);

  const trackViewingFeature = useCallback(
    (feature: "transcript" | "bites") => {
      if (feature === "transcript" && !trackedViewingTranscript.current) {
        tracker.track(TRACKING_EVENTS.PERSON_VIEWING_TRANSCRIPT, {
          transcriptId: meeting.id,
        });
        trackedViewingTranscript.current = true;
      }

      if (feature === "bites" && !trackedViewingBites.current) {
        tracker.track(TRACKING_EVENTS.MEETING_BITES_VIEWED, {
          transcriptId: meeting.id,
        });
        trackedViewingBites.current = true;
      }
    },
    [meeting.id],
  );

  return (
    <AskFredThreadProvider meetingId={meeting.id}>
      <NotepadScreenContext.Provider
        value={{
          meeting,
          captions,
          search,
          setSearch,
          isOpenShare,
          openShare,
          closeShare,
          isOpenMenu,
          openMenu,
          closeMenu,
          createdBite,
          setCreatedBite,
          isOpenCreateSoundbiteModal,
          openCreateSoundbiteModal,
          closeCreateSoundbiteModal,
          isOpenAskFredModal,
          openAskFredModal,
          closeAskFredModal,
          aiModel,
          setAiModel,
          mobileOverlay,
          setMobileOverlay,
          smartSearchFilter,
          setSmartSearchFilter,
          isOpenSmartSearchModal,
          openSmartSearchModal,
          closeSmartSearchModal,
          videoHidden,
          isFocused,
          trackViewingFeature,
        }}
      >
        <SafeAreaView style={styles.root(theme)} edges={["bottom"]}>
          {theme.breakpoint !== Breakpoint.Small && (
            <NotepadScreenDesktopSidebar />
          )}
          <View style={styles.main(theme)}>
            {meeting.addedBy !== MEETING_SOURCE.DESKTOP_RECORD &&
              (!!meeting.audio_url || !!meeting.video_url) && (
                <PlayerComponentContainer videoHidden={videoHidden}>
                  {isFocused && (
                    <PlayerComponent
                      videoHidden={videoHidden}
                      setVideoHidden={setVideoHidden}
                    />
                  )}
                </PlayerComponentContainer>
              )}
            <View style={styles.wrapper}>
              <View style={styles.content} aria-hidden={!!mobileOverlay}>
                {!videoHidden && <MeetingMetadata meeting={meeting} />}
                {theme.breakpoint === Breakpoint.Small ? (
                  <NotepadScreenMobileTabs />
                ) : (
                  <NotepadSummary meeting={meeting} />
                )}
              </View>
              <NotepadScreenMobileOverlays navigation={navigation} />
            </View>
          </View>
          {theme.breakpoint === Breakpoint.Large && (
            <KeyboardAvoidingView style={layoutStyles.sideLarge(theme)}>
              <NotepadScreenDesktopTranscript />
            </KeyboardAvoidingView>
          )}
        </SafeAreaView>
        <ShareMeetingDialog
          meetingId={meeting.id}
          meeting={meeting}
          isOpen={isOpenShare}
          close={closeShare}
        />
        <MeetingBottomSheetMenu
          isOpen={isOpenMenu}
          close={closeMenu}
          meeting={meeting}
          onDelete={() => navigation.goBack()}
          showDownload
          fromRef="notepad"
        />
        <NotepadBitesCreatedDialog
          createdBite={createdBite}
          setCreatedBite={setCreatedBite}
          meeting={meeting}
        />
        {/** Start Desktop */}
        <NotepadCreateSoundbiteDialog
          isOpen={isOpenCreateSoundbiteModal}
          close={closeCreateSoundbiteModal}
          meeting={meeting}
          captions={captions}
          setCreatedBite={setCreatedBite}
        />
        {/** End Desktop */}
        {/** Start Mobile */}
        <AskFredChatModal
          meeting={meeting}
          isOpen={isOpenAskFredModal}
          close={closeAskFredModal}
        />
        <SmartSearchModal
          meeting={meeting}
          isOpen={isOpenSmartSearchModal}
          close={closeSmartSearchModal}
          smartSearchFilter={smartSearchFilter}
          setSmartSearchFilter={setSmartSearchFilter}
        />
        {/** End Mobile */}
      </NotepadScreenContext.Provider>
    </AskFredThreadProvider>
  );
};

export const NotepadScreenContentLoading: FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.root(theme)}>
      {theme.breakpoint !== Breakpoint.Small && (
        <LoadingNotepadScreenDesktopSidebar />
      )}
      <View style={styles.main(theme)}>
        <PlayerComponentContainer>
          <LoadingScreen />
        </PlayerComponentContainer>
        <LoadingMeetingMetadata />
        <LoadingNotepadSummary />
      </View>
      {theme.breakpoint === Breakpoint.Large && (
        <View style={layoutStyles.sideLarge(theme)}>
          <LoadingNotepadScreenDesktopTranscript />
        </View>
      )}
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    flexDirection:
      theme.breakpoint === Breakpoint.Medium ? "row-reverse" : "row",
    borderTopColor: theme.colors.borderStaticSubtle,
    borderTopWidth: 1,
  }),
  main: (theme) => ({
    borderRightWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    ...(theme.breakpoint === Breakpoint.Large && { borderLeftWidth: 1 }),
    flex: 1,
  }),
  wrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
    overflow: "hidden",
  },
});
