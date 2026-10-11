import { Text } from "@/components/Typography";
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from "@/constants";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC, PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

const InlineButton: FC<PropsWithChildren<{ href: string }>> = ({
  href,
  children,
}) => (
  <Text
    style={styles.linkText}
    {...({ href, target: "_blank", tabIndex: -1 } as object)}
  >
    {children}
  </Text>
);

export const DesktopLoginPrivacyPolicy: FC = () => {
  return (
    <View style={styles.footer}>
      <Text
        variant="body2LongRegular"
        style={styles.termNotice}
        color="textMuted"
        allowFontScaling={false}
      >
        {`By clicking "Continue", you agree to our `}
        <InlineButton href={TERMS_OF_SERVICE_URL}>
          Terms of Service
        </InlineButton>
        {`, acknowledge `}
        <InlineButton href={PRIVACY_POLICY_URL}>Privacy Policy</InlineButton>
        {` & consent to Fireflies recording and using your voice data to provide Fireflies' services.`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    alignSelf: "center",
    marginTop: 20,
    width: "100%",
    maxWidth: 486,
    alignItems: "center",
  },
  securedText: {
    color: "#054F31",
    fontSize: 10,
  },
  termNotice: {
    textAlign: "center",
  },
  linkText: {
    textDecorationLine: "underline",
    cursor: "pointer",
    color: DESKTOP_THEME.grey400,
  },
});
