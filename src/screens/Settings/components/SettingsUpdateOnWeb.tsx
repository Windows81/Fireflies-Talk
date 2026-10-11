import { LinkText, Text } from "@/components/Typography";
import type { FC } from "react";
import { View } from "react-native";

export const SettingsUpdateOnWeb: FC<{ label: string; url: string }> = ({
  label,
  url,
}) => {
  const urlObj = new URL(url);
  return (
    <View>
      <Text variant="body1Regular" color="textMuted">
        You can change your {label} on the web at{" "}
        <LinkText href={url} color="textBrand" variant="body1Regular">
          {`${urlObj.hostname}${urlObj.pathname}`}
        </LinkText>
        .
      </Text>
    </View>
  );
};
