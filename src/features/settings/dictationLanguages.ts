/**
 * Scribe v2 Realtime languages from ElevenLabs STT docs (ISO-639-3).
 * https://elevenlabs.io/docs/overview/capabilities/speech-to-text#supported-languages
 */
export const SCRIBE_V2_REALTIME_LANGUAGES = [
  { code: "afr", name: "Afrikaans", alt: ["af"] },
  { code: "amh", name: "Amharic", alt: ["am"] },
  { code: "ara", name: "Arabic", alt: ["ar"] },
  { code: "hye", name: "Armenian", alt: ["hy"] },
  { code: "asm", name: "Assamese", alt: ["as"] },
  { code: "ast", name: "Asturian" },
  { code: "aze", name: "Azerbaijani", alt: ["az"] },
  { code: "bel", name: "Belarusian", alt: ["be"] },
  { code: "ben", name: "Bengali", alt: ["bn"] },
  { code: "bos", name: "Bosnian", alt: ["bs"] },
  { code: "bul", name: "Bulgarian", alt: ["bg"] },
  { code: "mya", name: "Burmese", alt: ["my"] },
  { code: "yue", name: "Cantonese" },
  { code: "cat", name: "Catalan", alt: ["ca"] },
  { code: "ceb", name: "Cebuano" },
  { code: "nya", name: "Chichewa", alt: ["ny"] },
  { code: "hrv", name: "Croatian", alt: ["hr"] },
  { code: "ces", name: "Czech", alt: ["cs"] },
  { code: "dan", name: "Danish", alt: ["da"] },
  { code: "nld", name: "Dutch", alt: ["nl"] },
  { code: "eng", name: "English", alt: ["en"] },
  { code: "est", name: "Estonian", alt: ["et"] },
  { code: "fil", name: "Filipino" },
  { code: "fin", name: "Finnish", alt: ["fi"] },
  { code: "fra", name: "French", alt: ["fr"] },
  { code: "ful", name: "Fulah", alt: ["ff"] },
  { code: "glg", name: "Galician", alt: ["gl"] },
  { code: "lug", name: "Ganda", alt: ["lg"] },
  { code: "kat", name: "Georgian", alt: ["ka"] },
  { code: "deu", name: "German", alt: ["de"] },
  { code: "ell", name: "Greek", alt: ["el"] },
  { code: "guj", name: "Gujarati", alt: ["gu"] },
  { code: "hau", name: "Hausa", alt: ["ha"] },
  { code: "heb", name: "Hebrew", alt: ["he"] },
  { code: "hin", name: "Hindi", alt: ["hi"] },
  { code: "hun", name: "Hungarian", alt: ["hu"] },
  { code: "isl", name: "Icelandic", alt: ["is"] },
  { code: "ibo", name: "Igbo", alt: ["ig"] },
  { code: "ind", name: "Indonesian", alt: ["id"] },
  { code: "gle", name: "Irish", alt: ["ga"] },
  { code: "ita", name: "Italian", alt: ["it"] },
  { code: "jpn", name: "Japanese", alt: ["ja"] },
  { code: "jav", name: "Javanese", alt: ["jv"] },
  { code: "kea", name: "Kabuverdianu" },
  { code: "kan", name: "Kannada", alt: ["kn"] },
  { code: "kaz", name: "Kazakh", alt: ["kk"] },
  { code: "khm", name: "Khmer", alt: ["km"] },
  { code: "kor", name: "Korean", alt: ["ko"] },
  { code: "kur", name: "Kurdish", alt: ["ku"] },
  { code: "kir", name: "Kyrgyz", alt: ["ky"] },
  { code: "lao", name: "Lao", alt: ["lo"] },
  { code: "lav", name: "Latvian", alt: ["lv"] },
  { code: "lin", name: "Lingala", alt: ["ln"] },
  { code: "lit", name: "Lithuanian", alt: ["lt"] },
  { code: "luo", name: "Luo" },
  { code: "ltz", name: "Luxembourgish", alt: ["lb"] },
  { code: "mkd", name: "Macedonian", alt: ["mk"] },
  { code: "msa", name: "Malay", alt: ["ms"] },
  { code: "mal", name: "Malayalam", alt: ["ml"] },
  { code: "mlt", name: "Maltese", alt: ["mt"] },
  { code: "zho", name: "Mandarin Chinese", alt: ["zh", "cmn"] },
  { code: "mri", name: "Māori", alt: ["mi"] },
  { code: "mar", name: "Marathi", alt: ["mr"] },
  { code: "mon", name: "Mongolian", alt: ["mn"] },
  { code: "nep", name: "Nepali", alt: ["ne"] },
  { code: "nso", name: "Northern Sotho" },
  { code: "nor", name: "Norwegian", alt: ["no"] },
  { code: "oci", name: "Occitan", alt: ["oc"] },
  { code: "ori", name: "Odia", alt: ["or"] },
  { code: "pus", name: "Pashto", alt: ["ps"] },
  { code: "fas", name: "Persian", alt: ["fa"] },
  { code: "pol", name: "Polish", alt: ["pl"] },
  { code: "por", name: "Portuguese", alt: ["pt"] },
  { code: "pan", name: "Punjabi", alt: ["pa"] },
  { code: "ron", name: "Romanian", alt: ["ro"] },
  { code: "rus", name: "Russian", alt: ["ru"] },
  { code: "srp", name: "Serbian", alt: ["sr"] },
  { code: "sna", name: "Shona", alt: ["sn"] },
  { code: "snd", name: "Sindhi", alt: ["sd"] },
  { code: "slk", name: "Slovak", alt: ["sk"] },
  { code: "slv", name: "Slovenian", alt: ["sl"] },
  { code: "som", name: "Somali", alt: ["so"] },
  { code: "spa", name: "Spanish", alt: ["es"] },
  { code: "swa", name: "Swahili", alt: ["sw"] },
  { code: "swe", name: "Swedish", alt: ["sv"] },
  { code: "tgk", name: "Tajik", alt: ["tg"] },
  { code: "tam", name: "Tamil", alt: ["ta"] },
  { code: "tel", name: "Telugu", alt: ["te"] },
  { code: "tha", name: "Thai", alt: ["th"] },
  { code: "tur", name: "Turkish", alt: ["tr"] },
  { code: "ukr", name: "Ukrainian", alt: ["uk"] },
  { code: "umb", name: "Umbundu" },
  { code: "urd", name: "Urdu", alt: ["ur"] },
  { code: "uzb", name: "Uzbek", alt: ["uz"] },
  { code: "vie", name: "Vietnamese", alt: ["vi"] },
  { code: "cym", name: "Welsh", alt: ["cy"] },
  { code: "wol", name: "Wolof", alt: ["wo"] },
  { code: "xho", name: "Xhosa", alt: ["xh"] },
  { code: "zul", name: "Zulu", alt: ["zu"] },
] as const;

export type ScribeV2RealtimeLanguageCode =
  (typeof SCRIBE_V2_REALTIME_LANGUAGES)[number]["code"];

const SCRIBE_V2_REALTIME_LANGUAGE_CODES = new Set<string>(
  SCRIBE_V2_REALTIME_LANGUAGES.map((language) => language.code),
);

export const DEFAULT_DICTATION_LANGUAGE_HINTS: string[] = ["eng"];
export const MAX_DICTATION_LANGUAGE_HINTS = 10;

/**
 * AssemblyAI Sync STT `language_code` values (ISO-639-1).
 * https://www.assemblyai.com/docs/sync-stt/language-selection#supported-languages
 */
export const ASSEMBLY_SYNC_LANGUAGE_CODES = [
  "en",
  "es",
  "de",
  "fr",
  "it",
  "pt",
  "tr",
  "nl",
  "sv",
  "no",
  "da",
  "fi",
  "hi",
  "vi",
  "ar",
  "he",
  "ja",
  "ur",
  "zh",
] as const;

const ASSEMBLY_SYNC_LANGUAGE_CODE_SET = new Set<string>(
  ASSEMBLY_SYNC_LANGUAGE_CODES,
);

const ISO6391_BY_ISO6393 = new Map<string, string>(
  SCRIBE_V2_REALTIME_LANGUAGES.flatMap((language) => {
    const iso6391 = "alt" in language ? language.alt[0] : undefined;
    return iso6391 ? [[language.code, iso6391]] : [];
  }),
);

const ISO6393_BY_ALT_CODE = new Map<string, string>(
  SCRIBE_V2_REALTIME_LANGUAGES.flatMap((language) =>
    "alt" in language
      ? language.alt.map((alt): [string, string] => [alt, language.code])
      : [],
  ),
);

export function isScribeV2RealtimeLanguageCode(
  value: unknown,
): value is ScribeV2RealtimeLanguageCode {
  return (
    typeof value === "string" && SCRIBE_V2_REALTIME_LANGUAGE_CODES.has(value)
  );
}

/** Drops unknown codes and duplicates. Missing/invalid values fall back to English. */
export function normalizeDictationLanguageHints(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_DICTATION_LANGUAGE_HINTS];
  }

  const seen = new Set<string>();
  const next: string[] = [];
  for (const item of value) {
    if (!isScribeV2RealtimeLanguageCode(item) || seen.has(item)) continue;
    seen.add(item);
    next.push(item);
    if (next.length >= MAX_DICTATION_LANGUAGE_HINTS) break;
  }
  if (value.length > 0 && next.length === 0) {
    return [...DEFAULT_DICTATION_LANGUAGE_HINTS];
  }
  return next;
}

/** ISO-639-1 for one stored hint. Codes with no two-letter form pass through. */
export function toIso6391DictationCode(code: string): string {
  return ISO6391_BY_ISO6393.get(code) ?? code;
}

/**
 * Stored hint for an account language such as `en`, `pt-BR` or `zh_CN`.
 * Regions are dropped because dictation hints are per language. `auto` and
 * languages dictation cannot hear map to nothing.
 */
export function toDictationLanguageHint(
  accountLanguage: string | undefined,
): string | undefined {
  if (!accountLanguage) return undefined;
  const base = accountLanguage.replaceAll("_", "-").split("-")[0];
  if (SCRIBE_V2_REALTIME_LANGUAGE_CODES.has(base)) return base;
  return ISO6393_BY_ALT_CODE.get(base.toLowerCase());
}

export function isAssemblyDictationLanguage(code: string): boolean {
  return ASSEMBLY_SYNC_LANGUAGE_CODE_SET.has(toIso6391DictationCode(code));
}

export function dictationLanguagesSupportedByAssembly(
  codes: readonly string[],
): boolean {
  if (codes.length === 0) return true;
  return codes.every(isAssemblyDictationLanguage);
}

/** Maps stored ISO-639-3 hints to ISO-639-1 for dictation-ff. */
export function toDictationApiLanguageCodes(
  codes: readonly string[],
): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const code of codes) {
    const apiCode = toIso6391DictationCode(code);
    if (seen.has(apiCode)) continue;
    seen.add(apiCode);
    next.push(apiCode);
  }
  return next;
}

/** ISO-639-1 codes `/process` and Sync STT accept. */
export function toProcessDictationLanguages(
  codes: readonly string[],
): string[] {
  return toDictationApiLanguageCodes(codes).filter((code) =>
    ASSEMBLY_SYNC_LANGUAGE_CODE_SET.has(code),
  );
}

export function getDictationLanguageOptions() {
  return SCRIBE_V2_REALTIME_LANGUAGES.map((language) => {
    const aliases = "alt" in language ? language.alt : undefined;
    return {
      label: language.name,
      value: language.code,
      alt: aliases ? [language.code, ...aliases] : [language.code],
    };
  });
}

export const DICTATION_LANGUAGE_OPTIONS = getDictationLanguageOptions();
