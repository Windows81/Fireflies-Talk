import type { SvgProps } from "react-native-svg";
import {
  IconSlack,
  IconGmail,
  IconNotion,
  IconGoogleMeetLogo,
  IconGoogleCalendar,
  IconGoogleDocs,
  IconGoogleDrive,
  IconHubspot,
  IconMsTeamsLogo,
  IconOutlook,
  IconZoomLogo,
  IconAsana,
  IconSalesforce,
  IconLinear,
  IconJira,
  IconLink,
} from "@/assets/svg";
import IconLogo from "@/assets/svg/IconLogo";

type SvgIcon = React.FC<SvgProps>;

export type CitationType = "meeting" | "email" | "slack" | "brand" | "generic";

export type CitationMeta = {
  type: CitationType;
  Icon: SvgIcon;
  label: string;
};

const HOST_TO_ICON: Array<{ test: RegExp; icon: SvgIcon }> = [
  { test: /(^|\.)slack\.com$/, icon: IconSlack },
  { test: /(^|\.)notion\.(so|site|com)$/, icon: IconNotion },
  { test: /^mail\.google\.com$/, icon: IconGmail },
  { test: /^meet\.google\.com$/, icon: IconGoogleMeetLogo },
  { test: /^calendar\.google\.com$/, icon: IconGoogleCalendar },
  { test: /^docs\.google\.com$/, icon: IconGoogleDocs },
  { test: /^drive\.google\.com$/, icon: IconGoogleDrive },
  { test: /(^|\.)hubspot\.com$/, icon: IconHubspot },
  { test: /^teams\.microsoft\.com$/, icon: IconMsTeamsLogo },
  { test: /^outlook\.live\.com$|^outlook\.office\.com$/, icon: IconOutlook },
  { test: /(^|\.)zoom\.us$/, icon: IconZoomLogo },
  { test: /(^|\.)asana\.com$/, icon: IconAsana },
  {
    test: /(^|\.)salesforce\.com$|(^|\.)lightning\.force\.com$/,
    icon: IconSalesforce,
  },
  { test: /(^|\.)linear\.app$/, icon: IconLinear },
  { test: /(^|\.)atlassian\.net$/, icon: IconJira },
];

export const isMeetingHref = (href: string): boolean => {
  try {
    const url = new URL(href);
    return (
      /(^|\.)fireflies\.ai$/.test(url.hostname.toLowerCase()) &&
      url.pathname.includes("/view/")
    );
  } catch {
    return false;
  }
};

export const isEmailHref = (href: string): boolean =>
  href.startsWith("mailto:");

const getSourceIcon = (href: string): SvgIcon | null => {
  let host: string;
  try {
    host = new URL(href).hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const { test, icon } of HOST_TO_ICON) {
    if (test.test(host)) return icon;
  }
  return null;
};

export const getSourceLabel = (href: string): string => {
  if (isEmailHref(href)) return "Email";
  try {
    const host = new URL(href).hostname.toLowerCase();
    if (/(^|\.)slack\.com$/.test(host)) return "Slack";
    if (host === "mail.google.com") return "Gmail";
    return host.replace(/^www\./, "");
  } catch {
    return "Source";
  }
};

export const getCitationMeta = (href: string): CitationMeta => {
  if (isMeetingHref(href)) {
    return { type: "meeting", Icon: IconLogo, label: "Meeting" };
  }
  if (isEmailHref(href)) {
    return { type: "email", Icon: IconGmail, label: "Email" };
  }
  const brandIcon = getSourceIcon(href);
  if (brandIcon) {
    return { type: "brand", Icon: brandIcon, label: getSourceLabel(href) };
  }
  return { type: "generic", Icon: IconLink, label: getSourceLabel(href) };
};

export const isFootnoteLabel = (text: string): boolean =>
  /^\^/.test(text.trim());

const FOOTNOTE_DEFINITION_REGEX = /^[ \t]*\[\^([^\]\s]+)\]:[ \t]*(\S+).*$/gm;
const BARE_FOOTNOTE_REF_REGEX = /\[\^([^\]]+)\](?!\()/g;

export const normalizeFootnoteCitations = (output: string): string => {
  const definitions = new Map<string, string>();
  for (const match of output.matchAll(FOOTNOTE_DEFINITION_REGEX)) {
    const [, label, url] = match;
    if (label && url) definitions.set(label, url);
  }
  if (definitions.size === 0) return output;

  const withoutDefinitions = output
    .replace(FOOTNOTE_DEFINITION_REGEX, "")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();

  return withoutDefinitions.replace(
    BARE_FOOTNOTE_REF_REGEX,
    (whole, label: string) => {
      const url = definitions.get(label);
      return url ? `[^${label}](${url})` : whole;
    },
  );
};
