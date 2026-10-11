import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import {
  FREE_TRIAL_CARD_ELEMENT_OPTIONS,
  FREE_TRIAL_DAYS,
  freeTrialIntervalCopy,
  useStartFreeTrial,
} from "@/features/free-trial";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { countries } from "@firefliesai/shared-libs.utils";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
} from "@stripe/react-stripe-js";
import { addDays, format } from "date-fns";
import { type FC, useCallback, useMemo, useState } from "react";
import { Platform, TextInput, View } from "react-native";
import { useOnboarding } from "../../../OnboardingContext";
import { CountryDropdown } from "./CountryDropdown";
import { IntervalToggle } from "./IntervalToggle";
import { Pending3dsPanel } from "./Pending3dsPanel";

/** US ZIP / ZIP+4. Matches Stripe's address_zip validation for US. */
const US_ZIP_RE = /^\d{5}(-\d{4})?$/;

/**
 * Form rendered inside <Elements> so it has access to the `useStripe` /
 * `useElements` hooks via the Stripe context.
 */
export const FreeTrialForm: FC = () => {
  const { freeTrialInterval, setFreeTrialInterval, completeFreeTrial } =
    useOnboarding();

  const [country, setCountry] = useState<string>("US");
  const [countryOpen, setCountryOpen] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [cardValid, setCardValid] = useState({
    number: false,
    expiry: false,
    cvc: false,
  });

  const { submit, loading, pending3ds, retry3ds, cancelPending3ds } =
    useStartFreeTrial({
      trialPeriodDays: FREE_TRIAL_DAYS,
      interval: freeTrialInterval,
      paywall: "onboarding-desktop",
      onCompleted: completeFreeTrial,
    });

  const isUS = country === "US";
  const isZipValid = !isUS || US_ZIP_RE.test(zipCode);

  const isReady =
    cardValid.number &&
    cardValid.expiry &&
    cardValid.cvc &&
    !!country &&
    isZipValid;

  const handleSubmit = useCallback(() => {
    if (!isReady) return;
    void submit({ country, zipCode: isUS ? zipCode : undefined });
  }, [isReady, submit, country, isUS, zipCode]);

  const trialEndsAt = useMemo(
    () => format(addDays(Date.now(), FREE_TRIAL_DAYS), "LLL d, yyyy"),
    [],
  );

  const selectedCountryName = useMemo(
    () => countries.find((c) => c.code === country)?.name ?? "Select country",
    [country],
  );

  if (pending3ds) {
    return <Pending3dsPanel onRetry={retry3ds} onCancel={cancelPending3ds} />;
  }

  return (
    <View style={styles.outer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text
            variant="heading4Weight"
            color="textSecondary"
            textAlign="center"
          >
            Start your {FREE_TRIAL_DAYS} days free trial
          </Text>
          <Text variant="body2Regular" color="textMuted" textAlign="center">
            After trial, you&apos;ll be charged{" "}
            {freeTrialIntervalCopy(freeTrialInterval)}
            {isUS ? " with tax" : ""} starting {trialEndsAt}. Cancel anytime.
          </Text>
        </View>

        <IntervalToggle
          value={freeTrialInterval}
          onChange={setFreeTrialInterval}
        />

        <View style={styles.form}>
          <View style={styles.section}>
            <Text variant="title3Weight" style={styles.formLabel}>
              Card Information
            </Text>
            <View>
              <View style={styles.cardNumberWrap}>
                <CardNumberElement
                  options={FREE_TRIAL_CARD_ELEMENT_OPTIONS}
                  onChange={(event) =>
                    setCardValid((prev) => ({
                      ...prev,
                      number: event.complete,
                    }))
                  }
                />
              </View>

              <View style={styles.cardSplitRow}>
                <View
                  style={[styles.cardSplitField, styles.cardSplitFieldFirst]}
                >
                  <CardExpiryElement
                    options={FREE_TRIAL_CARD_ELEMENT_OPTIONS}
                    onChange={(event) =>
                      setCardValid((prev) => ({
                        ...prev,
                        expiry: event.complete,
                      }))
                    }
                  />
                </View>
                <View
                  style={[
                    styles.cardSplitField,
                    isUS
                      ? styles.cardSplitFieldMiddle
                      : styles.cardSplitFieldLast,
                  ]}
                >
                  <CardCvcElement
                    options={FREE_TRIAL_CARD_ELEMENT_OPTIONS}
                    onChange={(event) =>
                      setCardValid((prev) => ({
                        ...prev,
                        cvc: event.complete,
                      }))
                    }
                  />
                </View>
                {isUS && (
                  <View
                    style={[styles.cardSplitField, styles.cardSplitFieldLast]}
                  >
                    <TextInput
                      value={zipCode}
                      onChangeText={setZipCode}
                      placeholder="ZIP CODE"
                      placeholderTextColor="rgba(255, 255, 255, 0.2)"
                      inputMode="numeric"
                      maxLength={10}
                      style={[styles.zipInput, ZIP_INPUT_WEB_STYLE]}
                    />
                  </View>
                )}
              </View>
            </View>
          </View>

          <CountryDropdown
            isOpen={countryOpen}
            onToggle={() => setCountryOpen((v) => !v)}
            onSelect={(code) => {
              setCountry(code);
              setCountryOpen(false);
            }}
            selectedLabel={selectedCountryName}
          />

          <View style={styles.payRow}>
            <Text variant="body2Regular" color="commandNeutralDisabled">
              Pay today
            </Text>
            <Text variant="body2Weight" color="textSecondary">
              $0.00
            </Text>
          </View>
        </View>

        <Button
          variant="primary"
          size="md"
          disabled={!isReady || loading}
          onPress={handleSubmit}
          style={[
            styles.submitButton,
            (!isReady || loading) && styles.submitButtonDisabled,
          ]}
        >
          <Text
            variant="label2Weight"
            style={
              !isReady || loading
                ? styles.submitButtonTextDisabled
                : styles.submitButtonText
            }
          >
            {loading ? "Starting trial…" : "Start Free Trial"}
          </Text>
        </Button>
      </View>
    </View>
  );
};

/**
 * Applied inline on the ZIP `TextInput` rather than via `createStyles`, since
 * `createStyles` -> `StyleSheet.create` strips CSS shorthands like `outline`
 * on react-native-web, leaving the browser's default focus ring visible.
 * Inline styles bypass that filtering.
 */
const ZIP_INPUT_WEB_STYLE =
  Platform.OS === "web" ? ({ outline: "none" } as object) : undefined;

const styles = createStyles({
  outer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 16,
  },
  container: {
    width: 480,
    alignItems: "stretch",
    gap: 32,
  },
  header: {
    gap: 12,
    alignItems: "center",
  },
  form: {
    gap: 20,
    // Elevate the form so its absolutely-positioned country dropdown can
    // paint above the later sibling submit button.
    zIndex: 10,
  },
  section: {
    gap: 16,
  },
  formLabel: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  cardNumberWrap: {
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: DESKTOP_THEME.grey900,
    borderColor: "#2F2F32",
    borderWidth: 1,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: -1,
  },
  cardSplitRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 0,
  },
  cardSplitField: {
    flex: 1,
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: DESKTOP_THEME.grey900,
    borderColor: "#2F2F32",
    borderWidth: 1,
  },
  cardSplitFieldFirst: {
    borderRightWidth: 0,
    borderBottomLeftRadius: 4,
  },
  cardSplitFieldMiddle: {
    borderRightWidth: 0,
  },
  cardSplitFieldLast: {
    borderBottomRightRadius: 4,
  },
  zipInput: {
    flex: 1,
    height: "100%",
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter, system-ui, sans-serif",
    padding: 0,
    margin: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    outlineWidth: 0,
  },
  payRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  submitButton: {
    alignSelf: "center",
    width: 280,
    backgroundColor: DESKTOP_THEME.purple600,
    marginTop: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: DESKTOP_THEME.purple1200,
  },
  submitButtonText: {
    color: DESKTOP_THEME.grey100,
  },
  submitButtonTextDisabled: {
    color: DESKTOP_THEME.grey700,
  },
});
