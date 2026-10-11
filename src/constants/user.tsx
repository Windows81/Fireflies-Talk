import { RNText } from "@/components/Typography";
import { vars } from "@/styles";
import { isGenericDomain } from "@/utils/email";
import { isTruthy } from "@/utils/object";
import { StyleSheet } from "react-native";
import type { User } from "../graphql/gql.gen";
import { isDesktop } from "@/utils/device";

export enum SendNotesTo {
  All = "all",
  Team = "team",
  Domain = "domain",
  Me = "me",
}

export enum AutoJoin {
  Auto = "auto",
  Autoself = "autoself",
  Autodomain = "autodomain",
  Autoteammates = "autoteammates",
  Autoexternal = "autoexternal",
  Manual = "manual",
}

export const SEND_NOTES_TO_OPTIONS = (user?: Pick<User, "domain"> | null) =>
  [
    {
      value: SendNotesTo.All,
      label: "Everyone on the invite",
    },
    {
      value: SendNotesTo.Team,
      label: `Only me and participants from my Fireflies team`,
    },
    !(user?.domain && isGenericDomain(user?.domain)) && {
      value: SendNotesTo.Domain,
      label: (
        <>
          Only me and participants from{" "}
          <RNText style={styles.highlightText}>
            {user?.domain || "my domain"}
          </RNText>
        </>
      ),
    },
    {
      value: SendNotesTo.Me,
      label: `Only me`,
    },
  ].filter(isTruthy);

export const AUTO_JOIN_OPTIONS = (user?: Pick<User, "domain"> | null) =>
  [
    {
      value: AutoJoin.Auto,
      label: `All meetings with web-conf link`,
    },
    {
      value: AutoJoin.Autoself,
      label: "Only meetings that I own",
    },
    !(user?.domain && isGenericDomain(user.domain)) && {
      value: AutoJoin.Autodomain,
      label: (
        <>
          Only meetings with{" "}
          <RNText style={styles.highlightText}>@{user?.domain}</RNText>{" "}
          participants
        </>
      ),
    },
    !(user?.domain && isGenericDomain(user?.domain)) && {
      value: AutoJoin.Autoexternal,
      label: (
        <>
          Only meetings with{" "}
          <RNText style={styles.highlightText}>non-@{user?.domain}</RNText>{" "}
          participants
        </>
      ),
    },
    {
      value: AutoJoin.Autoteammates,
      label: `Only meetings with teammates`,
    },
    {
      value: AutoJoin.Manual,
      label: (
        <>
          Only when I invite{" "}
          <RNText style={styles.highlightText}>fred@fireflies.ai</RNText>
        </>
      ),
    },
  ].filter(isTruthy);

const styles = StyleSheet.create({
  highlightText: {
    color: isDesktop ? vars.colors.purple400 : vars.colors.purple700,
  },
});

export const MANUAL_AUTO_JOIN_OPTION = {
  value: AutoJoin.Manual,
  label: (
    <>
      Only when I invite{" "}
      <RNText style={styles.highlightText}>fred@fireflies.ai</RNText>
    </>
  ),
};
