import { apolloClient } from "@/graphql";
import { TrackPaywallShownDocument } from "@firefliesai/tracking-ff.graphql-client";
import { useAuth } from "@/features/auth";

export const trackPaywallShown = ({
  paywall,
  from,
}: {
  paywall: string;
  from: string;
}) => {
  const { user } = useAuth.getState();
  if (user) {
    void apolloClient.mutate({
      mutation: TrackPaywallShownDocument,
      variables: {
        paywall,
        from,
        source: "mobile-ff",
      },
    });
  }
};
