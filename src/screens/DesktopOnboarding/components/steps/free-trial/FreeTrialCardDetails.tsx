import { Text } from "@/components/Typography";
import { getStripe } from "@/features/free-trial";
import { createStyles } from "@/styles";
import { Elements } from "@stripe/react-stripe-js";
import { type FC, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { FreeTrialForm } from "./FreeTrialForm";

/**
 * Top-level wrapper that lazily loads Stripe.js and mounts the Elements provider.
 * If the publishable key is missing (e.g. mobile build), we render a fallback so
 * the trial step still mounts but no payment surface is shown.
 */
export const FreeTrialCardDetails: FC = () => {
  const stripeRef = useRef<ReturnType<typeof getStripe> | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [stripeMissing, setStripeMissing] = useState(false);

  useEffect(() => {
    stripeRef.current = getStripe();
    void stripeRef.current.then((stripe) => {
      if (!stripe) {
        setStripeMissing(true);
        return;
      }
      setStripeLoaded(true);
    });
  }, []);

  if (stripeMissing) {
    return (
      <View style={styles.outer}>
        <Text variant="body2Regular" color="textHint" textAlign="center">
          We couldn&apos;t load the secure payment form. Please try again in a
          moment, or reach out to support@fireflies.ai if this keeps happening.
        </Text>
      </View>
    );
  }

  if (!stripeLoaded || !stripeRef.current) {
    return <View style={styles.outer} />;
  }

  return (
    <Elements stripe={stripeRef.current}>
      <FreeTrialForm />
    </Elements>
  );
};

const styles = createStyles({
  outer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 16,
  },
});
