import { IconX } from "@/assets/svg";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import type { TagInputProps } from "@/components/Input";
import { SelectField, TagInput } from "@/components/Input";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { Config } from "@/constants";
import { appReviewApi } from "@/features/app-review";
import type {
  FindUsersMeetingIsSharedWithResponse,
  SharedMeetingTtlInput,
} from "@/graphql";
import {
  FindUsersMeetingIsSharedWithDocument,
  GetPublicProfilesDocument,
  useShareMeetingsMutation,
  type Meeting,
} from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { isEmail } from "@/utils/email";
import { isDefined } from "@/utils/object";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import { Pressable, TouchableOpacity, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { TTL_OPTIONS } from "./constants";
import { useTeam } from "@/features/team";
import { useAuth } from "@/features/auth";
import { useLazyQuery } from "@apollo/client";
import type { InviteOption, TeammateOption, GroupOption } from "./types";

const EmailUserListItem: FC<{
  email: string;
  name?: string | null;
  picture?: string | null;
  onRemove?: () => void;
  isGroup?: boolean;
}> = ({ email, name, picture, onRemove, isGroup }) => {
  const theme = useTheme();
  return (
    <View style={styles.listItem}>
      <Avatar size={32} name={name || email} picture={picture} shape="square" />
      <View style={styles.listItemContent}>
        <Text color="textPrimary" variant="body2Regular">
          {name || email}
        </Text>
        {name && !isGroup && (
          <Text color="textHint" variant="body3Regular">
            {email}
          </Text>
        )}
        {isGroup && (
          <Text color="textHint" variant="body3Regular">
            Group
          </Text>
        )}
      </View>
      {onRemove && (
        <TouchableOpacity
          style={styles.clear}
          onPress={onRemove}
          role="button"
          aria-label={`Remove ${name || email}`}
        >
          <IconX width={20} height={20} color={theme.colors.textHint} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const ttlToString = (ttl: SharedMeetingTtlInput | null) => {
  if (!ttl) return "";
  return `${ttl.unit}:${ttl.duration}`;
};

const ttlFromString = (ttl: string): SharedMeetingTtlInput | null => {
  if (!ttl) return null;
  const [unit, duration] = ttl.split(":");
  return { unit, duration: Number(duration) };
};

export const ShareMeetingDialogEmailAddingContent: FC<{
  meeting: Meeting;
  close: () => void;
  findUsersMeetingIsSharedWith:
    | FindUsersMeetingIsSharedWithResponse
    | undefined
    | null;
}> = ({ meeting, close, findUsersMeetingIsSharedWith }) => {
  const { team, userGroups } = useTeam();
  const { user } = useAuth();

  // Lazy loading for public profiles with local caching
  const [profiles, setProfiles] = useState<
    Map<
      string,
      { email?: string | null; name?: string | null; picture?: string | null }
    >
  >(new Map());
  const profilesRef = useRef(profiles);

  // Keep ref in sync with state
  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  const [getPublicProfiles, { loading: loadingProfiles }] = useLazyQuery(
    GetPublicProfilesDocument,
    {
      fetchPolicy: "cache-first",
      nextFetchPolicy: "cache-first",
    },
  );

  // Fetch profiles for teammates that don't have cached profiles
  const fetchMissingProfiles = useCallback(
    async (emails: string[]) => {
      const missingEmails = emails.filter(
        (email) => !profilesRef.current.has(email),
      );
      if (missingEmails.length > 0) {
        const { data } = await getPublicProfiles({
          variables: { emails: missingEmails },
        });

        setProfiles((prevProfiles) => {
          const newProfiles = new Map(prevProfiles);
          data?.publicProfiles?.forEach(
            (profile: {
              email?: string | null;
              name?: string | null;
              picture?: string | null;
            }) => {
              if (profile.email) {
                newProfiles.set(profile.email, profile);
              }
            },
          );
          return newProfiles;
        });
      }
    },
    [getPublicProfiles],
  );

  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [tagInputText, setTagInputText] = useState("");

  const [ttl, setTtl] = useState<SharedMeetingTtlInput | null>(null);

  // Create combined list of teammates and user groups
  const allOptions = useMemo((): InviteOption[] => {
    const alreadyInvitedEmails = [
      ...(findUsersMeetingIsSharedWith?.teammates || []),
      ...(findUsersMeetingIsSharedWith?.nonTeammates || []),
    ]
      .map((user) => user?.email)
      .filter(isDefined);

    const teammates: TeammateOption[] =
      team?.teammates
        ?.map((teammate) => ({
          type: "teammate" as const,
          email: teammate?.email || "",
          name:
            teammate?.name || teammate?.profile?.name || teammate?.email || "",
          picture: teammate?.profile?.picture || null,
        }))
        .filter(
          (item) =>
            item.email &&
            !selectedEmails.includes(item.email) &&
            item.email !== user?.email &&
            !alreadyInvitedEmails.includes(item.email),
        ) || [];

    const groups: GroupOption[] =
      userGroups
        ?.map((group) => ({
          type: "group" as const,
          id: group._id, // Group ID for API calls
          name: group.name,
          picture: null,
        }))
        .filter((item) => !selectedEmails.includes(item.id)) || [];

    return [...teammates, ...groups];
  }, [
    team?.teammates,
    userGroups,
    selectedEmails,
    user?.email,
    findUsersMeetingIsSharedWith,
  ]);

  const options = useMemo(() => {
    if (!tagInputText) return allOptions;

    const searchText = tagInputText.trim().toLowerCase();
    return allOptions.filter(
      (item) =>
        item.name.toLowerCase().includes(searchText) ||
        (item.type === "teammate" &&
          item.email.toLowerCase().includes(searchText)),
    );
  }, [allOptions, tagInputText]);

  // Fetch profiles for visible teammates when options change
  useEffect(() => {
    const teammateEmails = options
      .filter((item) => item.type === "teammate")
      .map((item) => item.email);

    if (teammateEmails.length > 0) {
      fetchMissingProfiles(teammateEmails);
    }
  }, [options, fetchMissingProfiles]);

  const onChangeValue = useCallback<TagInputProps["onChangeValue"]>(
    (value, option, action) => {
      if (action === "add") {
        option = option.trim().toLowerCase();
        if (!isEmail(option)) return false;
        setSelectedEmails((emails) => Array.from(new Set([...emails, option])));
      } else {
        setSelectedEmails(value);
      }
    },
    [],
  );

  const handleItemPress = useCallback((item: InviteOption) => {
    setTagInputText("");

    const displayValue = item.type === "group" ? item.name : item.email;
    setSelectedEmails((emails) =>
      Array.from(new Set([...emails, displayValue])),
    );
  }, []);

  const [shareMeetings, { loading }] = useShareMeetingsMutation({
    refetchQueries: [FindUsersMeetingIsSharedWithDocument],
    variables: {
      meetingId: meeting.id,
      inviteeList: selectedEmails.map((email) => {
        // If it's a group name, find the corresponding group ID
        const group = userGroups?.find((g) => g.name === email);
        return group ? group._id : email;
      }),
      reason: Config.NAME,
      ttl,
    },
    onCompleted() {
      toast({
        message: "You have shared successfully",
        type: "success",
      });
      appReviewApi.increaseSharedMeetingCount();
      close();
    },
    onError(err) {
      toast({
        title: "Could not share meeting",
        message: err.message,
        type: "error",
      });
    },
  });

  const theme = useTheme();

  return (
    <>
      <Dialog.Header
        actions={
          <Button
            hitSlop={10}
            variant="transparentPrimary"
            disabled={selectedEmails.length <= 0 || loading}
            onPress={() => shareMeetings()}
            style={styles.inviteButton}
          >
            Invite
          </Button>
        }
      >
        Invite a person
      </Dialog.Header>
      <View style={styles.root}>
        <View style={styles.inputContainer}>
          <TagInput
            value={selectedEmails}
            onChangeValue={onChangeValue}
            placeholder="Add emails or people..."
            autoComplete="email"
            text={tagInputText}
            onChangeText={setTagInputText}
            autoFocus
            variant="filled"
          />
        </View>
        <View style={styles.content}>
          <View style={styles.container}>
            <SelectField
              label="Access expires after"
              options={TTL_OPTIONS.map((ttl) => ({
                ...ttl,
                value: ttlToString(ttl.value),
              }))}
              value={ttlToString(ttl)}
              onValueChange={(value) => setTtl(ttlFromString(value))}
            />
          </View>
          <View style={styles.listSection}>
            <View style={styles.container}>
              <Text variant="label2Weight">Select a person or group</Text>
            </View>
            <View style={styles.listContainer}>
              {loadingProfiles && options.length > 0 && (
                <View style={styles.loadingContainer}>
                  <Text color="textHint" variant="body3Regular">
                    Loading profiles...
                  </Text>
                </View>
              )}
              <FlashList
                data={options}
                keyExtractor={(item) =>
                  item.type === "group" ? item.id : item.email
                }
                renderItem={({ item }) => {
                  // Get profile data for teammates
                  const profile =
                    item.type === "teammate" ? profiles.get(item.email) : null;
                  const displayName = profile?.name || item.name;
                  const displayPicture = profile?.picture || item.picture;
                  const displayEmail =
                    item.type === "group" ? item.name : item.email;

                  return (
                    <Pressable
                      onPress={() => handleItemPress(item)}
                      style={({ pressed }) => [
                        pressed && styles.pressableActive(theme),
                      ]}
                    >
                      <EmailUserListItem
                        email={displayEmail}
                        name={displayName}
                        picture={displayPicture}
                        isGroup={item.type === "group"}
                      />
                    </Pressable>
                  );
                }}
                contentContainerStyle={styles.list}
              />
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    paddingTop: 12,
    gap: 16,
  },
  inputContainer: {
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    gap: 16,
  },
  container: {
    paddingHorizontal: 20,
  },
  pressableActive: (theme) => ({
    backgroundColor: theme.colors.layerMuted,
  }),
  listSection: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  list: {
    paddingVertical: 4,
  },
  listItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
    minHeight: 56,
  },
  listItemContent: {
    flex: 1,
  },
  clear: {
    padding: 4,
  },
  inviteButton: {
    paddingRight: 0,
  },
});
