import { IconLogoText } from "@/assets/svg";
import { LinkText, Text } from "@/components/Typography";
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from "@/constants";
import { useTheme } from "@/styles";
import type { FC } from "react";
import { StyleSheet } from "react-native";

export const Header: FC = () => {
  const theme = useTheme();

  return (
    <>
      <IconLogoText height={36} color={theme.colors.textPrimary} />
      <>
        <Text
          variant={"heading4Weight"}
          style={styles.heading}
          allowFontScaling={false}
        >
          Automate your meeting notes
        </Text>
        <Text
          variant="body1Regular"
          style={styles.subheadingExperiment}
          color="textSecondary"
          allowFontScaling={false}
        >
          {
            "Record, transcribe, search and analyze all your online and in-person conversations."
          }
        </Text>
      </>

      <Text
        variant="body3Regular"
        color="textHint"
        style={styles.policyText}
        allowFontScaling={false}
      >
        By clicking &quot;Continue&quot;, you agree to our{" "}
        {/* By clicking one of the &quot;Continue&quot; buttons below, you agree
          to the{" "} */}
        <LinkText
          href={TERMS_OF_SERVICE_URL}
          color="textBrand"
          variant="body3Regular"
        >
          Terms of Service,
        </LinkText>{" "}
        acknowledge{" "}
        <LinkText
          href={PRIVACY_POLICY_URL}
          color="textBrand"
          variant="body3Regular"
        >
          Privacy Policy
        </LinkText>{" "}
        &amp; consent to Fireflies recording and using your voice data to
        provide Fireflies&apos; services.
      </Text>
    </>
  );
};

const styles = StyleSheet.create({
  heading: {
    marginTop: 58,
    textAlign: "center",
    width: "100%",
  },
  subheading: {
    marginTop: 8,
    maxWidth: 324,
    textAlign: "center",
    lineHeight: 24,
  },
  subheadingExperiment: {
    opacity: 0.9,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 24,
    width: "100%",
    fontWeight: "400",
  },
  policyText: {
    marginVertical: 32,
    textAlign: "center",
    lineHeight: 16,
  },
  newPolicyText: {
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 348,
    alignSelf: "center",
  },
});
