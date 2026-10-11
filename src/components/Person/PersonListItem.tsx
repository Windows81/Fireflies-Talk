import { IconX } from "@/assets/svg";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { TouchableOpacity, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { Avatar } from "../Avatar";
import { Text } from "../Typography";

export const PersonGroupListItem: FC<{
  Icon: FC<SvgProps>;
  title: string;
  description?: string;
}> = ({ Icon, title, description }) => {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <View style={styles.leading}>
        <View style={styles.currentIcon(theme)}>
          <Icon width={16} height={16} color={theme.colors.textSecondary} />
        </View>
        <View>
          <Text color="textPrimary" variant="body2Regular">
            {title}
          </Text>
          <Text color="textHint" variant="body3Regular">
            {description}
          </Text>
        </View>
      </View>
    </View>
  );
};

export const PersonListItem: FC<{
  email: string;
  name?: string | null;
  photoUrl?: string | null;
  remove?: {
    label: string;
    loading?: boolean;
    onPress: () => void;
  };
}> = ({ email, name, photoUrl, remove }) => {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <View style={styles.leading}>
        <Avatar size={24} name={name || email} picture={photoUrl} />
        <View>
          <Text color="textPrimary" variant="body2Regular">
            {name || email}
          </Text>
          {name && email && (
            <Text color="textHint" variant="body3Regular">
              {email}
            </Text>
          )}
        </View>
      </View>
      {remove && (
        <TouchableOpacity
          style={styles.clear}
          onPress={remove.onPress}
          aria-label="Remove"
          disabled={remove.loading}
        >
          <IconX width={20} height={20} color={theme.colors.textHint} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  currentIcon: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral3Default,
    borderRadius: 8,
    width: 27,
    height: 27,
    alignItems: "center",
    justifyContent: "center",
  }),
  leading: {
    flexDirection: "row",
    gap: 10,
    flex: 1,
    alignItems: "center",
  },
  clear: {
    padding: 4,
  },
});
