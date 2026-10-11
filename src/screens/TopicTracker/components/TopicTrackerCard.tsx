import { useCallback, useMemo, type FC } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import {
  type Teammate,
  type Categories,
  GetCategoriesDocument,
  useUpdateCategoriesMutation,
} from "@/graphql";
import { createStyles, Fonts, useTheme } from "@/styles";
import { Tag } from "@/components/Tag";
import { IconCheck, IconEdit, IconTrash } from "@/assets/svg";
import {
  CreateTopicTrackerModal,
  getMessageForError,
  TopicDeleteDialog,
} from "@/features/topic-tracker";
import { useBooleanState } from "@/utils/states";
import { Switch } from "@/components/Switch";
import { toast } from "@/components/Toast";

export const TopicTrackerCard: FC<{
  category: Categories;
  teammates?: Array<Teammate | null> | null;
  isAdmin: boolean;
  myTopics?: boolean;
}> = ({ category, teammates, isAdmin, myTopics = false }) => {
  const [isOpenDelete, openDelete, closeDelete] = useBooleanState();
  const [isOpenEdit, openEdit, closeEdit] = useBooleanState();

  const theme = useTheme();

  const actionIconColor =
    theme.name === "dark"
      ? theme.colors.textBrand
      : theme.colors.interactivePrimaryDefault;

  const categoryOwnerEmail = useMemo(() => {
    return teammates?.find((user) => user?.id === category.owner)?.email;
  }, [teammates, category.owner]);

  const [switchTeamAccess, { loading: updatingTeamAccess }] =
    useUpdateCategoriesMutation({
      refetchQueries: [GetCategoriesDocument],
      onError(err) {
        toast({
          title: "Could not update team access",
          message: getMessageForError(err),
          type: "error",
        });
      },
    });

  const updateTeamAccess = useCallback(() => {
    switchTeamAccess({
      variables: {
        _id: category._id,
        name: category.property?.name ?? "",
        subProperties: category.property?.subProperties ?? [],
        teamAccess: !category.teamAccess,
      },
    });
  }, [category, switchTeamAccess]);

  return (
    <View style={styles.root(theme)}>
      <View style={styles.titleContainer}>
        <Text style={styles.topicTitle(theme)}>{category?.property?.name}</Text>
        {(myTopics || isAdmin) && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={openEdit}
              aria-label="Edit topic"
              hitSlop={8}
              style={styles.actionIconButton}
              role="button"
            >
              <IconEdit color={actionIconColor} width={20} height={20} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openDelete}
              aria-label="Delete topic"
              hitSlop={8}
              style={styles.actionIconButton}
              role="button"
            >
              <IconTrash color={actionIconColor} width={20} height={20} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.tagContainer}>
        {category?.property?.subProperties?.map((subProperty) => (
          <Tag key={subProperty} style={styles.tag(theme)}>
            {subProperty}
          </Tag>
        ))}
      </View>

      {categoryOwnerEmail && !myTopics && (
        <Text style={styles.ownerEmail(theme)}>
          Created by {categoryOwnerEmail}
        </Text>
      )}

      {isAdmin && (
        <View style={styles.teamAdminContainer}>
          <Text style={styles.switchText(theme)}>Enable for teammates</Text>
          <Switch
            value={category.teamAccess ?? false}
            onValueChange={updateTeamAccess}
            loading={updatingTeamAccess}
          />
        </View>
      )}

      {!isAdmin && category.teamAccess && (
        <View style={styles.teamAdminContainer}>
          <IconCheck width={16} height={16} color={theme.colors.textPrimary} />
          <Text style={styles.teamAdminText(theme)}>Enabled by team admin</Text>
        </View>
      )}

      <TopicDeleteDialog
        category={category}
        isOpen={isOpenDelete}
        close={closeDelete}
      />

      <CreateTopicTrackerModal
        isOpen={isOpenEdit}
        isAdmin={isAdmin}
        close={closeEdit}
        categoryToEdit={category}
      />
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.layerDefault,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
  }),
  titleContainer: {
    flexDirection: "row",
  },
  buttonContainer: {
    flex: 1,
    marginLeft: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  tagContainer: {
    flexWrap: "wrap",
    paddingVertical: 8,
    flexDirection: "row",
  },
  tag: (theme) => ({
    borderRadius: 4,
    height: 28,
    marginTop: 8,
    marginRight: 8,
    // Dark: lift the chip off the card with a brighter grey surface.
    ...(theme.name === "dark" && {
      backgroundColor: theme.colors.interactiveNeutral3Default,
    }),
  }),
  topicTitle: (theme) => ({
    borderRadius: 18,
    fontFamily: Fonts.dmSans["500"].regular,
    height: 36,
    lineHeight: 36,
    paddingHorizontal: 16,
    marginBottom: 8,
    textAlign: "center",
    alignSelf: "flex-start",
    textAlignVertical: "center",
    overflow: "hidden",
    // Dark: the purple-on-purple pill reads muddy/dark, so use a brighter
    // translucent-brand surface + brighter brand text. Light is unchanged.
    backgroundColor:
      theme.name === "dark"
        ? theme.colors.layerBrandLight2
        : theme.colors.interactiveSecondaryDefault,
    color:
      theme.name === "dark"
        ? theme.colors.textBrand
        : theme.colors.interactivePrimaryDefault,
    marginTop: 8,
    marginRight: 8,
  }),
  ownerEmail: (theme) => ({
    marginTop: 16,
    color: theme.colors.textSecondary,
    fontSize: 12,
    alignSelf: "flex-end",
  }),
  teamAdminContainer: {
    marginTop: 12,
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  switchText: (theme) => ({
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginRight: 8,
  }),
  teamAdminText: (theme) => ({
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
  }),
  actionIconButton: {
    marginLeft: 16,
    paddingTop: 12,
  },
});
