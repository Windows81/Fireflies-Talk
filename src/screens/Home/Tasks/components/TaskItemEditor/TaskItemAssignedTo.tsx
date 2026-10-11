import { IconChevronDown, IconUserPlus } from "@/assets/svg";
import { Avatar, GroupAvatar } from "@/components/Avatar";
import { SelectPopover, type SelectOption } from "@/components/Input";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth";
import { useTeam } from "@/features/team";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import { isEmail } from "@/utils/email";
import { isDefined } from "@/utils/object";
import { useBooleanState } from "@/utils/states";
import { getNameParts } from "@/utils/user";
import type {
  Profile,
  UserGroup,
} from "@firefliesai/payments-ff.graphql-client";
import type {
  CoreFeedMeetingFieldsFragment,
  CoreTaskFieldsFragment,
} from "@firefliesai/tasks-ff.graphql-client";
import {
  EnumCreateTaskOwnerType,
  EnumTaskOwnerType,
} from "@firefliesai/tasks-ff.graphql-client";
import type { FC } from "react";
import { Pressable, View } from "react-native";
import type {
  AssignedToOwnerInput,
  EditableTaskData,
  HandleChangeOwnerFn,
} from "./types";

const getNameAndAvatar = (
  ownerProfile:
    | NonNullable<CoreTaskFieldsFragment["ownerProfile"]>
    | Profile
    | Omit<UserGroup, "id" | "updatedAt">,
  short?: boolean,
) => {
  if (ownerProfile.__typename === "UserGroup") {
    type UserGroupProfile = Omit<UserGroup, "id" | "updatedAt"> & {
      groupName?: string;
    };

    const userGroupProfile = ownerProfile as UserGroupProfile;

    const groupName = userGroupProfile.groupName || userGroupProfile.name;

    return {
      name: `@${ownerProfile.handle}`,
      avatarNode: (
        <GroupAvatar
          handle={ownerProfile.handle}
          name={groupName}
          size={24}
          shape="square"
        />
      ),
      alt: [groupName, ownerProfile.handle].filter(isDefined)[0],
    };
  } else if (ownerProfile.__typename === "Profile") {
    const firstName =
      ownerProfile.name && short
        ? getNameParts(ownerProfile.name).firstName
        : ownerProfile.name;
    const name = firstName || ownerProfile.email;
    return {
      name,
      avatarNode: (
        <Avatar
          size={24}
          shape="square"
          picture={ownerProfile.picture || undefined}
          name={name}
        />
      ),
      alt: [ownerProfile.name, ownerProfile.email].filter(isDefined)[0],
    };
  }

  const name = ownerProfile.name || "Unnamed";

  return {
    name: name,
    avatarNode: null,
    alt: name,
  };
};

const assertEmail = (email: string) => {
  if (!isEmail(email)) {
    throw new Error(
      "You must enter a valid email or select a user or user group from the dropdown",
    );
  }
};

/**
 * As the dropdown allows assigning to both user and user group, we need to
 * prefix the value with ownerType to differentiate between the two.
 *
 * Also since, for both OwnerType.Email and OwnerType.User, the email is considered as the value,
 * so both of them will be prefixed with OwnerType.Email
 */
const fromOptionValue = (option: string): AssignedToOwnerInput => {
  const sepIndex = option.indexOf(":");
  if (sepIndex === -1) {
    // this could be a manually entered value, which we can assume
    // to be an email
    return {
      ownerType: EnumCreateTaskOwnerType.Email,
      ownerId: option,
    };
  }

  const ownerType = option.slice(0, sepIndex);
  const ownerId = option.slice(sepIndex + 1);

  if (
    !(Object.values(EnumCreateTaskOwnerType) as string[]).includes(ownerType)
  ) {
    // not a valid owner type, assume it's an email
    return {
      ownerType: EnumCreateTaskOwnerType.Email,
      ownerId: option,
    };
  }
  return {
    ownerType: ownerType as EnumCreateTaskOwnerType,
    ownerId: ownerId,
  };
};

const toOptionValue = (task: EditableTaskData) => {
  if (!task.ownerType) return "";
  if (task.ownerType === EnumCreateTaskOwnerType.UserGroup) {
    return `${EnumTaskOwnerType.UserGroup}:${task.ownerId}`;
  }
  return `${EnumTaskOwnerType.Email}:${("ownerEmail" in task && task.ownerEmail) || task.ownerId}`;
};

const getOptions = ({
  userGroups,
  profiles,
  currentValue,
}: {
  userGroups: Omit<UserGroup, "id" | "updatedAt">[] | null | undefined;
  profiles: Profile[] | null | undefined;
  currentValue?: string;
}): SelectOption<string>[] => {
  const sortedUserGroups = [
    ...Array.from(userGroups || []).sort((a, b) => {
      return a.handle.localeCompare(b.handle);
    }),
  ];

  const uniqueProfiles = profiles?.filter(
    (profile, index, self) =>
      !!profile.email &&
      self.findIndex((p) => p.email === profile.email) === index,
  );

  return [
    ...(currentValue ? [{ value: "", label: "Unassign", sticky: true }] : []),
    ...(uniqueProfiles || []).map((profile) => {
      const { name, alt, avatarNode } = getNameAndAvatar(profile);

      return {
        left: avatarNode,
        label: name,
        alt,
        value: `${EnumTaskOwnerType.Email}:${profile.email}`,
        meta: {
          ownerProfile: profile,
        },
      };
    }),
    // user groups at the bottom
    ...sortedUserGroups.map((userGroup): SelectOption<string> => {
      const { name, alt, avatarNode } = getNameAndAvatar(userGroup);
      return {
        left: avatarNode,
        label: name,
        value: `${EnumTaskOwnerType.UserGroup}:${userGroup._id}`,
        alt,
        meta: {
          ownerProfile: {
            __typename: "UserGroup",
            _id: userGroup._id,
            handle: userGroup.handle,
            groupName: userGroup.name,
          },
        },
      };
    }),
  ];
};

export const getName = (task: EditableTaskData) => {
  if (task.ownerProfile?.__typename === "UserGroup") {
    return `@${task.ownerProfile.handle}`;
  } else if (task.ownerProfile?.__typename === "Profile") {
    return task.ownerProfile.name || task.ownerEmail;
  } else {
    return task.ownerEmail || "";
  }
};

const TaskItemCurrentAssignedTo: FC<{
  value: string;
  task: EditableTaskData;
  full?: boolean;
}> = ({ task, value, full }) => {
  const theme = useTheme();
  const hasGeneratedOwnerName =
    task.generatedOwnerName && task.generatedOwnerName !== "Unassigned";

  if (!value && hasGeneratedOwnerName && !task.hasChangedOwner) {
    return (
      <View style={styles.assigned}>
        <Avatar size={24} shape="square" name={task.generatedOwnerName} />
        {full && (
          <View style={styles.currentNameWrapper(theme)}>
            <Text color="textMuted">{task.generatedOwnerName}</Text>
          </View>
        )}
      </View>
    );
  }

  if (!value) {
    return (
      <View style={styles.unassigned}>
        <View style={styles.unassignedWrapper(theme)}>
          <IconUserPlus
            color={theme.colors.textMuted}
            width={16}
            height={16}
            aria-label={!full ? "Assign" : undefined}
          />
          {full && <Text color="textMuted">Assign</Text>}
        </View>
      </View>
    );
  }

  const ownerEmail = "ownerEmail" in task ? task.ownerEmail : task.ownerId;

  const { avatarNode, name } = task.ownerProfile
    ? getNameAndAvatar(task.ownerProfile, true)
    : {
        avatarNode: (
          <Avatar size={24} shape="square" name={ownerEmail || "?"} />
        ),
        name: ownerEmail?.split("@")[0] || "",
      };

  return (
    <View style={styles.assigned}>
      {avatarNode}
      {full && (
        <View style={styles.currentNameWrapper(theme)}>
          <Text color="textMuted">{name}</Text>
        </View>
      )}
    </View>
  );
};

export const TaskItemAssignedTo: FC<{
  meeting: CoreFeedMeetingFieldsFragment;
  task: EditableTaskData;
  handleChangeOwner: HandleChangeOwnerFn;
  loading?: boolean;
  forceFullVariant?: boolean;
  showDropdownArrow?: boolean;
}> = ({
  meeting,
  task,
  handleChangeOwner,
  loading,
  forceFullVariant,
  showDropdownArrow,
}) => {
  const { user } = useAuth();
  const { userGroups, team } = useTeam();
  const teammates = team?.teammates;

  const optionValue = toOptionValue(task);

  const onChange = (newOwner: string, option: SelectOption<string>) => {
    if (newOwner === optionValue || newOwner === "") {
      // selected the same owner again will clear the owner
      handleChangeOwner({
        ownerId: null,
        ownerType: null,
      });
    } else {
      try {
        const newOwnerInput = fromOptionValue(newOwner);
        if (
          newOwnerInput.ownerId &&
          newOwnerInput.ownerType === EnumCreateTaskOwnerType.Email
        ) {
          assertEmail(newOwnerInput.ownerId);
        }
        handleChangeOwner(newOwnerInput, option.meta?.ownerProfile);
      } catch (err) {
        toast({
          title: "Failed to update task owner",
          message: err.message,
          type: "error",
        });
      }
    }
  };

  const [isOpen, open, close] = useBooleanState();

  const theme = useTheme();
  const isLargeScreen = theme.breakpoint !== Breakpoint.Small;

  if (!user) return null;

  return (
    <>
      <Pressable style={styles.root} onPress={open} disabled={loading}>
        <TaskItemCurrentAssignedTo
          value={optionValue}
          task={task}
          full={isLargeScreen || forceFullVariant}
        />
        {showDropdownArrow && !!task.ownerType && (
          <IconChevronDown
            width={16}
            height={16}
            color={theme.colors.textHint}
          />
        )}
      </Pressable>
      <SelectPopover
        isOpen={isOpen}
        close={close}
        onValueChange={onChange}
        value={optionValue}
        options={getOptions({
          userGroups,
          currentValue: optionValue,
          profiles: [
            ...meeting.participantsProfiles,
            ...(teammates || []).map((t) => t?.profile).filter(isDefined),
          ],
        })}
        showSearch
        freeSolo
        dialogVariant="bottomSheet"
        style={styles.selectPopover}
      />
    </>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unassigned: {
    flexDirection: "row",
  },
  unassignedWrapper: (theme) => ({
    paddingHorizontal: 4,
    height: 24,
    backgroundColor: theme.colors.layerStrong,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    flexDirection: "row",
  }),
  assigned: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  currentNameWrapper: (theme) => ({
    backgroundColor: theme.colors.layerBrandLight2,
    height: 24,
    paddingHorizontal: 8,
    justifyContent: "center",
    borderRadius: 4,
  }),
  selectPopover: {
    maxHeight: "80%",
  },
});
