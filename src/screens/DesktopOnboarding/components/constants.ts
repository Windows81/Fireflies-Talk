import {
  IconAirtable,
  IconAsana,
  IconBambooHr,
  IconCalendly,
  IconClickup,
  IconConfluence,
  IconDropbox,
  IconFreshsales,
  IconGoogleDocs,
  IconGoogleDrive,
  IconGreenhouse,
  IconHubspot,
  IconJira,
  IconKeragon,
  IconLever,
  IconLinear,
  IconMake,
  IconMsDynamics365,
  IconMicrosoftOneNote,
  IconMicrosoftSharePoint,
  IconMicrosoftToDo,
  IconMondayCom,
  IconNotion,
  IconOneDrive,
  IconOutreach,
  IconPabblyConnect,
  IconPipedrive,
  IconQuo,
  IconRedtail,
  IconRelay,
  IconRingcentral,
  IconSalesforce,
  IconSalesloft,
  IconSlack,
  IconStartDeliver,
  IconTrello,
  IconVonage,
  IconWealthbox,
  IconWorkplace,
  IconZapier,
  IconZendesk,
  IconZoho,
} from "@/assets/svg/svgs.gen";
import type { Role } from "../OnboardingContext";

export type ToolKey =
  | "slack"
  | "notion"
  | "hub_spot"
  | "asana"
  | "salesforce"
  | "click_up"
  | "google_docs"
  | "pipedrive"
  | "salesloft"
  | "outreach"
  | "freshsales"
  | "zendesk_sell"
  | "jira_projects"
  | "linear_app"
  | "confluence"
  | "monday_com"
  | "airtable"
  | "zoho"
  | "pabbly_connect"
  | "make"
  | "zapier"
  | "google_drive"
  | "bamboo_hr"
  | "greenhouse"
  | "lever"
  | "workplace"
  | "calendly"
  | "start_deliver"
  | "ring_central"
  | "vonage"
  | "quo"
  | "microsoft_share_point"
  | "relay_app"
  | "trello"
  | "dropbox"
  | "one_drive"
  | "microsoft_one_note"
  | "microsoft_to_do"
  | "redtail"
  | "wealthbox"
  | "microsoft_dynamics_365"
  | "keragon"
  | "other";

interface Tool {
  name: string;
  icon?: React.FC<{ width: number; height: number; color?: string }>;
}

export const TOOL_DEFINITIONS: Record<ToolKey, Tool> = {
  slack: { name: "Slack", icon: IconSlack },
  notion: { name: "Notion", icon: IconNotion },
  hub_spot: { name: "HubSpot", icon: IconHubspot },
  asana: { name: "Asana", icon: IconAsana },
  salesforce: { name: "Salesforce", icon: IconSalesforce },
  click_up: { name: "ClickUp", icon: IconClickup },
  google_docs: { name: "Google Docs", icon: IconGoogleDocs },
  pipedrive: { name: "Pipedrive", icon: IconPipedrive },
  salesloft: { name: "Salesloft", icon: IconSalesloft },
  outreach: { name: "Outreach", icon: IconOutreach },
  freshsales: { name: "Freshsales", icon: IconFreshsales },
  zendesk_sell: { name: "Zendesk Sell", icon: IconZendesk },
  jira_projects: { name: "Jira Projects", icon: IconJira },
  linear_app: { name: "Linear App", icon: IconLinear },
  confluence: { name: "Confluence", icon: IconConfluence },
  monday_com: { name: "Monday.com", icon: IconMondayCom },
  airtable: { name: "Airtable", icon: IconAirtable },
  zoho: { name: "Zoho", icon: IconZoho },
  pabbly_connect: { name: "Pabbly Connect", icon: IconPabblyConnect },
  make: { name: "Make", icon: IconMake },
  zapier: { name: "Zapier", icon: IconZapier },
  google_drive: { name: "Google Drive", icon: IconGoogleDrive },
  bamboo_hr: { name: "BambooHR", icon: IconBambooHr },
  greenhouse: { name: "Greenhouse", icon: IconGreenhouse },
  lever: { name: "Lever", icon: IconLever },
  workplace: { name: "Workplace", icon: IconWorkplace },
  calendly: { name: "Calendly", icon: IconCalendly },
  start_deliver: { name: "StartDeliver", icon: IconStartDeliver },
  ring_central: { name: "RingCentral", icon: IconRingcentral },
  vonage: { name: "Vonage", icon: IconVonage },
  quo: { name: "Quo", icon: IconQuo },
  microsoft_share_point: {
    name: "Microsoft SharePoint",
    icon: IconMicrosoftSharePoint,
  },
  relay_app: { name: "Relay.App", icon: IconRelay },
  trello: { name: "Trello", icon: IconTrello },
  dropbox: { name: "Dropbox", icon: IconDropbox },
  one_drive: { name: "OneDrive", icon: IconOneDrive },
  microsoft_one_note: { name: "Microsoft OneNote", icon: IconMicrosoftOneNote },
  microsoft_to_do: { name: "Microsoft To Do", icon: IconMicrosoftToDo },
  redtail: { name: "Redtail", icon: IconRedtail },
  wealthbox: { name: "Wealthbox", icon: IconWealthbox },
  microsoft_dynamics_365: {
    name: "Microsoft Dynamics 365",
    icon: IconMsDynamics365,
  },
  keragon: { name: "Keragon", icon: IconKeragon },
  other: { name: "Other" },
};

export const DEFAULT_TOOLS: ToolKey[] = [
  "google_docs",
  "google_drive",
  "notion",
  "dropbox",
  "one_drive",
  "slack",
  "calendly",
];

export const ROLE_TOOLS: Record<Role, ToolKey[]> = {
  sales: [
    "salesforce",
    "hub_spot",
    "pipedrive",
    "salesloft",
    "outreach",
    "freshsales",
    "zendesk_sell",
    "slack",
  ],
  product_design: [
    "jira_projects",
    "linear_app",
    "notion",
    "confluence",
    "monday_com",
    "click_up",
    "airtable",
    "slack",
  ],
  engineering: [
    "jira_projects",
    "linear_app",
    "confluence",
    "notion",
    "slack",
    "asana",
    "zapier",
  ],
  marketing: [
    "hub_spot",
    "zoho",
    "pabbly_connect",
    "make",
    "zapier",
    "airtable",
    "google_docs",
    "slack",
  ],
  customer_success_support: [
    "zendesk_sell",
    "start_deliver",
    "ring_central",
    "vonage",
    "quo",
    "salesforce",
    "slack",
  ],
  finance: [
    "redtail",
    "wealthbox",
    "microsoft_dynamics_365",
    "zoho",
    "airtable",
    "notion",
    "zapier",
  ],
  recruiting_hr: [
    "bamboo_hr",
    "greenhouse",
    "lever",
    "workplace",
    "asana",
    "slack",
    "calendly",
  ],
  healthcare: [
    "keragon",
    "airtable",
    "google_docs",
    "google_drive",
    "dropbox",
    "zapier",
  ],
  freelancer: [
    "google_docs",
    "google_drive",
    "notion",
    "dropbox",
    "one_drive",
    "slack",
    "calendly",
  ],
  student: [
    "google_docs",
    "google_drive",
    "notion",
    "microsoft_one_note",
    "airtable",
    "dropbox",
    "microsoft_to_do",
    "slack",
  ],
  cxo_founder: DEFAULT_TOOLS,
  other: DEFAULT_TOOLS,
};
