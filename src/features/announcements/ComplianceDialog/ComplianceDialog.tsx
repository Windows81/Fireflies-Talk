import { IconAlertCircle, IconCheck } from "@/assets/svg";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { LinkText, Text } from "@/components/Typography";
import { useShouldShowOnboarding } from "@/features/onboarding";
import type { User } from "@/graphql";
import { useApproveTermsMutation, useGetCurrentUserQuery } from "@/graphql";
import { useTheme } from "@/styles";
import { useApolloClient } from "@apollo/client";
import { useEffect, useRef, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ComplianceListItem: FC<{
  children: string;
}> = ({ children }) => {
  const theme = useTheme();

  return (
    <View style={styles.listItem}>
      <IconCheck color={theme.colors.textBrand} width={20} height={20} />
      <Text color="textSecondary" style={styles.listItemText}>
        {children}
      </Text>
    </View>
  );
};

const ComplianceDialogContent: FC<{
  user: Pick<User, "profile" | "_id" | "__typename">;
  close: () => void;
}> = ({ user, close }) => {
  const theme = useTheme();

  const client = useApolloClient();

  const [approveTerms, { called }] = useApproveTermsMutation({
    onCompleted() {
      client.cache.modify({
        id: client.cache.identify(user),
        fields: {
          approvedTerms() {
            return true;
          },
        },
      });
    },
  });

  useEffect(() => {
    if (!called) approveTerms();
  }, [approveTerms, called]);

  return (
    <SafeAreaView
      style={styles.root}
      edges={{
        top: "off",
        right: "off",
        bottom: "maximum",
        left: "off",
      }}
    >
      <Avatar
        size={40}
        name={user?.profile?.name}
        picture={user?.profile?.picture}
        shape="square"
      />
      <View style={styles.heading}>
        <Text variant="heading4Weight">
          Welcome to Fireflies, {user?.profile?.firstName || user.profile?.name}
        </Text>
        <Text variant="body1Regular" color="textSecondary">
          Let&lsquo;s help you understand how Fireflies transcribe online
          meetings.
        </Text>
      </View>
      <View style={styles.list}>
        <ComplianceListItem>
          Fireflies joins your online meetings as a participant at the start.
        </ComplianceListItem>
        <ComplianceListItem>
          You can kick Fireflies Notetaker out of the meeting anytime, just like
          any other paparticipant.
        </ComplianceListItem>
      </View>
      <View style={styles.rule}>
        <IconAlertCircle width={16} height={16} color={theme.colors.textHint} />
        <Text variant="body2Regular" color="textHint">
          Follow all the local/state{" "}
          <LinkText
            href="https://fireflies.notion.site/Fireflies-Platform-Rules-e0015d3d608f4f25aa65860706b49b11"
            color="textHint"
          >
            recording rules
          </LinkText>{" "}
          and notify participants as required.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button size="lg" onPress={close}>
          Got it
        </Button>
      </View>
    </SafeAreaView>
  );
};

export const ComplianceDialog: FC<{
  isOpen: boolean;
  open(): void;
  close(): void;
}> = ({ isOpen, open, close }) => {
  const { data } = useGetCurrentUserQuery();
  const user = data?.user;

  const { completed: completedOnboarding, loading: loadingOnboarding } =
    useShouldShowOnboarding();

  const hasShownRef = useRef(false);
  useEffect(() => {
    if (!user || loadingOnboarding) return;
    if (hasShownRef.current) return;
    if (!user.approvedTerms && completedOnboarding) {
      open();
      hasShownRef.current = true;
    }
  }, [user, completedOnboarding, loadingOnboarding, open]);

  return (
    <Dialog.Root variant="bottomSheet" isOpen={isOpen} close={close}>
      {user && <ComplianceDialogContent user={user} close={close} />}
    </Dialog.Root>
  );
};

const styles = StyleSheet.create({
  root: {
    padding: 24,
  },
  heading: {
    gap: 16,
    marginTop: 24,
  },
  list: {
    gap: 12,
    marginTop: 40,
  },
  listItem: {
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  listItemText: {
    flex: 1,
  },
  rule: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  footer: {
    paddingTop: 24,
    marginTop: 64,
  },
});
