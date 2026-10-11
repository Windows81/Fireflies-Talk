import { IconCalendar, IconLogo, IconMail } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Select } from "@/components/Input";
import { Switch } from "@/components/Switch";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import {
  AUTO_JOIN_OPTIONS,
  AutoJoin,
  MANUAL_AUTO_JOIN_OPTION,
  SEND_NOTES_TO_OPTIONS,
  SendNotesTo,
} from "@/constants";
import { storage as localStorageOrMemory } from "@/features/storage";
import {
  EnumLoginPageVersion,
  EnumOnboardingStep,
  useGetCurrentUserQuery,
  useSaveOptionsMutation,
} from "@/graphql";
import { useContext, useEffect, useState, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { OnboardingContext } from "../Context";
import { HeaderBlock } from "../components/HeaderBlock";
import { TitleHeader } from "../components/HeaderTitle";

const AutoJoinAndRecapLabel: FC<{
  title: string;
  description: string;
}> = ({ title, description }) => {
  return (
    <View style={styles.label}>
      <Text variant="title2Weight">{title}</Text>
      <Text variant="body2Regular" color="textMuted">
        {description}
      </Text>
    </View>
  );
};

export const AutoJoinAndRecapTab: FC = () => {
  const {
    autoJoin,
    setAutoJoin,
    enableAutojoin,
    setEnableAutojoin,
    sendNotesTo,
    setSendNotesTo,
  } = useContext(OnboardingContext);

  const { data: dataUser } = useGetCurrentUserQuery();

  return (
    <View style={styles.root}>
      <HeaderBlock>
        <IconLogo width={24} height={24} />
      </HeaderBlock>
      <TitleHeader title={`Automatically transcribe\nyour meetings`} />
      <View style={styles.form}>
        <View style={styles.field}>
          <View style={styles.row}>
            <AutoJoinAndRecapLabel
              title="Auto-join calendar meetings"
              description="Fireflies Notetaker automatically joins calendar meetings and take notes for you."
            />
            <Switch
              value={enableAutojoin}
              onValueChange={setEnableAutojoin}
              aria-label="Enable Auto-join calendar meetings"
            />
          </View>
          {enableAutojoin ? (
            <Select
              value={autoJoin}
              onValueChange={setAutoJoin}
              options={AUTO_JOIN_OPTIONS(dataUser?.user)}
              Icon={IconCalendar}
            />
          ) : (
            <Select
              value={AutoJoin.Manual}
              onValueChange={() => {}}
              options={[MANUAL_AUTO_JOIN_OPTION]}
              Icon={IconCalendar}
              disabled
            />
          )}
        </View>
        <View style={styles.field}>
          <AutoJoinAndRecapLabel
            title="Share meeting recap"
            description="Once meeting is transcribed, Fireflies automatically emails meeting recap to selected participant(s)."
          />
          <Select
            value={sendNotesTo}
            onValueChange={setSendNotesTo}
            options={SEND_NOTES_TO_OPTIONS(dataUser?.user)}
            Icon={IconMail}
          />
        </View>
      </View>
    </View>
  );
};

export const AutoJoinAndRecapFooter: FC = () => {
  const { completeStep, autoJoin, sendNotesTo, enableAutojoin } =
    useContext(OnboardingContext);

  const [saveOptions, { loading }] = useSaveOptionsMutation({
    variables: {
      autoJoin: enableAutojoin ? autoJoin : AutoJoin.Manual,
      sendNotesTo,
    },
    onError(err) {
      toast({
        title: "Could not save auto-join and recap option",
        message: err.message,
        type: "error",
      });
    },
  });

  const onPress = () => {
    saveOptions().finally(() => {
      // there is no skip for this step
      // so even if there is an error, we should still
      // allow the user to continue
      const loginPageVersion = localStorageOrMemory.getItem("loginPageVariant");
      const validVersions: string[] = Object.values(EnumLoginPageVersion);
      const isValidVersion =
        loginPageVersion && validVersions.includes(loginPageVersion);

      completeStep({
        step: EnumOnboardingStep.Setup,
        skip: false,
        extraInfo: {
          autoJoin,
          sendNotesTo,
          ...(isValidVersion
            ? { loginPageVersion: loginPageVersion as EnumLoginPageVersion }
            : {}),
        },
      });
    });
  };

  return (
    <Button onPress={onPress} disabled={loading}>
      Next
    </Button>
  );
};

export const useAutoJoinAndRecapStates = () => {
  const { data: dataUser } = useGetCurrentUserQuery();

  const [enableAutojoin, setEnableAutojoin] = useState(false);
  const [autoJoin, setAutoJoin] = useState(AutoJoin.Auto);
  const [sendNotesTo, setSendNotesTo] = useState(SendNotesTo.Me);

  useEffect(() => {
    if (dataUser?.user?.autoJoin) {
      if (dataUser.user.autoJoin !== AutoJoin.Manual) {
        setAutoJoin(dataUser.user.autoJoin as AutoJoin);
        setEnableAutojoin(true);
      } else {
        setEnableAutojoin(false);
      }
    }
    if (dataUser?.user?.sendNotesTo) {
      setSendNotesTo(dataUser.user.sendNotesTo as SendNotesTo);
    }
  }, [dataUser?.user?.autoJoin, dataUser?.user?.sendNotesTo]);

  return {
    enableAutojoin,
    setEnableAutojoin,
    autoJoin,
    setAutoJoin,
    sendNotesTo,
    setSendNotesTo,
  };
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  form: {
    marginTop: 56,
    gap: 40,
  },
  label: {
    gap: 4,
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  field: {
    gap: 20,
  },
});
