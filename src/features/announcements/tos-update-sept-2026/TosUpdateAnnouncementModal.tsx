import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { LinkText, Text } from "@/components/Typography";
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from "@/constants";
import { useEffect, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { isMobile } from "@/utils/device";
import { useTosUpdate } from "./useTosUpdate";

const SUPPORT_EMAIL = "support@fireflies.ai";

/**
 * Re-prompts existing users to accept the September 2026 Terms of Service and
 * Privacy Policy. Not dismissable: the dialog gets no `close`, so the backdrop
 * and Android back do nothing until "Continue" records the acceptance.
 */
export const TosUpdateAnnouncementModal: FC<{
  isOpen: boolean;
  open(): void;
  close(): void;
}> = ({ isOpen, open, close }) => {
  const { shouldShow, acceptTos } = useTosUpdate();

  // Mobile-only announcement: desktop and web are never prompted here.
  useEffect(() => {
    if (isMobile && shouldShow) open();
  }, [shouldShow, open]);

  const accept = () => {
    acceptTos();
    close();
  };

  return (
    <Dialog.Root variant="bottomSheet" isOpen={isOpen}>
      <SafeAreaView
        style={styles.root}
        edges={{ top: "off", right: "off", bottom: "maximum", left: "off" }}
      >
        <View style={styles.heading}>
          <Text variant="heading4Weight">
            🔒 We&apos;ve updated our Terms of Service and Privacy Policy.
          </Text>
          <Text variant="body1Regular" color="textSecondary">
            By clicking &apos;Continue&apos;, you agree to the updated{" "}
            <LinkText
              href={TERMS_OF_SERVICE_URL}
              color="textBrand"
              variant="body1Regular"
            >
              Terms of Service
            </LinkText>{" "}
            and acknowledge the updated{" "}
            <LinkText
              href={PRIVACY_POLICY_URL}
              color="textBrand"
              variant="body1Regular"
            >
              Privacy Policy
            </LinkText>
            . You also consent to Fireflies automatically recording and using
            your voice and data derived from your voice to provide
            Fireflies&apos; services
          </Text>
          <Text variant="body2Regular" color="textHint">
            If you have any concerns, reach out to{" "}
            <LinkText
              href={`mailto:${SUPPORT_EMAIL}`}
              color="textHint"
              variant="body2Regular"
            >
              {SUPPORT_EMAIL}
            </LinkText>
          </Text>
        </View>
        <View style={styles.footer}>
          <Button size="lg" onPress={accept}>
            Continue
          </Button>
        </View>
      </SafeAreaView>
    </Dialog.Root>
  );
};

const styles = StyleSheet.create({
  root: {
    padding: 24,
  },
  heading: {
    gap: 12,
  },
  footer: {
    marginTop: 40,
  },
});
