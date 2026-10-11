// Cosmetic flag rendering for language codes. Codes are BCP-47-ish ("en",
// "en-GB", "pt-BR") or underscore variants ("en_us"). Prefer a 2-letter region
// subtag; otherwise map the base language to a representative country, then
// convert the ISO-3166 alpha-2 pair into a regional-indicator flag emoji.
const BASE_LANGUAGE_REGION: Record<string, string> = {
  en: "GB",
  es: "ES",
  fr: "FR",
  de: "DE",
  it: "IT",
  pt: "PT",
  nl: "NL",
  hi: "IN",
  ja: "JP",
  zh: "CN",
  fi: "FI",
  ko: "KR",
  pl: "PL",
  ru: "RU",
  tr: "TR",
  uk: "UA",
  vi: "VN",
  af: "ZA",
  sq: "AL",
  am: "ET",
  ar: "SA",
  hy: "AM",
  as: "IN",
  az: "AZ",
  ba: "RU",
  eu: "ES",
  be: "BY",
  bn: "BD",
  bs: "BA",
  br: "FR",
  bg: "BG",
  my: "MM",
  ca: "ES",
  hr: "HR",
  cs: "CZ",
  da: "DK",
  et: "EE",
  fo: "FO",
  gl: "ES",
  ka: "GE",
  el: "GR",
  gu: "IN",
  ht: "HT",
  ha: "NG",
  haw: "US",
  he: "IL",
  hu: "HU",
  is: "IS",
  id: "ID",
  jw: "ID",
  jv: "ID",
  kn: "IN",
  kk: "KZ",
  km: "KH",
  lo: "LA",
  la: "VA",
  lv: "LV",
  ln: "CD",
  lt: "LT",
  lb: "LU",
  mk: "MK",
  mg: "MG",
  ms: "MY",
  ml: "IN",
  mt: "MT",
  mi: "NZ",
  mr: "IN",
  mn: "MN",
  ne: "NP",
  no: "NO",
  nn: "NO",
  oc: "FR",
  pa: "IN",
  ps: "AF",
  fa: "IR",
  ro: "RO",
  sa: "IN",
  sr: "RS",
  sn: "ZW",
  sd: "PK",
  si: "LK",
  sk: "SK",
  sl: "SI",
  so: "SO",
  su: "ID",
  sw: "KE",
  sv: "SE",
  tl: "PH",
  tg: "TJ",
  ta: "IN",
  tt: "RU",
  te: "IN",
  th: "TH",
  bo: "CN",
  tk: "TM",
  ur: "PK",
  uz: "UZ",
  cy: "GB",
  yi: "IL",
  yo: "NG",
  mo: "MD",
  zu: "ZA",
  ff: "SN",
  ga: "IE",
  ig: "NG",
  ku: "IQ",
  ky: "KG",
  lg: "UG",
  ny: "MW",
  or: "IN",
  wo: "SN",
  xh: "ZA",
  // Dictation hints are ISO-639-3 and a few of these languages have no
  // two-letter form, so they are keyed by the three-letter code instead.
  ast: "ES",
  ceb: "PH",
  fil: "PH",
  kea: "CV",
  luo: "KE",
  nso: "ZA",
  umb: "AO",
  yue: "HK",
};

// "Auto-detect" / "Multi-Language" have no country; show a globe instead.
const GLOBE = "🌐";
const AUTO_CODES = new Set(["auto", "multi"]);

const toFlagEmoji = (countryCode: string): string => {
  if (countryCode.length !== 2) return "";
  const points = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 0x1f1e6 + (char.charCodeAt(0) - 65));
  return String.fromCodePoint(...points);
};

export const getLanguageFlag = (code: string): string => {
  const normalized = code.replace("_", "-");
  if (AUTO_CODES.has(normalized.toLowerCase())) return GLOBE;

  const [base, region] = normalized.split("-");
  let country =
    region?.length === 2
      ? region.toUpperCase()
      : (BASE_LANGUAGE_REGION[base.toLowerCase()] ?? "");
  // "UK" isn't a valid ISO-3166 code; the flag lives under "GB".
  if (country === "UK") country = "GB";

  return toFlagEmoji(country);
};
