import { Button } from "@/components/Button";
import { MessageView } from "@/components/Message";
import { Config } from "@/constants";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as NativeCode from "modules/native-code";
import { useEffect, type FC } from "react";
import { StyleSheet, View } from "react-native";
import type { ParamList, StackRouteConfig } from "../types";
import { isDesktop } from "@/utils/device";

const NotFoundScreen: FC<NativeStackScreenProps<ParamList, "NotFound">> = ({
  navigation,
  route,
}) => {
  useEffect(() => {
    if (!route.path) return;
    const redirectedUrl = `${Config.DASHBOARD_URL}${route.path}`;
    // do not open dashboard login url in the app
    NativeCode.openInBrowser(redirectedUrl);
  }, [route.path]);

  return (
    <View style={styles.root}>
      <MessageView
        title="Not Found"
        description="This page could not be found."
        action={
          <Button
            onPress={() =>
              navigation.replace(isDesktop ? "MainDesktop" : "Main")
            }
          >
            Go Home
          </Button>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export const NotFoundRouteConfig: StackRouteConfig<"NotFound"> = {
  name: "NotFound",
  component: NotFoundScreen,
  options: {
    headerShown: false,
  },
};
