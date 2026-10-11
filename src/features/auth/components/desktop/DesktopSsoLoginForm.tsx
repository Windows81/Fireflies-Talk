import { Button } from "@/components/Button";
import { TextInput } from "@/components/Input";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { CanceledError, captureException } from "@/errors";
import {
  useGetUserLoginOptionsLazyQuery,
  type SsoLoginOption,
} from "@/graphql";
import { createStyles, vars } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { useState, type FC } from "react";
import { Pressable, View } from "react-native";
import {
  EMAIL_REGEX,
  NO_SSO_CONFIGURED_MESSAGE,
  extractSsoErrorMessage,
} from "../../ssoOptions";
import { authApi } from "../../store";

export const DesktopSsoLoginForm: FC<{ onBack: () => void }> = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState("");
  const [ssoOptions, setSsoOptions] = useState<SsoLoginOption[] | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const [fetchLoginOptions, { loading }] = useGetUserLoginOptionsLazyQuery({
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      const options = data?.getUserLoginOptions?.ssoOptions;
      if (!options?.length) {
        setValidationError(NO_SSO_CONFIGURED_MESSAGE);
        return;
      }
      if (options.length === 1) {
        startSso(options[0].url);
        return;
      }
      setSsoOptions(options);
    },
    onError: (error) => {
      setValidationError(extractSsoErrorMessage(error));
    },
  });

  const startSso = (ssoUrl: string) => {
    setRedirecting(true);
    authApi.authorizeSso(ssoUrl).catch((error) => {
      if (error instanceof CanceledError) return;
      setRedirecting(false);
      captureException(error, { tags: { section: "sso-login" } });
      toast({ message: error.message });
    });
  };

  const handleSubmit = () => {
    setValidationError("");
    setSsoOptions(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setValidationError("Please enter your work email.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    fetchLoginOptions({ variables: { email: trimmed } });
  };

  const isBusy = loading || redirecting;

  if (ssoOptions) {
    return (
      <View style={styles.root}>
        <Text
          variant="body2Regular"
          color="textSecondary"
          style={styles.description}
        >
          Multiple SSO providers are available for your organization. Select one
          to continue.
        </Text>
        <View style={styles.optionList}>
          {ssoOptions.map((option, index) => (
            <Pressable
              key={option.url}
              style={styles.optionButton}
              onPress={() => startSso(option.url)}
              disabled={redirecting}
              tabIndex={-1}
            >
              <Text variant="label1Weight" color="textSecondary">
                {option.label || `Sign in with SSO ${index + 1}`}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => setSsoOptions(null)} disabled={redirecting}>
          <Text variant="body2Regular" color="textHint" style={styles.backLink}>
            Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text
        variant="body2Regular"
        color="textSecondary"
        style={styles.description}
      >
        Enter your work email and we&apos;ll redirect you to your company&apos;s
        sign-in page.
      </Text>
      <TextInput
        value={email}
        onValueChange={setEmail}
        placeholder="name@company.com"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        autoFocus
        enterKeyHint="go"
        onSubmitEditing={handleSubmit}
        style={styles.input}
      />
      {validationError ? (
        <Text
          variant="body3Regular"
          color="informationStaticRedText"
          style={styles.error}
        >
          {validationError}
        </Text>
      ) : null}
      <Button variant="primary" onPress={handleSubmit} disabled={isBusy}>
        {isBusy ? "Checking SSO configuration..." : "Continue"}
      </Button>
      <Pressable onPress={onBack}>
        <Text variant="body2Regular" color="textHint" style={styles.backLink}>
          Back to login
        </Text>
      </Pressable>
    </View>
  );
};

const styles = createStyles({
  root: {
    width: "100%",
    gap: 12,
  },
  description: {
    textAlign: "center",
  },
  input: {
    width: "100%",
  },
  error: {
    textAlign: "left",
  },
  backLink: {
    textAlign: "center",
    marginTop: 4,
  },
  optionList: {
    width: "100%",
    gap: 8,
  },
  optionButton: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey900,
    backgroundColor: DESKTOP_THEME.grey1000,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    ...vars.elevations[1],
  },
});
