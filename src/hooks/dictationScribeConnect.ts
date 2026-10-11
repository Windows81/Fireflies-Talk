import {
  Scribe,
  type AudioOptions,
  type RealtimeConnection,
} from "@elevenlabs/client";

type ScribeUriBuilder = {
  buildWebSocketUri: (options: AudioOptions) => string;
};

export function appendScribeLanguageHints(
  websocketUri: string,
  languageCodes: readonly string[],
): string {
  if (!languageCodes.length) return websocketUri;

  const url = new URL(websocketUri);
  for (const code of languageCodes) {
    url.searchParams.append("secondary_languages", code);
  }
  return url.toString();
}

/**
 * Opens a Scribe realtime session and attaches selected languages as
 * `secondary_languages` query params (language hints). The 1.15 client has no
 * `secondaryLanguages` option, so this wraps `buildWebSocketUri` for one call.
 */
export function connectScribeRealtime(
  options: AudioOptions & { languageHints?: string[] },
): RealtimeConnection {
  const { languageHints = [], ...connectOptions } = options;
  const scribe = Scribe as unknown as ScribeUriBuilder;
  const buildWebSocketUri = scribe.buildWebSocketUri;
  if (!languageHints.length || typeof buildWebSocketUri !== "function") {
    return Scribe.connect(connectOptions);
  }

  scribe.buildWebSocketUri = (nextOptions: AudioOptions) =>
    appendScribeLanguageHints(
      buildWebSocketUri.call(Scribe, nextOptions),
      languageHints,
    );
  try {
    return Scribe.connect(connectOptions);
  } finally {
    scribe.buildWebSocketUri = buildWebSocketUri;
  }
}
