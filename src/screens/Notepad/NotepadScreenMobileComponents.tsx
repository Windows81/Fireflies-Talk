import { Button } from "@/components/Button";
import { MessageView } from "@/components/Message";
import { Tabs } from "@/components/Tabs";
import { AskFredButton } from "@/features/ask-fred";
import { openLoginPopup, useAuth } from "@/features/auth";
import { usePaywallConfig } from "@/features/billing";
import type { Meeting } from "@/graphql";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type {
  NativeStackNavigationOptions,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import type { Dispatch, FC, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import type { ParamList } from "../types";
import { NotepadBites } from "./Bites";
import {
  AddSoundbiteButton,
  NotepadCreateSoundbite,
} from "./Bites/NotepadBitesCreateDialog";
import { useNotepadScreenContext } from "./NotepadScreenContext";
import { SmartSearchButton } from "./SmartSearch";
import { NotepadSummary } from "./Summary";
import { NotepadThread } from "./Thread";
import { NotepadTranscript, NotepadTranscriptNoCaptions } from "./Transcript";
import { LoadingNotepadTranscript } from "./Transcript/NotepadTranscript";
import { HeaderRight } from "./components/Header";
import { NotepadContentOverlay } from "./components/NotepadContentOverlay";
import { SearchInputHeader } from "./components/SearchInputHeader";
import { MEETING_SOURCE } from "@/features/meeting";

export const notepadScreenMobileNavigationOptions = ({
  mobileOverlay,
  setMobileOverlay,
  openShare,
  openMenu,
  setSearch,
  meeting,
}: {
  mobileOverlay: "search" | "thread" | "add-soundbite" | null;
  setMobileOverlay: Dispatch<
    SetStateAction<"search" | "thread" | "add-soundbite" | null>
  >;
  openShare: () => void;
  openMenu: () => void;
  setSearch: (search: string) => void;
  meeting: Meeting;
}): NativeStackNavigationOptions => ({
  // we actually cannot return null
  // because it will default to showing the title
  headerTitle: () => <View />,
  headerRight: () => (
    <HeaderRightMobile
      overlay={mobileOverlay}
      setOverlay={setMobileOverlay}
      openShare={openShare}
      openMenu={openMenu}
      setSearch={setSearch}
      meeting={meeting}
    />
  ),
});

const HeaderRightMobile: FC<{
  overlay: "search" | "thread" | "add-soundbite" | null;
  setOverlay: Dispatch<
    SetStateAction<"search" | "thread" | "add-soundbite" | null>
  >;
  openShare: () => void;
  openMenu: () => void;
  setSearch: (search: string) => void;
  meeting: Meeting;
}> = ({ overlay, setOverlay, openShare, openMenu, setSearch, meeting }) => {
  if (overlay === "search") {
    return <SearchInputHeader setSearch={setSearch} meeting={meeting} />;
  }
  return (
    <HeaderRight
      meeting={meeting}
      setOverlay={setOverlay}
      openShare={openShare}
      openMenu={openMenu}
    />
  );
};

enum TabName {
  Summary = "summary",
  Transcript = "transcript",
  Bites = "bites",
}

export const NotepadScreenMobileTabs: FC = () => {
  const {
    mobileOverlay,
    setMobileOverlay,
    meeting,
    captions,
    smartSearchFilter,
    openSmartSearchModal,
    openAskFredModal,
    trackViewingFeature,
  } = useNotepadScreenContext();

  const [uncontrolledTab, setUncontrolledTab] = useState<string>(
    TabName.Summary,
  );
  const { hidePaidFeatures } = usePaywallConfig();
  const { user } = useAuth();

  useEffect(() => {
    if (uncontrolledTab === TabName.Transcript) {
      trackViewingFeature("transcript");
    }
    if (uncontrolledTab === TabName.Bites) {
      trackViewingFeature("bites");
    }
  }, [trackViewingFeature, uncontrolledTab]);

  return (
    <>
      <Tabs.Root onTabChange={setUncontrolledTab} disabled={!!mobileOverlay}>
        <Tabs.Panel name={TabName.Summary} title="Summary">
          <NotepadSummary meeting={meeting} />
        </Tabs.Panel>
        <Tabs.Panel name={TabName.Transcript} title="Transcript">
          {meeting.captions?.length ? (
            captions ? (
              <NotepadTranscript
                meeting={meeting}
                smartSearchFilter={smartSearchFilter}
                search={undefined}
                captions={captions}
                mediaDisabled={
                  meeting.addedBy === MEETING_SOURCE.DESKTOP_RECORD ||
                  (!meeting.audio_url && !meeting.video_url)
                }
              />
            ) : (
              <LoadingNotepadTranscript />
            )
          ) : (
            <NotepadTranscriptNoCaptions meeting={meeting} />
          )}
        </Tabs.Panel>
        {meeting.addedBy !== MEETING_SOURCE.DESKTOP_RECORD && (
          <Tabs.Panel name={TabName.Bites} title="Soundbites">
            {!user ? (
              <MessageView
                title="Login to listen or create key highlights"
                description="Listen or automatically generate AI-powered key highlights"
                action={
                  <Button onPress={() => openLoginPopup("notepad/soundbites")}>
                    Login
                  </Button>
                }
              />
            ) : (
              <NotepadBites
                meeting={meeting}
                openCreateSoundbite={() => setMobileOverlay("add-soundbite")}
              />
            )}
          </Tabs.Panel>
        )}
      </Tabs.Root>
      {!mobileOverlay && (
        <View style={styles.fabs}>
          {uncontrolledTab === TabName.Transcript &&
            !!meeting.captions &&
            !hidePaidFeatures && (
              <SmartSearchButton
                onPress={() => {
                  tracker.track(TRACKING_EVENTS.SMART_SEARCH_MODAL_OPENED, {
                    meetingId: meeting.id,
                    from: "fab",
                    captionLength: meeting.captions?.length,
                  });
                  openSmartSearchModal();
                }}
                smartSearchFilter={smartSearchFilter}
              />
            )}

          {uncontrolledTab === TabName.Bites &&
            meeting.addedBy !== MEETING_SOURCE.DESKTOP_RECORD && (
              <AddSoundbiteButton
                onPress={() => setMobileOverlay("add-soundbite")}
              />
            )}

          {!!meeting.captions && !hidePaidFeatures && (
            <AskFredButton
              onPress={() => {
                openAskFredModal();
                tracker.track(TRACKING_EVENTS.MEETING_ASK_FRED_MODAL_OPENED, {
                  meetingId: meeting.id,
                  from: "fab",
                });
              }}
            />
          )}
        </View>
      )}
    </>
  );
};

export const NotepadScreenMobileOverlays: FC<{
  navigation: NativeStackScreenProps<ParamList, "Notepad">["navigation"];
}> = ({ navigation }) => {
  const {
    mobileOverlay,
    setMobileOverlay,
    meeting,
    captions,
    search,
    setCreatedBite,
  } = useNotepadScreenContext();

  useEffect(() => {
    if (Platform.OS === "ios") return;
    if (mobileOverlay) {
      // going back = exit overlay
      return navigation.addListener("beforeRemove", (e) => {
        e.preventDefault();
        setMobileOverlay(null);
      });
    }
  }, [navigation, mobileOverlay, setMobileOverlay]);

  return (
    <>
      {mobileOverlay === "search" && !!captions && (
        <NotepadContentOverlay key="search">
          <NotepadTranscript
            meeting={meeting}
            search={search}
            captions={captions}
            mediaDisabled={
              meeting.addedBy === MEETING_SOURCE.DESKTOP_RECORD ||
              (!meeting.audio_url && !meeting.video_url)
            }
          />
        </NotepadContentOverlay>
      )}
      {mobileOverlay === "thread" && (
        <NotepadContentOverlay
          key="thread"
          header="Comments"
          close={() => setMobileOverlay(null)}
        >
          <NotepadThread meeting={meeting} />
        </NotepadContentOverlay>
      )}
      {mobileOverlay === "add-soundbite" && (
        <NotepadContentOverlay
          key="add-soundbite"
          header="Create Soundbite"
          close={() => setMobileOverlay(null)}
        >
          <NotepadCreateSoundbite
            meeting={meeting}
            setCreatedBite={setCreatedBite}
            close={() => setMobileOverlay(null)}
            captions={captions}
          />
        </NotepadContentOverlay>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  fabs: {
    position: "absolute",
    bottom: 16,
    right: 16,
    gap: 12,
  },
});
