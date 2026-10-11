import type * as ShareTarget from "@/modules/share-target";
import { getMimeType, patchAndroidMimeType } from "@/utils/mime";

export function formatShareData(
  data: ShareTarget.ShareData,
): ShareTarget.ShareData {
  if (data.files) {
    return {
      ...data,
      files: data.files.map((file) => {
        let type = file.type;
        if (!type) {
          type =
            (file.name && getMimeType(file.name)) ||
            (file.uri && getMimeType(file.uri)) ||
            undefined;
        } else {
          type = patchAndroidMimeType(type, [file.uri, file.name]);
        }
        return {
          ...file,
          type,
        };
      }),
    };
  }
  return data;
}
