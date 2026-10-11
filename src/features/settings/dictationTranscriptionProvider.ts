import { dictationLanguagesSupportedByAssembly } from "./dictationLanguages";

export const DICTATION_TRANSCRIPTION_PROVIDERS = [
  "elevenlabs",
  "assembly",
  "assembly-chunked",
  // Scribe through the dictation service's WebSocket, which also cleans up the text.
  "stream",
] as const;

export type DictationTranscriptionProvider =
  (typeof DICTATION_TRANSCRIPTION_PROVIDERS)[number];

export const DEFAULT_DICTATION_TRANSCRIPTION_PROVIDER: DictationTranscriptionProvider =
  "elevenlabs";

export function isDictationTranscriptionProvider(
  value: unknown,
): value is DictationTranscriptionProvider {
  return (
    typeof value === "string" &&
    (DICTATION_TRANSCRIPTION_PROVIDERS as readonly string[]).includes(value)
  );
}

export function isAssemblyDictationProvider(
  provider: unknown,
): provider is Extract<
  DictationTranscriptionProvider,
  "assembly" | "assembly-chunked"
> {
  return provider === "assembly" || provider === "assembly-chunked";
}

export function normalizeDictationTranscriptionProvider(
  value: unknown,
): DictationTranscriptionProvider {
  return isDictationTranscriptionProvider(value)
    ? value
    : DEFAULT_DICTATION_TRANSCRIPTION_PROVIDER;
}

export function resolveDictationTranscriptionProvider(options: {
  stored: unknown;
  experimentValue: unknown;
}): DictationTranscriptionProvider {
  if (isDictationTranscriptionProvider(options.stored)) {
    return options.stored;
  }
  return normalizeDictationTranscriptionProvider(options.experimentValue);
}

/**
 * Assembly stays selected for a single explicit language it supports, and the
 * stream for any mix of the dictation service's languages. Scribe in the app
 * handles the rest.
 */
export function effectiveDictationTranscriptionProvider(options: {
  stored: unknown;
  experimentValue: unknown;
  languageHints: readonly string[];
}): DictationTranscriptionProvider {
  const resolved = resolveDictationTranscriptionProvider(options);
  const { languageHints } = options;

  // The stream's server accepts the same languages as Assembly, in any number.
  if (resolved === "stream") {
    return dictationLanguagesSupportedByAssembly(languageHints)
      ? "stream"
      : "elevenlabs";
  }
  if (!isAssemblyDictationProvider(resolved)) return resolved;
  if (languageHints.length !== 1) return "elevenlabs";
  if (!dictationLanguagesSupportedByAssembly(languageHints)) {
    return "elevenlabs";
  }
  return resolved;
}

export function assignedDictationTranscriptionProvider(options: {
  source: string;
  value: unknown;
}): DictationTranscriptionProvider {
  switch (options.source) {
    case "experiment":
    case "force":
    case "override":
      return normalizeDictationTranscriptionProvider(options.value);
    // Product default is elevenlabs, not GrowthBook's dashboard defaultValue.
    default:
      return DEFAULT_DICTATION_TRANSCRIPTION_PROVIDER;
  }
}

/** v12 stored elevenlabs for everyone; only keep a real AssemblyAI choice. */
export function migrateDictationTranscriptionProviderOverride(
  stored: unknown,
): DictationTranscriptionProvider | null {
  return isAssemblyDictationProvider(stored) ? stored : null;
}
