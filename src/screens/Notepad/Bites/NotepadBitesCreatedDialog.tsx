import { IconPlaylist, IconShare } from "@/assets/svg";
import { Button, TextButton } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { SelectField, TextField } from "@/components/Input";
import { LinkView } from "@/components/Link";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import {
  BITE_PRIVACY_OPTIONS,
  BiteShareDialog,
  fromBiteSinglePrivacy,
  getBiteSinglePrivacy,
} from "@/features/bite";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useBooleanState } from "@/utils/states";
import { toHHMMSS } from "@/utils/time";
import {
  useUpdateSoundbiteMutation,
  type Soundbite,
} from "@firefliesai/bites-ff.graphql-client";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { openAddToPlaylistModal } from "src/features/global-modals";

const NotepadBiteCreatedContent: FC<{
  bite: Soundbite;
  close: () => void;
  meeting: Meeting;
}> = ({ bite, close }) => {
  const [currentBite, setCurrentBite] = useState(bite);
  useEffect(() => {
    setCurrentBite(bite);
  }, [bite]);

  const [updateSoundbite, { loading: loadingUpdate }] =
    useUpdateSoundbiteMutation();

  const onPrivacyChange = useCallback(
    (privacy: string) => {
      const privacies = fromBiteSinglePrivacy(privacy);

      updateSoundbite({
        variables: {
          id: bite.id,
          privacies,
        },
        onCompleted(data) {
          toast({
            message: "Soundbite Access updated",
            type: "success",
          });
          setCurrentBite(data.updateSoundbite);
        },
      });
      tracker.track(TRACKING_EVENTS.BITE_PRIVACY_UPDATED, {
        id: bite.id,
        previousPrivacy: bite.privacies.join(" "),
        privacy: privacies.join(" "),
        from: "created-dialog",
      });
    },
    [bite, updateSoundbite],
  );

  const prevNameRef = useRef(bite.name);
  const [name, setName] = useState(bite.name);
  const onBlur = () => {
    if (name !== prevNameRef.current) {
      updateSoundbite({
        variables: {
          id: bite.id,
          name,
        },
        onCompleted(data) {
          prevNameRef.current = data.updateSoundbite.name;
          toast({
            message: "Soundbite Title updated",
            type: "success",
          });
          setCurrentBite(data.updateSoundbite);
        },
      });
    }
  };

  const [isOpenShare, openShare, closeShare] = useBooleanState();

  const openAdd = () => {
    openAddToPlaylistModal({
      bite,
      fromRef: "notepad/bite-created-dialog",
    });
  };

  const theme = useTheme();

  return (
    <>
      <Dialog.Header>Soundbite created</Dialog.Header>
      <View>
        <ScrollView>
          <View style={styles.root}>
            <View style={styles.top(theme)}>
              <LinkView
                style={styles.topMeta}
                href={{
                  pathname: RouteNames.Bite,
                  params: {
                    id: currentBite.id,
                  },
                }}
                onPress={close}
                animated
              >
                <Text variant="label2Weight">{currentBite.name}</Text>
                <Text variant="body3Regular">
                  {toHHMMSS(currentBite.startTime)} -{" "}
                  {toHHMMSS(currentBite.endTime)}
                </Text>
              </LinkView>
              <TextButton
                Icon={IconShare}
                onPress={openShare}
                aria-label="Share"
              />
            </View>
            <View style={styles.inputs}>
              <TextField
                label="Soundbite Title"
                value={name}
                onValueChange={setName}
                disabled={loadingUpdate}
                onBlur={onBlur}
              />
              <SelectField
                label="Soundbite Access"
                value={getBiteSinglePrivacy(bite.privacies)}
                options={BITE_PRIVACY_OPTIONS}
                onValueChange={onPrivacyChange}
                disabled={loadingUpdate}
              />
            </View>
          </View>
          <View style={styles.actions}>
            <TextButton
              Icon={IconPlaylist}
              onPress={openAdd}
              aria-label="Add to playlist"
            >
              Add to Playlist
            </TextButton>
            <Button onPress={close}>Done</Button>
          </View>
        </ScrollView>
      </View>
      <BiteShareDialog
        bite={currentBite}
        isOpen={isOpenShare}
        close={closeShare}
      />
    </>
  );
};

export const NotepadBitesCreatedDialog: FC<{
  createdBite: Soundbite | null;
  setCreatedBite: (bite: Soundbite | null) => void;
  meeting: Meeting;
}> = ({ createdBite: createdBiteProp, setCreatedBite, meeting }) => {
  const lastCreatedBiteRef = useRef(createdBiteProp);
  useEffect(() => {
    lastCreatedBiteRef.current = createdBiteProp;
  }, [createdBiteProp]);

  const createdBite = createdBiteProp || lastCreatedBiteRef.current;

  const close = () => setCreatedBite(null);

  return (
    <Dialog.Root isOpen={!!createdBiteProp}>
      {createdBite && (
        <NotepadBiteCreatedContent
          bite={createdBite}
          close={close}
          meeting={meeting}
        />
      )}
    </Dialog.Root>
  );
};

const styles = createStyles({
  root: {
    padding: 20,
    alignItems: "flex-start",
    gap: 20,
  },
  inputs: {
    gap: 20,
    width: "100%",
  },
  actions: {
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    gap: 20,
    padding: 20,
  },
  top: (theme) => ({
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: "100%",
    gap: 8,
  }),
  topMeta: {
    gap: 4,
    flex: 1,
  },
});
