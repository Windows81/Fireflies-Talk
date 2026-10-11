import { RefreshControl } from "@/components/RefreshControl";
import { Text } from "@/components/Typography";
import { useUpload } from "@/features/upload";
import { useFetchUploadedFilesQuery } from "@/graphql";
import { Link } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, type FC } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import type { ParamList } from "../types";
import { UploadingFileList } from "./components/UploadingFileList";
import { UserFileList } from "./components/UserFileList";
import { RouteNames } from "@/constants";

export const UploadScreen: FC<
  NativeStackScreenProps<ParamList, "Upload">
> = () => {
  const { uploads } = useUpload();

  const { data, loading, refetch, error } = useFetchUploadedFilesQuery({
    fetchPolicy: "cache-and-network",
    pollInterval: 15 * 1000,
  });

  useEffect(() => {
    // every time an upload is completed, we should reload
    refetch();
  }, [uploads.length, refetch]);

  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={!!data?.fetchUploadedFiles && loading}
          onRefresh={refetch}
        />
      }
    >
      {Boolean(uploads.length) && (
        <View style={styles.section}>
          <View style={styles.header}>
            <Text fontWeight="500" fontSize={16}>
              Uploading Files
            </Text>
            <Text color="textMuted">
              Closing the application will stop them from completing.
            </Text>
          </View>
          <UploadingFileList uploadTasks={uploads} />
        </View>
      )}
      <View style={styles.section}>
        <View style={styles.header}>
          <Text fontWeight="500" fontSize={16}>
            Past Files
          </Text>
          <Text color="textMuted">
            Past uploaded files and their processing statuses.
          </Text>
          <Text color="textMuted" variant="label3Regular">
            Note: Uploaded recordings can be found on the{" "}
            <Link
              screen={RouteNames.MeetingStatus}
              style={{
                textDecorationLine: "underline",
              }}
            >
              Meeting Status
            </Link>{" "}
            screen.
          </Text>
        </View>
        <UserFileList
          fetchUploadedFiles={data?.fetchUploadedFiles}
          loading={loading}
          error={error}
          refetch={refetch}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 48,
  },
  header: {
    gap: 4,
    marginBottom: 24,
  },
  section: {},
});
