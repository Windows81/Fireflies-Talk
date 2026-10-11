import { apolloClient } from "@/graphql";
import { gql } from "@apollo/client";
import { GraphQLError } from "graphql";
import {
  type DesktopConsentPolicy,
  type TeamConsentPolicySource,
  resolveDesktopConsentPolicy,
} from "./desktopConsentPolicy";

/**
 * A slim read of the team's consent policy, kept off the normalized cache on
 * purpose: `getTeam` selects a different `settings` shape, and two selections
 * writing the same non-normalized object would overwrite each other's fields.
 * Hand-written rather than generated because it is only ever read fresh.
 */
const TEAM_CONSENT_POLICY_QUERY = gql`
  query getTeamConsentPolicy {
    team: teamAccount {
      _id
      tier
      settings {
        enforceDesktopConsentAudio
        enforceDesktopConsentCamera
        enforceDesktopConsentChat
      }
    }
  }
`;

interface TeamConsentPolicyQueryResult {
  team: (TeamConsentPolicySource & { _id?: string | null }) | null;
}

export async function fetchDesktopConsentPolicy(): Promise<DesktopConsentPolicy> {
  const { data, errors } =
    await apolloClient.query<TeamConsentPolicyQueryResult>({
      query: TEAM_CONSENT_POLICY_QUERY,
      fetchPolicy: "no-cache",
    });
  // errorPolicy "all" hands GraphQL errors back beside the data; a policy
  // read that errored must not pass as "nothing required".
  if (errors?.length) {
    throw new GraphQLError(errors[0].message, { ...errors[0] });
  }
  return resolveDesktopConsentPolicy(data?.team);
}
