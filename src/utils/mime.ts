import { Mime } from "mime";
// @ts-ignore: type defs for this sub-module is not published
import otherTypes from "mime/types/other";
// @ts-ignore: type defs for this sub-module is not published
import standardTypes from "mime/types/standard";

const mime = new Mime(standardTypes, otherTypes);
// we redefine some undesired or missing types
// some undesired types do have the correct extension in getAllExtensions
// but the preferred extension is different
mime.define(
  {
    "audio/aac": ["aac", "adts"],
    "audio/mpeg": ["mp3", "mpga", "mp2", "mp2a", "m2a", "m3a"],
    "audio/ogg": ["ogg", "oga", "spx", "opus"],
    "audio/webm": ["webm", "weba"],
    "audio/flac": ["flac"],
    "audio/x-aiff": ["aiff", "aif"],
    "audio/opus": ["opus"],
    "audio/wav": ["wav"],
    "audio/vnd.wave": ["wav"],
    "video/quicktime": ["mov", "qt"],
    "video/mpeg": ["mpg", "mpeg", "mpe", "m1v", "m2v"],
  },
  true,
);

const patchedMimeType: Record<string, string> = {
  "application/mp4": "video/mp4",
  "audio/vnd.wave": "audio/wav",
};

export function getMimeType(uri: string) {
  const type = mime.getType(uri);
  if (!type) return null;
  if (type in patchedMimeType) return patchedMimeType[type];
  return type;
}

export function getExtensionFromMimeType(mimeType: string) {
  const ext = mime.getExtension(mimeType);
  if (!ext) return null;
  return ext;
}

// we consider both the uri and the name because sometimes
// the uri is a mask (eg. UUID with no extension)
export function patchAndroidMimeType(mimeType: string, uriOrNames: string[]) {
  // https://github.com/tuskyapp/Tusky/issues/3189#issuecomment-1396221671
  if (uriOrNames.some((s) => s.endsWith(".m4a"))) return "audio/mp4";
  return mimeType;
}
