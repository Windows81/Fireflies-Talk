import { Config } from "@/constants";
import { type FC, useEffect } from "react";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { isDesktop } from "@/utils/device";

export const DashboardWebview: FC<{
  path: string;
}> = ({ path }) => {
  const uri = `${Config.DASHBOARD_URL}${path}`;
  const navigation = useNavigation();

  useEffect(() => {
    if (isDesktop) {
      void Linking.openURL(uri);
      navigation.goBack();
    }
  }, [uri, navigation]);

  if (isDesktop) {
    return null;
  }

  return (
    <iframe
      src={uri}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        border: "none",
        outline: "none",
      }}
    />
  );
};
