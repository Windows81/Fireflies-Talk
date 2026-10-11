import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type AiAppsPreference = {
  __typename?: 'AIAppsPreference';
  answers?: Maybe<Array<Scalars['String']['output']>>;
  question?: Maybe<Scalars['String']['output']>;
};

export type AiAppsPreferenceInput = {
  answers?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  question?: InputMaybe<Scalars['String']['input']>;
};

export type AiCreditSettings = {
  __typename?: 'AICreditSettings';
  autoUpgrade?: Maybe<Scalars['Boolean']['output']>;
  free1kAICreditsCampaignStatus?: Maybe<Free1kAiCreditsCampaignStatus>;
};

export type AiCreditUsageByConsumerIdDatapoint = {
  __typename?: 'AICreditUsageByConsumerIdDatapoint';
  consumerTitle?: Maybe<Scalars['String']['output']>;
  creditsUsed: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  microCreditsUsed: Scalars['Float']['output'];
};

export type AiCreditUsageByConsumerTypeBreakdownDatapoint = {
  __typename?: 'AICreditUsageByConsumerTypeBreakdownDatapoint';
  consumerTitle?: Maybe<Scalars['String']['output']>;
  creditsUsed: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  microCreditsUsed: Scalars['Float']['output'];
  scheduleBreakdown?: Maybe<Array<AiCreditUsageByConsumerTypeScheduleBreakdownDatapoint>>;
};

export type AiCreditUsageByConsumerTypeDatapoint = {
  __typename?: 'AICreditUsageByConsumerTypeDatapoint';
  breakdown?: Maybe<Array<AiCreditUsageByConsumerTypeBreakdownDatapoint>>;
  creditsUsed: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  microCreditsUsed: Scalars['Float']['output'];
};

export type AiCreditUsageByConsumerTypeScheduleBreakdownDatapoint = {
  __typename?: 'AICreditUsageByConsumerTypeScheduleBreakdownDatapoint';
  consumerSchedule: EnumAiCreditsConsumerSchedule;
  creditsUsed: Scalars['Int']['output'];
  microCreditsUsed: Scalars['Float']['output'];
};

export type AiCreditUsageDatapoint = {
  __typename?: 'AICreditUsageDatapoint';
  creditsUsed: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  microCreditsUsed: Scalars['Float']['output'];
};

export type AiCreditsFreeAccess = {
  __typename?: 'AICreditsFreeAccess';
  campaign: EnumAiCreditsFreeAccessCampaigns;
  canceledAt?: Maybe<Scalars['DateTime']['output']>;
  endsAt: Scalars['DateTime']['output'];
  startedAt: Scalars['DateTime']['output'];
};

export type AiCreditsTiers = {
  __typename?: 'AICreditsTiers';
  extraTiers: Array<Scalars['Int']['output']>;
  tiers: Array<Scalars['Int']['output']>;
};

export type AiExtensionsSubscription = {
  __typename?: 'AIExtensionsSubscription';
  autoUpgrade?: Maybe<Scalars['Boolean']['output']>;
  cancelAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  nextPaymentAt?: Maybe<Scalars['DateTime']['output']>;
  quantity: Scalars['Float']['output'];
  scheduledIntervalChange?: Maybe<ScheduledAiCreditsIntervalChange>;
  status: Scalars['String']['output'];
  stripePlanId: Scalars['String']['output'];
  stripePlanNickname: Scalars['String']['output'];
  stripeSubscriptionId: Scalars['String']['output'];
  trialEndsAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type AbTestMeta = {
  __typename?: 'AbTestMeta';
  chunkSize?: Maybe<Scalars['Int']['output']>;
  indexStrategy?: Maybe<Scalars['String']['output']>;
};

export type AbTestMetaInput = {
  chunkSize?: InputMaybe<Scalars['Int']['input']>;
  indexStrategy?: InputMaybe<Scalars['String']['input']>;
};

export type AccessKnowledgeBaseFileInput = {
  fileUrl: Scalars['String']['input'];
};

export type AccessKnowledgeBaseFileResponse = {
  __typename?: 'AccessKnowledgeBaseFileResponse';
  url: Scalars['String']['output'];
};

export type AccountMigrationInput = {
  creditCardLastFour?: InputMaybe<Scalars['String']['input']>;
  deleteOldAccount?: InputMaybe<Scalars['Boolean']['input']>;
  fromEmail?: InputMaybe<Scalars['String']['input']>;
  hasAccessToOldAccount?: InputMaybe<Scalars['Boolean']['input']>;
  migrateOnlyMeetings?: InputMaybe<Scalars['Boolean']['input']>;
  toEmail: Scalars['String']['input'];
};

export type AccountMigrationResponse = {
  __typename?: 'AccountMigrationResponse';
  deleteOldAccount?: Maybe<Scalars['Boolean']['output']>;
  fromEmail?: Maybe<Scalars['String']['output']>;
  hasAccessToOldAccount?: Maybe<Scalars['Boolean']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  migrateOnlyMeetings?: Maybe<Scalars['Boolean']['output']>;
  success: Scalars['Boolean']['output'];
  toEmail?: Maybe<Scalars['String']['output']>;
};

export type AddPhoneNumberResult = {
  __typename?: 'AddPhoneNumberResult';
  phoneNumber: PhoneNumber;
  verification: PhoneNumberVerification;
};

export type AdminConnectedUsersResponse = {
  __typename?: 'AdminConnectedUsersResponse';
  data: Array<ConnectedUserItem>;
};

export type AdminIntegrationOverviewItem = {
  __typename?: 'AdminIntegrationOverviewItem';
  adminConnected: Scalars['Boolean']['output'];
  category?: Maybe<Scalars['String']['output']>;
  connectedCount: Scalars['Int']['output'];
  connectorId: Scalars['String']['output'];
  connectorName: Scalars['String']['output'];
  displayName?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  permissionLevel: Scalars['String']['output'];
  totalMembers: Scalars['Int']['output'];
};

export type AdminIntegrationOverviewResponse = {
  __typename?: 'AdminIntegrationOverviewResponse';
  data: Array<AdminIntegrationOverviewItem>;
};

export type AdminPermissionResponse = {
  __typename?: 'AdminPermissionResponse';
  allowedGroupIds?: Maybe<Array<Scalars['String']['output']>>;
  allowedUserIds?: Maybe<Array<Scalars['String']['output']>>;
  connectorId: Scalars['String']['output'];
  permissionLevel: Scalars['String']['output'];
  teamId: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
};

export type AdminSyncPreferenceResponse = {
  __typename?: 'AdminSyncPreferenceResponse';
  adminConnected: Scalars['Boolean']['output'];
  applyToAllWorkspaceMembers: Scalars['Boolean']['output'];
  configCount: Scalars['Int']['output'];
  connectorId: Scalars['String']['output'];
  hasAutofillConfig: Scalars['Boolean']['output'];
  isTeamScope: Scalars['Boolean']['output'];
  restrictNonAdminConfiguration: Scalars['Boolean']['output'];
};

export type AgenticAgentTool = {
  __typename?: 'AgenticAgentTool';
  tool: EnumAgentToolName;
};

export type AgenticDataSource = {
  __typename?: 'AgenticDataSource';
  instructions?: Maybe<Scalars['String']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  query?: Maybe<Scalars['String']['output']>;
  source: EnumKnowledgeSource;
  type: EnumDataSourceType;
};

export type AgenticDataSourceToggleInput = {
  isActive: Scalars['Boolean']['input'];
  source: EnumKnowledgeSource;
  type: EnumDataSourceType;
};

export type AiAppsMeeting = {
  __typename?: 'AiAppsMeeting';
  date?: Maybe<Scalars['String']['output']>;
  hasCaptions?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['String']['output'];
  isRecurring?: Maybe<Scalars['Boolean']['output']>;
  meetingLink?: Maybe<Scalars['String']['output']>;
  ownerName?: Maybe<Scalars['String']['output']>;
  ownerPicture?: Maybe<Scalars['String']['output']>;
  puppet_status?: Maybe<Scalars['String']['output']>;
  startTime: Scalars['String']['output'];
  status?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type AmazonQBusinessSettings = {
  __typename?: 'AmazonQBusinessSettings';
  appARN?: Maybe<Scalars['String']['output']>;
  awsRegion?: Maybe<Scalars['String']['output']>;
  iamIdentityCenterRegion?: Maybe<Scalars['String']['output']>;
  qBusinessApplicationId?: Maybe<Scalars['String']['output']>;
  qRetrieverId?: Maybe<Scalars['String']['output']>;
};

export type AnalyticsUser = {
  __typename?: 'AnalyticsUser';
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  parseUserId?: Maybe<Scalars['ID']['output']>;
  picture?: Maybe<Scalars['String']['output']>;
};

export type AnalyticsView = {
  __typename?: 'AnalyticsView';
  conditions: Array<AnalyticsViewCondition>;
  id: Scalars['ID']['output'];
  logicalOperator: AnalyticsViewLogicalOperator;
  name: Scalars['String']['output'];
  teamId: Scalars['String']['output'];
};

export type AnalyticsViewCondition = {
  __typename?: 'AnalyticsViewCondition';
  operator: AnalyticsViewOperator;
  property: Scalars['String']['output'];
  value: Array<Scalars['String']['output']>;
};

export type AnalyticsViewConditionInput = {
  operator: AnalyticsViewOperator;
  property: Scalars['String']['input'];
  value: Array<Scalars['String']['input']>;
};

export type AnalyticsViewFilterInput = {
  conditions: Array<AnalyticsViewConditionInput>;
  logicalOperator: AnalyticsViewLogicalOperator;
};

export enum AnalyticsViewLogicalOperator {
  And = 'AND',
  Or = 'OR'
}

export enum AnalyticsViewOperator {
  Contains = 'CONTAINS',
  Equals = 'EQUALS',
  GreaterThan = 'GREATER_THAN',
  GreaterThanOrEqual = 'GREATER_THAN_OR_EQUAL',
  LessThan = 'LESS_THAN',
  LessThanOrEqual = 'LESS_THAN_OR_EQUAL',
  NotContains = 'NOT_CONTAINS',
  NotEquals = 'NOT_EQUALS'
}

export type Announcement = {
  __typename?: 'Announcement';
  createdAt: Scalars['DateTime']['output'];
  deliveryStatus: NotificationDeliveryStatus;
  growthbookFlagKey?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  scheduledAt?: Maybe<Scalars['DateTime']['output']>;
  seenAt?: Maybe<Scalars['DateTime']['output']>;
  slug: Scalars['String']['output'];
  status: Scalars['String']['output'];
  templates: Array<AnnouncementTemplateRef>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type AnnouncementTemplate = {
  __typename?: 'AnnouncementTemplate';
  config: AnnouncementTemplateConfig;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type AnnouncementTemplateAction = {
  __typename?: 'AnnouncementTemplateAction';
  label: Scalars['String']['output'];
  leadingIcon?: Maybe<Scalars['String']['output']>;
  trailingIcon?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
  variant?: Maybe<Scalars['String']['output']>;
};

export type AnnouncementTemplateBannerConfig = {
  __typename?: 'AnnouncementTemplateBannerConfig';
  configuration: AnnouncementTemplateBannerConfiguration;
  description: Scalars['String']['output'];
  image?: Maybe<AnnouncementTemplateImage>;
  primaryAction: AnnouncementTemplateAction;
  title: Scalars['String']['output'];
};

export type AnnouncementTemplateBannerConfiguration = {
  __typename?: 'AnnouncementTemplateBannerConfiguration';
  backgroundColor?: Maybe<Scalars['String']['output']>;
  expiresInDays?: Maybe<Scalars['Float']['output']>;
  surface: Scalars['String']['output'];
};

export type AnnouncementTemplateCardConfig = {
  __typename?: 'AnnouncementTemplateCardConfig';
  configuration?: Maybe<AnnouncementTemplateCardConfiguration>;
  icon?: Maybe<AnnouncementTemplateIcon>;
  image?: Maybe<AnnouncementTemplateImage>;
  message?: Maybe<Scalars['String']['output']>;
  primaryAction?: Maybe<AnnouncementTemplateAction>;
  secondaryAction?: Maybe<AnnouncementTemplateAction>;
  title: Scalars['String']['output'];
  titleIcon?: Maybe<Scalars['String']['output']>;
};

export type AnnouncementTemplateCardConfiguration = {
  __typename?: 'AnnouncementTemplateCardConfiguration';
  duration?: Maybe<Scalars['Float']['output']>;
  showOnInitialLoad?: Maybe<Scalars['Boolean']['output']>;
};

export type AnnouncementTemplateConfig = {
  __typename?: 'AnnouncementTemplateConfig';
  banner?: Maybe<AnnouncementTemplateBannerConfig>;
  card?: Maybe<AnnouncementTemplateCardConfig>;
  modal?: Maybe<AnnouncementTemplateModalConfig>;
};

export type AnnouncementTemplateFeature = {
  __typename?: 'AnnouncementTemplateFeature';
  description: Scalars['String']['output'];
  icon?: Maybe<Scalars['String']['output']>;
};

export type AnnouncementTemplateIcon = {
  __typename?: 'AnnouncementTemplateIcon';
  backgroundColor?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
};

export type AnnouncementTemplateImage = {
  __typename?: 'AnnouncementTemplateImage';
  backgroundColor?: Maybe<Scalars['String']['output']>;
  size?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
};

export type AnnouncementTemplateModalConfig = {
  __typename?: 'AnnouncementTemplateModalConfig';
  disclaimerText?: Maybe<Scalars['String']['output']>;
  features?: Maybe<Array<AnnouncementTemplateFeature>>;
  icons?: Maybe<Array<AnnouncementTemplateIcon>>;
  image?: Maybe<AnnouncementTemplateImage>;
  primaryAction?: Maybe<AnnouncementTemplateAction>;
  secondaryAction?: Maybe<AnnouncementTemplateAction>;
  subtitle?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  topIcon?: Maybe<AnnouncementTemplateIcon>;
  variant: Scalars['String']['output'];
  video?: Maybe<AnnouncementTemplateVideo>;
};

export type AnnouncementTemplateRef = {
  __typename?: 'AnnouncementTemplateRef';
  template?: Maybe<AnnouncementTemplate>;
  templateId: Scalars['ID']['output'];
};

export type AnnouncementTemplateVideo = {
  __typename?: 'AnnouncementTemplateVideo';
  placement: Scalars['String']['output'];
  thumbnail?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
};

export type AnonymTrackingIDs = {
  __typename?: 'AnonymTrackingIDs';
  anonymousId?: Maybe<Scalars['String']['output']>;
  fbp?: Maybe<Scalars['String']['output']>;
  gaClientId?: Maybe<Scalars['String']['output']>;
};

export type Answer = {
  __typename?: 'Answer';
  abTestMeta?: Maybe<AbTestMeta>;
  answer?: Maybe<Scalars['String']['output']>;
  cost?: Maybe<Scalars['Float']['output']>;
  meta?: Maybe<Scalars['JSON']['output']>;
  model?: Maybe<Scalars['String']['output']>;
  question?: Maybe<Scalars['String']['output']>;
  sources?: Maybe<Array<AnswerSource>>;
  timePassed?: Maybe<Scalars['Int']['output']>;
};

export type AnswerChunk = {
  __typename?: 'AnswerChunk';
  data?: Maybe<Scalars['String']['output']>;
  time?: Maybe<Scalars['Float']['output']>;
  usedByLlm?: Maybe<Scalars['Boolean']['output']>;
};

export type AnswerSource = {
  __typename?: 'AnswerSource';
  chunks?: Maybe<Array<AnswerChunk>>;
  detailedOwner?: Maybe<MeetingOwner>;
  meetingId?: Maybe<Scalars['String']['output']>;
  rawCreatedDate?: Maybe<Scalars['Date']['output']>;
  summaryContent?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type AppCategory = {
  __typename?: 'AppCategory';
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type AppChannel = {
  __typename?: 'AppChannel';
  isDefault?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  value: Scalars['String']['output'];
};

export type AppEvent = {
  __typename?: 'AppEvent';
  appSettings: AppSettings;
  artifact?: Maybe<AppEventArtifact>;
  createdAt: Scalars['DateTime']['output'];
  events: Array<AppEventLog>;
  followUpThreadId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isSeen?: Maybe<Scalars['Boolean']['output']>;
  itemExpansions: Array<AppOutputItemExpansion>;
  meetingIds?: Maybe<Array<Scalars['String']['output']>>;
  origin: EnumAppOutputOrigin;
  signedUrl?: Maybe<Scalars['String']['output']>;
  status: EnumAppEventStatus;
  teamId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['String']['output'];
};

export type AppEventArtifact = {
  __typename?: 'AppEventArtifact';
  artifactId: Scalars['String']['output'];
  kind: Scalars['String']['output'];
  pdfUrl?: Maybe<Scalars['String']['output']>;
  sizeBytes?: Maybe<Scalars['Float']['output']>;
  slideCount?: Maybe<Scalars['Float']['output']>;
  status: Scalars['String']['output'];
  thumbnailUrl?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type AppEventLog = {
  __typename?: 'AppEventLog';
  createdAt: Scalars['DateTime']['output'];
  message: Scalars['String']['output'];
  status: EnumAppEventStatus;
};

export type AppIntegration = {
  __typename?: 'AppIntegration';
  actions?: Maybe<Array<AppIntegrationAction>>;
  category: Scalars['String']['output'];
  displayName?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type AppIntegrationAction = {
  __typename?: 'AppIntegrationAction';
  label?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  resource?: Maybe<Scalars['String']['output']>;
  resourceId?: Maybe<Scalars['JSON']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type AppOutput = {
  __typename?: 'AppOutput';
  appId: Scalars['String']['output'];
  appTitle: Scalars['String']['output'];
  audioUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  eventId: Scalars['String']['output'];
  meetingIds: Array<Scalars['String']['output']>;
  origin: EnumAppOutputOrigin;
  output: Scalars['String']['output'];
  outputJson?: Maybe<Scalars['JSON']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type AppOutputEvent = {
  __typename?: 'AppOutputEvent';
  appId: Scalars['String']['output'];
  appTitle: Scalars['String']['output'];
  audioUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  event: AppEvent;
  eventId: Scalars['String']['output'];
  meetingIds: Array<Scalars['String']['output']>;
  meetings: Array<AiAppsMeeting>;
  origin: EnumAppOutputOrigin;
  output: Scalars['String']['output'];
  outputJson?: Maybe<Scalars['JSON']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type AppOutputEventWithNullableSettings = {
  __typename?: 'AppOutputEventWithNullableSettings';
  appId: Scalars['String']['output'];
  appTitle: Scalars['String']['output'];
  audioUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  event: AppEvent;
  eventId: Scalars['String']['output'];
  meetingIds: Array<Scalars['String']['output']>;
  meetings: Array<AiAppsMeeting>;
  origin: EnumAppOutputOrigin;
  output: Scalars['String']['output'];
  outputJson?: Maybe<Scalars['JSON']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type AppOutputItemExpansion = {
  __typename?: 'AppOutputItemExpansion';
  createdAt: Scalars['DateTime']['output'];
  itemKey: Scalars['String']['output'];
  markdown: Scalars['String']['output'];
};

export enum AppOutputViewSource {
  AiSkillOutputPage = 'AI_SKILL_OUTPUT_PAGE',
  NotepadAiSkillsNotesTab = 'NOTEPAD_AI_SKILLS_NOTES_TAB',
  NotepadAiSkillsTab = 'NOTEPAD_AI_SKILLS_TAB',
  NotepadSummary = 'NOTEPAD_SUMMARY',
  WelcomeAiSkillsFeed = 'WELCOME_AI_SKILLS_FEED',
  WelcomeAiSkillOutputs = 'WELCOME_AI_SKILL_OUTPUTS'
}

export type AppPreview = {
  __typename?: 'AppPreview';
  appId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  meetingIds: Array<Scalars['String']['output']>;
  output: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type AppPrompt = {
  __typename?: 'AppPrompt';
  system?: Maybe<Scalars['String']['output']>;
  user: Scalars['String']['output'];
};

export type AppPromptInput = {
  system?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<Scalars['String']['input']>;
};

export type AppRecommendationTitle = {
  __typename?: 'AppRecommendationTitle';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
  roleId: Scalars['String']['output'];
  type: EnumAppRecommendationDocumentType;
  updatedAt: Scalars['DateTime']['output'];
};

export type AppRecommendationsForMeetingResponse = {
  __typename?: 'AppRecommendationsForMeetingResponse';
  meetingId?: Maybe<Scalars['String']['output']>;
  meetingTitle?: Maybe<Scalars['String']['output']>;
  recommendations?: Maybe<Array<RecommendedApp>>;
  totalCost?: Maybe<Scalars['Float']['output']>;
};

export type AppSettings = {
  __typename?: 'AppSettings';
  active: Scalars['Boolean']['output'];
  agentic?: Maybe<AppSettingsAgenticConfig>;
  appPrivacy: EnumAppPrivacy;
  appTemplateId?: Maybe<Scalars['String']['output']>;
  autoEnabled?: Maybe<Scalars['Boolean']['output']>;
  brandGuidelinesId?: Maybe<Scalars['String']['output']>;
  categoryId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  engine?: Maybe<EnumAppEngine>;
  id: Scalars['ID']['output'];
  integrations?: Maybe<Array<AppIntegration>>;
  lastScheduledTriggeredAt?: Maybe<Scalars['DateTime']['output']>;
  lastUpdatedBy: Scalars['String']['output'];
  model?: Maybe<Scalars['String']['output']>;
  outputPrivacy: EnumAppOutputPrivacyType;
  outputPrivacyUserGroupIds?: Maybe<Array<Scalars['String']['output']>>;
  outputType?: Maybe<EnumAppOutputType>;
  pinned?: Maybe<Scalars['Boolean']['output']>;
  prompt: AppPrompt;
  shared?: Maybe<Scalars['Boolean']['output']>;
  sharedUserGroupIds?: Maybe<Array<Scalars['String']['output']>>;
  sourceAppSettingsId?: Maybe<Scalars['String']['output']>;
  sources?: Maybe<Array<EnumKnowledgeSource>>;
  staticSources?: Maybe<Array<EnumKnowledgeSource>>;
  teamId?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  trigger: AppTrigger;
  type: EnumAppType;
  updatedAt: Scalars['DateTime']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

export type AppSettingsAgenticAgentTool = {
  __typename?: 'AppSettingsAgenticAgentTool';
  isActive?: Maybe<Scalars['Boolean']['output']>;
  tool: EnumAgentToolName;
};

export type AppSettingsAgenticConfig = {
  __typename?: 'AppSettingsAgenticConfig';
  agentTools?: Maybe<Array<AppSettingsAgenticAgentTool>>;
  customPrompt?: Maybe<Scalars['String']['output']>;
  dataSources?: Maybe<Array<AgenticDataSource>>;
  prompt?: Maybe<Scalars['String']['output']>;
  sources?: Maybe<Array<EnumKnowledgeSource>>;
  staticSources?: Maybe<Array<EnumKnowledgeSource>>;
};

export type AppSettingsAgenticConfigInput = {
  customPrompt?: InputMaybe<Scalars['String']['input']>;
  dataSources?: InputMaybe<Array<AgenticDataSourceToggleInput>>;
  prompt?: InputMaybe<Scalars['String']['input']>;
};

export type AppSetupInput = {
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type AppTemplate = {
  __typename?: 'AppTemplate';
  agentic?: Maybe<AppTemplateAgenticConfig>;
  autoEnabled?: Maybe<Scalars['Boolean']['output']>;
  categoryId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  defaultAppPrivacy?: Maybe<EnumAppPrivacy>;
  defaultIntegrations?: Maybe<Array<AppIntegration>>;
  defaultOutputPrivacy?: Maybe<EnumAppOutputPrivacyType>;
  description?: Maybe<Scalars['String']['output']>;
  engine?: Maybe<EnumAppEngine>;
  id: Scalars['ID']['output'];
  lastUpdatedBy: Scalars['String']['output'];
  outputType?: Maybe<EnumAppOutputType>;
  prompt: AppPrompt;
  runsCount?: Maybe<Scalars['Float']['output']>;
  shared?: Maybe<Scalars['Boolean']['output']>;
  sources?: Maybe<Array<EnumKnowledgeSource>>;
  title: Scalars['String']['output'];
  trigger?: Maybe<AppTrigger>;
  type: EnumAppType;
  updatedAt: Scalars['DateTime']['output'];
};

export type AppTemplateAgenticConfig = {
  __typename?: 'AppTemplateAgenticConfig';
  agentTools?: Maybe<Array<AgenticAgentTool>>;
  customPrompt?: Maybe<Scalars['String']['output']>;
  dataSources?: Maybe<Array<AgenticDataSource>>;
  prompt: Scalars['String']['output'];
  sources?: Maybe<Array<EnumKnowledgeSource>>;
  staticSources?: Maybe<Array<EnumKnowledgeSource>>;
};

export type AppTrigger = {
  __typename?: 'AppTrigger';
  cron?: Maybe<Scalars['String']['output']>;
  passMessageAsInput?: Maybe<Scalars['Boolean']['output']>;
  rules?: Maybe<Array<AppTriggerRule>>;
  rulesCompositionType?: Maybe<EnumAppTriggerRulesCompositionType>;
  slackTeamId?: Maybe<Scalars['String']['output']>;
  source: EnumAppTriggerSource;
  sources?: Maybe<Array<EnumAppTriggerSource>>;
};

export type AppTriggerRule = {
  __typename?: 'AppTriggerRule';
  field: EnumAppTriggerRuleFieldType;
  operator: EnumAppTriggerRuleFieldOperator;
  values: Array<Scalars['String']['output']>;
};

export type ApplyAppOutputPrivacyToPastOutputsResponseDto = {
  __typename?: 'ApplyAppOutputPrivacyToPastOutputsResponseDto';
  matchedCount: Scalars['Int']['output'];
  updatedCount: Scalars['Int']['output'];
};

export type ArtifactExpirySetting = {
  __typename?: 'ArtifactExpirySetting';
  ttl: Scalars['Int']['output'];
  unit?: Maybe<Scalars['String']['output']>;
};

export type ArtifactExpirySettingInput = {
  ttl: Scalars['Int']['input'];
  unit?: InputMaybe<Scalars['String']['input']>;
};

export type ArtifactExpirySettings = {
  __typename?: 'ArtifactExpirySettings';
  audio?: Maybe<ArtifactExpirySetting>;
  summary?: Maybe<ArtifactExpirySetting>;
  transcript?: Maybe<ArtifactExpirySetting>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  video?: Maybe<ArtifactExpirySetting>;
};

export type ArtifactExpirySettingsInput = {
  audio?: InputMaybe<ArtifactExpirySettingInput>;
  summary?: InputMaybe<ArtifactExpirySettingInput>;
  transcript?: InputMaybe<ArtifactExpirySettingInput>;
  video?: InputMaybe<ArtifactExpirySettingInput>;
};

export type AskFredMeetingSourceCriteria = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  owner?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  participants?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  speakers?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type AskFredWebsiteInput = {
  question: Scalars['String']['input'];
  url: Scalars['String']['input'];
  websiteText: Scalars['String']['input'];
  youtubeId?: InputMaybe<Scalars['String']['input']>;
};

export type AssistantMessage = {
  __typename?: 'AssistantMessage';
  content: MessageContent;
  role: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
};

export type AttendedUser = {
  __typename?: 'AttendedUser';
  participantName?: Maybe<Scalars['String']['output']>;
  time?: Maybe<Scalars['Float']['output']>;
  timestamp?: Maybe<Scalars['Float']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type Attendee = {
  __typename?: 'Attendee';
  email?: Maybe<Scalars['String']['output']>;
  organizer?: Maybe<Scalars['Boolean']['output']>;
  responseStatus?: Maybe<Scalars['String']['output']>;
  self?: Maybe<Scalars['Boolean']['output']>;
};

export type Attendees = {
  __typename?: 'Attendees';
  displayName?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  picture?: Maybe<Scalars['String']['output']>;
};

/**
 * A category of subject a permission level admits, in the policy engine's own
 * terms. These are role/ownership categories, never individual identities, so the
 * set is a static property of the level and does not drift with team membership.
 */
export enum AudienceMember {
  /** A team admin. */
  Admin = 'ADMIN',
  /** The resource owner. */
  Owner = 'OWNER',
  /** A team super admin. Admitted by every level except NO_ONE. */
  SuperAdmin = 'SUPER_ADMIN',
  /** Any (non-blocked) teammate. */
  Teammate = 'TEAMMATE'
}

export type AudioFile = {
  __typename?: 'AudioFile';
  _id?: Maybe<Scalars['String']['output']>;
  format?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  size?: Maybe<Scalars['Int']['output']>;
  transcriptId?: Maybe<Scalars['String']['output']>;
};

export type AudioMetaData = {
  __typename?: 'AudioMetaData';
  apiSource?: Maybe<Scalars['String']['output']>;
  languageCode?: Maybe<Scalars['String']['output']>;
  meetingNote?: Maybe<Scalars['Boolean']['output']>;
  preferredLanguage?: Maybe<Scalars['String']['output']>;
  silentMeeting?: Maybe<Scalars['Boolean']['output']>;
};

export type AudioMetadata = {
  __typename?: 'AudioMetadata';
  hasGeneratedInstantSummary?: Maybe<Scalars['Boolean']['output']>;
  hasManualNotesMerged?: Maybe<Scalars['Boolean']['output']>;
  languageCode?: Maybe<Scalars['String']['output']>;
  numCaptions?: Maybe<Scalars['Int']['output']>;
  preferredLanguage?: Maybe<Scalars['String']['output']>;
  silentMeeting?: Maybe<Scalars['Boolean']['output']>;
  skipSummaryReason?: Maybe<Scalars['String']['output']>;
};

export type AuthFieldGroup = {
  __typename?: 'AuthFieldGroup';
  description?: Maybe<Scalars['String']['output']>;
  fields: Array<AuthFieldSchema>;
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
};

export type AuthFieldSchema = {
  __typename?: 'AuthFieldSchema';
  description?: Maybe<Scalars['String']['output']>;
  label: Scalars['String']['output'];
  name: Scalars['String']['output'];
  options?: Maybe<Array<SelectOption>>;
  placeholder?: Maybe<Scalars['String']['output']>;
  required: Scalars['Boolean']['output'];
  sensitive?: Maybe<Scalars['Boolean']['output']>;
  type: Scalars['String']['output'];
};

export type AutoDeleteSettingsInput = {
  meetingTtl?: InputMaybe<Scalars['Int']['input']>;
  unit?: InputMaybe<Scalars['String']['input']>;
};

export type AutoDeleteSettingsOutput = {
  __typename?: 'AutoDeleteSettingsOutput';
  meetingTtl?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
};

export type AutofillActionResult = {
  __typename?: 'AutofillActionResult';
  error?: Maybe<Scalars['String']['output']>;
};

export type AutofillConfig = {
  __typename?: 'AutofillConfig';
  enabledEntities?: Maybe<Array<Scalars['String']['output']>>;
  fieldMappings?: Maybe<Scalars['JSON']['output']>;
  isEnabled?: Maybe<Scalars['Boolean']['output']>;
};

export type AutofillConfigInput = {
  enabledEntities: Array<InputMaybe<Scalars['String']['input']>>;
  fieldMappings: Scalars['JSON']['input'];
  isEnabled: Scalars['Boolean']['input'];
};

export type AutofillCustomFieldsForEntity = {
  __typename?: 'AutofillCustomFieldsForEntity';
  entityType?: Maybe<Scalars['String']['output']>;
  fields?: Maybe<Array<AutofillEnrichedMapping>>;
};

export type AutofillEnrichedMapping = {
  __typename?: 'AutofillEnrichedMapping';
  behavior?: Maybe<Scalars['String']['output']>;
  crmFieldId?: Maybe<Scalars['String']['output']>;
  crmFieldName?: Maybe<Scalars['String']['output']>;
  fieldFormat?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  priority?: Maybe<Scalars['Int']['output']>;
  prompt?: Maybe<Scalars['String']['output']>;
  promptLabel?: Maybe<Scalars['String']['output']>;
  sampleValues?: Maybe<Array<Scalars['String']['output']>>;
};

export type AutofillEntityExtraction = {
  __typename?: 'AutofillEntityExtraction';
  cost?: Maybe<Scalars['Float']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  extractedFields?: Maybe<Array<AutofillExtractedField>>;
  model?: Maybe<Scalars['String']['output']>;
  pushResults?: Maybe<Array<AutofillPushResultItem>>;
  pushedAt?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  totalTokens?: Maybe<Scalars['Int']['output']>;
};

export type AutofillEntityExtractionInput = {
  cost?: InputMaybe<Scalars['Float']['input']>;
  entityType: Scalars['String']['input'];
  extractedFields: Array<InputMaybe<AutofillExtractedFieldInput>>;
  model?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  totalTokens?: InputMaybe<Scalars['Int']['input']>;
};

export type AutofillExtractedField = {
  __typename?: 'AutofillExtractedField';
  behavior?: Maybe<Scalars['String']['output']>;
  confidence?: Maybe<Scalars['Float']['output']>;
  crmFieldId?: Maybe<Scalars['String']['output']>;
  crmFieldName?: Maybe<Scalars['String']['output']>;
  dataFormat?: Maybe<Scalars['String']['output']>;
  enumOptions?: Maybe<Array<Scalars['String']['output']>>;
  extractedValue?: Maybe<Scalars['String']['output']>;
  extras?: Maybe<Scalars['JSON']['output']>;
  fieldId?: Maybe<Scalars['String']['output']>;
  isEdited?: Maybe<Scalars['Boolean']['output']>;
  prompt?: Maybe<Scalars['String']['output']>;
};

export type AutofillExtractedFieldInput = {
  behavior: Scalars['String']['input'];
  confidence?: InputMaybe<Scalars['Float']['input']>;
  crmFieldId: Scalars['String']['input'];
  crmFieldName: Scalars['String']['input'];
  dataFormat?: InputMaybe<Scalars['String']['input']>;
  enumOptions?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  extractedValue?: InputMaybe<Scalars['String']['input']>;
  extras?: InputMaybe<Scalars['JSON']['input']>;
  fieldId: Scalars['String']['input'];
  isEdited: Scalars['Boolean']['input'];
  prompt?: InputMaybe<Scalars['String']['input']>;
};

export type AutofillMappingsForEntity = {
  __typename?: 'AutofillMappingsForEntity';
  baseMappings?: Maybe<Array<AutofillEnrichedMapping>>;
  customMappings?: Maybe<Array<AutofillEnrichedMapping>>;
  entityType?: Maybe<Scalars['String']['output']>;
};

export type AutofillMeetingExtractions = {
  __typename?: 'AutofillMeetingExtractions';
  connectorId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  extractions?: Maybe<Array<AutofillEntityExtraction>>;
  meetingId?: Maybe<Scalars['String']['output']>;
  setupId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  userConnectorId?: Maybe<Scalars['String']['output']>;
};

export type AutofillOpportunity = {
  __typename?: 'AutofillOpportunity';
  accountName?: Maybe<Scalars['String']['output']>;
  amount?: Maybe<Scalars['Float']['output']>;
  closeDate?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  stage?: Maybe<Scalars['String']['output']>;
};

export type AutofillPushExtractionsInput = {
  extractions: Array<InputMaybe<AutofillEntityExtractionInput>>;
  meetingId: Scalars['String']['input'];
};

export type AutofillPushResult = {
  __typename?: 'AutofillPushResult';
  email?: Maybe<Scalars['String']['output']>;
  entityId?: Maybe<Scalars['String']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  updated?: Maybe<Scalars['Boolean']['output']>;
};

export type AutofillPushResultItem = {
  __typename?: 'AutofillPushResultItem';
  email?: Maybe<Scalars['String']['output']>;
  entityId?: Maybe<Scalars['String']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  updated?: Maybe<Scalars['Boolean']['output']>;
};

export type AutofillRule = {
  __typename?: 'AutofillRule';
  conditions?: Maybe<Array<Scalars['JSON']['output']>>;
  enabled?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type AutofillTargetRecordInput = {
  id: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type AutofillUpdateEntityInput = {
  entityType: Scalars['String']['input'];
  extractedFields: Array<InputMaybe<AutofillUpdateFieldInput>>;
};

export type AutofillUpdateExtractionsInput = {
  extractions: Array<InputMaybe<AutofillUpdateEntityInput>>;
};

export type AutofillUpdateFieldInput = {
  behavior: Scalars['String']['input'];
  extractedValue?: InputMaybe<Scalars['String']['input']>;
  fieldId: Scalars['String']['input'];
  isEdited: Scalars['Boolean']['input'];
};

export type AutomaticRefund = {
  __typename?: 'AutomaticRefund';
  _id: Scalars['String']['output'];
  refundableAmount: Scalars['Int']['output'];
  refundableAmountAfterProcessingFee: Scalars['Int']['output'];
  status: Scalars['String']['output'];
  token: Scalars['String']['output'];
  viewLink: Scalars['String']['output'];
};

export type AutopilotAgent = {
  __typename?: 'AutopilotAgent';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  introductoryMessage?: Maybe<Scalars['String']['output']>;
  isPublished: Scalars['Boolean']['output'];
  knowledgeBase?: Maybe<Array<KnowledgeBaseItem>>;
  knowledgeBaseCategories?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  meetingsCount?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  organization?: Maybe<Scalars['String']['output']>;
  questionParagraph?: Maybe<Scalars['String']['output']>;
  questions: Array<Scalars['String']['output']>;
  settings: AutopilotAgentSettings;
  systemPrompt: Scalars['String']['output'];
  template?: Maybe<AutopilotAgentTemplate>;
  templateId?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
  userInstructions?: Maybe<Scalars['String']['output']>;
};

export type AutopilotAgentCategory = {
  __typename?: 'AutopilotAgentCategory';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export enum AutopilotAgentError {
  LowCredit = 'LowCredit'
}

export type AutopilotAgentScenario = {
  __typename?: 'AutopilotAgentScenario';
  action: Scalars['String']['output'];
  actionType: ScenarioActionType;
  agentId: Scalars['ID']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  rule: Scalars['String']['output'];
  transcriptId?: Maybe<Scalars['String']['output']>;
  transcriptionStatus?: Maybe<Scalars['String']['output']>;
  transcriptionText?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type AutopilotAgentSettings = {
  __typename?: 'AutopilotAgentSettings';
  accent?: Maybe<Scalars['String']['output']>;
  color: Scalars['String']['output'];
  conversationSpeed: Scalars['Float']['output'];
  dialect?: Maybe<Scalars['String']['output']>;
  eagerness?: Maybe<AutopilotEagernessOption>;
  inactivityReminder: Scalars['Boolean']['output'];
  interruptions?: Maybe<Scalars['String']['output']>;
  isTeamAccessible?: Maybe<Scalars['Boolean']['output']>;
  isVideoRecordingEnabled?: Maybe<Scalars['Boolean']['output']>;
  language: Scalars['String']['output'];
  model: Scalars['String']['output'];
  participantInfoFields?: Maybe<Array<ParticipantInfoField>>;
  platform?: Maybe<AutopilotPlatform>;
  responseStyle: AutopilotResponseStyle;
  sendRecapEmail?: Maybe<SendRecapEmailOption>;
  sessionPrivacy?: Maybe<SessionPrivacy>;
  sessionTimeout?: Maybe<Scalars['Int']['output']>;
  silenceDurationMS: Scalars['Int']['output'];
  speechRecognitionDurationMS: Scalars['Int']['output'];
  temperature: Scalars['Float']['output'];
  tone: AutopilotTone;
  vad?: Maybe<AutopilotVadOption>;
  vadThreshold: Scalars['Float']['output'];
  voice?: Maybe<Scalars['String']['output']>;
};

export type AutopilotAgentSettingsInput = {
  accent?: InputMaybe<Scalars['String']['input']>;
  color: Scalars['String']['input'];
  conversationSpeed: Scalars['Float']['input'];
  dialect?: InputMaybe<Scalars['String']['input']>;
  eagerness: AutopilotEagernessOption;
  inactivityReminder: Scalars['Boolean']['input'];
  interruptions?: InputMaybe<Scalars['String']['input']>;
  isTeamAccessible: Scalars['Boolean']['input'];
  isVideoRecordingEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  language: Scalars['String']['input'];
  model: Scalars['String']['input'];
  participantInfoFields?: InputMaybe<Array<ParticipantInfoField>>;
  platform?: InputMaybe<AutopilotPlatform>;
  responseStyle: AutopilotResponseStyle;
  sendRecapEmail: SendRecapEmailOption;
  sessionPrivacy: SessionPrivacy;
  sessionTimeout: Scalars['Int']['input'];
  silenceDurationMS: Scalars['Int']['input'];
  speechRecognitionDurationMS: Scalars['Int']['input'];
  temperature: Scalars['Float']['input'];
  tone: AutopilotTone;
  vad: AutopilotVadOption;
  vadThreshold: Scalars['Float']['input'];
  voice?: InputMaybe<Scalars['String']['input']>;
};

export type AutopilotAgentTemplate = {
  __typename?: 'AutopilotAgentTemplate';
  category?: Maybe<AutopilotAgentCategory>;
  categoryId: Scalars['ID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  instructions?: Maybe<Scalars['String']['output']>;
  knowledgeBase: AutopilotAgentTemplateSection;
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  questions: AutopilotAgentTemplateSection;
  settings: AutopilotAgentSettings;
  userInstructions?: Maybe<AutopilotAgentTemplateSection>;
};

export type AutopilotAgentTemplateSection = {
  __typename?: 'AutopilotAgentTemplateSection';
  description: Scalars['String']['output'];
  placeholder: Scalars['String']['output'];
};

export type AutopilotAgentsResponse = {
  __typename?: 'AutopilotAgentsResponse';
  data: Array<AutopilotAgent>;
  total: Scalars['Int']['output'];
};

export type AutopilotAudioConfig = {
  __typename?: 'AutopilotAudioConfig';
  code?: Maybe<Scalars['String']['output']>;
  defaultVoice?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  voices?: Maybe<Array<AutopilotBotVoice>>;
};

export type AutopilotBotVoice = {
  __typename?: 'AutopilotBotVoice';
  key?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export enum AutopilotEagernessOption {
  Auto = 'auto',
  High = 'high',
  Low = 'low',
  Medium = 'medium'
}

export enum AutopilotPlatform {
  Gmeet = 'gmeet',
  Web = 'web'
}

export enum AutopilotResponseStyle {
  Detailed = 'Detailed',
  Normal = 'Normal'
}

export enum AutopilotTone {
  Casual = 'Casual',
  Professional = 'Professional',
  Talkative = 'Talkative'
}

export enum AutopilotVadOption {
  Semantic = 'semantic',
  Server = 'server'
}

export type AwaitConnectorAuthorizationResponse = {
  __typename?: 'AwaitConnectorAuthorizationResponse';
  completionToken?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  pending?: Maybe<Scalars['Boolean']['output']>;
};

export type BeginConferenceResponse = {
  __typename?: 'BeginConferenceResponse';
  liveMeeting?: Maybe<Scalars['Boolean']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type BillingInfo = {
  __typename?: 'BillingInfo';
  cards: Array<Card>;
  customer: Customer;
  defaultTaxId?: Maybe<CustomerTaxId>;
  hasMoreInvoices: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  invoices: Array<Invoice>;
  planName: Scalars['String']['output'];
  planNickname: Scalars['String']['output'];
  price?: Maybe<Price>;
  seats: Scalars['Int']['output'];
  subscription?: Maybe<StripeSubscription>;
  tier: Scalars['String']['output'];
  upcomingInvoice?: Maybe<NextInvoice>;
  upcomingInvoices: Array<NextInvoice>;
};

export type BillingSettings = {
  __typename?: 'BillingSettings';
  billingEmails?: Maybe<Array<Scalars['String']['output']>>;
  sendReceiptEnabled?: Maybe<Scalars['Boolean']['output']>;
};

export type BiteCaption = {
  __typename?: 'BiteCaption';
  endTime: Scalars['Float']['output'];
  index: Scalars['Int']['output'];
  speakerId: Scalars['String']['output'];
  speakerName: Scalars['String']['output'];
  startTime: Scalars['Float']['output'];
  text: Scalars['String']['output'];
};

export type BiteOrigin = {
  __typename?: 'BiteOrigin';
  description?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: BiteOriginType;
};

export enum BiteOriginType {
  Meeting = 'meeting'
}

export type BiteUser = {
  __typename?: 'BiteUser';
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  picture?: Maybe<Scalars['String']['output']>;
};

export enum BitesAiExtensionType {
  AutoBites = 'AUTO_BITES'
}

export type BluePrint = {
  __typename?: 'BluePrint';
  created_at?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  manifest?: Maybe<Manifest>;
  version?: Maybe<Scalars['Int']['output']>;
};

export type Brief = {
  __typename?: 'Brief';
  bulletGist?: Maybe<Scalars['String']['output']>;
  gist?: Maybe<Scalars['String']['output']>;
  overview?: Maybe<Scalars['String']['output']>;
};

export type BulletGistItem = {
  __typename?: 'BulletGistItem';
  emoji: Scalars['String']['output'];
  sentence: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type ButtonContent = {
  __typename?: 'ButtonContent';
  type: Scalars['String']['output'];
  values: Array<ButtonValue>;
};

export type ButtonValue = {
  __typename?: 'ButtonValue';
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type CalendarConnectionStatus = {
  __typename?: 'CalendarConnectionStatus';
  google: ProviderCalendarConnectionStatus;
  outlook: ProviderCalendarConnectionStatus;
};

export type CalendarEvents = {
  __typename?: 'CalendarEvents';
  _id?: Maybe<Scalars['String']['output']>;
  attendees?: Maybe<Array<Attendee>>;
  calendarType?: Maybe<Scalars['String']['output']>;
  cancelReason?: Maybe<Scalars['String']['output']>;
  creator?: Maybe<Scalars['String']['output']>;
  creator_email?: Maybe<Scalars['String']['output']>;
  customLanguage?: Maybe<Scalars['String']['output']>;
  date?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['Int']['output']>;
  endDate?: Maybe<Scalars['String']['output']>;
  fredAdded?: Maybe<Scalars['Boolean']['output']>;
  iCalUID?: Maybe<Scalars['String']['output']>;
  isMeetingAdmin?: Maybe<Scalars['Boolean']['output']>;
  isOrganizer?: Maybe<Scalars['Boolean']['output']>;
  isValidMeeting?: Maybe<Scalars['Boolean']['output']>;
  lastMeeting?: Maybe<FeedMeeting>;
  manuallyToggled?: Maybe<Scalars['Boolean']['output']>;
  meetingId?: Maybe<Scalars['String']['output']>;
  organizerEmail?: Maybe<Scalars['String']['output']>;
  owner?: Maybe<Scalars['String']['output']>;
  ownerProfile?: Maybe<Profile>;
  title?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
  userCanToggle?: Maybe<Scalars['Boolean']['output']>;
};

export type CalendarStatus = {
  __typename?: 'CalendarStatus';
  authProviders?: Maybe<Array<Scalars['String']['output']>>;
  hasValidGoogleAuth?: Maybe<Scalars['Boolean']['output']>;
  hasValidOutlookAuth?: Maybe<Scalars['Boolean']['output']>;
};

export enum CallStatus {
  Busy = 'busy',
  Canceled = 'canceled',
  Completed = 'completed',
  Failed = 'failed',
  InProgress = 'in_progress',
  NoAnswer = 'no_answer',
  Pending = 'pending'
}

export type CancelAiTeammateFreeAccessInput = {
  reason: Scalars['String']['input'];
};

/**
 * A capability the access service governs. The enum is the authoritative registry:
 * clients can only reference capabilities the service defines, so an unknown
 * capability is rejected at schema validation rather than at runtime.
 */
export enum Capability {
  /** meeting.delete — delete meetings. */
  MeetingDelete = 'MEETING_DELETE',
  /** meeting.download — download meeting video and audio. */
  MeetingDownload = 'MEETING_DOWNLOAD',
  /** meeting.edit_transcript — edit meeting transcripts. */
  MeetingEditTranscript = 'MEETING_EDIT_TRANSCRIPT',
  /** meeting.export — export transcripts and notes. */
  MeetingExport = 'MEETING_EXPORT'
}

/**
 * The full set of level audiences for one capability, ordering the levels for
 * display. Lets a client build the settings dropdown, detect narrowing changes,
 * and render copy entirely from the authoritative policy engine.
 */
export type CapabilityAudiences = {
  __typename?: 'CapabilityAudiences';
  /** The capability these audiences describe. */
  capability: Capability;
  /** One entry per permission level, in display order. */
  levels: Array<LevelAudience>;
};

/**
 * The evaluated decision for one capability, for the authenticated caller. allowed
 * reflects the effective team level applied to the caller's resolved standing;
 * reason is null when allowed.
 */
export type CapabilityDecision = {
  __typename?: 'CapabilityDecision';
  /** Whether the authenticated caller is allowed to perform this capability. */
  allowed: Scalars['Boolean']['output'];
  /** The evaluated capability. */
  capability: Capability;
  /** The effective team level the decision was made against. */
  level: PermissionLevel;
  /** Why the caller was denied. Null when allowed: true. */
  reason?: Maybe<DenyReason>;
};

export type Caption = {
  __typename?: 'Caption';
  endTime?: Maybe<Scalars['Float']['output']>;
  filterType?: Maybe<Scalars['String']['output']>;
  index?: Maybe<Scalars['Int']['output']>;
  match?: Maybe<Scalars['String']['output']>;
  metrics?: Maybe<Array<CategoryMetric>>;
  sentence?: Maybe<Scalars['String']['output']>;
  sentiment?: Maybe<Scalars['Float']['output']>;
  sentimentType?: Maybe<Scalars['String']['output']>;
  speaker_id?: Maybe<Scalars['Int']['output']>;
  time?: Maybe<Scalars['Float']['output']>;
};

export type CaptionComment = {
  __typename?: 'CaptionComment';
  _id?: Maybe<Scalars['String']['output']>;
  dataAdded?: Maybe<Scalars['Int']['output']>;
  dateAdded?: Maybe<Scalars['Int']['output']>;
  deleted?: Maybe<Scalars['Boolean']['output']>;
  meetingNoteId: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  picture?: Maybe<Scalars['String']['output']>;
  referIndex?: Maybe<Scalars['String']['output']>;
  referText?: Maybe<Scalars['String']['output']>;
  referTime?: Maybe<Scalars['Int']['output']>;
  replyToCommentId?: Maybe<Scalars['String']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type Card = {
  __typename?: 'Card';
  address_country?: Maybe<Scalars['String']['output']>;
  address_zip?: Maybe<Scalars['String']['output']>;
  exp_month?: Maybe<Scalars['Int']['output']>;
  exp_year?: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  isDefault?: Maybe<Scalars['Boolean']['output']>;
  last4?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<CardMetadata>;
};

export type CardContent = {
  __typename?: 'CardContent';
  buttonLabel: Scalars['String']['output'];
  buttonValue: Scalars['String']['output'];
  description: Scalars['String']['output'];
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type CardInfo = {
  brand: Scalars['String']['input'];
  exp_month: Scalars['Int']['input'];
  exp_year: Scalars['Int']['input'];
  id: Scalars['ID']['input'];
  last4: Scalars['String']['input'];
  tokenId: Scalars['String']['input'];
};

export type CardInfoInput = {
  brand: Scalars['String']['input'];
  exp_month: Scalars['Int']['input'];
  exp_year: Scalars['Int']['input'];
  id: Scalars['String']['input'];
  last4: Scalars['String']['input'];
  tokenId: Scalars['String']['input'];
};

export type CardMetadata = {
  __typename?: 'CardMetadata';
  email?: Maybe<Scalars['String']['output']>;
  fullName?: Maybe<Scalars['String']['output']>;
};

export type Categories = {
  __typename?: 'Categories';
  _id: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['Date']['output']>;
  owner?: Maybe<Scalars['String']['output']>;
  property?: Maybe<Properties>;
  teamAccess?: Maybe<Scalars['Boolean']['output']>;
};

export type CategoryMetric = {
  __typename?: 'CategoryMetric';
  category?: Maybe<Scalars['String']['output']>;
  word?: Maybe<Scalars['String']['output']>;
};

export type Channel = {
  __typename?: 'Channel';
  _id: Scalars['String']['output'];
  createdBy?: Maybe<Scalars['String']['output']>;
  isPrivate?: Maybe<Scalars['Boolean']['output']>;
  memberCount?: Maybe<Scalars['Int']['output']>;
  members?: Maybe<Array<ChannelMember>>;
  teamId?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type ChannelMember = {
  __typename?: 'ChannelMember';
  _id?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  isAdmin?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  picture?: Maybe<Scalars['String']['output']>;
};

export type ChannelSettingsInput = {
  channelId?: InputMaybe<Scalars['String']['input']>;
};

export type ChannelSettingsOutput = {
  __typename?: 'ChannelSettingsOutput';
  channelId?: Maybe<Scalars['String']['output']>;
};

export type Checklist = {
  __typename?: 'Checklist';
  email: Scalars['String']['output'];
  progress: Scalars['Float']['output'];
  shouldShowChecklist: Scalars['Boolean']['output'];
  tasks: Array<ChecklistTask>;
};

export type ChecklistTask = {
  __typename?: 'ChecklistTask';
  completed: Scalars['Boolean']['output'];
  key: Scalars['String']['output'];
};

export type ChurnChatResponse = {
  __typename?: 'ChurnChatResponse';
  classification?: Maybe<Scalars['String']['output']>;
  classifierVersion?: Maybe<Scalars['String']['output']>;
  content?: Maybe<Scalars['JSON']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<ChurnMetadata>;
  requesterEmail?: Maybe<Scalars['String']['output']>;
  sessionId: Scalars['String']['output'];
  source?: Maybe<Scalars['String']['output']>;
  traceId?: Maybe<Scalars['String']['output']>;
};

export type ChurnDefenderMessageInput = {
  content: Scalars['String']['input'];
  role: Scalars['String']['input'];
};

export type ChurnDefenderSession = {
  __typename?: 'ChurnDefenderSession';
  history?: Maybe<Array<Scalars['JSON']['output']>>;
  sessionId: Scalars['String']['output'];
};

export type ChurnMetadata = {
  __typename?: 'ChurnMetadata';
  churnReason: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type ChurnMetadataInput = {
  churnReason: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type ClaimCreditResult = {
  __typename?: 'ClaimCreditResult';
  amount?: Maybe<Scalars['Int']['output']>;
  granted: Scalars['Boolean']['output'];
};

export type ClaimPartnerPerkInput = {
  campaign: Scalars['String']['input'];
  source?: InputMaybe<EnumPartnerPerkClaimSource>;
};

export type ClickIds = {
  __typename?: 'ClickIds';
  initialFBClickId?: Maybe<Scalars['String']['output']>;
  initialGClickId?: Maybe<Scalars['String']['output']>;
  initialRedditClickId?: Maybe<Scalars['String']['output']>;
};

/** Consent channels a client is allowed to self-report. `chat` is a Google Meet chat notice delivered through client-side keyboard automation. It is distinct from a Teams chat notice, which the server posts and records from the provider's confirmed response. */
export enum ClientConsentChannel {
  Audio = 'audio',
  Camera = 'camera',
  Chat = 'chat'
}

/** Outcomes a client may report. Clients report attempts — either the notice reached the meeting, or it was attempted and failed. Non-attempts are not reported, so an absent row means no announcement was attempted. */
export enum ClientConsentOutcome {
  Failed = 'failed',
  Sent = 'sent'
}

export type ClipSegment = {
  __typename?: 'ClipSegment';
  endTime: Scalars['Float']['output'];
  speed?: Maybe<Scalars['Float']['output']>;
  startTime: Scalars['Float']['output'];
};

export type ClipSegmentInput = {
  endTime: Scalars['Float']['input'];
  speed?: InputMaybe<Scalars['Float']['input']>;
  startTime: Scalars['Float']['input'];
};

export type CompanyOpenPositionsResponse = {
  __typename?: 'CompanyOpenPositionsResponse';
  jobTitles: Array<Scalars['String']['output']>;
};

export type CompanyOwner = {
  __typename?: 'CompanyOwner';
  email?: Maybe<Scalars['String']['output']>;
  externalOwnerId: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type ComparedMeetingAnalytics = {
  __typename?: 'ComparedMeetingAnalytics';
  compareToDays: Scalars['Int']['output'];
  endTime: Scalars['DateTime']['output'];
  startTime: Scalars['DateTime']['output'];
  teamStats: ComparedMeetingAnalyticsTeamStats;
  teammates: Array<ComparedMeetingAnalyticsTeammateStats>;
};

export type ComparedMeetingAnalyticsStats = {
  __typename?: 'ComparedMeetingAnalyticsStats';
  count: Scalars['Int']['output'];
  countDiff: Scalars['Int']['output'];
  countDiffComparedTo: Scalars['Int']['output'];
  countDiffPct?: Maybe<Scalars['Int']['output']>;
  duration: Scalars['Int']['output'];
  durationDiff: Scalars['Int']['output'];
  durationDiffComparedTo: Scalars['Int']['output'];
  durationDiffPct?: Maybe<Scalars['Int']['output']>;
};

export type ComparedMeetingAnalyticsTeamStats = {
  __typename?: 'ComparedMeetingAnalyticsTeamStats';
  averageCount: Scalars['Float']['output'];
  averageCountDiffPct?: Maybe<Scalars['Int']['output']>;
  averageDuration: Scalars['Float']['output'];
  averageDurationDiffPct?: Maybe<Scalars['Int']['output']>;
  count: Scalars['Int']['output'];
  countDiffPct?: Maybe<Scalars['Int']['output']>;
  duration: Scalars['Float']['output'];
  durationDiffPct?: Maybe<Scalars['Int']['output']>;
};

export type ComparedMeetingAnalyticsTeammateStats = {
  __typename?: 'ComparedMeetingAnalyticsTeammateStats';
  endTime: Scalars['DateTime']['output'];
  meetingsStats: ComparedMeetingAnalyticsStats;
  participantsInDomain: Scalars['Int']['output'];
  participantsInteracted: Array<MeetingParticipantInteracted>;
  participantsOutOfDomain: Scalars['Int']['output'];
  startTime: Scalars['DateTime']['output'];
  totalParticipants: Scalars['Int']['output'];
  user: AnalyticsUser;
};

export type ComparedMeetingNotesAnalytics = {
  __typename?: 'ComparedMeetingNotesAnalytics';
  compareToDays: Scalars['Int']['output'];
  endTime: Scalars['DateTime']['output'];
  startTime: Scalars['DateTime']['output'];
  teamStats: ComparedMeetingNotesAnalyticsTeamStats;
  teammates: Array<ComparedMeetingNotesAnalyticsTeammates>;
};

export type ComparedMeetingNotesAnalyticsTeamStats = {
  __typename?: 'ComparedMeetingNotesAnalyticsTeamStats';
  averageFillerWords: Scalars['Float']['output'];
  averageFillerWordsDiffPct?: Maybe<Scalars['Int']['output']>;
  averageMonologuesCount: Scalars['Float']['output'];
  averageMonologuesCountDiffPct?: Maybe<Scalars['Int']['output']>;
  averageQuestions: Scalars['Float']['output'];
  averageQuestionsDiffPct?: Maybe<Scalars['Int']['output']>;
  averageSentiments: Sentiments;
  averageSilenceDuration: Scalars['Float']['output'];
  averageSilenceDurationDiffPct?: Maybe<Scalars['Int']['output']>;
  averageTalkListenRatio: Scalars['Float']['output'];
  averageWordsPerMinute: Scalars['Float']['output'];
  longestMonologueDurationDiffPct?: Maybe<Scalars['Int']['output']>;
  longestMonologueDurationSec: Scalars['Int']['output'];
  teammatesCount: Scalars['Int']['output'];
  totalFillerWords: Scalars['Int']['output'];
  totalFillerWordsDiffPct?: Maybe<Scalars['Int']['output']>;
  totalMeetingNotesCount: Scalars['Int']['output'];
  totalMeetingsCount: Scalars['Int']['output'];
  totalMonologuesCount: Scalars['Int']['output'];
  totalMonologuesDiffPct?: Maybe<Scalars['Int']['output']>;
  totalQuestions: Scalars['Int']['output'];
  totalQuestionsDiffPct?: Maybe<Scalars['Int']['output']>;
  totalSilenceDuration: Scalars['Float']['output'];
  totalSilenceDurationDiffPct?: Maybe<Scalars['Int']['output']>;
};

export type ComparedMeetingNotesAnalyticsTeammates = {
  __typename?: 'ComparedMeetingNotesAnalyticsTeammates';
  analytics: ComparedTeammateMeetingNotesAnalytics;
  endTime: Scalars['DateTime']['output'];
  meetingNotesCount: Scalars['Int']['output'];
  meetingsCount: Scalars['Int']['output'];
  sentiments: Sentiments;
  startTime: Scalars['DateTime']['output'];
  user: AnalyticsUser;
};

export type ComparedTeammateMeetingNotesAnalytics = {
  __typename?: 'ComparedTeammateMeetingNotesAnalytics';
  talkListenPct?: Maybe<Scalars['Float']['output']>;
  talkListenRatio: Scalars['Float']['output'];
  totalSilenceDuration: Scalars['Float']['output'];
  totalSilenceDurationCompareTo: Scalars['Float']['output'];
  totalSilencePct?: Maybe<Scalars['Float']['output']>;
  totalSilenceRatio: Scalars['Float']['output'];
  totalSpeakDuration: Scalars['Float']['output'];
  totalSpeakDurationWithUser: Scalars['Float']['output'];
  totalWordCount: Scalars['Int']['output'];
  userFillerWords: Scalars['Float']['output'];
  userFillerWordsCompareTo: Scalars['Float']['output'];
  userFillerWordsDiffPct?: Maybe<Scalars['Int']['output']>;
  userLongestMonologueCompareTo: Scalars['Float']['output'];
  userLongestMonologueDiffPct?: Maybe<Scalars['Int']['output']>;
  userLongestMonologueSec: Scalars['Float']['output'];
  userMonologuesCount: Scalars['Float']['output'];
  userMonologuesCountCompareTo: Scalars['Float']['output'];
  userMonologuesCountDiffPct?: Maybe<Scalars['Int']['output']>;
  userQuestions: Scalars['Float']['output'];
  userQuestionsCompareTo: Scalars['Float']['output'];
  userQuestionsDiffPct?: Maybe<Scalars['Int']['output']>;
  userSpeakDuration: Scalars['Float']['output'];
  userWordCount: Scalars['Int']['output'];
  userWordsPerMinute: Scalars['Float']['output'];
  userWordsPerMinuteCompareTo: Scalars['Float']['output'];
  userWordsPerMinuteDiffPct?: Maybe<Scalars['Int']['output']>;
};

export type CompleteOnboardingStepExtraInfoInput = {
  autoJoin?: InputMaybe<Scalars['String']['input']>;
  customRole?: InputMaybe<Scalars['String']['input']>;
  emailAssistantEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  freeTrial?: InputMaybe<Scalars['Boolean']['input']>;
  gmailConnected?: InputMaybe<Scalars['Boolean']['input']>;
  loginPageVersion?: InputMaybe<EnumLoginPageVersion>;
  outlookConnected?: InputMaybe<Scalars['Boolean']['input']>;
  referralSource?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  sendNotesTo?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  stepsToShow?: InputMaybe<Array<EnumOnboardingStep>>;
  suggestion?: InputMaybe<EnumTeamOnboardingSuggestionType>;
  title?: InputMaybe<Scalars['String']['input']>;
  toggledUnlimitedTranscriptions?: InputMaybe<Scalars['Boolean']['input']>;
  tools?: InputMaybe<Array<Scalars['String']['input']>>;
  version?: InputMaybe<Scalars['String']['input']>;
};

export type ConditionInput = {
  conditions?: InputMaybe<Array<InputMaybe<ConditionInput>>>;
  field?: InputMaybe<Scalars['String']['input']>;
  operator?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['JSON']['input']>;
};

export type ConnectLink = {
  __typename?: 'ConnectLink';
  label?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type ConnectedConnectors = {
  __typename?: 'ConnectedConnectors';
  data?: Maybe<Array<UserConnector>>;
  has_more?: Maybe<Scalars['Boolean']['output']>;
};

export type ConnectedUserItem = {
  __typename?: 'ConnectedUserItem';
  connectedEmail?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  isAdmin: Scalars['Boolean']['output'];
  isPersonal: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  userConnectorId: Scalars['String']['output'];
  userId: Scalars['String']['output'];
  workspaceName?: Maybe<Scalars['String']['output']>;
};

export type Connector = {
  __typename?: 'Connector';
  auth_type?: Maybe<Scalars['String']['output']>;
  categories?: Maybe<Array<Scalars['String']['output']>>;
  category?: Maybe<Scalars['String']['output']>;
  connector_setup_limit?: Maybe<Scalars['Int']['output']>;
  display_name?: Maybe<Scalars['String']['output']>;
  feature_mode?: Maybe<Scalars['String']['output']>;
  features_metadata?: Maybe<FeaturesMetadata>;
  guide_url?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  long_description?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  post_connect_links?: Maybe<Array<ConnectLink>>;
  pre_connect_links?: Maybe<Array<ConnectLink>>;
  provider?: Maybe<Scalars['String']['output']>;
  published?: Maybe<Scalars['Boolean']['output']>;
  published_at?: Maybe<Scalars['String']['output']>;
  short_description?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  strategy?: Maybe<Array<Scalars['String']['output']>>;
};

export type ConnectorAuthResponse = {
  __typename?: 'ConnectorAuthResponse';
  authorizationURL?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  initiateURL?: Maybe<Scalars['String']['output']>;
  streamToken?: Maybe<Scalars['String']['output']>;
};

export type ConnectorCategory = {
  __typename?: 'ConnectorCategory';
  description?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type ConnectorContact = {
  __typename?: 'ConnectorContact';
  list?: Maybe<Array<ConnectorContactItem>>;
  meta?: Maybe<ConnectorMeta>;
};

export type ConnectorContactItem = {
  __typename?: 'ConnectorContactItem';
  email?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type ConnectorDetails = {
  __typename?: 'ConnectorDetails';
  action_permissions?: Maybe<Array<Scalars['String']['output']>>;
  blueprint?: Maybe<BluePrint>;
  connector?: Maybe<Connector>;
  past_meetings_filters?: Maybe<Array<PastMeetingsFilterOption>>;
  platform_manifest?: Maybe<PlatformMainfest>;
  setup_rules?: Maybe<ConnectorSetupRules>;
  user_connector?: Maybe<UserConnector>;
};

export type ConnectorHistory = {
  __typename?: 'ConnectorHistory';
  data?: Maybe<Array<ConnectorJob>>;
  has_more?: Maybe<Scalars['Boolean']['output']>;
};

export type ConnectorIntegration = {
  __typename?: 'ConnectorIntegration';
  actions?: Maybe<Array<Scalars['String']['output']>>;
  aiAppsTriggerSourcesFilter?: Maybe<Array<Scalars['String']['output']>>;
  authType?: Maybe<Scalars['String']['output']>;
  beta?: Maybe<Scalars['Boolean']['output']>;
  bgColor?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  comingSoon?: Maybe<Scalars['Boolean']['output']>;
  connected?: Maybe<Scalars['Boolean']['output']>;
  connectorSetupLimit?: Maybe<Scalars['Int']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  externalMcpUrl?: Maybe<Scalars['String']['output']>;
  featureMode?: Maybe<Scalars['String']['output']>;
  hasMcpTools?: Maybe<Scalars['Boolean']['output']>;
  iconUrl?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  isPartnerIntegration?: Maybe<Scalars['Boolean']['output']>;
  isPremium?: Maybe<Scalars['Boolean']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  legacyName?: Maybe<Scalars['String']['output']>;
  migratedUsersOnly?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  supportAiApps?: Maybe<Scalars['Boolean']['output']>;
  supportExternalMcp?: Maybe<Scalars['Boolean']['output']>;
  supportOrchestratorMCPTools?: Maybe<Scalars['Boolean']['output']>;
  supportTaskManagement?: Maybe<Scalars['Boolean']['output']>;
  supportsConnectorFramework?: Maybe<Scalars['Boolean']['output']>;
};

export type ConnectorInviteContact = {
  __typename?: 'ConnectorInviteContact';
  email: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type ConnectorInviteContactsMeta = {
  __typename?: 'ConnectorInviteContactsMeta';
  has_more?: Maybe<Scalars['Boolean']['output']>;
  pagination?: Maybe<ConnectorInviteContactsPagination>;
};

export type ConnectorInviteContactsPagination = {
  __typename?: 'ConnectorInviteContactsPagination';
  next_page_query?: Maybe<Scalars['String']['output']>;
};

export type ConnectorInviteContactsPaginationInput = {
  next_page_query?: InputMaybe<Scalars['String']['input']>;
};

export type ConnectorInviteContactsResult = {
  __typename?: 'ConnectorInviteContactsResult';
  contacts: Array<ConnectorInviteContact>;
  meta?: Maybe<ConnectorInviteContactsMeta>;
};

export type ConnectorJob = {
  __typename?: 'ConnectorJob';
  action?: Maybe<Scalars['String']['output']>;
  cid?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  feature_version?: Maybe<Scalars['Int']['output']>;
  job_id?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  outcome?: Maybe<Scalars['String']['output']>;
  scope?: Maybe<Scalars['String']['output']>;
  setup_label?: Maybe<Scalars['String']['output']>;
  setup_target?: Maybe<Scalars['JSON']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type ConnectorList = {
  __typename?: 'ConnectorList';
  categories?: Maybe<Array<ConnectorCategory>>;
  integrations?: Maybe<Array<ConnectorIntegration>>;
  newIntegrations?: Maybe<Array<ConnectorIntegration>>;
};

export type ConnectorMeta = {
  __typename?: 'ConnectorMeta';
  has_more?: Maybe<Scalars['Boolean']['output']>;
  pagination?: Maybe<ConnectorPagination>;
};

export type ConnectorPagination = {
  __typename?: 'ConnectorPagination';
  next_page_query?: Maybe<Scalars['String']['output']>;
  prev_page_query?: Maybe<Scalars['String']['output']>;
};

export type ConnectorResource = {
  __typename?: 'ConnectorResource';
  default_value?: Maybe<ConnectorResourceDefaultValue>;
  list?: Maybe<Array<ConnectorResourceItem>>;
  meta?: Maybe<ConnectorMeta>;
};

export type ConnectorResourceDefaultValue = {
  __typename?: 'ConnectorResourceDefaultValue';
  label?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type ConnectorResourceItem = {
  __typename?: 'ConnectorResourceItem';
  description?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type ConnectorSetupField = {
  __typename?: 'ConnectorSetupField';
  message?: Maybe<Scalars['String']['output']>;
  ok?: Maybe<Scalars['Boolean']['output']>;
};

export type ConnectorSetupInput = {
  appSetup?: InputMaybe<AppSetupInput>;
  connectorSetup: Scalars['JSON']['input'];
  label?: InputMaybe<Scalars['String']['input']>;
  platformSetup: Scalars['JSON']['input'];
  rule?: InputMaybe<RuleInput>;
  strategy?: InputMaybe<Scalars['String']['input']>;
};

export type ConnectorSetupList = {
  __typename?: 'ConnectorSetupList';
  data?: Maybe<Array<ConnectorSetupListData>>;
  has_more?: Maybe<Scalars['Boolean']['output']>;
};

export type ConnectorSetupListData = {
  __typename?: 'ConnectorSetupListData';
  action_permissions?: Maybe<Array<Scalars['String']['output']>>;
  blueprint?: Maybe<BluePrint>;
  setup?: Maybe<Scalars['JSON']['output']>;
};

export type ConnectorSetupResponse = {
  __typename?: 'ConnectorSetupResponse';
  message?: Maybe<Scalars['JSON']['output']>;
  ok?: Maybe<Scalars['Boolean']['output']>;
  originOwnerId?: Maybe<Scalars['String']['output']>;
};

export type ConnectorSetupRules = {
  __typename?: 'ConnectorSetupRules';
  eligibility_hint?: Maybe<Scalars['String']['output']>;
};

export type Contact = {
  __typename?: 'Contact';
  bio?: Maybe<Scalars['String']['output']>;
  bioLastUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  bioManuallyUpdated?: Maybe<Scalars['Boolean']['output']>;
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastMeetingDate?: Maybe<Scalars['DateTime']['output']>;
  meetingHistory: ContactMeetingHistory;
  name: Scalars['String']['output'];
  ownerId: Scalars['String']['output'];
  picture?: Maybe<Scalars['String']['output']>;
  upcomingMeetings: Array<ContactUpcomingMeeting>;
  updatedAt: Scalars['DateTime']['output'];
};


export type ContactMeetingHistoryArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<EnumContactMeetingHistoryType>;
};

export type ContactMeeting = {
  __typename?: 'ContactMeeting';
  id: Scalars['ID']['output'];
  summary?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type ContactMeetingHistory = {
  __typename?: 'ContactMeetingHistory';
  meetings: Array<ContactMeeting>;
  totalCount: Scalars['Float']['output'];
};

export type ContactUpcomingMeeting = {
  __typename?: 'ContactUpcomingMeeting';
  timestamp: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type Contract = {
  __typename?: 'Contract';
  id?: Maybe<Scalars['String']['output']>;
  signed?: Maybe<Scalars['Boolean']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type CopilotAgentSettingsInput = {
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  enabledVoiceResponseMode?: InputMaybe<Scalars['Boolean']['input']>;
  enabledVoiceTriggerMode?: InputMaybe<Scalars['Boolean']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  voiceInputMode?: InputMaybe<Scalars['String']['input']>;
  voiceOutputMode?: InputMaybe<Scalars['String']['input']>;
};

export type CopilotAgentSettingsMeta = {
  __typename?: 'CopilotAgentSettingsMeta';
  enabled?: Maybe<Scalars['Boolean']['output']>;
  enabledVoiceResponseMode?: Maybe<Scalars['Boolean']['output']>;
  enabledVoiceTriggerMode?: Maybe<Scalars['Boolean']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  voiceInputMode?: Maybe<Scalars['String']['output']>;
  voiceOutputMode?: Maybe<Scalars['String']['output']>;
};

export type CopilotAgentTeamSettings = {
  __typename?: 'CopilotAgentTeamSettings';
  askFredLiveAccess?: Maybe<Scalars['String']['output']>;
  voiceResponseModeAccess?: Maybe<Scalars['String']['output']>;
  voiceTriggerModeAccess?: Maybe<Scalars['String']['output']>;
};

export type CopilotAgentTeamSettingsInput = {
  askFredLiveAccess?: InputMaybe<Scalars['String']['input']>;
  voiceResponseModeAccess?: InputMaybe<Scalars['String']['input']>;
  voiceTriggerModeAccess?: InputMaybe<Scalars['String']['input']>;
};

export type CopperActivities = {
  __typename?: 'CopperActivities';
  category?: Maybe<Scalars['String']['output']>;
  count_as_interaction?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  is_disabled?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type Counters = {
  __typename?: 'Counters';
  allMicroCreditsUsed?: Maybe<Scalars['Float']['output']>;
  /** @deprecated Use allMicroCreditsUsed */
  allNanoCreditsUsed?: Maybe<Scalars['Float']['output']>;
  allPromptsUsed?: Maybe<Scalars['Float']['output']>;
  meetings?: Maybe<Scalars['Int']['output']>;
  monthlyMicroCreditsUsed?: Maybe<Scalars['Float']['output']>;
  /** @deprecated Use monthlyMicroCreditsUsed */
  monthlyNanoCreditsUsed?: Maybe<Scalars['Float']['output']>;
  monthlyPromptsLimit?: Maybe<Scalars['Float']['output']>;
  monthlyPromptsUsed?: Maybe<Scalars['Float']['output']>;
  monthlyQuotaPercent?: Maybe<Scalars['Float']['output']>;
  monthlyRevenue?: Maybe<Scalars['Float']['output']>;
  monthlyTranscriptionMins?: Maybe<Scalars['Float']['output']>;
  monthlyTranscriptionMinsAvailable?: Maybe<Scalars['Float']['output']>;
  totalRevenue?: Maybe<Scalars['Float']['output']>;
  totalStorageMinutes?: Maybe<Scalars['Float']['output']>;
  yearlyAICreditsPlanQuantity?: Maybe<Scalars['Int']['output']>;
};

export type Coupon = {
  __typename?: 'Coupon';
  _id: Scalars['String']['output'];
  campaign?: Maybe<Scalars['String']['output']>;
  checkoutBreakdownLabel?: Maybe<Scalars['String']['output']>;
  checkoutLabel?: Maybe<Scalars['String']['output']>;
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<EnumCouponDuration>;
  durationInMonths?: Maybe<Scalars['Int']['output']>;
  grantedCredits?: Maybe<CouponGrantedCredits>;
  id: Scalars['String']['output'];
  maxSeats?: Maybe<Scalars['Int']['output']>;
  type: EnumCouponType;
  updatedAt: Scalars['DateTime']['output'];
  validActions?: Maybe<Array<EnumCouponValidActions>>;
  validPlans?: Maybe<Array<Scalars['String']['output']>>;
  value: Scalars['Int']['output'];
};

export type CouponGrantedCredits = {
  __typename?: 'CouponGrantedCredits';
  amount: Scalars['Int']['output'];
  expiresInDays: Scalars['Int']['output'];
};

export type CouponRedemption = {
  __typename?: 'CouponRedemption';
  _id: Scalars['String']['output'];
  couponCampaign?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type CreateAiExtensionsSubscription = {
  __typename?: 'CreateAIExtensionsSubscription';
  aiExtensionsSubscription?: Maybe<AiExtensionsSubscription>;
  createdSubscription: CreateSubscription;
  teamPromptsConsumed?: Maybe<TeamPromptsConsumed>;
};

export type CreateAppIntegrationActionInput = {
  label?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  resource?: InputMaybe<Scalars['String']['input']>;
  resourceId?: InputMaybe<Scalars['JSON']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type CreateAppIntegrationInput = {
  actions?: InputMaybe<Array<CreateAppIntegrationActionInput>>;
  category: Scalars['String']['input'];
  displayName?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CreateAppPreviewInput = {
  appId: Scalars['String']['input'];
  meetingIds: Array<Scalars['String']['input']>;
  output: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type CreateAppSettingsInput = {
  active: Scalars['Boolean']['input'];
  agentic?: InputMaybe<AppSettingsAgenticConfigInput>;
  appPrivacy: EnumAppPrivacy;
  appTemplateId?: InputMaybe<Scalars['String']['input']>;
  autoEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  brandGuidelinesId?: InputMaybe<Scalars['String']['input']>;
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  engine?: InputMaybe<EnumAppEngine>;
  integrations?: InputMaybe<Array<CreateAppIntegrationInput>>;
  model?: InputMaybe<Scalars['String']['input']>;
  outputPrivacy: EnumAppOutputPrivacyType;
  outputPrivacyUserGroupIds?: InputMaybe<Array<Scalars['String']['input']>>;
  outputType?: InputMaybe<EnumAppOutputType>;
  prompt: AppPromptInput;
  ref?: InputMaybe<Scalars['String']['input']>;
  sharedUserGroupIds?: InputMaybe<Array<Scalars['String']['input']>>;
  sources?: InputMaybe<Array<EnumKnowledgeSource>>;
  teamId?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  trigger: CreateAppTriggerInput;
  type: EnumAppType;
};

export type CreateAppTriggerInput = {
  cron?: InputMaybe<Scalars['String']['input']>;
  rules?: InputMaybe<Array<CreateAppTriggerRuleInput>>;
  rulesCompositionType?: InputMaybe<EnumAppTriggerRulesCompositionType>;
  source: EnumAppTriggerSource;
  sources?: InputMaybe<Array<EnumAppTriggerSource>>;
};

export type CreateAppTriggerRuleInput = {
  field: EnumAppTriggerRuleFieldType;
  operator: EnumAppTriggerRuleFieldOperator;
  values: Array<Scalars['String']['input']>;
};

export type CreateAutopilotAgentInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  isPublished: Scalars['Boolean']['input'];
  knowledgeBase?: InputMaybe<Array<KnowledgeBaseItemInput>>;
  knowledgeBaseCategories?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  name: Scalars['String']['input'];
  organization?: InputMaybe<Scalars['String']['input']>;
  questionParagraph: Scalars['String']['input'];
  settings: AutopilotAgentSettingsInput;
  templateId: Scalars['String']['input'];
  userInstructions?: InputMaybe<Scalars['String']['input']>;
};

export type CreateCustomBotNameSubscriptionInput = {
  applyToAllTeammates: Scalars['Boolean']['input'];
  defaultSource?: InputMaybe<Scalars['ID']['input']>;
  interval: EnumBillingInterval;
  name: Scalars['String']['input'];
  paywall?: InputMaybe<Scalars['String']['input']>;
  referral?: InputMaybe<Scalars['String']['input']>;
};

export type CreateEmailRuleInput = {
  actions: Array<EmailRuleActionInput>;
  filters: Array<EmailRuleFilterInput>;
};

export type CreateManualUploadBatchInput = {
  files: Array<ManualUploadFileInput>;
};

export type CreateRuleInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  categories?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  description?: InputMaybe<Scalars['String']['input']>;
  globalRuleId?: InputMaybe<Scalars['String']['input']>;
  nodeSettings?: InputMaybe<RulesNodeSettingsInput>;
  teamEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  templateId?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  trigger: TriggerInput;
  type?: InputMaybe<ExtensionType>;
};

export type CreateRuleResponsePlaceholder = {
  __typename?: 'CreateRuleResponsePlaceholder';
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type CreateScenarioInput = {
  action: Scalars['String']['input'];
  actionType: ScenarioActionType;
  agentId: Scalars['ID']['input'];
  rule: Scalars['String']['input'];
};

export type CreateSoundbiteInput = {
  endTime: Scalars['Float']['input'];
  mediaType?: InputMaybe<Scalars['String']['input']>;
  meetingId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  privacies?: InputMaybe<Array<SoundbitePrivacy>>;
  startTime: Scalars['Float']['input'];
  summary?: InputMaybe<Scalars['String']['input']>;
};

export type CreateSubscription = {
  __typename?: 'CreateSubscription';
  is3ds?: Maybe<Scalars['Boolean']['output']>;
  redirectUrl?: Maybe<Scalars['String']['output']>;
  subscription?: Maybe<StripeSubscription>;
};

export type CreateSubscriptionInput = {
  cardInfo?: InputMaybe<CardInfoInput>;
  couponId?: InputMaybe<Scalars['String']['input']>;
  defaultPaymentMethod?: InputMaybe<Scalars['String']['input']>;
  discountCouponId?: InputMaybe<Scalars['String']['input']>;
  paywall?: InputMaybe<Scalars['String']['input']>;
  plan: Scalars['String']['input'];
  referral?: InputMaybe<Scalars['String']['input']>;
  seats: Scalars['Int']['input'];
  trialPeriodDays?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateSummarySettingsInput = {
  enabled: Scalars['Boolean']['input'];
  extendedSections?: InputMaybe<Array<SummarySettingsSectionInput>>;
  length: EnumSummaryLength;
  templateId: Scalars['String']['input'];
};

export type CreateSummaryTemplateFromSampleInput = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  customStyle?: InputMaybe<Scalars['String']['input']>;
  includeInAutoClassification?: InputMaybe<Scalars['Boolean']['input']>;
  index?: InputMaybe<Scalars['Float']['input']>;
  isPreview?: InputMaybe<Scalars['Boolean']['input']>;
  mimeType?: InputMaybe<Scalars['String']['input']>;
  objectKey?: InputMaybe<Scalars['String']['input']>;
  sampleContent?: InputMaybe<Scalars['String']['input']>;
  sampleFileName?: InputMaybe<Scalars['String']['input']>;
  shareScope?: InputMaybe<SummaryTemplateShareScope>;
  teamId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateSummaryTemplateInput = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  extendedSections?: InputMaybe<Array<ExtendedSectionInput>>;
  includeInAutoClassification?: InputMaybe<Scalars['Boolean']['input']>;
  index?: InputMaybe<Scalars['Float']['input']>;
  isPreview?: InputMaybe<Scalars['Boolean']['input']>;
  shareScope?: InputMaybe<SummaryTemplateShareScope>;
  teamId?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type CreateTaskInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  ownerId?: InputMaybe<Scalars['String']['input']>;
  ownerType?: InputMaybe<EnumCreateTaskOwnerType>;
  source: Scalars['String']['input'];
  status?: InputMaybe<EnumTaskStatus>;
  title: Scalars['String']['input'];
};

export type CreateTeamRuleInput = {
  actions?: InputMaybe<Array<RuleActionInput>>;
  active?: InputMaybe<Scalars['Boolean']['input']>;
  categories?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  description?: InputMaybe<Scalars['String']['input']>;
  globalRuleId?: InputMaybe<Scalars['String']['input']>;
  nodeSettings?: InputMaybe<RulesNodeSettingsInput>;
  teamEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  templateId?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  trigger: RuleTriggerInput;
  type?: InputMaybe<ExtensionType>;
};

export type CreateTeamSummaryTemplateFromSampleInput = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  customStyle?: InputMaybe<Scalars['String']['input']>;
  includeInAutoClassification?: InputMaybe<Scalars['Boolean']['input']>;
  index?: InputMaybe<Scalars['Float']['input']>;
  mimeType?: InputMaybe<Scalars['String']['input']>;
  objectKey?: InputMaybe<Scalars['String']['input']>;
  sampleContent?: InputMaybe<Scalars['String']['input']>;
  sampleFileName?: InputMaybe<Scalars['String']['input']>;
  setAsTeamDefault?: InputMaybe<Scalars['Boolean']['input']>;
  userGroupIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type CreateTeamSummaryTemplateInput = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  extendedSections?: InputMaybe<Array<ExtendedSectionInput>>;
  includeInAutoClassification?: InputMaybe<Scalars['Boolean']['input']>;
  index?: InputMaybe<Scalars['Float']['input']>;
  setAsTeamDefault?: InputMaybe<Scalars['Boolean']['input']>;
  title: Scalars['String']['input'];
  userGroupIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type CreateUserGroupInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  handle: Scalars['String']['input'];
  memberIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  name: Scalars['String']['input'];
};

export type CreateVoiceAgentFromMeetingsInput = {
  agentCategory: MeetingAgentCategory;
  meetingIds: Array<Scalars['ID']['input']>;
};

export type CreateVoiceAgentFromMeetingsResponse = {
  __typename?: 'CreateVoiceAgentFromMeetingsResponse';
  agent: AutopilotAgent;
  shareUrl: Scalars['String']['output'];
};

export type CreateVoiceCloneParams = {
  name: Scalars['String']['input'];
  storageKey: Scalars['String']['input'];
};

export type CreateVoiceCloneResponse = {
  __typename?: 'CreateVoiceCloneResponse';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
};

export type CreditIncentive = {
  __typename?: 'CreditIncentive';
  amount: Scalars['Int']['output'];
  expiresInDays: Scalars['Int']['output'];
  reason: Scalars['String']['output'];
};

export type CustomBotNameSubscription = {
  __typename?: 'CustomBotNameSubscription';
  applyToAllTeammates: Scalars['Boolean']['output'];
  cancelAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  nextPaymentAt?: Maybe<Scalars['DateTime']['output']>;
  quantity: Scalars['Float']['output'];
  status: Scalars['String']['output'];
  stripePlanId: Scalars['String']['output'];
  stripePlanNickname: Scalars['String']['output'];
  stripeSubscriptionId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type CustomDictionary = {
  __typename?: 'CustomDictionary';
  parseId?: Maybe<Scalars['String']['output']>;
  phrases: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type Customer = {
  __typename?: 'Customer';
  address?: Maybe<CustomerAddress>;
  balance?: Maybe<Scalars['Float']['output']>;
  default_source?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
};

export type CustomerAddress = {
  __typename?: 'CustomerAddress';
  city?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  line1?: Maybe<Scalars['String']['output']>;
  line2?: Maybe<Scalars['String']['output']>;
  postal_code?: Maybe<Scalars['String']['output']>;
  state?: Maybe<Scalars['String']['output']>;
};

export type CustomerTaxId = {
  __typename?: 'CustomerTaxId';
  type: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type DailyDigestMetadata = {
  __typename?: 'DailyDigestMetadata';
  appSettings: AppSettings;
  audioUrl?: Maybe<Scalars['String']['output']>;
  emailCount?: Maybe<Scalars['Float']['output']>;
  lastOutputCreatedAt?: Maybe<Scalars['DateTime']['output']>;
  meetingCount: Scalars['Float']['output'];
  slackCount?: Maybe<Scalars['Float']['output']>;
};

export type DataExportRequestInput = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  excludeAudio?: InputMaybe<Scalars['Boolean']['input']>;
  excludeVideos?: InputMaybe<Scalars['Boolean']['input']>;
  isExportForTeam: Scalars['Boolean']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  teamMemberEmails?: InputMaybe<Scalars['String']['input']>;
};

export type DataExportRequestResponse = {
  __typename?: 'DataExportRequestResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DateFilter = {
  end?: InputMaybe<Scalars['String']['input']>;
  start?: InputMaybe<Scalars['String']['input']>;
};

/** Date range options for filtering app outputs */
export enum DateRange {
  Last_7Days = 'LAST_7_DAYS',
  LastMonth = 'LAST_MONTH',
  ThisMonth = 'THIS_MONTH',
  Today = 'TODAY',
  Yesterday = 'YESTERDAY'
}

export type Deal = {
  __typename?: 'Deal';
  aiActionItems?: Maybe<Array<DealAiActionItem>>;
  aiDealCloseProbability?: Maybe<Scalars['Float']['output']>;
  aiDetailedInsights?: Maybe<Array<DealAiInsight>>;
  aiInsightSummary?: Maybe<Scalars['String']['output']>;
  aiKeyInsights?: Maybe<Array<Scalars['String']['output']>>;
  aiState?: Maybe<EnumAiDealState>;
  associatedExternalCompanyId?: Maybe<Scalars['String']['output']>;
  associatedExternalContactIds?: Maybe<Array<Scalars['String']['output']>>;
  company?: Maybe<DealCompany>;
  createdAt: Scalars['DateTime']['output'];
  daysToClose?: Maybe<Scalars['Float']['output']>;
  dealAcv?: Maybe<Scalars['Float']['output']>;
  dealArr?: Maybe<Scalars['Float']['output']>;
  dealCloseAt?: Maybe<Scalars['DateTime']['output']>;
  dealCreatedAt: Scalars['DateTime']['output'];
  dealType?: Maybe<Scalars['String']['output']>;
  dealValue?: Maybe<DealValue>;
  description?: Maybe<Scalars['String']['output']>;
  externalDealId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isClosed?: Maybe<Scalars['Boolean']['output']>;
  isWon?: Maybe<Scalars['Boolean']['output']>;
  lastAIValuesUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  lastActivityAt?: Maybe<Scalars['DateTime']['output']>;
  lastRelevantActivityAt?: Maybe<Scalars['DateTime']['output']>;
  lastSyncedAt: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  nextActivityAt?: Maybe<Scalars['DateTime']['output']>;
  pipeline?: Maybe<DealPipeline>;
  privacy?: Maybe<DealPrivacy>;
  provider: EnumDealProvider;
  representative?: Maybe<Representative>;
  sharedWithUserIds?: Maybe<Array<Scalars['String']['output']>>;
  stage?: Maybe<DealStage>;
  status?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type DealAiActionItem = {
  __typename?: 'DealAIActionItem';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isUserUpdated: Scalars['Boolean']['output'];
  priority: EnumAiDealActionItemPriority;
  status: EnumAiDealActionItemStatus;
  title: Scalars['String']['output'];
  what?: Maybe<Scalars['String']['output']>;
  when?: Maybe<Scalars['String']['output']>;
  who?: Maybe<Scalars['String']['output']>;
};

export type DealAiInsight = {
  __typename?: 'DealAIInsight';
  category?: Maybe<EnumAiDealInsightCategory>;
  description: Scalars['String']['output'];
  evidence?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  type: EnumAiDealInsightType;
};

export type DealAccessibleMeeting = {
  __typename?: 'DealAccessibleMeeting';
  hasAccess: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type DealCompany = {
  __typename?: 'DealCompany';
  associatedExternalContactIds?: Maybe<Array<Scalars['String']['output']>>;
  city?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  domain: Scalars['String']['output'];
  externalCompanyId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  industry?: Maybe<Scalars['String']['output']>;
  lastActivityAt?: Maybe<Scalars['DateTime']['output']>;
  lastSyncedAt: Scalars['DateTime']['output'];
  linkedinHandle?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  numberOfEmployees?: Maybe<Scalars['String']['output']>;
  owner?: Maybe<CompanyOwner>;
  timezone?: Maybe<Scalars['String']['output']>;
  twitterHandle?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  websiteUrl?: Maybe<Scalars['String']['output']>;
};

export type DealContact = {
  __typename?: 'DealContact';
  aiBio?: Maybe<Scalars['String']['output']>;
  companyName?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  emailDomain: Scalars['String']['output'];
  employmentRole?: Maybe<Scalars['String']['output']>;
  employmentSubRole?: Maybe<Scalars['String']['output']>;
  externalCompanyId: Scalars['String']['output'];
  externalContactId: Scalars['String']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  industry?: Maybe<Scalars['String']['output']>;
  jobFunction?: Maybe<Scalars['String']['output']>;
  jobTitle?: Maybe<Scalars['String']['output']>;
  lastActivityAt?: Maybe<Scalars['DateTime']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  lastSyncedAt: Scalars['DateTime']['output'];
  nextActivityAt?: Maybe<Scalars['DateTime']['output']>;
  timezone?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type DealCurrency = {
  __typename?: 'DealCurrency';
  code?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  symbol?: Maybe<Scalars['String']['output']>;
};

export type DealFilterItem = {
  __typename?: 'DealFilterItem';
  id?: Maybe<Scalars['String']['output']>;
  label: Scalars['String']['output'];
};

export type DealFilters = {
  __typename?: 'DealFilters';
  pipelineFilters: Array<DealFilterItem>;
  pipelines: Array<Scalars['String']['output']>;
  representativeFilters: Array<DealFilterItem>;
  representatives: Array<Scalars['String']['output']>;
  stageFilters: Array<DealFilterItem>;
  stages: Array<Scalars['String']['output']>;
};

export type DealIntelligenceAccess = {
  __typename?: 'DealIntelligenceAccess';
  connectors: Array<DealIntelligenceConnectorAccess>;
};

export type DealIntelligenceConnectorAccess = {
  __typename?: 'DealIntelligenceConnectorAccess';
  canSetup: Scalars['Boolean']['output'];
  connectorId: Scalars['String']['output'];
  hostEmail?: Maybe<Scalars['String']['output']>;
  hostFullname?: Maybe<Scalars['String']['output']>;
  hostUserConnectorId?: Maybe<Scalars['String']['output']>;
  teamHasSetup: Scalars['Boolean']['output'];
};

export type DealIntelligenceSettings = {
  __typename?: 'DealIntelligenceSettings';
  defaultDealPrivacy?: Maybe<EnumDealPrivacy>;
  enabled?: Maybe<Scalars['Boolean']['output']>;
  userGroupId?: Maybe<Scalars['String']['output']>;
};

export type DealMeetingAccess = {
  __typename?: 'DealMeetingAccess';
  accessibleCount: Scalars['Float']['output'];
  meetings: Array<DealAccessibleMeeting>;
  totalCount: Scalars['Float']['output'];
};

export type DealPipeline = {
  __typename?: 'DealPipeline';
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
};

/** Per-deal visibility level. OWNER limits access to the rep, ADMIN extends to team admins, TEAMMATES extends to all deal-intel user-group members. */
export enum DealPrivacy {
  /** Deal representative + all team admins can access the deal */
  Admin = 'ADMIN',
  /** Only the deal representative can access the deal */
  Owner = 'OWNER',
  /** All deal-intel user-group members can access the deal */
  Teammates = 'TEAMMATES'
}

/** Fields available for sorting deals */
export enum DealSortField {
  /** Sort by deal budget/value */
  Budget = 'BUDGET',
  /** Sort by deal creation date */
  CreatedAt = 'CREATED_AT',
  /** Sort by expected close date */
  ExpectedCloseDate = 'EXPECTED_CLOSE_DATE',
  /** Sort by last updated date */
  LastUpdatedAt = 'LAST_UPDATED_AT',
  /** Sort by deal name */
  Name = 'NAME',
  /** Sort by AI deal close probability */
  Probability = 'PROBABILITY',
  /** Sort by deal stage */
  Stage = 'STAGE',
  /** Sort by AI deal state */
  State = 'STATE'
}

export type DealStage = {
  __typename?: 'DealStage';
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
};

export type DealStageMetrics = {
  __typename?: 'DealStageMetrics';
  dealCount: Scalars['Int']['output'];
  stage: Scalars['String']['output'];
  totalValue: Scalars['Float']['output'];
};

export type DealUpcomingMeeting = {
  __typename?: 'DealUpcomingMeeting';
  id: Scalars['String']['output'];
  meetingId: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  title: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type DealValue = {
  __typename?: 'DealValue';
  currency?: Maybe<DealCurrency>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type DeleteAutofillConfigResponse = {
  __typename?: 'DeleteAutofillConfigResponse';
  message?: Maybe<Scalars['String']['output']>;
  ok?: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteKnowledgeBaseDocumentInput = {
  documentId: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  type?: InputMaybe<NamespaceType>;
};

export type DeleteVoiceCloneInput = {
  id: Scalars['String']['input'];
};

export type DeleteVoiceCloneResponse = {
  __typename?: 'DeleteVoiceCloneResponse';
  message?: Maybe<Scalars['String']['output']>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

/**
 * Why a capability was denied. Null on an allowed decision. Mirrors the internal
 * policy engine's deny reasons plus NOT_A_MEMBER for a caller with no team standing.
 */
export enum DenyReason {
  /** Level is ADMINS_ONLY: only team admins and super admins are allowed. */
  AdminsOnly = 'ADMINS_ONLY',
  /**
   * The caller has no (non-blocked) standing in the team, or their standing could
   * not be resolved. A fail-closed denial, not a schema/level decision.
   */
  NotAMember = 'NOT_A_MEMBER',
  /** Level is CUSTOM: the caller is not in the capability's custom grant list. */
  NotInCustomList = 'NOT_IN_CUSTOM_LIST',
  /** Level is NO_ONE: denied for everyone, including owners and admins. */
  NoOne = 'NO_ONE',
  /** Level is OWNER: only the resource owner (or super admin) is allowed. */
  OwnerOnly = 'OWNER_ONLY',
  /** Level is OWNER_AND_ADMINS: the caller is neither the resource owner nor a team admin (or super admin). */
  PolicyOwnerAndAdmins = 'POLICY_OWNER_AND_ADMINS',
  /** Denied by the team's plan tier. */
  Tier = 'TIER'
}

export enum DevicePlatform {
  Android = 'android',
  Ios = 'ios',
  Web = 'web'
}

export type DownloadsInput = {
  downloadType: Scalars['String']['input'];
  meetingId: Scalars['String']['input'];
  transcriptFormat?: InputMaybe<Scalars['String']['input']>;
};

export type DownloadsPropertiesInputV2 = {
  downloadType: Scalars['String']['input'];
  meetingId: Scalars['String']['input'];
  transcriptFormat?: InputMaybe<Scalars['String']['input']>;
};

export type DuplicateCard = {
  __typename?: 'DuplicateCard';
  customerId?: Maybe<Scalars['String']['output']>;
  tokenId?: Maybe<Scalars['String']['output']>;
};

export type DurationFilter = {
  gte?: InputMaybe<Scalars['Float']['input']>;
  lte?: InputMaybe<Scalars['Float']['input']>;
};

export type Email = {
  __typename?: 'Email';
  address?: Maybe<Scalars['String']['output']>;
  verified?: Maybe<Scalars['Boolean']['output']>;
};

export type EmailActionUsageDatapoint = {
  __typename?: 'EmailActionUsageDatapoint';
  action: EnumEmailAssistantAction;
  count: Scalars['Int']['output'];
};

export type EmailConnectionStatus = {
  __typename?: 'EmailConnectionStatus';
  gmail?: Maybe<Scalars['Boolean']['output']>;
  outlook?: Maybe<Scalars['Boolean']['output']>;
};

export type EmailDraftSettings = {
  __typename?: 'EmailDraftSettings';
  autoDraftEnabled: Scalars['Boolean']['output'];
  autoFollowUpDays?: Maybe<Scalars['Float']['output']>;
  autoFollowUpEnabled: Scalars['Boolean']['output'];
  createDraftsFor: EnumEmailCreateDraftsFor;
  draftInDays?: Maybe<Scalars['Float']['output']>;
  draftSample?: Maybe<Scalars['String']['output']>;
  draftSchedule: EnumEmailDraftSchedule;
  writingStyle?: Maybe<Scalars['String']['output']>;
};

export type EmailDraftSettingsInput = {
  autoDraftEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  autoFollowUpDays?: InputMaybe<Scalars['Float']['input']>;
  autoFollowUpEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  createDraftsFor?: InputMaybe<EnumEmailCreateDraftsFor>;
  draftInDays?: InputMaybe<Scalars['Float']['input']>;
  draftSchedule?: InputMaybe<EnumEmailDraftSchedule>;
  writingStyle?: InputMaybe<Scalars['String']['input']>;
};

export type EmailInfoInput = {
  addedVia: Scalars['String']['input'];
  email: Scalars['String']['input'];
};

export type EmailInsightSource = {
  __typename?: 'EmailInsightSource';
  date: Scalars['String']['output'];
  id: Scalars['String']['output'];
  participantEmails: Array<Scalars['String']['output']>;
  threadId: Scalars['String']['output'];
};

export type EmailInsights = {
  __typename?: 'EmailInsights';
  bullets: Array<Scalars['String']['output']>;
  emailCount: Scalars['Float']['output'];
  participants: Array<Scalars['String']['output']>;
  providers?: Maybe<Array<EnumEmailProvider>>;
  sources: Array<EmailInsightSource>;
  threadCount: Scalars['Float']['output'];
  windowEnd: Scalars['String']['output'];
  windowStart: Scalars['String']['output'];
};

export type EmailLabelCategory = {
  __typename?: 'EmailLabelCategory';
  backgroundColor?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  textColor?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type EmailRule = {
  __typename?: 'EmailRule';
  actions: Array<EmailRuleAction>;
  enabled: Scalars['Boolean']['output'];
  filters: Array<EmailRuleFilter>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  priority: Scalars['Int']['output'];
};

export type EmailRuleAction = {
  __typename?: 'EmailRuleAction';
  parameters: Scalars['String']['output'];
  type: EnumEmailRuleActionType;
};

export type EmailRuleActionInput = {
  parameters?: InputMaybe<Scalars['String']['input']>;
  type: EnumEmailRuleActionType;
};

export type EmailRuleFilter = {
  __typename?: 'EmailRuleFilter';
  field: EnumEmailRuleFilterField;
  operator: EnumEmailRuleFilterOperator;
  value: Scalars['String']['output'];
};

export type EmailRuleFilterInput = {
  field: EnumEmailRuleFilterField;
  operator: EnumEmailRuleFilterOperator;
  value: Scalars['String']['input'];
};

export type EmailSettings = {
  __typename?: 'EmailSettings';
  autoDraftPausedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  draftSettings?: Maybe<EmailDraftSettings>;
  enabledFeatures: Array<EnumEmailFeature>;
  id: Scalars['ID']['output'];
  isAssistantEnabled: Scalars['Boolean']['output'];
  sortingSettings?: Maybe<EmailSortingSettings>;
  tokenExpiredAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['String']['output'];
};

export type EmailSortingSettings = {
  __typename?: 'EmailSortingSettings';
  autoLabelEnabled: Scalars['Boolean']['output'];
  labelCategories?: Maybe<Array<EmailLabelCategory>>;
  overrideLabels: Scalars['Boolean']['output'];
  sortingScope?: Maybe<EnumEmailSortingScope>;
};

export type EmailSortingSettingsInput = {
  autoLabelEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  overrideLabels?: InputMaybe<Scalars['Boolean']['input']>;
  sortingScope?: InputMaybe<EnumEmailSortingScope>;
};

export enum EmailType {
  Business = 'business',
  Generic = 'generic'
}

export type EnhanceSummaryTemplateDescriptionInput = {
  description: Scalars['String']['input'];
};

export type EnrichedDomain = {
  __typename?: 'EnrichedDomain';
  brief?: Maybe<Scalars['String']['output']>;
  businessModel?: Maybe<Scalars['String']['output']>;
  companySize?: Maybe<Scalars['String']['output']>;
  competitors?: Maybe<Array<Scalars['String']['output']>>;
  description?: Maybe<Scalars['String']['output']>;
  differentiators?: Maybe<Array<Scalars['String']['output']>>;
  domain: Scalars['String']['output'];
  fundingSummary?: Maybe<Scalars['String']['output']>;
  keyProducts?: Maybe<Array<Scalars['String']['output']>>;
  name: Scalars['String']['output'];
  primaryCustomers?: Maybe<Scalars['String']['output']>;
  recentHeadlines: Array<OrganizationHeadline>;
};

export type EnrichedOrganization = {
  __typename?: 'EnrichedOrganization';
  _id: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  domain: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  recentHeadlines?: Maybe<Array<RecentHeadline>>;
};

export enum EnumAiCreditsConsumer {
  AiApp = 'AI_APP',
  AiAppMultiMeeting = 'AI_APP_MULTI_MEETING',
  Artifact = 'ARTIFACT',
  AskFred = 'ASK_FRED',
  AutofillExtraction = 'AUTOFILL_EXTRACTION',
  AutomatedAskFred = 'AUTOMATED_ASK_FRED',
  Autopilot = 'AUTOPILOT',
  Copilot = 'COPILOT',
  DealIntelligence = 'DEAL_INTELLIGENCE',
  EmailAssistant = 'EMAIL_ASSISTANT',
  MagicApps = 'MAGIC_APPS',
  PersonalAssistant = 'PERSONAL_ASSISTANT',
  RealtimeAskFred = 'REALTIME_ASK_FRED',
  RealtimeSalesAssist = 'REALTIME_SALES_ASSIST',
  SlackFred = 'SLACK_FRED',
  Soundbite = 'SOUNDBITE',
  SummarySection = 'SUMMARY_SECTION',
  WebFred = 'WEB_FRED'
}

export enum EnumAiCreditsConsumerSchedule {
  Daily = 'DAILY',
  Monthly = 'MONTHLY',
  PerMeeting = 'PER_MEETING',
  Weekly = 'WEEKLY'
}

export enum EnumAiCreditsFreeAccessCampaigns {
  AiTeammateFreeAccess = 'AI_TEAMMATE_FREE_ACCESS',
  AutoEnabledAiApps = 'AUTO_ENABLED_AI_APPS',
  AutoEnabledAiAppsFree = 'AUTO_ENABLED_AI_APPS_FREE',
  AutoEnabledAiAppsNoAutoSubscribe = 'AUTO_ENABLED_AI_APPS_NO_AUTO_SUBSCRIBE'
}

/** The priority level of a deal action item */
export enum EnumAiDealActionItemPriority {
  /** High priority action item */
  High = 'HIGH',
  /** Low priority action item */
  Low = 'LOW',
  /** Medium priority action item */
  Medium = 'MEDIUM'
}

/** The status of a deal action item */
export enum EnumAiDealActionItemStatus {
  /** Action item has been completed */
  Done = 'DONE',
  /** Action item is currently being worked on */
  InProgress = 'IN_PROGRESS',
  /** Action item has not been started */
  Pending = 'PENDING'
}

/** The category of AI insight for a deal */
export enum EnumAiDealInsightCategory {
  /** Insight related to a capability gap */
  CapabilityGap = 'CAPABILITY_GAP',
  /** Insight related to competitive positioning */
  Competitive = 'COMPETITIVE',
  /** Insight related to a specific competitor */
  Competitor = 'COMPETITOR',
  /** Insight related to compliance requirements */
  Compliance = 'COMPLIANCE',
  /** Insight related to buyer interest signals */
  Interest = 'INTEREST',
  /** Insight related to deal risks */
  Risk = 'RISK',
  /** Insight related to stakeholder dynamics */
  Stakeholder = 'STAKEHOLDER'
}

/** The type of AI insight for a deal */
export enum EnumAiDealInsightType {
  /** An alert indicating potential issues or risks with the deal */
  Alert = 'ALERT',
  /** A negative insight indicating unfavorable conditions for the deal */
  Negative = 'NEGATIVE',
  /** A positive insight indicating favorable conditions for the deal */
  Positive = 'POSITIVE'
}

/** The state of the deal */
export enum EnumAiDealState {
  /** The deal is at risk */
  AtRisk = 'AT_RISK',
  /** The deal is closed */
  Closed = 'CLOSED',
  /** The deal is lost */
  Lost = 'LOST',
  /** The deal is on track */
  OnTrack = 'ON_TRACK',
  /** The deal is slipping */
  Slipping = 'SLIPPING'
}

export enum EnumAiExtensionsPermissionType {
  AiCreditsFreeAccess = 'AI_CREDITS_FREE_ACCESS',
  FreeCredits = 'FREE_CREDITS',
  FreeTrial = 'FREE_TRIAL',
  GrowthBook = 'GROWTH_BOOK',
  None = 'NONE',
  Subscription = 'SUBSCRIPTION'
}

export enum EnumAgentToolName {
  ConnectorTools = 'CONNECTOR_TOOLS',
  CreateTask = 'CREATE_TASK'
}

export enum EnumAppEngine {
  AgenticFred = 'AGENTIC_FRED',
  Codex = 'CODEX',
  FredFf = 'FRED_FF'
}

export enum EnumAppEventStatus {
  CompletedWithoutOutput = 'COMPLETED_WITHOUT_OUTPUT',
  CompletedWithOutput = 'COMPLETED_WITH_OUTPUT',
  Failed = 'FAILED',
  Processing = 'PROCESSING',
  Started = 'STARTED'
}

export enum EnumAppOutputOrigin {
  Email = 'EMAIL',
  Manual = 'MANUAL',
  Meeting = 'MEETING',
  Regenerate = 'REGENERATE',
  Retry = 'RETRY',
  Scheduled = 'SCHEDULED'
}

export enum EnumAppOutputPrivacyType {
  Link = 'LINK',
  Owner = 'OWNER',
  Participants = 'PARTICIPANTS',
  Teammates = 'TEAMMATES',
  UserGroup = 'USER_GROUP'
}

export enum EnumAppOutputType {
  Chart = 'CHART',
  Slides = 'SLIDES',
  Text = 'TEXT'
}

export enum EnumAppPrivacy {
  Owner = 'OWNER',
  Teammates = 'TEAMMATES',
  UserGroup = 'USER_GROUP'
}

export enum EnumAppRecommendationDocumentType {
  EssentialApps = 'ESSENTIAL_APPS',
  Recommendation = 'RECOMMENDATION',
  RecommendedByFred = 'RECOMMENDED_BY_FRED',
  RecommendedForMeeting = 'RECOMMENDED_FOR_MEETING',
  RecommendedForMeetingV2 = 'RECOMMENDED_FOR_MEETING_V2',
  Role = 'ROLE',
  Title = 'TITLE'
}

export enum EnumAppScheduleFilter {
  Daily = 'DAILY',
  Hourly = 'HOURLY',
  Monthly = 'MONTHLY',
  PerMeeting = 'PER_MEETING',
  Weekly = 'WEEKLY'
}

export enum EnumAppTriggerRuleFieldOperator {
  EndsWith = 'ENDS_WITH',
  Equals = 'EQUALS',
  Includes = 'INCLUDES',
  NotEquals = 'NOT_EQUALS',
  NotIncludes = 'NOT_INCLUDES',
  StartsWith = 'STARTS_WITH'
}

export enum EnumAppTriggerRuleFieldType {
  EmailFrom = 'EMAIL_FROM',
  EmailLabel = 'EMAIL_LABEL',
  EmailSubject = 'EMAIL_SUBJECT',
  EmailTo = 'EMAIL_TO',
  MeetingHost = 'MEETING_HOST',
  MeetingParticipants = 'MEETING_PARTICIPANTS',
  MeetingTitle = 'MEETING_TITLE',
  MeetingType = 'MEETING_TYPE',
  SlackChannel = 'SLACK_CHANNEL',
  SlackMessageSender = 'SLACK_MESSAGE_SENDER',
  SlackMessageText = 'SLACK_MESSAGE_TEXT'
}

export enum EnumAppTriggerRulesCompositionType {
  And = 'AND',
  Or = 'OR'
}

export enum EnumAppTriggerSource {
  AfterMeeting = 'AFTER_MEETING',
  EmailReceived = 'EMAIL_RECEIVED',
  Scheduled = 'SCHEDULED',
  SlackMessageReceived = 'SLACK_MESSAGE_RECEIVED'
}

export enum EnumAppType {
  Soundbite = 'SOUNDBITE',
  Text = 'TEXT'
}

/** Billing interval of a plan */
export enum EnumBillingInterval {
  Month = 'MONTH',
  Year = 'YEAR'
}

export enum EnumContactMeetingHistoryType {
  All = 'ALL',
  Mine = 'MINE'
}

export enum EnumCouponDuration {
  Forever = 'FOREVER',
  Once = 'ONCE',
  Repeating = 'REPEATING'
}

export enum EnumCouponType {
  AmountOff = 'AMOUNT_OFF',
  FreeDays = 'FREE_DAYS',
  PercentageOff = 'PERCENTAGE_OFF'
}

export enum EnumCouponValidActions {
  PlanUpgrade = 'PLAN_UPGRADE',
  SeatsAddition = 'SEATS_ADDITION',
  SubscriptionCreation = 'SUBSCRIPTION_CREATION',
  SubscriptionUpdate = 'SUBSCRIPTION_UPDATE'
}

export enum EnumCreateTaskOwnerType {
  Email = 'EMAIL',
  UserGroup = 'USER_GROUP'
}

export enum EnumDataSourceType {
  Dynamic = 'DYNAMIC',
  Static = 'STATIC'
}

export enum EnumDealPrivacy {
  Admin = 'ADMIN',
  Owner = 'OWNER',
  Teammates = 'TEAMMATES'
}

/** Supported CRM providers for deals */
export enum EnumDealProvider {
  /** HubSpot CRM provider */
  Hubspot = 'HUBSPOT',
  /** Salesforce CRM provider */
  Salesforce = 'SALESFORCE'
}

export enum EnumEmailAssistantAction {
  AutoDraftGenerated = 'AUTO_DRAFT_GENERATED',
  EmailLabeled = 'EMAIL_LABELED',
  EmailProcessed = 'EMAIL_PROCESSED',
  FollowUpCreated = 'FOLLOW_UP_CREATED'
}

export enum EnumEmailCreateDraftsFor {
  All = 'ALL',
  ExpectsReply = 'EXPECTS_REPLY',
  HighPriority = 'HIGH_PRIORITY',
  Important = 'IMPORTANT',
  MostConversations = 'MOST_CONVERSATIONS'
}

export enum EnumEmailDraftSchedule {
  EightHours = 'EIGHT_HOURS',
  Immediately = 'IMMEDIATELY',
  ThirtyMinutes = 'THIRTY_MINUTES',
  TwentyFourHours = 'TWENTY_FOUR_HOURS',
  TwoHours = 'TWO_HOURS'
}

export enum EnumEmailFeature {
  Draft = 'DRAFT',
  Label = 'LABEL',
  Read = 'READ'
}

export enum EnumEmailProvider {
  Gmail = 'GMAIL',
  Outlook = 'OUTLOOK'
}

export enum EnumEmailRuleActionType {
  ApplyLabel = 'APPLY_LABEL',
  Archive = 'ARCHIVE',
  AutoDraft = 'AUTO_DRAFT',
  Delete = 'DELETE',
  MarkAsRead = 'MARK_AS_READ',
  MarkAsStar = 'MARK_AS_STAR',
  MoveToFolder = 'MOVE_TO_FOLDER',
  SkipAutoDraft = 'SKIP_AUTO_DRAFT',
  SkipAutoLabel = 'SKIP_AUTO_LABEL'
}

export enum EnumEmailRuleFilterField {
  Provider = 'PROVIDER',
  SenderEmail = 'SENDER_EMAIL',
  SenderName = 'SENDER_NAME',
  Subject = 'SUBJECT',
  ThreadId = 'THREAD_ID'
}

export enum EnumEmailRuleFilterOperator {
  Equals = 'EQUALS',
  Includes = 'INCLUDES',
  NotEquals = 'NOT_EQUALS',
  NotIncludes = 'NOT_INCLUDES'
}

export enum EnumEmailSortingScope {
  All = 'ALL',
  ImportantOnly = 'IMPORTANT_ONLY'
}

export enum EnumFeedbackType {
  Bug = 'BUG',
  ContactCsm = 'CONTACT_CSM',
  CsmInvoiceRefund = 'CSM_INVOICE_REFUND',
  Feature = 'FEATURE',
  Feedback = 'FEEDBACK',
  PositiveFeedback = 'POSITIVE_FEEDBACK',
  Suggestion = 'SUGGESTION'
}

export enum EnumFreeTrial {
  Cc = 'CC',
  NoCc = 'NO_CC'
}

export enum EnumGlobalSearchSuggestionsMatch {
  Titles = 'titles',
  Transcriptions = 'transcriptions'
}

export enum EnumInviteSuggestionsGroup {
  All = 'ALL',
  Meeting = 'MEETING',
  User = 'USER'
}

/** Status of invoice */
export enum EnumInvoiceStatus {
  All = 'ALL',
  Draft = 'DRAFT',
  Open = 'OPEN',
  Paid = 'PAID',
  Uncollectible = 'UNCOLLECTIBLE',
  Void = 'VOID'
}

/** Sub status of invoice */
export enum EnumInvoiceSubStatus {
  Draft = 'DRAFT',
  Open = 'OPEN',
  Paid = 'PAID',
  Pending = 'PENDING',
  Uncollectible = 'UNCOLLECTIBLE',
  Void = 'VOID'
}

export enum EnumKnowledgeSource {
  Email = 'EMAIL',
  Meeting = 'MEETING',
  Slack = 'SLACK',
  Web = 'WEB'
}

export enum EnumLoginPageVersion {
  V1 = 'v1',
  V2 = 'v2',
  V3 = 'v3'
}

export enum EnumMeetingExpirySettingsTimeUnits {
  Days = 'days',
  Hours = 'hours',
  Milliseconds = 'milliseconds',
  Minutes = 'minutes',
  Months = 'months',
  Quarters = 'quarters',
  Seconds = 'seconds',
  Weeks = 'weeks',
  Years = 'years'
}

export enum EnumMeetingPrepAppNotificationType {
  Owner = 'OWNER',
  Participants = 'PARTICIPANTS'
}

export enum EnumOnboardingStep {
  Completed = 'COMPLETED',
  EmailAssistant = 'EMAIL_ASSISTANT',
  FreeTrial = 'FREE_TRIAL',
  ReferralSource = 'REFERRAL_SOURCE',
  RoleAndTitle = 'ROLE_AND_TITLE',
  SelectLanguage = 'SELECT_LANGUAGE',
  Setup = 'SETUP',
  TeamOnboarding = 'TEAM_ONBOARDING',
  Tools = 'TOOLS'
}

/** Source of partner perk claim */
export enum EnumPartnerPerkClaimSource {
  PerksPage = 'PERKS_PAGE',
  TrialEnded = 'TRIAL_ENDED',
  UpgradeFlow = 'UPGRADE_FLOW'
}

/** Status of partner perk */
export enum EnumPartnerPerkStatus {
  Claimed = 'CLAIMED',
  Disabled = 'DISABLED',
  Unclaimed = 'UNCLAIMED'
}

/** Provider for private storage */
export enum EnumPrivateStorageProvider {
  Gcs = 'GCS',
  S3 = 'S3'
}

export enum EnumReferralStatus {
  AlreadyClaimed = 'ALREADY_CLAIMED',
  Completed = 'COMPLETED',
  NotClaimed = 'NOT_CLAIMED',
  Pending = 'PENDING'
}

export enum EnumRefineType {
  Condense = 'CONDENSE',
  Custom = 'CUSTOM',
  CustomerWords = 'CUSTOMER_WORDS',
  Elaborate = 'ELABORATE'
}

export enum EnumSearchOperator {
  And = 'AND',
  Or = 'OR'
}

export enum EnumSearchOrder {
  Asc = 'ASC',
  Desc = 'DESC'
}

export enum EnumSortOrder {
  Asc = 'ASC',
  Desc = 'DESC'
}

export enum EnumSubscriptionStatus {
  Active = 'ACTIVE',
  Canceled = 'CANCELED',
  Incomplete = 'INCOMPLETE',
  IncompleteExpired = 'INCOMPLETE_EXPIRED',
  PastDue = 'PAST_DUE',
  Trialing = 'TRIALING',
  Unpaid = 'UNPAID'
}

export enum EnumSummaryLength {
  Comprehensive = 'COMPREHENSIVE',
  Concise = 'CONCISE'
}

export enum EnumSummaryStyle {
  BulletPoints = 'BULLET_POINTS',
  Paragraph = 'PARAGRAPH'
}

export enum EnumSummaryTemplateCreationMethod {
  Prompt = 'PROMPT',
  Sample = 'SAMPLE'
}

export enum EnumSummaryType {
  Default = 'DEFAULT',
  Predefined = 'PREDEFINED',
  UserAdded = 'USER_ADDED'
}

export enum EnumTaskOrigin {
  AiApp = 'AI_APP',
  Email = 'EMAIL',
  Manual = 'MANUAL',
  Meeting = 'MEETING',
  Slack = 'SLACK'
}

export enum EnumTaskOwnerType {
  Email = 'EMAIL',
  User = 'USER',
  UserGroup = 'USER_GROUP'
}

export enum EnumTaskStatus {
  Backlog = 'BACKLOG',
  Blocked = 'BLOCKED',
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS',
  InReview = 'IN_REVIEW',
  Pending = 'PENDING'
}

export enum EnumTaskType {
  Task = 'TASK'
}

export enum EnumTeamOnboardingSuggestionType {
  AutoAddTeam = 'AUTO_ADD_TEAM',
  Invite = 'INVITE',
  InviteSuggestion = 'INVITE_SUGGESTION',
  None = 'NONE',
  RequestTeams = 'REQUEST_TEAMS'
}

export enum EnumTeamRequestStatus {
  Accepted = 'ACCEPTED',
  Canceled = 'CANCELED',
  Denied = 'DENIED',
  Pending = 'PENDING'
}

export enum EnumUserGroupMemberRole {
  Admin = 'ADMIN',
  Member = 'MEMBER'
}

export type ErrorDetail = {
  __typename?: 'ErrorDetail';
  description?: Maybe<Scalars['String']['output']>;
  link?: Maybe<Scalars['String']['output']>;
};

export type EssentialAppItem = {
  __typename?: 'EssentialAppItem';
  appId: Scalars['String']['output'];
  order: Scalars['Float']['output'];
};

export type EvaluateRuleActionOutput = {
  __typename?: 'EvaluateRuleActionOutput';
  parameters?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};

export type EvaluateRuleInput = {
  meetingId: Scalars['String']['input'];
  ruleId: Scalars['String']['input'];
};

export type EvaluateRuleMeetingContext = {
  __typename?: 'EvaluateRuleMeetingContext';
  attendees?: Maybe<Array<Scalars['String']['output']>>;
  host?: Maybe<Scalars['String']['output']>;
  meetingType?: Maybe<Scalars['String']['output']>;
  organizerEmail?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  userGroupIds?: Maybe<Array<Scalars['String']['output']>>;
};

export type EvaluateRuleOutput = {
  __typename?: 'EvaluateRuleOutput';
  actions?: Maybe<Array<EvaluateRuleActionOutput>>;
  evaluatedAt?: Maybe<Scalars['String']['output']>;
  meetingContext?: Maybe<EvaluateRuleMeetingContext>;
  meetingId?: Maybe<Scalars['String']['output']>;
  meetingTitle?: Maybe<Scalars['String']['output']>;
  ruleId: Scalars['String']['output'];
  ruleName: Scalars['String']['output'];
  triggered: Scalars['Boolean']['output'];
};

export type ExpandAppOutputItemInput = {
  citedHrefs: Array<Scalars['String']['input']>;
  eventId: Scalars['String']['input'];
  itemKey: Scalars['String']['input'];
  itemText: Scalars['String']['input'];
  sectionTitle?: InputMaybe<Scalars['String']['input']>;
};

export type ExperimentInput = {
  experimentId?: InputMaybe<Scalars['String']['input']>;
  hashAttribute?: InputMaybe<Scalars['String']['input']>;
  variationId?: InputMaybe<Scalars['Int']['input']>;
};

export type ExperimentInputV2 = {
  experimentId?: InputMaybe<Scalars['String']['input']>;
  hashAttribute?: InputMaybe<Scalars['String']['input']>;
  variationId?: InputMaybe<Scalars['Int']['input']>;
};

export type ExtendedSectionInput = {
  id: Scalars['String']['input'];
};

export type ExtensionConfigInput = {
  _id?: InputMaybe<Scalars['String']['input']>;
  activatedAt?: InputMaybe<Scalars['Date']['input']>;
  activatedBy?: InputMaybe<Scalars['String']['input']>;
  extensionId?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
};

export type ExtensionConfigObject = {
  __typename?: 'ExtensionConfigObject';
  _id?: Maybe<Scalars['String']['output']>;
  activatedAt?: Maybe<Scalars['Date']['output']>;
  activatedBy?: Maybe<Scalars['String']['output']>;
  extensionId?: Maybe<Scalars['String']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  meta?: Maybe<Scalars['JSON']['output']>;
};

export enum ExtensionType {
  AskFred = 'ASK_FRED',
  AskFredV2 = 'ASK_FRED_V2',
  Custom = 'CUSTOM',
  SingleSummary = 'SINGLE_SUMMARY',
  Soundbite = 'SOUNDBITE',
  SuperSummary = 'SUPER_SUMMARY'
}

export type FeatureInput = {
  featureKey?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type FeatureInputV2 = {
  featureKey?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type FeaturesMetadata = {
  __typename?: 'FeaturesMetadata';
  supported_app_types?: Maybe<Array<Scalars['String']['output']>>;
  supports_app?: Maybe<Scalars['Boolean']['output']>;
};

export type FeedAiApp = {
  __typename?: 'FeedAIApp';
  appId?: Maybe<Scalars['String']['output']>;
  comment?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  meetingId?: Maybe<Scalars['String']['output']>;
  meetingTitle?: Maybe<Scalars['String']['output']>;
  summary: Array<FeedSummary>;
};

export type FeedAiAppsResult = {
  __typename?: 'FeedAIAppsResult';
  aiApps: Array<FeedAiApp>;
  hasMore: Scalars['Boolean']['output'];
  total: Scalars['Int']['output'];
};

export type FeedContact = {
  __typename?: 'FeedContact';
  email: Scalars['String']['output'];
  lastMeetingDate: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  picture?: Maybe<Scalars['String']['output']>;
};

export type FeedMeeting = {
  __typename?: 'FeedMeeting';
  _id: Scalars['String']['output'];
  addedBy?: Maybe<Scalars['String']['output']>;
  allEmails?: Maybe<Scalars['String']['output']>;
  brief?: Maybe<Brief>;
  creator_email?: Maybe<Scalars['String']['output']>;
  durationMins?: Maybe<Scalars['Int']['output']>;
  endTime?: Maybe<Scalars['Date']['output']>;
  hasAiApps?: Maybe<Scalars['Boolean']['output']>;
  host?: Maybe<Scalars['String']['output']>;
  isShared?: Maybe<Scalars['Boolean']['output']>;
  meetingLink?: Maybe<Scalars['String']['output']>;
  organizerEmail: Scalars['String']['output'];
  organizerProfile?: Maybe<Profile>;
  owner?: Maybe<Scalars['String']['output']>;
  participantsProfiles: Array<Profile>;
  privacy?: Maybe<Scalars['String']['output']>;
  promptSuggestions: Array<Scalars['String']['output']>;
  startTime?: Maybe<Scalars['Date']['output']>;
  summary: Array<FeedSummary>;
  tasks: Array<Task>;
  title: Scalars['String']['output'];
};

export type FeedResults = {
  __typename?: 'FeedResults';
  meetings: Array<FeedMeeting>;
  total: Scalars['Int']['output'];
};

export type FeedSummary = {
  __typename?: 'FeedSummary';
  emoji?: Maybe<Scalars['String']['output']>;
  sentence: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
};

export type Feedback = {
  __typename?: 'Feedback';
  _id: Scalars['String']['output'];
  appVersion?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  content?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  csmCalendlyLink?: Maybe<Scalars['String']['output']>;
  experiment?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  isMarketingAllowed?: Maybe<Scalars['Boolean']['output']>;
  os?: Maybe<Scalars['String']['output']>;
  rating?: Maybe<Scalars['Int']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  subcategory?: Maybe<Scalars['String']['output']>;
  type: EnumFeedbackType;
  updatedAt: Scalars['DateTime']['output'];
  userEmail: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type FetchRulesOutput = {
  __typename?: 'FetchRulesOutput';
  hasMore?: Maybe<Scalars['Boolean']['output']>;
  rules?: Maybe<Array<RuleOutput>>;
};

export type FetchSmartSearchFiltersResponse = {
  __typename?: 'FetchSmartSearchFiltersResponse';
  topicHighlights?: Maybe<Array<TopicHighlight>>;
};

export type FetchTeamRulesOutput = {
  __typename?: 'FetchTeamRulesOutput';
  hasMore?: Maybe<Scalars['Boolean']['output']>;
  rules?: Maybe<Array<TeamRuleOutput>>;
};

export enum FieldType {
  Array = 'ARRAY',
  String = 'STRING'
}

export type FileUploadResponse = {
  __typename?: 'FileUploadResponse';
  filename: Scalars['String']['output'];
  uploadUrl: Scalars['String']['output'];
};

export type Files = {
  __typename?: 'Files';
  _id: Scalars['String']['output'];
  audio_url: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  durationMins?: Maybe<Scalars['Float']['output']>;
  isAudio: Scalars['Boolean']['output'];
  meetingId?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  processing?: Maybe<Scalars['Boolean']['output']>;
  size: Scalars['Int']['output'];
  transcriptId?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export enum FilterOperator {
  And = 'AND',
  Or = 'OR'
}

export type FindUsersMeetingIsSharedWithResponse = {
  __typename?: 'FindUsersMeetingIsSharedWithResponse';
  nonTeammates: Array<SharedUser>;
  teammates: Array<SharedUser>;
};

export enum FirefliesVoice {
  Dylan = 'Dylan',
  Emma = 'Emma',
  Ethan = 'Ethan',
  Eva = 'Eva',
  Fred = 'Fred',
  Lucas = 'Lucas',
  Tyler = 'Tyler'
}

export type FocusSettings = {
  __typename?: 'FocusSettings';
  hasGoogleCalendarAccess?: Maybe<Scalars['Boolean']['output']>;
  hasOutlookCalendarAccess?: Maybe<Scalars['Boolean']['output']>;
  useAsDefaultMeetingPlatform?: Maybe<Scalars['Boolean']['output']>;
};

export type FocusSettingsInput = {
  hasGoogleCalendarAccess?: InputMaybe<Scalars['Boolean']['input']>;
  hasOutlookCalendarAccess?: InputMaybe<Scalars['Boolean']['input']>;
  useAsDefaultMeetingPlatform?: InputMaybe<Scalars['Boolean']['input']>;
};

export type FredRecommendationsResponse = {
  __typename?: 'FredRecommendationsResponse';
  generating: Scalars['Boolean']['output'];
  recommendations: Array<AppTemplate>;
};

export type FredResponse = {
  __typename?: 'FredResponse';
  answer?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  domain?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  meetingId?: Maybe<Scalars['String']['output']>;
  privacy?: Maybe<Scalars['String']['output']>;
  question: Scalars['String']['output'];
  rating?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
  userId: Scalars['String']['output'];
};

export enum Free1kAiCreditsCampaignStatus {
  Accepted = 'ACCEPTED',
  Declined = 'DECLINED',
  Pending = 'PENDING'
}

export type GenerateAgentIconUploadUrlInput = {
  agentId: Scalars['ID']['input'];
  contentType: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  fileType: Scalars['String']['input'];
};

export type GenerateAgentIconUploadUrlResponse = {
  __typename?: 'GenerateAgentIconUploadUrlResponse';
  key: Scalars['String']['output'];
  previewUrl: Scalars['String']['output'];
  uploadUrl: Scalars['String']['output'];
};

export type GenerateAgentVoicePreview = {
  __typename?: 'GenerateAgentVoicePreview';
  audioData?: Maybe<Scalars['String']['output']>;
};

export type GenerateAgentVoicePreviewParams = {
  conversationSpeed: Scalars['Float']['input'];
  language: Scalars['String']['input'];
  provider: Scalars['String']['input'];
  tone: Scalars['String']['input'];
  voice: Scalars['String']['input'];
};

export type GenerateAiApp = {
  __typename?: 'GenerateAiApp';
  description?: Maybe<Scalars['String']['output']>;
  prompt?: Maybe<Scalars['String']['output']>;
  prompts?: Maybe<Array<Scalars['String']['output']>>;
  title?: Maybe<Scalars['String']['output']>;
};

export type GenerateAppPreviewInput = {
  appCron?: InputMaybe<Scalars['String']['input']>;
  appTemplateId?: InputMaybe<Scalars['String']['input']>;
  engine?: InputMaybe<EnumAppEngine>;
  meetingIds?: InputMaybe<Array<Scalars['String']['input']>>;
  model?: InputMaybe<Scalars['String']['input']>;
  outputType?: InputMaybe<EnumAppOutputType>;
  prompt: AppPromptInput;
  sources?: InputMaybe<Array<EnumKnowledgeSource>>;
};

export type GenerateAppRecommendationsForMeetingInput = {
  meetingId: Scalars['String']['input'];
};

export type GenerateAutopilotAgentContentInput = {
  companyName: Scalars['String']['input'];
  domain?: InputMaybe<Scalars['String']['input']>;
  jobRole: Scalars['String']['input'];
};

export type GenerateAutopilotMeetingParams = {
  email: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  turnstileToken?: InputMaybe<Scalars['String']['input']>;
};

export type GenerateAutopilotMeetingResponse = {
  __typename?: 'GenerateAutopilotMeetingResponse';
  meetingLink: Scalars['String']['output'];
};

export type GenerateKnowledgeBaseUploadUrlInput = {
  contentType: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  type?: InputMaybe<NamespaceType>;
};

export type GenerateKnowledgeBaseUploadUrlResponse = {
  __typename?: 'GenerateKnowledgeBaseUploadUrlResponse';
  url: Scalars['String']['output'];
};

export type GenerateScenarioUploadUrlInput = {
  agentId: Scalars['ID']['input'];
  contentType: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  fileType: Scalars['String']['input'];
};

export type GenerateScenarioUploadUrlResponse = {
  __typename?: 'GenerateScenarioUploadUrlResponse';
  url: Scalars['String']['output'];
};

export type GenerateSummaryTemplateStyleFromSampleInput = {
  sampleContent: Scalars['String']['input'];
};

export type GenerateSummaryTemplateUploadUrlInput = {
  contentType: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  fileSize: Scalars['Float']['input'];
};

export type GenerateSummaryTemplateUploadUrlResponse = {
  __typename?: 'GenerateSummaryTemplateUploadUrlResponse';
  objectKey: Scalars['String']['output'];
  uploadUrl: Scalars['String']['output'];
};

export type GenerateVoiceAgentQuestionsInput = {
  agentType: VoiceAgentType;
  customAgentType?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
};

export type GenerateVoiceAgentQuestionsResponse = {
  __typename?: 'GenerateVoiceAgentQuestionsResponse';
  agentTitle: Scalars['String']['output'];
  agentType: Scalars['String']['output'];
  questions: Array<Scalars['String']['output']>;
};

export type GeneratedAutopilotAgentContent = {
  __typename?: 'GeneratedAutopilotAgentContent';
  instructions: Scalars['String']['output'];
  knowledgeBase: Scalars['String']['output'];
  questions: Scalars['String']['output'];
};

export type GetAiCreditUsageByConsumerIdInput = {
  consumerType: EnumAiCreditsConsumer;
  endDate: Scalars['DateTime']['input'];
  startDate: Scalars['DateTime']['input'];
  userIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type GetAiCreditUsageByConsumerTypeInput = {
  endDate: Scalars['DateTime']['input'];
  startDate: Scalars['DateTime']['input'];
  userIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type GetAiCreditUsageByTeammateInput = {
  endDate: Scalars['DateTime']['input'];
  startDate: Scalars['DateTime']['input'];
};

export type GetAppEventsByUserIdResponseDto = {
  __typename?: 'GetAppEventsByUserIdResponseDto';
  events: Array<AppEvent>;
  hasMore: Scalars['Boolean']['output'];
};

export type GetAppOutputsByAppIdResponseDto = {
  __typename?: 'GetAppOutputsByAppIdResponseDto';
  appOutputs: Array<AppOutputEvent>;
  hasMore: Scalars['Boolean']['output'];
};

export type GetAppOutputsByUserIdResponseDto = {
  __typename?: 'GetAppOutputsByUserIdResponseDto';
  appOutputs: Array<AppOutputEvent>;
  hasMore: Scalars['Boolean']['output'];
};

export type GetAppRecommendationByKeyInput = {
  roleKey?: InputMaybe<Scalars['String']['input']>;
  titleKey?: InputMaybe<Scalars['String']['input']>;
};

export type GetAppRecommendationInput = {
  roleId?: InputMaybe<Scalars['String']['input']>;
  titleId?: InputMaybe<Scalars['String']['input']>;
};

export type GetAutofillConfigResponse = {
  __typename?: 'GetAutofillConfigResponse';
  config?: Maybe<AutofillConfig>;
  message?: Maybe<Scalars['String']['output']>;
  ok?: Maybe<Scalars['Boolean']['output']>;
  rule?: Maybe<AutofillRule>;
};

export type GetAutofillCustomFieldsResponse = {
  __typename?: 'GetAutofillCustomFieldsResponse';
  customFields?: Maybe<Array<AutofillCustomFieldsForEntity>>;
  message?: Maybe<Scalars['String']['output']>;
  ok?: Maybe<Scalars['Boolean']['output']>;
};

export type GetAutofillExtractionsResponse = {
  __typename?: 'GetAutofillExtractionsResponse';
  extractions?: Maybe<AutofillMeetingExtractions>;
  ok?: Maybe<Scalars['Boolean']['output']>;
};

export type GetAutofillMappingsResponse = {
  __typename?: 'GetAutofillMappingsResponse';
  mappings?: Maybe<Array<AutofillMappingsForEntity>>;
  message?: Maybe<Scalars['String']['output']>;
  ok?: Maybe<Scalars['Boolean']['output']>;
};

export type GetAutofillOpportunitiesResponse = {
  __typename?: 'GetAutofillOpportunitiesResponse';
  message?: Maybe<Scalars['String']['output']>;
  ok?: Maybe<Scalars['Boolean']['output']>;
  opportunities?: Maybe<Array<AutofillOpportunity>>;
};

export type GetByAppSettingsOrTemplateIdResult = AppSettings | AppTemplate;

export type GetClonedVoiceSignedUrlInput = {
  blobSize: Scalars['Int']['input'];
  mimeType: Scalars['String']['input'];
};

export type GetClonedVoiceSignedUrlResponse = {
  __typename?: 'GetClonedVoiceSignedUrlResponse';
  message?: Maybe<Scalars['String']['output']>;
  signedUrl?: Maybe<Scalars['String']['output']>;
  storageKey?: Maybe<Scalars['String']['output']>;
};

export type GetCompanyOpenPositionsInput = {
  companyName: Scalars['String']['input'];
  domain?: InputMaybe<Scalars['String']['input']>;
};

export type GetDealStageMetricsInput = {
  days?: InputMaybe<Scalars['Int']['input']>;
  representativeEmails?: InputMaybe<Array<Scalars['String']['input']>>;
  state?: InputMaybe<EnumAiDealState>;
};

export type GetDealsInput = {
  contactEmails?: InputMaybe<Array<Scalars['String']['input']>>;
  days?: InputMaybe<Scalars['Int']['input']>;
  hasInsights?: InputMaybe<Scalars['Boolean']['input']>;
  maximumBudget?: InputMaybe<Scalars['Int']['input']>;
  minimumBudget?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  pipeline?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  representativeEmails?: InputMaybe<Array<Scalars['String']['input']>>;
  sortBy?: InputMaybe<DealSortField>;
  sortDirection?: InputMaybe<SortDirection>;
  stage?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<EnumAiDealState>;
};

export type GetEmailActionUsageInput = {
  actions?: InputMaybe<Array<EnumEmailAssistantAction>>;
  endDate: Scalars['DateTime']['input'];
  startDate: Scalars['DateTime']['input'];
};

export type GetFeedOutputsResponseDto = {
  __typename?: 'GetFeedOutputsResponseDto';
  events: Array<AppEvent>;
  hasMore: Scalars['Boolean']['output'];
};

export type GetIngestionJobStatusInput = {
  jobId: Scalars['String']['input'];
};

export type GetKnowledgeBaseCategoriesInput = {
  categories: Array<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  type?: InputMaybe<NamespaceType>;
};

export type GetLiveMeetingRecommendationsInput = {
  meetingId: Scalars['String']['input'];
  meetingStartTime: Scalars['String']['input'];
};

export type GetMeetingByDeletionTimeResult = {
  __typename?: 'GetMeetingByDeletionTimeResult';
  count?: Maybe<Scalars['Int']['output']>;
  meetings?: Maybe<Array<MeetingServiceObject>>;
};

export type GetMeetingPrepOutputInput = {
  meetingId: Scalars['String']['input'];
};

export type GetPersonalAssistantResponseDto = {
  __typename?: 'GetPersonalAssistantResponseDto';
  dailyDigest?: Maybe<DailyDigestMetadata>;
  popularTopics?: Maybe<PopularTopicsMetadata>;
};

export type GetSsoResponse = {
  __typename?: 'GetSsoResponse';
  adminEmail?: Maybe<Scalars['String']['output']>;
  domain?: Maybe<Scalars['String']['output']>;
  enforceSso?: Maybe<Scalars['Boolean']['output']>;
  guid?: Maybe<Scalars['String']['output']>;
  platformName?: Maybe<Scalars['String']['output']>;
  redirectUrl?: Maybe<Scalars['String']['output']>;
  samlCertificate?: Maybe<Scalars['String']['output']>;
  samlEntryPoint?: Maybe<Scalars['String']['output']>;
};

export type GetUserLoginOptionsResponse = {
  __typename?: 'GetUserLoginOptionsResponse';
  ssoEnforced: Scalars['Boolean']['output'];
  ssoOptions: Array<SsoLoginOption>;
};

export type GetUserTasksCountInput = {
  filters?: InputMaybe<TaskFilters>;
};

export type GetUserTasksCountResponse = {
  __typename?: 'GetUserTasksCountResponse';
  count: Scalars['Int']['output'];
};

export type GetUserTasksInput = {
  filters?: InputMaybe<TaskFilters>;
  /** The number of tasks to skip (like OFFSET), used for pagination */
  from?: InputMaybe<Scalars['Int']['input']>;
  /** The number of tasks to return (like LIMIT), used for pagination */
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type GetUserTasksResponse = {
  __typename?: 'GetUserTasksResponse';
  count: Scalars['Int']['output'];
  items: Array<Task>;
  pageInfo: PageInfo;
};

export type GiveFeedbackInput = {
  appVersion?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  experiment?: InputMaybe<Scalars['String']['input']>;
  isMarketingAllowed?: InputMaybe<Scalars['Boolean']['input']>;
  os?: InputMaybe<Scalars['String']['input']>;
  rating?: InputMaybe<Scalars['Int']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  subcategory?: InputMaybe<Scalars['String']['input']>;
  type: EnumFeedbackType;
};

export enum GlobalFredResponseRating {
  Negative = 'NEGATIVE',
  Positive = 'POSITIVE'
}

export type GlobalSearchFilterOperatorsInput = {
  /** Used to change the filter operator. Deprecated from Mongo search due performance */
  participants?: InputMaybe<EnumSearchOperator>;
};

export type GlobalSearchSortInput = {
  field: Scalars['String']['input'];
  order?: InputMaybe<EnumSearchOrder>;
};

export type GlobalSearchSuggestionsResponse = {
  __typename?: 'GlobalSearchSuggestionsResponse';
  titles: Meetings;
  transcriptions: Meetings;
};

export type GrantedAiCredit = {
  __typename?: 'GrantedAICredit';
  amount: Scalars['Float']['output'];
  amountUsed: Scalars['Float']['output'];
};

export type GroupedSummaryTemplatesDto = {
  __typename?: 'GroupedSummaryTemplatesDto';
  id: Scalars['String']['output'];
  index: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  templates: Array<SummaryTemplate>;
};

export type GrowthbookFeatures = {
  __typename?: 'GrowthbookFeatures';
  features: Scalars['JSON']['output'];
};

export type GrowthbookFeaturesV2 = {
  __typename?: 'GrowthbookFeaturesV2';
  features: Scalars['JSON']['output'];
};

export type GuideCardContent = {
  __typename?: 'GuideCardContent';
  description: Scalars['String']['output'];
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type HasAccessToCampaignResponse = {
  __typename?: 'HasAccessToCampaignResponse';
  campaign?: Maybe<Scalars['String']['output']>;
  invitesSent: Scalars['Float']['output'];
  isTrialAllowed: Scalars['Boolean']['output'];
};

export type HasAccessToExpansionCampaignResponse = {
  __typename?: 'HasAccessToExpansionCampaignResponse';
  hasAccess: Scalars['Boolean']['output'];
};

export type HasAccessToFreeExpansionCampaignResponse = {
  __typename?: 'HasAccessToFreeExpansionCampaignResponse';
  hasAccess: Scalars['Boolean']['output'];
  invitesSent: Scalars['Float']['output'];
  isTrialAllowed: Scalars['Boolean']['output'];
};

export type Highlight = {
  __typename?: 'Highlight';
  captions?: Maybe<Array<Caption>>;
  creator_email?: Maybe<Array<Scalars['String']['output']>>;
  title?: Maybe<Array<Scalars['String']['output']>>;
};

export type HighlightSegment = {
  __typename?: 'HighlightSegment';
  endTime: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  startTime: Scalars['Int']['output'];
  summary?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type HighlightedSentence = {
  __typename?: 'HighlightedSentence';
  captionIndex?: Maybe<Scalars['Int']['output']>;
  sentence?: Maybe<Scalars['String']['output']>;
  speakerId?: Maybe<Scalars['Int']['output']>;
  speakerName?: Maybe<Scalars['String']['output']>;
};

export type HighlightedWords = {
  __typename?: 'HighlightedWords';
  captionIndex?: Maybe<Scalars['String']['output']>;
  speakerId?: Maybe<Scalars['Int']['output']>;
  speakerName?: Maybe<Scalars['String']['output']>;
  word?: Maybe<Scalars['String']['output']>;
};

export type InAppMessage = {
  __typename?: 'InAppMessage';
  action?: Maybe<NotificationAction>;
  createdAt: Scalars['DateTime']['output'];
  deliveryStatus: NotificationDeliveryStatus;
  icon?: Maybe<NotificationIcon>;
  id: Scalars['ID']['output'];
  message?: Maybe<Scalars['String']['output']>;
  notificationId: Scalars['ID']['output'];
  properties?: Maybe<Scalars['JSON']['output']>;
  templateId: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
  titleIcon?: Maybe<NotificationIcon>;
};

export type IngestKnowledgeBaseDocumentInput = {
  category: Scalars['String']['input'];
  contentType: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  fileUrl: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  type?: InputMaybe<NamespaceType>;
};

export type IngestKnowledgeBaseDocumentResponse = {
  __typename?: 'IngestKnowledgeBaseDocumentResponse';
  documentIds: Array<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type IngestKnowledgeBaseUrlInput = {
  category: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  subPages?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<NamespaceType>;
  urls: Array<Scalars['String']['input']>;
};

export type IngestionJob = {
  __typename?: 'IngestionJob';
  documentId?: Maybe<Scalars['String']['output']>;
  jobId: Scalars['String']['output'];
  message?: Maybe<Scalars['String']['output']>;
  progress: Scalars['Int']['output'];
  status: JobStatus;
};

export type InitiateVideoTranscriptionInput = {
  fileUrl: Scalars['String']['input'];
  scenarioId: Scalars['ID']['input'];
};

export type InitiateVideoTranscriptionResponse = {
  __typename?: 'InitiateVideoTranscriptionResponse';
  id: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Integration = {
  __typename?: 'Integration';
  _id?: Maybe<Scalars['String']['output']>;
  access_token?: Maybe<Scalars['String']['output']>;
  actions?: Maybe<Array<Scalars['String']['output']>>;
  activities?: Maybe<Array<Scalars['String']['output']>>;
  activityLogForm?: Maybe<Scalars['JSON']['output']>;
  apiKey?: Maybe<Scalars['String']['output']>;
  apiKeyEmail?: Maybe<Scalars['String']['output']>;
  authEndpoint?: Maybe<Scalars['String']['output']>;
  authParams?: Maybe<Array<Scalars['JSON']['output']>>;
  authParamsDelimiter?: Maybe<Scalars['String']['output']>;
  authType?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  clientId?: Maybe<Scalars['String']['output']>;
  clientSecret?: Maybe<Scalars['String']['output']>;
  connectButtonLink?: Maybe<Scalars['String']['output']>;
  connectButtonText?: Maybe<Scalars['String']['output']>;
  connectCallbackUrl?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['Int']['output']>;
  dealIntelligenceUrl?: Maybe<Scalars['String']['output']>;
  disconnectCallbackUrl?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  enabled?: Maybe<Scalars['Boolean']['output']>;
  event?: Maybe<Scalars['String']['output']>;
  expires_in?: Maybe<Scalars['Int']['output']>;
  extraAuthAttributes?: Maybe<Array<Scalars['String']['output']>>;
  feature_mode?: Maybe<Scalars['String']['output']>;
  files?: Maybe<Scalars['String']['output']>;
  folderId?: Maybe<Scalars['String']['output']>;
  guid?: Maybe<Scalars['String']['output']>;
  guide?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id_token?: Maybe<Scalars['String']['output']>;
  longDescription?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  postConnectForm?: Maybe<Scalars['JSON']['output']>;
  preConnectForm?: Maybe<Scalars['JSON']['output']>;
  redirectUri?: Maybe<Scalars['String']['output']>;
  refresh_token?: Maybe<Scalars['String']['output']>;
  scope?: Maybe<Array<Scalars['String']['output']>>;
  serverBaseUrl?: Maybe<Scalars['String']['output']>;
  settings?: Maybe<Scalars['JSON']['output']>;
  setup?: Maybe<Scalars['JSON']['output']>;
  shortDescription?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  supportDealIntelligence?: Maybe<Scalars['Boolean']['output']>;
  supportSampleData?: Maybe<Scalars['Boolean']['output']>;
  supportSyncingPastEvents?: Maybe<Scalars['Boolean']['output']>;
  supportTeamSetup?: Maybe<Scalars['Boolean']['output']>;
  supportTestPullFlow?: Maybe<Scalars['Boolean']['output']>;
  supportTestPushFlow?: Maybe<Scalars['Boolean']['output']>;
  supportUserContacts?: Maybe<Scalars['Boolean']['output']>;
  supportsConnectorFramework?: Maybe<Scalars['Boolean']['output']>;
  testPullFlowUrl?: Maybe<Scalars['String']['output']>;
  testPushFlowUrl?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type IntegrationAppChannelData = {
  __typename?: 'IntegrationAppChannelData';
  channels?: Maybe<Array<AppChannel>>;
  cursor?: Maybe<Scalars['String']['output']>;
};

export type IntegrationApps = {
  __typename?: 'IntegrationApps';
  _id: Scalars['String']['output'];
  aiAppsTriggerSourcesFilter?: Maybe<Array<Scalars['String']['output']>>;
  authType?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  connected?: Maybe<Scalars['Boolean']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  postConnectForm?: Maybe<Scalars['JSON']['output']>;
  shortDescription?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  supportsApp?: Maybe<Scalars['Boolean']['output']>;
  supportsConnectorFramework?: Maybe<Scalars['Boolean']['output']>;
  workflowId?: Maybe<Scalars['String']['output']>;
};

export type Invitation = {
  __typename?: 'Invitation';
  _id: Scalars['String']['output'];
  accepted: Scalars['Boolean']['output'];
  code: Scalars['String']['output'];
  isPublic?: Maybe<Scalars['Boolean']['output']>;
  link?: Maybe<Scalars['String']['output']>;
  profile?: Maybe<Profile>;
  sentTo: Scalars['String']['output'];
  teamId: Scalars['String']['output'];
};

export type InvitationDetails = {
  __typename?: 'InvitationDetails';
  _id: Scalars['String']['output'];
  invitedByName: Scalars['String']['output'];
  teamId: Scalars['String']['output'];
  teamName: Scalars['String']['output'];
  teamSize: Scalars['Float']['output'];
  teammates: Array<Teammate>;
  tier: Scalars['String']['output'];
};

export type InviteMetadataInput = {
  emailsInfo: Array<EmailInfoInput>;
};

export type InviteSuggestions = {
  __typename?: 'InviteSuggestions';
  integrations?: Maybe<Array<Integration>>;
  nonUsers?: Maybe<PaginationInviteSuggestions>;
  totalCount: Scalars['Int']['output'];
  users?: Maybe<PaginationInviteSuggestions>;
};

export type Invoice = {
  __typename?: 'Invoice';
  amount?: Maybe<Scalars['Float']['output']>;
  createdAt?: Maybe<Scalars['Int']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  invoiceUrl?: Maybe<Scalars['String']['output']>;
  lineGroups?: Maybe<Array<InvoiceLineGroup>>;
  number: Scalars['String']['output'];
  pdf?: Maybe<Scalars['String']['output']>;
  status?: Maybe<EnumInvoiceSubStatus>;
  taxAmount?: Maybe<Scalars['Float']['output']>;
};

export type InvoiceDiscount = {
  __typename?: 'InvoiceDiscount';
  amountOff?: Maybe<Scalars['Float']['output']>;
  endDate?: Maybe<Scalars['DateTime']['output']>;
  metadata?: Maybe<Array<InvoiceDiscountMetadata>>;
  name?: Maybe<Scalars['String']['output']>;
  percentageOff?: Maybe<Scalars['Float']['output']>;
  startDate?: Maybe<Scalars['DateTime']['output']>;
  valid?: Maybe<Scalars['Boolean']['output']>;
};

export type InvoiceDiscountMetadata = {
  __typename?: 'InvoiceDiscountMetadata';
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type InvoiceFilters = {
  status?: InputMaybe<EnumInvoiceStatus>;
};

export type InvoiceLineGroup = {
  __typename?: 'InvoiceLineGroup';
  description?: Maybe<Scalars['String']['output']>;
  eventType?: Maybe<InvoiceLineGroupEventType>;
  groupType?: Maybe<InvoiceLineGroupType>;
  lineItems?: Maybe<Array<InvoiceLineItem>>;
};

/** Type of event that triggered the invoice line group, such as subscription creation, upgrade, downgrade, etc. */
export enum InvoiceLineGroupEventType {
  BillingIntervalChanged = 'BILLING_INTERVAL_CHANGED',
  SeatAdded = 'SEAT_ADDED',
  SeatRemoved = 'SEAT_REMOVED',
  SubscriptionCreated = 'SUBSCRIPTION_CREATED',
  SubscriptionDowngraded = 'SUBSCRIPTION_DOWNGRADED',
  SubscriptionRenewed = 'SUBSCRIPTION_RENEWED',
  SubscriptionTrialStarted = 'SUBSCRIPTION_TRIAL_STARTED',
  SubscriptionUpdated = 'SUBSCRIPTION_UPDATED',
  SubscriptionUpgraded = 'SUBSCRIPTION_UPGRADED'
}

/** Type of invoice line item, can be Proration Pair, Proration Single, or Regular */
export enum InvoiceLineGroupType {
  ProrationPair = 'PRORATION_PAIR',
  ProrationSingle = 'PRORATION_SINGLE',
  Regular = 'REGULAR'
}

export type InvoiceLineItem = {
  __typename?: 'InvoiceLineItem';
  amount?: Maybe<Scalars['Float']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  periodEnd?: Maybe<Scalars['Int']['output']>;
  periodStart?: Maybe<Scalars['Int']['output']>;
  planName?: Maybe<Scalars['String']['output']>;
  proration?: Maybe<Scalars['Boolean']['output']>;
  quantity?: Maybe<Scalars['Int']['output']>;
  unitAmount?: Maybe<Scalars['Float']['output']>;
};

export enum JobStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Processing = 'PROCESSING',
  Queued = 'QUEUED'
}

export type JoinAllUpcomingMeetingResult = {
  __typename?: 'JoinAllUpcomingMeetingResult';
  calId: Scalars['String']['output'];
  meetingId?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  status: Scalars['Boolean']['output'];
};

export type Keyword = {
  __typename?: 'Keyword';
  conversations: Scalars['Int']['output'];
  mentions: Scalars['Int']['output'];
  subtopic: Scalars['String']['output'];
  topic: Scalars['String']['output'];
};

export type KnowledgeBaseCategory = {
  __typename?: 'KnowledgeBaseCategory';
  category: Scalars['String']['output'];
  categoryId: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  documentCount: Scalars['Int']['output'];
  entity?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type KnowledgeBaseDocument = {
  __typename?: 'KnowledgeBaseDocument';
  category: Scalars['String']['output'];
  contentType: Scalars['String']['output'];
  documentId: Scalars['String']['output'];
  fileName: Scalars['String']['output'];
  metadata?: Maybe<KnowledgeBaseDocumentMetadata>;
  uploadedAt: Scalars['String']['output'];
};

export type KnowledgeBaseDocumentMetadata = {
  __typename?: 'KnowledgeBaseDocumentMetadata';
  domain?: Maybe<Scalars['String']['output']>;
  fileUrl?: Maybe<Scalars['String']['output']>;
  provider?: Maybe<Scalars['String']['output']>;
  scrapedAt?: Maybe<Scalars['String']['output']>;
  subPages?: Maybe<Array<SubPageInfo>>;
  subpagesCount?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type KnowledgeBaseItem = {
  __typename?: 'KnowledgeBaseItem';
  content: Scalars['String']['output'];
  title: Scalars['String']['output'];
  type: KnowledgeBaseItemType;
};

export type KnowledgeBaseItemInput = {
  content: Scalars['String']['input'];
  title: Scalars['String']['input'];
  type: KnowledgeBaseItemType;
};

export enum KnowledgeBaseItemType {
  Text = 'Text',
  Url = 'Url'
}

export type LastMeeting = {
  __typename?: 'LastMeeting';
  brief?: Maybe<MeetingPrepBrief>;
  id?: Maybe<Scalars['ID']['output']>;
  participantsProfiles?: Maybe<Array<MeetingPrepParticipant>>;
  startTime?: Maybe<Scalars['DateTime']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

/**
 * The audience a single permission level resolves to, plus the metadata the
 * settings UI needs to render it. `includes` is the authoritative member set
 * (clients derive narrowing by comparing sets, not by assuming a linear order);
 * `selectable` is false for levels that cannot be offered as a choice in v0
 * (CUSTOM, which is identity-based and managed separately).
 */
export type LevelAudience = {
  __typename?: 'LevelAudience';
  /** Canonical, policy-engine-owned description of who the level admits. */
  description: Scalars['String']['output'];
  /** The member categories this level admits. Empty for NO_ONE and CUSTOM. */
  includes: Array<AudienceMember>;
  /** The permission level this audience describes. */
  level: PermissionLevel;
  /** Whether this level may be offered as a choice in the settings UI. */
  selectable: Scalars['Boolean']['output'];
};

export type ListKnowledgeBaseCategoriesInput = {
  id: Scalars['ID']['input'];
  type?: InputMaybe<NamespaceType>;
};

export type ListKnowledgeBaseDocumentsInput = {
  id: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<NamespaceType>;
};

export type LiveActionItem = {
  __typename?: 'LiveActionItem';
  actionItem: Scalars['String']['output'];
  actionItemTimestamp: Scalars['Int']['output'];
  captionIndex?: Maybe<Scalars['Int']['output']>;
  checked?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['String']['output'];
  parseId: Scalars['String']['output'];
  personEmail?: Maybe<Scalars['String']['output']>;
  personName: Scalars['String']['output'];
};

export type LiveInsights = {
  __typename?: 'LiveInsights';
  actionItems?: Maybe<Array<LiveActionItem>>;
  chapterizedNotes: Scalars['JSON']['output'];
  notes?: Maybe<Array<LiveNote>>;
};

export type LiveMeeting = {
  __typename?: 'LiveMeeting';
  duration?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  endTime?: Maybe<Scalars['String']['output']>;
  guid?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  long_gui?: Maybe<Scalars['String']['output']>;
  meetingStatus?: Maybe<MeetingStatus>;
  meetingTitle?: Maybe<Scalars['String']['output']>;
  startTime?: Maybe<Scalars['String']['output']>;
};

export type LiveNote = {
  __typename?: 'LiveNote';
  emoji?: Maybe<Scalars['String']['output']>;
  endTime: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  note: Scalars['String']['output'];
  parseId: Scalars['String']['output'];
  time: Scalars['Int']['output'];
  title?: Maybe<Scalars['String']['output']>;
};

export type LiveTranscriptItem = {
  __typename?: 'LiveTranscriptItem';
  endTime: Scalars['Float']['output'];
  parseId: Scalars['String']['output'];
  sentence: Scalars['String']['output'];
  speaker: Scalars['Int']['output'];
  speaker_id: Scalars['Int']['output'];
  speaker_name?: Maybe<Scalars['String']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  time: Scalars['Float']['output'];
  transcript_id: Scalars['String']['output'];
};

export type MakePhoneCallResult = {
  __typename?: 'MakePhoneCallResult';
  accessToken: Scalars['String']['output'];
};

export type Manifest = {
  __typename?: 'Manifest';
  auth?: Maybe<Scalars['JSON']['output']>;
  externalMcpFeatures?: Maybe<Array<Scalars['String']['output']>>;
  features?: Maybe<Array<Scalars['String']['output']>>;
  setup?: Maybe<Scalars['JSON']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

export type ManualNotes = {
  __typename?: 'ManualNotes';
  notes?: Maybe<Scalars['String']['output']>;
  shouldMerge?: Maybe<Scalars['Boolean']['output']>;
};

export type ManualUploadBatch = {
  __typename?: 'ManualUploadBatch';
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  items: Array<ManualUploadItem>;
  migrationId?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
};

export type ManualUploadFileInput = {
  fileName: Scalars['String']['input'];
  sizeBytes: Scalars['Float']['input'];
};

export type ManualUploadItem = {
  __typename?: 'ManualUploadItem';
  contentType: Scalars['String']['output'];
  error?: Maybe<Scalars['String']['output']>;
  extension: Scalars['String']['output'];
  fileName: Scalars['String']['output'];
  itemId: Scalars['String']['output'];
  mediaType: Scalars['String']['output'];
  meetingId: Scalars['String']['output'];
  sizeBytes: Scalars['Float']['output'];
  status: Scalars['String']['output'];
  transcriptionRequestedAt?: Maybe<Scalars['String']['output']>;
  uploadUrl?: Maybe<Scalars['String']['output']>;
  uploadUrlExpiresAt?: Maybe<Scalars['String']['output']>;
};

export type ManualUploadLimits = {
  __typename?: 'ManualUploadLimits';
  acceptedFormats: Array<Scalars['String']['output']>;
  maxAudioBytes: Scalars['Float']['output'];
  maxFilesPerBatch: Scalars['Int']['output'];
  maxVideoBytes: Scalars['Float']['output'];
  uploadUrlExpiryMinutes: Scalars['Int']['output'];
};

export type MediaSource = {
  __typename?: 'MediaSource';
  src: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type Meeting = {
  __typename?: 'Meeting';
  addedBy?: Maybe<Scalars['String']['output']>;
  allEmails?: Maybe<Array<Scalars['String']['output']>>;
  attendees?: Maybe<Array<MeetingAttendee>>;
  audioService_metadata?: Maybe<MeetingAudioServiceMetadata>;
  audio_only?: Maybe<Scalars['Boolean']['output']>;
  audio_url?: Maybe<Scalars['String']['output']>;
  captions?: Maybe<Array<MeetingCaption>>;
  customLanguage?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['Float']['output']>;
  duration_actual?: Maybe<Scalars['Float']['output']>;
  endTime?: Maybe<Scalars['DateTime']['output']>;
  fredJoinedMeetingAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  labelMeta?: Maybe<Scalars['JSON']['output']>;
  notesPrivacy: MeetingNotesPrivacy;
  organizer?: Maybe<MeetingUser>;
  organizerEmail: Scalars['String']['output'];
  owner?: Maybe<Scalars['String']['output']>;
  paragraphMeta?: Maybe<Scalars['JSON']['output']>;
  processMeetingStatus?: Maybe<Scalars['String']['output']>;
  puppetStates?: Maybe<Array<Maybe<PuppetState>>>;
  sentenceMeta?: Maybe<Scalars['JSON']['output']>;
  speakerMeta?: Maybe<Scalars['JSON']['output']>;
  startTime?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  summaryStatus?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  video_url?: Maybe<Scalars['String']['output']>;
};

/** Meeting-level voice-agent category as classified on the dashboard meeting page (mirrors codex-ff `agentCategory`). Used to seed a voice agent from past meetings via `createVoiceAgentFromMeetings`. */
export enum MeetingAgentCategory {
  DiscoveryCall = 'discovery_call',
  None = 'none',
  ScreeningInterview = 'screening_interview',
  SupportCall = 'support_call',
  TeamCheckIn = 'team_check_in',
  UserInterview = 'user_interview'
}

export type MeetingAttendee = {
  __typename?: 'MeetingAttendee';
  displayName?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  organizer?: Maybe<Scalars['Boolean']['output']>;
  picture?: Maybe<Scalars['String']['output']>;
  responseStatus?: Maybe<Scalars['String']['output']>;
};

export type MeetingAttendeeInput = {
  displayName?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  organizer?: InputMaybe<Scalars['Boolean']['input']>;
  responseStatus?: InputMaybe<Scalars['String']['input']>;
};

export type MeetingAudioServiceMetadata = {
  __typename?: 'MeetingAudioServiceMetadata';
  audioOnly?: Maybe<Scalars['Boolean']['output']>;
  languageCode?: Maybe<Scalars['String']['output']>;
  preferredLanguage?: Maybe<Scalars['String']['output']>;
  silentMeeting?: Maybe<Scalars['Boolean']['output']>;
  skipSummaryReason?: Maybe<Scalars['String']['output']>;
};

export type MeetingByIdResponse = {
  __typename?: 'MeetingByIdResponse';
  _id?: Maybe<Scalars['String']['output']>;
  endTime?: Maybe<Scalars['String']['output']>;
  iCalUID?: Maybe<Scalars['String']['output']>;
  meetingLink?: Maybe<Scalars['String']['output']>;
  startTime?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type MeetingCaption = {
  __typename?: 'MeetingCaption';
  averageConfidence?: Maybe<Scalars['Float']['output']>;
  endTime: Scalars['Float']['output'];
  filterType?: Maybe<Scalars['String']['output']>;
  importance?: Maybe<Scalars['Float']['output']>;
  index: Scalars['Int']['output'];
  match?: Maybe<Scalars['String']['output']>;
  metrics?: Maybe<Array<MeetingCaptionMetric>>;
  questionFilter?: Maybe<Scalars['Boolean']['output']>;
  readability?: Maybe<Scalars['Float']['output']>;
  sentence: Scalars['String']['output'];
  sentiment?: Maybe<Scalars['Float']['output']>;
  sentimentType?: Maybe<Scalars['String']['output']>;
  speaker_id: Scalars['Int']['output'];
  speaker_name?: Maybe<Scalars['String']['output']>;
  task?: Maybe<Scalars['Float']['output']>;
  time: Scalars['Float']['output'];
};

export type MeetingCaptionMetric = {
  __typename?: 'MeetingCaptionMetric';
  category: Scalars['String']['output'];
  word: Scalars['String']['output'];
};

export type MeetingChannel = {
  __typename?: 'MeetingChannel';
  _id: Scalars['String']['output'];
  isPrivate?: Maybe<Scalars['Boolean']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type MeetingDetails = {
  duration?: InputMaybe<Scalars['Int']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  puppet_status?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  transcriptParseId?: InputMaybe<Scalars['String']['input']>;
};

export type MeetingExpirySettings = {
  __typename?: 'MeetingExpirySettings';
  deletionTime?: Maybe<Scalars['String']['output']>;
  meetingTtl?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
};

export type MeetingExpirySettingsInput = {
  meetingTtl?: InputMaybe<Scalars['Int']['input']>;
  unit?: InputMaybe<Scalars['String']['input']>;
};

export type MeetingInMediaStorageResponse = {
  __typename?: 'MeetingInMediaStorageResponse';
  meeting: Scalars['JSON']['output'];
  uploadSignedUrl?: Maybe<Scalars['String']['output']>;
};

export type MeetingMediaUrls = {
  __typename?: 'MeetingMediaUrls';
  audio_url?: Maybe<Scalars['String']['output']>;
  video_url?: Maybe<Scalars['String']['output']>;
};

export type MeetingMetadata = {
  __typename?: 'MeetingMetadata';
  meetingId: Scalars['String']['output'];
  metadata?: Maybe<MeetingMetadataDetails>;
};

export type MeetingMetadataDetails = {
  __typename?: 'MeetingMetadataDetails';
  agentCategory?: Maybe<MeetingAgentCategory>;
  agentCategoryConfidence?: Maybe<Scalars['String']['output']>;
};

export type MeetingNote = {
  __typename?: 'MeetingNote';
  _id?: Maybe<Scalars['String']['output']>;
  addedBy?: Maybe<Scalars['String']['output']>;
  allEmails?: Maybe<Scalars['String']['output']>;
  allEmailsProfiles: Array<Profile>;
  allEmailsSentTo?: Maybe<Array<Scalars['String']['output']>>;
  attendees?: Maybe<Array<Attendees>>;
  audioOnly?: Maybe<Scalars['Boolean']['output']>;
  audioServiceMetadata?: Maybe<AudioMetadata>;
  audio_url?: Maybe<Scalars['String']['output']>;
  captions?: Maybe<Array<Caption>>;
  channel?: Maybe<MeetingChannel>;
  channelIds?: Maybe<Array<Scalars['String']['output']>>;
  channels?: Maybe<Array<MeetingChannel>>;
  contact2?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  creator?: Maybe<Scalars['String']['output']>;
  creator_email?: Maybe<Scalars['String']['output']>;
  date?: Maybe<Scalars['Date']['output']>;
  defaultChannelAccess?: Maybe<Scalars['Boolean']['output']>;
  detail?: Maybe<Scalars['String']['output']>;
  durationMins?: Maybe<Scalars['String']['output']>;
  eventStatus?: Maybe<Scalars['String']['output']>;
  expandSummaryItemCount?: Maybe<Scalars['Int']['output']>;
  fredQA: Array<FredResponse>;
  hasCaptions?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  isGuestAccessEnabled?: Maybe<Scalars['Boolean']['output']>;
  isOnPrivateStorage?: Maybe<Scalars['Boolean']['output']>;
  isVideoAvailable?: Maybe<Scalars['Boolean']['output']>;
  joinedUsers?: Maybe<Array<AttendedUser>>;
  labelMeta?: Maybe<Scalars['JSON']['output']>;
  manualNotes?: Maybe<ManualNotes>;
  meetingExpirySettings?: Maybe<MeetingExpirySettings>;
  owner?: Maybe<Scalars['String']['output']>;
  ownerProfile?: Maybe<Profile>;
  ownersList?: Maybe<Array<Scalars['String']['output']>>;
  paragraphMeta?: Maybe<Scalars['JSON']['output']>;
  parseId?: Maybe<Scalars['String']['output']>;
  privacy?: Maybe<Scalars['String']['output']>;
  privacyList?: Maybe<Array<UserPrivacySetting>>;
  private?: Maybe<Scalars['Boolean']['output']>;
  processMeetingStatus?: Maybe<Scalars['String']['output']>;
  puppetStates?: Maybe<Array<PuppetState>>;
  recorderMetadata?: Maybe<RecorderMetadata>;
  recordingPreference?: Maybe<Scalars['String']['output']>;
  removeSpeakers?: Maybe<Scalars['Boolean']['output']>;
  retranscribeCount?: Maybe<Scalars['Int']['output']>;
  sentenceMeta?: Maybe<Scalars['JSON']['output']>;
  speakerMeta?: Maybe<Scalars['JSON']['output']>;
  startTime?: Maybe<Scalars['Date']['output']>;
  summary?: Maybe<Summary>;
  summaryStatus?: Maybe<MeetingSummaryStatus>;
  title?: Maybe<Scalars['String']['output']>;
  title2?: Maybe<Scalars['String']['output']>;
  topicMeta?: Maybe<Scalars['JSON']['output']>;
  transcriptParseId?: Maybe<Scalars['String']['output']>;
  txId?: Maybe<Scalars['String']['output']>;
  txService?: Maybe<Scalars['String']['output']>;
  userPermission?: Maybe<MeetingPermission>;
  users?: Maybe<Array<Scalars['String']['output']>>;
  validMeeting?: Maybe<Scalars['Boolean']['output']>;
  video_url?: Maybe<Scalars['String']['output']>;
  waveformData?: Maybe<Array<Scalars['Float']['output']>>;
};

export type MeetingNoteAnalytics = {
  __typename?: 'MeetingNoteAnalytics';
  categories?: Maybe<Scalars['JSON']['output']>;
  duration: Scalars['Float']['output'];
  sentiments: Sentiments;
  speakers: Array<SpeakerAnalytics>;
};

export type MeetingNoteComment = {
  __typename?: 'MeetingNoteComment';
  _id: Scalars['String']['output'];
  comment?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  creatorProfile?: Maybe<Profile>;
  isBookmarked?: Maybe<Scalars['Boolean']['output']>;
  isPrivate?: Maybe<Scalars['Boolean']['output']>;
  jsonComment?: Maybe<Array<SummarySections>>;
  meetingId?: Maybe<Scalars['String']['output']>;
  meetingNoteId?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  ownerId?: Maybe<Scalars['String']['output']>;
  picture?: Maybe<Scalars['String']['output']>;
  privacy?: Maybe<Scalars['String']['output']>;
  reactions?: Maybe<Array<Reaction>>;
  replyToCommentId?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['Float']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type MeetingNotePreference = {
  __typename?: 'MeetingNotePreference';
  category?: Maybe<Scalars['String']['output']>;
  values?: Maybe<Array<Scalars['String']['output']>>;
};

export type MeetingNotePreferenceInput = {
  category?: InputMaybe<Scalars['String']['input']>;
  values?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export enum MeetingNotesPrivacy {
  Link = 'link',
  Owner = 'owner',
  Participants = 'participants',
  Participatingteammates = 'participatingteammates',
  Teammates = 'teammates',
  Teammatesandparticipants = 'teammatesandparticipants'
}

export type MeetingOwner = {
  __typename?: 'MeetingOwner';
  email?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  photoUrl?: Maybe<Scalars['String']['output']>;
};

export type MeetingParticipantInteracted = {
  __typename?: 'MeetingParticipantInteracted';
  count: Scalars['Int']['output'];
  duration: Scalars['Int']['output'];
  email?: Maybe<Scalars['String']['output']>;
};

export enum MeetingPermission {
  Host = 'HOST',
  None = 'NONE',
  Participant = 'PARTICIPANT',
  Teammate = 'TEAMMATE',
  TeammateParticipant = 'TEAMMATE_PARTICIPANT'
}

export type MeetingPrep = {
  __typename?: 'MeetingPrep';
  lastMeeting?: Maybe<LastMeeting>;
  meetingInfo?: Maybe<MeetingPrepInfo>;
};

export type MeetingPrepApp = {
  __typename?: 'MeetingPrepApp';
  active: Scalars['Boolean']['output'];
  autoEnabled: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  notificationPreference: EnumMeetingPrepAppNotificationType;
  showCompanyInsights: Scalars['Boolean']['output'];
  showEmailInsights?: Maybe<Scalars['Boolean']['output']>;
  showParticipantInfo: Scalars['Boolean']['output'];
  showPastNotes: Scalars['Boolean']['output'];
  showPastSyncsSummary: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['String']['output'];
};

export type MeetingPrepAttendee = {
  __typename?: 'MeetingPrepAttendee';
  email?: Maybe<Scalars['String']['output']>;
  organizer?: Maybe<Scalars['Boolean']['output']>;
  responseStatus?: Maybe<Scalars['String']['output']>;
};

export type MeetingPrepBrief = {
  __typename?: 'MeetingPrepBrief';
  bulletGist?: Maybe<Scalars['String']['output']>;
  gist?: Maybe<Scalars['String']['output']>;
  overview?: Maybe<Scalars['String']['output']>;
};

export type MeetingPrepInfo = {
  __typename?: 'MeetingPrepInfo';
  attendees?: Maybe<Array<MeetingPrepAttendee>>;
  date?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  organizerEmail?: Maybe<Scalars['String']['output']>;
  ownerProfile?: Maybe<MeetingPrepOwnerProfile>;
  title?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type MeetingPrepList = {
  __typename?: 'MeetingPrepList';
  items: Array<MeetingPrepListItem>;
};

export type MeetingPrepListItem = {
  __typename?: 'MeetingPrepListItem';
  calendarEventId: Scalars['String']['output'];
  meetingId: Scalars['String']['output'];
  meetingTitle: Scalars['String']['output'];
};

export type MeetingPrepOutput = {
  __typename?: 'MeetingPrepOutput';
  charged?: Maybe<Scalars['Boolean']['output']>;
  companyInsights?: Maybe<Array<EnrichedDomain>>;
  emailInsights?: Maybe<EmailInsights>;
  meetingId?: Maybe<Scalars['String']['output']>;
  participantInfo?: Maybe<Scalars['String']['output']>;
  participantInsights?: Maybe<Array<ParticipantInsight>>;
  pastNotes?: Maybe<PastNotes>;
  /** @deprecated Use pastSyncsSummary.summary instead */
  pastSyncSummary?: Maybe<Scalars['String']['output']>;
  pastSyncsSummary?: Maybe<PastSyncsSummary>;
};

export type MeetingPrepOwnerProfile = {
  __typename?: 'MeetingPrepOwnerProfile';
  email?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  picture?: Maybe<Scalars['String']['output']>;
  preferredLanguage?: Maybe<Scalars['String']['output']>;
};

export type MeetingPrepParticipant = {
  __typename?: 'MeetingPrepParticipant';
  email?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  picture?: Maybe<Scalars['String']['output']>;
};

export type MeetingPrepTask = {
  __typename?: 'MeetingPrepTask';
  completedAt?: Maybe<Scalars['String']['output']>;
  completedByUserId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  createdById: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['String']['output']>;
  generatedOwnerName?: Maybe<Scalars['String']['output']>;
  hasChangedOwner?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['String']['output'];
  meetingCaptionIndex?: Maybe<Scalars['Float']['output']>;
  meetingId: Scalars['String']['output'];
  meetingTimestamp?: Maybe<Scalars['String']['output']>;
  ownerEmail?: Maybe<Scalars['String']['output']>;
  ownerId?: Maybe<Scalars['String']['output']>;
  ownerType?: Maybe<Scalars['String']['output']>;
  parentId?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type MeetingRealtimeSettings = {
  __typename?: 'MeetingRealtimeSettings';
  isRealtimeEnabled?: Maybe<Scalars['Boolean']['output']>;
  isRealtimeNotesEnabled?: Maybe<Scalars['Boolean']['output']>;
  showRealtimeTranscription?: Maybe<Scalars['Boolean']['output']>;
  transcriptionMode?: Maybe<Scalars['String']['output']>;
};

export type MeetingRecommendationsResponse = {
  __typename?: 'MeetingRecommendationsResponse';
  generatedAt: Scalars['DateTime']['output'];
  isStatic?: Maybe<Scalars['Boolean']['output']>;
  meetingId: Scalars['String']['output'];
  meetingTitle: Scalars['String']['output'];
  recommendations: Array<SuggestedAppResponse>;
  totalCost: Scalars['Float']['output'];
};

/** A meeting resource, identified by its meeting id. */
export type MeetingResource = {
  __typename?: 'MeetingResource';
  meetingId: Scalars['String']['output'];
};

export type MeetingServiceObject = {
  __typename?: 'MeetingServiceObject';
  creatorProfile?: Maybe<Profile>;
  detailedOwner?: Maybe<User>;
  id?: Maybe<Scalars['String']['output']>;
  meetingExpirySettings?: Maybe<MeetingExpirySettings>;
  organizerEmail?: Maybe<Scalars['String']['output']>;
  owner?: Maybe<Scalars['String']['output']>;
  rawCreatedDate?: Maybe<Scalars['Date']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  users?: Maybe<Array<Scalars['String']['output']>>;
};

export type MeetingStatus = {
  __typename?: 'MeetingStatus';
  audioQuality?: Maybe<Scalars['Float']['output']>;
  audio_threshhold?: Maybe<Scalars['Float']['output']>;
  callEnd?: Maybe<Scalars['Float']['output']>;
  guid?: Maybe<Scalars['String']['output']>;
  lastNote?: Maybe<Scalars['Float']['output']>;
  notesOver?: Maybe<Scalars['Int']['output']>;
  numNotes?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  yscript?: Maybe<Scalars['String']['output']>;
};

export type MeetingStatusData = {
  __typename?: 'MeetingStatusData';
  _id?: Maybe<Scalars['String']['output']>;
  addedBy?: Maybe<Scalars['String']['output']>;
  audioIsTooSmall?: Maybe<Scalars['Boolean']['output']>;
  audio_url?: Maybe<Scalars['String']['output']>;
  calId?: Maybe<Scalars['String']['output']>;
  computedStatus?: Maybe<Scalars['String']['output']>;
  endTime?: Maybe<Scalars['Float']['output']>;
  errorDetail?: Maybe<ErrorDetail>;
  fredJoinedMeetingAt?: Maybe<Scalars['Float']['output']>;
  hasAccess?: Maybe<Scalars['String']['output']>;
  hostEmail?: Maybe<Scalars['String']['output']>;
  meetingSource?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  notesPrivacy?: Maybe<Scalars['String']['output']>;
  objectId?: Maybe<Scalars['String']['output']>;
  openNotebook?: Maybe<Scalars['Boolean']['output']>;
  processMeetingStatus?: Maybe<Scalars['String']['output']>;
  puppetExitReason?: Maybe<Scalars['String']['output']>;
  realtimeSettings?: Maybe<MeetingRealtimeSettings>;
  reloadMeeting?: Maybe<Scalars['Boolean']['output']>;
  startTime?: Maybe<Scalars['Float']['output']>;
  started?: Maybe<Scalars['Boolean']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
  userEmail?: Maybe<Scalars['String']['output']>;
  userIsHost?: Maybe<Scalars['Boolean']['output']>;
  userIsParticipant?: Maybe<Scalars['Boolean']['output']>;
  userIsTeammate?: Maybe<Scalars['Boolean']['output']>;
  userProfile?: Maybe<Profile>;
};

export type MeetingStatusList = {
  __typename?: 'MeetingStatusList';
  hasNext?: Maybe<Scalars['Boolean']['output']>;
  meetings?: Maybe<Array<MeetingStatusData>>;
  next?: Maybe<Scalars['String']['output']>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type MeetingSummary = {
  __typename?: 'MeetingSummary';
  sections?: Maybe<Array<MeetingSummarySection>>;
  summary?: Maybe<Summary>;
  summaryStatus?: Maybe<MeetingSummaryStatus>;
};

export type MeetingSummaryResponse = {
  __typename?: 'MeetingSummaryResponse';
  extendedSections?: Maybe<Array<SummarySectionOutput>>;
  generatedSectionsSeparately?: Maybe<Scalars['Boolean']['output']>;
  isAutoClassified?: Maybe<Scalars['Boolean']['output']>;
  meetingId: Scalars['String']['output'];
  summary?: Maybe<Summary>;
  summarySections?: Maybe<Array<SummarySectionOutput>>;
  templateId?: Maybe<Scalars['String']['output']>;
};

export type MeetingSummarySection = {
  __typename?: 'MeetingSummarySection';
  isAiApp?: Maybe<Scalars['Boolean']['output']>;
  key: Scalars['String']['output'];
  prompt?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  value?: Maybe<Scalars['String']['output']>;
};

export enum MeetingSummaryStatus {
  Default = 'default',
  Failed = 'failed',
  Processed = 'processed',
  Processing = 'processing',
  Skipped = 'skipped'
}

export type MeetingUser = {
  __typename?: 'MeetingUser';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  picture?: Maybe<Scalars['String']['output']>;
};

export type Meetings = {
  __typename?: 'Meetings';
  meetings: Array<Source>;
  total?: Maybe<Scalars['Int']['output']>;
};

export type MeetingsExtended = {
  __typename?: 'MeetingsExtended';
  allEmailsProfiles?: Maybe<Array<Profile>>;
  channels?: Maybe<Array<MeetingChannel>>;
  parseId?: Maybe<Scalars['String']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
};

export type Member = {
  __typename?: 'Member';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  role?: Maybe<EnumUserGroupMemberRole>;
};

export type MessageContent = ButtonContent | CardContent | GuideCardContent | TextContent;

export type MigrationError = {
  __typename?: 'MigrationError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type MigrationListItem = {
  __typename?: 'MigrationListItem';
  completedMeetings: Scalars['Int']['output'];
  createdAt: Scalars['String']['output'];
  failedMeetings: Scalars['Int']['output'];
  migrationId: Scalars['String']['output'];
  overallStatus: Scalars['String']['output'];
  platform: Scalars['String']['output'];
  totalMeetings: Scalars['Int']['output'];
  userId: Scalars['String']['output'];
};

export type MigrationStageStatuses = {
  __typename?: 'MigrationStageStatuses';
  commit: StageStatus;
  fetchInfo: StageStatus;
  fullIngest: StageStatus;
  transcode: StageStatus;
  transform: StageStatus;
  validateMigration: StageStatus;
};

export type MigrationStatusError = {
  __typename?: 'MigrationStatusError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type MigrationStatusResponse = {
  __typename?: 'MigrationStatusResponse';
  completedMeetings: Scalars['Int']['output'];
  failedMeetings: Scalars['Int']['output'];
  migrationId: Scalars['String']['output'];
  overallStatus: Scalars['String']['output'];
  stages: MigrationStageStatuses;
  totalMeetings: Scalars['Int']['output'];
};

export type MigrationStatusResult = MigrationStatusError | MigrationStatusResponse;

export type MigrationSuccess = {
  __typename?: 'MigrationSuccess';
  message: Scalars['String']['output'];
  migrationId: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  acceptMeetingAccessRequest: Scalars['Boolean']['output'];
  acceptTeamInvitation?: Maybe<Scalars['Boolean']['output']>;
  acceptTeamJoinRequest: Scalars['Boolean']['output'];
  acceptTeamRequest: TeamRequest;
  accessKnowledgeBaseFile: AccessKnowledgeBaseFileResponse;
  activateAccount?: Maybe<Scalars['String']['output']>;
  addCard: Card;
  addConnectorSetup?: Maybe<ConnectorSetupResponse>;
  addMeetingRecaps?: Maybe<Scalars['JSON']['output']>;
  addMembers?: Maybe<Scalars['String']['output']>;
  addPhoneNumber: AddPhoneNumberResult;
  addTeammateToUserGroup: UserGroup;
  appRecommendationsV2: MeetingRecommendationsResponse;
  applyAppOutputPrivacyToPastOutputs: ApplyAppOutputPrivacyToPastOutputsResponseDto;
  approvePaymentAutomaticRefund?: Maybe<Scalars['Boolean']['output']>;
  approveTerms?: Maybe<Scalars['String']['output']>;
  archiveMeeting?: Maybe<Scalars['Boolean']['output']>;
  askFred: FredResponse;
  askFredOnWebsite?: Maybe<FredResponse>;
  authenticateIntegration?: Maybe<Scalars['String']['output']>;
  beginConference?: Maybe<BeginConferenceResponse>;
  blockUser?: Maybe<Teammate>;
  cancelAICreditsFreeAccess: Team;
  cancelAIExtensionsSubscription: UpdateAiExtensionsSubscription;
  cancelAIExtensionsUnsubscribeRequest: UpdateAiExtensionsSubscription;
  cancelAITeammateFreeAccess: Team;
  cancelMeetingExpiry?: Maybe<Scalars['Boolean']['output']>;
  cancelSharedMeetingAccess?: Maybe<Scalars['Boolean']['output']>;
  cancelSubscriptionUnsubscribeRequest: BillingInfo;
  cancelTeamDowngrade?: Maybe<Scalars['Boolean']['output']>;
  cancelTeamInvite?: Maybe<Invitation>;
  claimAICreditsActivationCampaign: Team;
  claimCreditIncentive?: Maybe<ClaimCreditResult>;
  claimPartnerPerk: PartnerPerk;
  clearTeamSummaryTemplate: Scalars['Boolean']['output'];
  completeOnboardingStep: Scalars['Boolean']['output'];
  completeUpload: Scalars['Boolean']['output'];
  confirmManualUploadItem: ManualUploadBatch;
  confirmSummaryTemplate: Scalars['Boolean']['output'];
  connectorAuthHelper?: Maybe<Scalars['JSON']['output']>;
  connectorSetupClick?: Maybe<Scalars['JSON']['output']>;
  connectorSetupVisibility?: Maybe<Scalars['JSON']['output']>;
  controlUserDictionary?: Maybe<User>;
  controlUserDictionaryV2?: Maybe<CustomDictionary>;
  createAnalyticsView: AnalyticsView;
  createAppPreview: Scalars['Boolean']['output'];
  createAppSettings: AppSettings;
  createAutopilotAgent: AutopilotAgent;
  createAutopilotAgentScenario: AutopilotAgentScenario;
  createAutopilotMeeting?: Maybe<Scalars['String']['output']>;
  createChannel?: Maybe<Channel>;
  /** @deprecated Use createCustomBotNameSubscriptionWith3ds instead */
  createCustomBotNameSubscription: StripeSubscription;
  createCustomBotNameSubscriptionWith3ds: CreateSubscription;
  createEmailRule: EmailRule;
  createManualUploadBatch: ManualUploadBatch;
  createMark?: Maybe<WaveMark>;
  createMeeting: Meeting;
  createMeetingInMediaStorage?: Maybe<MeetingInMediaStorageResponse>;
  createMeetingInMediaStorageWithURL?: Maybe<MeetingInMediaStorageResponse>;
  createNPSSurvey: NpsSurvey;
  createPlaylist: Playlist;
  createReferrals: Array<Referral>;
  createRule?: Maybe<Scalars['String']['output']>;
  createRuleV2?: Maybe<Scalars['String']['output']>;
  createSetupIntent: SetupIntent;
  createSoundbite: Soundbite;
  createSoundbites: Array<Soundbite>;
  createSubscription: CreateSubscription;
  createSummarySettings: SummarySettings;
  createSummaryTemplate: SummaryTemplate;
  createSummaryTemplateFromSample: SummaryTemplate;
  createTask: Task;
  createTeamRule?: Maybe<Scalars['String']['output']>;
  createTeamRuleV2?: Maybe<Scalars['String']['output']>;
  createTeamSummaryTemplate: SummaryTemplate;
  createTeamSummaryTemplateFromSample: SummaryTemplate;
  createTeamsAccount?: Maybe<Team>;
  createUserFile?: Maybe<Scalars['String']['output']>;
  createUserGroup: UserGroup;
  createVoiceAgentFromMeetings: CreateVoiceAgentFromMeetingsResponse;
  createVoiceClone?: Maybe<CreateVoiceCloneResponse>;
  declinePaymentAutomaticRefund?: Maybe<Scalars['Boolean']['output']>;
  deleteAccount?: Maybe<Scalars['Boolean']['output']>;
  deleteAllMeetings?: Maybe<Scalars['String']['output']>;
  deleteAnalyticsView: Scalars['Boolean']['output'];
  deleteAppOutput: Scalars['Boolean']['output'];
  deleteAppSettings: Scalars['Boolean']['output'];
  deleteAutofillConfig?: Maybe<DeleteAutofillConfigResponse>;
  deleteAutofillConfigV2: DeleteAutofillConfigResponse;
  deleteAutopilotAgent: Scalars['Boolean']['output'];
  deleteAutopilotAgentScenario: Scalars['Boolean']['output'];
  deleteCategories?: Maybe<Scalars['String']['output']>;
  deleteChannel?: Maybe<Scalars['String']['output']>;
  deleteConnectorSetup?: Maybe<Scalars['JSON']['output']>;
  deleteEmailRule: Scalars['Boolean']['output'];
  deleteKnowledgeBaseDocument: Scalars['Boolean']['output'];
  deleteMark: Scalars['String']['output'];
  deleteMeetingNoteComment?: Maybe<Scalars['Boolean']['output']>;
  deleteMeetingNoteCommentV2: Scalars['Boolean']['output'];
  deleteMeetings?: Maybe<Scalars['String']['output']>;
  deletePhoneNumber: Scalars['Boolean']['output'];
  deletePlaylist: Scalars['Boolean']['output'];
  deleteRule?: Maybe<Scalars['Boolean']['output']>;
  deleteRuleV2?: Maybe<Scalars['Boolean']['output']>;
  deleteSlackWorkspace?: Maybe<Scalars['Boolean']['output']>;
  deleteSoundbite: Scalars['Boolean']['output'];
  deleteSummarySettings: Scalars['Boolean']['output'];
  deleteSummaryTemplate: SummaryTemplate;
  deleteTask: Task;
  deleteTasks: Array<Task>;
  deleteTeam?: Maybe<Scalars['Boolean']['output']>;
  deleteTeamRule?: Maybe<Scalars['Boolean']['output']>;
  deleteTeamRuleV2?: Maybe<Scalars['Boolean']['output']>;
  deleteUserFile?: Maybe<Scalars['Boolean']['output']>;
  deleteUserGroup: UserGroup;
  deleteVoiceClone?: Maybe<DeleteVoiceCloneResponse>;
  denyMeetingAccessRequest: Scalars['Boolean']['output'];
  denyTeamJoinRequest: Scalars['Boolean']['output'];
  denyTeamRequest: TeamRequest;
  destroyDeviceSession?: Maybe<Scalars['Boolean']['output']>;
  destroyDeviceSessionV2?: Maybe<Scalars['Boolean']['output']>;
  disableChecklist: Scalars['Boolean']['output'];
  disconnectConnectorV2?: Maybe<ConnectorSetupResponse>;
  disconnectIntegration?: Maybe<Scalars['JSON']['output']>;
  downgradeAccount?: Maybe<Scalars['String']['output']>;
  downgradeTeamMembers?: Maybe<Scalars['Boolean']['output']>;
  dynamicRenderingSaveCreateForm?: Maybe<Scalars['JSON']['output']>;
  endConnectorAuthorization?: Maybe<ConnectorSetupResponse>;
  endLiveMeetingCall?: Maybe<Scalars['Boolean']['output']>;
  endMeeting: Scalars['Boolean']['output'];
  enhanceSummaryTemplateDescription: Scalars['String']['output'];
  evaluateRule?: Maybe<EvaluateRuleOutput>;
  evaluateRuleV2?: Maybe<EvaluateRuleOutput>;
  expandAppOutputItem: AppOutputItemExpansion;
  expandSection?: Maybe<Scalars['String']['output']>;
  generateAgentIconUploadUrl: GenerateAgentIconUploadUrlResponse;
  generateAgentVoicePreview?: Maybe<GenerateAgentVoicePreview>;
  generateAiApp?: Maybe<GenerateAiApp>;
  generateAiAppV2?: Maybe<GenerateAiApp>;
  generateAppOutputAudio?: Maybe<Scalars['String']['output']>;
  generateAppPreview: Scalars['String']['output'];
  generateAppRecommendationsForMeeting: MeetingRecommendationsResponse;
  generateAppRecommendedByFred: FredRecommendationsResponse;
  generateAutopilotAgentContent: GeneratedAutopilotAgentContent;
  generateAutopilotMeeting: GenerateAutopilotMeetingResponse;
  generateAutopilotOTP: Scalars['Boolean']['output'];
  generateContactBio: Contact;
  generateDealContactBio: DealContact;
  generateKnowledgeBaseUploadUrl: GenerateKnowledgeBaseUploadUrlResponse;
  generateScenarioUploadUrl: GenerateScenarioUploadUrlResponse;
  generateSummaryTemplateStyleFromSample: Scalars['String']['output'];
  generateSummaryTemplateUploadUrl: GenerateSummaryTemplateUploadUrlResponse;
  generateSummaryTemplateUploadUrlV2: GenerateSummaryTemplateUploadUrlResponse;
  generateVoiceAgentQuestions: GenerateVoiceAgentQuestionsResponse;
  getClonedVoiceSignedUrl?: Maybe<GetClonedVoiceSignedUrlResponse>;
  getLiveMeetingRecommendations: MeetingRecommendationsResponse;
  giveFeedback: Feedback;
  hideAppEventsForSkill: Scalars['Boolean']['output'];
  industrySelection?: Maybe<Scalars['Boolean']['output']>;
  ingestKnowledgeBaseDocument: IngestKnowledgeBaseDocumentResponse;
  ingestKnowledgeBaseDocumentAsync: IngestionJob;
  ingestKnowledgeBaseUrl: IngestKnowledgeBaseDocumentResponse;
  ingestKnowledgeBaseUrlAsync: IngestionJob;
  initApiKey?: Maybe<Scalars['String']['output']>;
  initApiKeyV2?: Maybe<Scalars['String']['output']>;
  initMailAboutSettings?: Maybe<Scalars['Boolean']['output']>;
  initiateVideoTranscription: InitiateVideoTranscriptionResponse;
  insertCategories: Categories;
  inviteFredToSlackHuddle?: Maybe<Scalars['Boolean']['output']>;
  inviteTeammates: Scalars['String']['output'];
  joinAllUpcomingMeetings: Array<JoinAllUpcomingMeetingResult>;
  joinAutoAddTeam: Team;
  leaveTeam?: Maybe<Scalars['Boolean']['output']>;
  makePhoneCall: MakePhoneCallResult;
  markAppEventSeen: Scalars['Boolean']['output'];
  markAutoAddModalAsSeen: Teammate;
  markFreeTrialModalAsSeen: Scalars['Boolean']['output'];
  markInviteCampaignBannerAsSeen: UserMetadata;
  markMeetingSharePopoverAsSeen: UserMetadata;
  markMessagesAsRead: Scalars['Boolean']['output'];
  markRegionalPricingCampaignAsSeen: Scalars['Boolean']['output'];
  markSeenFreeExpansionCampaign: Scalars['Boolean']['output'];
  markSeenFreeTrialPage: Scalars['Boolean']['output'];
  markSeenPaywall: Scalars['Boolean']['output'];
  markTeamRequestAsSeen: TeamRequest;
  moveChannelMeetings?: Maybe<Scalars['JSON']['output']>;
  newMeetingNoteComment?: Maybe<MeetingNoteComment>;
  newMeetingNoteCommentV2: MeetingNoteComment;
  notifyStealthRecordingStarted: NotifyStealthRecordingStartedPayload;
  pauseRealtimeMeeting: Meeting;
  paywallClick?: Maybe<Scalars['Boolean']['output']>;
  paywallClickV2?: Maybe<Scalars['Boolean']['output']>;
  pinAppSettings: AppSettings;
  prepareChurnDefenderSession?: Maybe<ChurnDefenderSession>;
  previewDraft: PreviewDraftResult;
  previewSummaryTemplate: Scalars['JSON']['output'];
  publishMeetingEdit: Soundbite;
  pushAutofillToCRM?: Maybe<PushAutofillToCrmResponse>;
  pushAutofillToCRMV2: PushAutofillToCrmResponse;
  pushPastMeetings?: Maybe<PushPastMeetingsResponse>;
  pushSampleData?: Maybe<Scalars['Boolean']['output']>;
  rateAskFred: FredResponse;
  rateGlobalAskFredResponse?: Maybe<Scalars['Boolean']['output']>;
  rateNotepad?: Maybe<Scalars['Boolean']['output']>;
  rateNotepadV2?: Maybe<Scalars['Boolean']['output']>;
  rateSummary?: Maybe<Scalars['String']['output']>;
  rateSummaryV2?: Maybe<Scalars['String']['output']>;
  realtimePanelFeedback?: Maybe<Scalars['Boolean']['output']>;
  realtimePanelFeedbackV2?: Maybe<Scalars['Boolean']['output']>;
  /** Records a consent notice the client delivered itself — the spoken message, camera badge, or keyboard-delivered Google Meet chat notice. These are distinct from a Teams chat notice, which is server/provider-confirmed. */
  recordConsentNotice: RecordConsentNoticePayload;
  recoverIntegrations?: Maybe<Scalars['String']['output']>;
  recrawlKnowledgeBaseUrl: IngestKnowledgeBaseDocumentResponse;
  refineSummary: Scalars['Boolean']['output'];
  refineSummaryPreview: RefineSummaryResult;
  regenerateAppOutput: Scalars['String']['output'];
  regenerateSoundbiteTitleAndSummary: Soundbite;
  registerDeviceToken: Scalars['Boolean']['output'];
  registerSlackWorkspace?: Maybe<Scalars['String']['output']>;
  registerSso?: Maybe<RegisterSsoResponse>;
  registerSsoV2?: Maybe<RegisterSsoResponse>;
  remoteDisconnectUser: MutationResponse;
  removeCard: Card;
  removeChannelMeetings?: Maybe<Scalars['Boolean']['output']>;
  removeMember?: Maybe<Scalars['String']['output']>;
  removeTeammateFromUserGroup: UserGroup;
  removeUserFromTeam: Teammate;
  renameChannel?: Maybe<Scalars['String']['output']>;
  reorderTeamRules?: Maybe<Scalars['Boolean']['output']>;
  reorderTeamRulesV2?: Maybe<Scalars['Boolean']['output']>;
  requestMeetingAccess?: Maybe<Scalars['Boolean']['output']>;
  requestPhoneNumberVerification: PhoneNumberVerification;
  requestToJoinTeam: TeamRequest;
  resendInviteToTeam?: Maybe<Scalars['String']['output']>;
  resendReferral: Referral;
  resetAPIKey?: Maybe<Scalars['String']['output']>;
  resetAPIKeyV2?: Maybe<Scalars['String']['output']>;
  resetMigrations: ResetMigrationsResult;
  resetScimApiKey?: Maybe<Scalars['String']['output']>;
  resetScimApiKeyV2?: Maybe<Scalars['String']['output']>;
  /**
   * Remove a team's override for one capability, reverting it to the registry
   * default. Requires the calling user to be a team admin or super admin.
   * Idempotent: resetting a capability with no override succeeds and returns the
   * default policy. Returns the resulting policy (always isDefault: true).
   */
  resetTeamPermissionPolicy: TeamCapabilityPolicy;
  resumeRealtimeMeeting: Meeting;
  resyncSingleIntegration?: Maybe<Scalars['String']['output']>;
  retryAskFred: FredResponse;
  retryConnectorJob?: Maybe<ConnectorSetupResponse>;
  retryFailedAppEvent: RetryFailedAppEventResult;
  retryManualUploadItem: ManualUploadBatch;
  runAppManually: Scalars['String']['output'];
  runSummaryManually: Scalars['Boolean']['output'];
  saveAutofillConfig?: Maybe<SaveAutofillConfigResponse>;
  saveAutofillConfigV2: SaveAutofillConfigResponse;
  saveNotes?: Maybe<MeetingNote>;
  saveOptions?: Maybe<User>;
  saveRefinedSummary: Scalars['Boolean']['output'];
  saveTeamSettings?: Maybe<Scalars['JSON']['output']>;
  segmentLog?: Maybe<Scalars['String']['output']>;
  segmentLogV2?: Maybe<Scalars['String']['output']>;
  sendChurnChat: ChurnChatResponse;
  sendMessageToSlack?: Maybe<Scalars['JSON']['output']>;
  sendSummaryToIntegration?: Maybe<Scalars['JSON']['output']>;
  sendTasksToIntegration?: Maybe<Scalars['Boolean']['output']>;
  setAppEventFollowUpThread: Scalars['Boolean']['output'];
  setDefaultCard: Card;
  setDefaultSummaryTemplate: Scalars['Boolean']['output'];
  setEmailSettings: EmailSettings;
  setMeetingLanguage?: Maybe<CalendarEvents>;
  setMeetingPrivacy?: Maybe<MeetingNote>;
  /**
   * Set the permission level for one capability on a team. Requires the calling
   * user to be a team admin or super admin. Returns the updated policy.
   */
  setTeamPermissionPolicy: TeamCapabilityPolicy;
  setTeamSummaryTemplate: SummaryTemplate;
  setTeamsConsentEnabled: RecordingPreferences;
  setupPrivateStorage: PrivateStorageDetails;
  shareDealWithUsers: Deal;
  shareMeetingViaEmail: Scalars['Boolean']['output'];
  shareMeetings?: Maybe<ShareMeetingResponse>;
  sharePlaylistViaEmail: Scalars['Boolean']['output'];
  shareSoundbiteViaEmail: Scalars['Boolean']['output'];
  shareWeeklyUsageViaEmail: Scalars['Boolean']['output'];
  startAICreditsFreeAccess: Team;
  startAITeammateFreeAccess: Team;
  startAuthorization?: Maybe<Scalars['JSON']['output']>;
  startConnectorAuthorization?: Maybe<ConnectorAuthResponse>;
  startFileUploads: Array<FileUploadResponse>;
  startMigration: StartMigrationResult;
  startPlatformOAuth: PlatformOAuthUrl;
  startUpload: StartUploadResponse;
  stopRealtimeMeeting: Meeting;
  submitAccountMigration: AccountMigrationResponse;
  submitDataExportRequest: DataExportRequestResponse;
  subscribeAIExtensions: CreateAiExtensionsSubscription;
  syncPastDeals: Scalars['Boolean']['output'];
  testPullFlow?: Maybe<Scalars['JSON']['output']>;
  testPushFlow?: Maybe<Scalars['JSON']['output']>;
  toggleAppSettings: AppSettings;
  toggleConnectorSetupEnabledStatus?: Maybe<ConnectorSetupResponse>;
  toggleEmailAssistant: EmailSettings;
  togglePersonalAssistant: TogglePersonalAssistantResponseDto;
  togglePrivateStorage: Scalars['Boolean']['output'];
  toggleSlackAutoJoin?: Maybe<SlackWorkSpace>;
  toggleTeammateInvite?: Maybe<Team>;
  toggleTeammateRole?: Maybe<Teammate>;
  toggleUpcomingEvent: CalendarEvents;
  trackAnonymousEvent?: Maybe<Scalars['Boolean']['output']>;
  trackAnonymousEventV2?: Maybe<Scalars['Boolean']['output']>;
  trackAppOutputView?: Maybe<Scalars['Boolean']['output']>;
  trackAppOutputViewV2?: Maybe<Scalars['Boolean']['output']>;
  trackDownloads?: Maybe<Scalars['Boolean']['output']>;
  trackDownloadsV2?: Maybe<Scalars['Boolean']['output']>;
  trackEvent?: Maybe<Scalars['Boolean']['output']>;
  trackEventV2?: Maybe<Scalars['Boolean']['output']>;
  trackExperiments?: Maybe<Scalars['Boolean']['output']>;
  trackExperimentsV2?: Maybe<Scalars['Boolean']['output']>;
  trackLoginPopup?: Maybe<Scalars['Boolean']['output']>;
  trackLoginPopupV2?: Maybe<Scalars['Boolean']['output']>;
  trackPaywallShown: Scalars['Boolean']['output'];
  trackSeenStorage?: Maybe<Scalars['String']['output']>;
  trackSeenStorageV2?: Maybe<Scalars['String']['output']>;
  trackTour?: Maybe<Scalars['Boolean']['output']>;
  trackTourV2?: Maybe<Scalars['Boolean']['output']>;
  trackTranscriptView?: Maybe<Scalars['String']['output']>;
  trackTranscriptViewV2?: Maybe<Scalars['String']['output']>;
  trackVideoRecording?: Maybe<Scalars['Boolean']['output']>;
  trackVideoRecordingV2?: Maybe<Scalars['Boolean']['output']>;
  transcribeCustomLang: Scalars['Boolean']['output'];
  transcribeMeeting: Scalars['Boolean']['output'];
  triggerOnDemandExtraction?: Maybe<TriggerOnDemandExtractionResponse>;
  triggerOnDemandExtractionV2: TriggerOnDemandExtractionResponse;
  unblockUser?: Maybe<Teammate>;
  unpinAppSettings: AppSettings;
  unsetArtifactExpirySettings?: Maybe<UserMetadata>;
  unshareDealFromUsers: Deal;
  updateAICreditSettings: Team;
  updateAIExtensionsPlan: UpdateAiExtensionsSubscription;
  updateAmazonQBusinessSettings: Team;
  updateAnalyticsView: AnalyticsView;
  updateAnnouncementState: UserAnnouncementState;
  updateAppOutput: AppOutput;
  updateAppSettings: AppSettings;
  updateAutoAddSettings?: Maybe<Team>;
  updateAutofillExtractions?: Maybe<UpdateAutofillExtractionsResponse>;
  updateAutofillExtractionsV2: UpdateAutofillExtractionsResponse;
  updateAutopilotAgent: AutopilotAgent;
  updateAutopilotAgentScenario: AutopilotAgentScenario;
  updateBillingAdmin: Team;
  updateBillingInfo?: Maybe<BillingInfo>;
  updateBillingSettings: Team;
  updateBitePlaylists: Array<Playlist>;
  updateCategories?: Maybe<Categories>;
  updateCommentReaction?: Maybe<MeetingNoteComment>;
  updateCommentReactionV2: MeetingNoteComment;
  updateConnectorSetup?: Maybe<Scalars['JSON']['output']>;
  updateContact: Contact;
  updateCustomBotName: Team;
  updateDealActionItemStatus: DealAiActionItem;
  updateDealAiState: Deal;
  updateDealIntelligenceSettings?: Maybe<Team>;
  updateDealPrivacy: Deal;
  updateEmailRule: EmailRule;
  updateFree1kAICreditsCampaignStatus: Team;
  updateIntegrationPermission: MutationResponse;
  updateMeeting: Meeting;
  updateMeetingNoteComment?: Maybe<MeetingNoteComment>;
  updateMeetingNoteCommentV2: MeetingNoteComment;
  updateMeetingNoteSummary?: Maybe<Scalars['Boolean']['output']>;
  updateMeetingState?: Maybe<Scalars['Boolean']['output']>;
  updateMeetingTitle?: Maybe<Scalars['String']['output']>;
  updateNotificationSetting?: Maybe<Team>;
  updatePersonalAssistantSettings: Team;
  updatePlanWith3ds: UpdatePlanWith3ds;
  updatePlaylist: Playlist;
  updatePlaylistBites: Playlist;
  updateRecapConfig: RecapConfig;
  updateRule?: Maybe<Scalars['Boolean']['output']>;
  updateRuleV2?: Maybe<Scalars['Boolean']['output']>;
  updateSetupToWebHook: Scalars['Int']['output'];
  updateSoundbite: Soundbite;
  updateSso?: Maybe<RegisterSsoResponse>;
  updateSsoV2?: Maybe<RegisterSsoResponse>;
  updateSummarySettings: SummarySettings;
  updateSummaryTemplate: SummaryTemplate;
  updateSummaryTemplateFromPrompt: SummaryTemplate;
  updateSummaryTemplateFromSample: SummaryTemplate;
  updateSyncPreference: MutationResponse;
  updateTask: Task;
  updateTaskOwner: Task;
  updateTaskStatus: Task;
  updateTeamRule?: Maybe<Scalars['Boolean']['output']>;
  updateTeamRuleV2?: Maybe<Scalars['Boolean']['output']>;
  updateTeamSettings?: Maybe<Team>;
  updateUpcomingMeetingsToUseFocus?: Maybe<Scalars['Boolean']['output']>;
  updateUserDynamicMetadata?: Maybe<UserDynamicMetadata>;
  updateUserFile?: Maybe<Scalars['Boolean']['output']>;
  updateUserGroup: UserGroup;
  updateUserGroupMemberRole: UserGroup;
  updateUserGroupSettings: UserGroup;
  updateUserMetadata?: Maybe<UserMetadata>;
  updateUserTrackingParams?: Maybe<Scalars['Boolean']['output']>;
  updateUserTrackingParamsV2?: Maybe<Scalars['Boolean']['output']>;
  updateWebhook?: Maybe<Scalars['JSON']['output']>;
  updateWebhookSubscriptions?: Maybe<Scalars['JSON']['output']>;
  /** @deprecated No longer supported. Use getClonedVoiceSignedUrl instead. */
  uploadClonedVoice?: Maybe<UploadClonedVoiceResponse>;
  uploadManualNotes?: Maybe<Scalars['Boolean']['output']>;
  uploadTranscript: Scalars['Boolean']['output'];
  upsertMeetingPrepApp: MeetingPrepApp;
  userClosedBrowser?: Maybe<Scalars['Boolean']['output']>;
  userClosedBrowserV2?: Maybe<Scalars['Boolean']['output']>;
  userInteractingWithHelp?: Maybe<Scalars['String']['output']>;
  userInteractingWithHelpV2?: Maybe<Scalars['String']['output']>;
  verifyAutopilotOTP: Scalars['Boolean']['output'];
  verifyConnectorSetup?: Maybe<Scalars['JSON']['output']>;
  verifyDomain?: Maybe<VerifySsoDomainResponse>;
  verifyDomainV2?: Maybe<VerifySsoDomainResponse>;
  verifyPhoneNumber: VerifyPhoneNumberResult;
};


export type MutationAcceptMeetingAccessRequestArgs = {
  inviteeId: Scalars['ID']['input'];
  meetingId: Scalars['ID']['input'];
};


export type MutationAcceptTeamInvitationArgs = {
  inviteId: Scalars['String']['input'];
};


export type MutationAcceptTeamJoinRequestArgs = {
  requesterId: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
};


export type MutationAcceptTeamRequestArgs = {
  requestId: Scalars['String']['input'];
};


export type MutationAccessKnowledgeBaseFileArgs = {
  input: AccessKnowledgeBaseFileInput;
};


export type MutationActivateAccountArgs = {
  message?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAddCardArgs = {
  cardToken: Scalars['String']['input'];
  markAsDefault?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationAddConnectorSetupArgs = {
  connectorId: Scalars['String']['input'];
  context: Scalars['String']['input'];
  setup: ConnectorSetupInput;
};


export type MutationAddMeetingRecapsArgs = {
  channelId: Scalars['String']['input'];
  meetings: Array<Scalars['String']['input']>;
};


export type MutationAddMembersArgs = {
  channelId: Scalars['String']['input'];
  membersId: Array<InputMaybe<Scalars['String']['input']>>;
};


export type MutationAddPhoneNumberArgs = {
  number: Scalars['String']['input'];
};


export type MutationAddTeammateToUserGroupArgs = {
  id: Scalars['ID']['input'];
  teammateId: Scalars['ID']['input'];
};


export type MutationAppRecommendationsV2Args = {
  input: GenerateAppRecommendationsForMeetingInput;
};


export type MutationApplyAppOutputPrivacyToPastOutputsArgs = {
  id: Scalars['String']['input'];
};


export type MutationApprovePaymentAutomaticRefundArgs = {
  token: Scalars['String']['input'];
};


export type MutationApproveTermsArgs = {
  approval?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationArchiveMeetingArgs = {
  meetingId: Scalars['String']['input'];
};


export type MutationAskFredArgs = {
  captionIndices?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  meetingId: Scalars['String']['input'];
  model?: InputMaybe<Scalars['String']['input']>;
  privacy?: InputMaybe<Scalars['String']['input']>;
  query: Scalars['String']['input'];
  source?: InputMaybe<Scalars['String']['input']>;
  urlRef?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAskFredOnWebsiteArgs = {
  input: AskFredWebsiteInput;
};


export type MutationAuthenticateIntegrationArgs = {
  authType: Scalars['String']['input'];
  customRedirectUri?: InputMaybe<Scalars['String']['input']>;
  formValues?: InputMaybe<Scalars['JSON']['input']>;
  integrationId: Scalars['String']['input'];
  teamId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationBeginConferenceArgs = {
  customLanguage?: InputMaybe<Scalars['String']['input']>;
  duration?: InputMaybe<Scalars['Int']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  url: Scalars['String']['input'];
};


export type MutationBlockUserArgs = {
  deleteUser?: InputMaybe<Scalars['Boolean']['input']>;
  teamId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type MutationCancelAiExtensionsSubscriptionArgs = {
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCancelAiTeammateFreeAccessArgs = {
  input: CancelAiTeammateFreeAccessInput;
};


export type MutationCancelMeetingExpiryArgs = {
  meetingId: Scalars['String']['input'];
};


export type MutationCancelSharedMeetingAccessArgs = {
  meetingId: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  sharedMeetingId: Scalars['String']['input'];
};


export type MutationCancelTeamInviteArgs = {
  inviteId: Scalars['String']['input'];
  teamId: Scalars['String']['input'];
};


export type MutationClaimCreditIncentiveArgs = {
  campaignSlug: Scalars['String']['input'];
};


export type MutationClaimPartnerPerkArgs = {
  input: ClaimPartnerPerkInput;
};


export type MutationClearTeamSummaryTemplateArgs = {
  userGroupIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type MutationCompleteOnboardingStepArgs = {
  extraInfo: CompleteOnboardingStepExtraInfoInput;
  skip?: InputMaybe<Scalars['Boolean']['input']>;
  step: EnumOnboardingStep;
};


export type MutationCompleteUploadArgs = {
  audioSamplingRate?: InputMaybe<Scalars['Float']['input']>;
  client: Scalars['String']['input'];
  duration?: InputMaybe<Scalars['Float']['input']>;
  meetingId: Scalars['String']['input'];
  mimeType: Scalars['String']['input'];
  platform?: InputMaybe<Scalars['String']['input']>;
};


export type MutationConfirmManualUploadItemArgs = {
  batchId: Scalars['ID']['input'];
  itemId: Scalars['ID']['input'];
};


export type MutationConfirmSummaryTemplateArgs = {
  basicSections?: InputMaybe<Array<Scalars['JSON']['input']>>;
  extendedSections?: InputMaybe<Array<Scalars['JSON']['input']>>;
  meetingId?: InputMaybe<Scalars['String']['input']>;
  templateId: Scalars['String']['input'];
  userEmail?: InputMaybe<Scalars['String']['input']>;
};


export type MutationConnectorAuthHelperArgs = {
  connectorId: Scalars['String']['input'];
  helperName: Scalars['String']['input'];
};


export type MutationConnectorSetupClickArgs = {
  clickName: Scalars['String']['input'];
  connectorId: Scalars['String']['input'];
  connectorSetup?: InputMaybe<Scalars['JSON']['input']>;
  setupName: Scalars['String']['input'];
};


export type MutationConnectorSetupVisibilityArgs = {
  connectorId: Scalars['String']['input'];
  connectorSetup?: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationControlUserDictionaryArgs = {
  action: Scalars['String']['input'];
  phrases?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  title: Scalars['String']['input'];
};


export type MutationControlUserDictionaryV2Args = {
  action: Scalars['String']['input'];
  phrases?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  title: Scalars['String']['input'];
};


export type MutationCreateAnalyticsViewArgs = {
  conditions: Array<AnalyticsViewConditionInput>;
  logicalOperator: AnalyticsViewLogicalOperator;
  name: Scalars['String']['input'];
};


export type MutationCreateAppPreviewArgs = {
  input: CreateAppPreviewInput;
};


export type MutationCreateAppSettingsArgs = {
  input: CreateAppSettingsInput;
};


export type MutationCreateAutopilotAgentArgs = {
  input: CreateAutopilotAgentInput;
};


export type MutationCreateAutopilotAgentScenarioArgs = {
  input: CreateScenarioInput;
};


export type MutationCreateAutopilotMeetingArgs = {
  id: Scalars['String']['input'];
};


export type MutationCreateChannelArgs = {
  privacy: Scalars['Boolean']['input'];
  title: Scalars['String']['input'];
};


export type MutationCreateCustomBotNameSubscriptionArgs = {
  input: CreateCustomBotNameSubscriptionInput;
};


export type MutationCreateCustomBotNameSubscriptionWith3dsArgs = {
  input: CreateCustomBotNameSubscriptionInput;
};


export type MutationCreateEmailRuleArgs = {
  input: CreateEmailRuleInput;
};


export type MutationCreateManualUploadBatchArgs = {
  input: CreateManualUploadBatchInput;
};


export type MutationCreateMarkArgs = {
  actionType?: InputMaybe<Scalars['String']['input']>;
  captionText?: InputMaybe<Scalars['String']['input']>;
  futureOffsetSeconds?: InputMaybe<Scalars['Float']['input']>;
  markPinType?: InputMaybe<Scalars['String']['input']>;
  markType: Scalars['String']['input'];
  meetingId?: InputMaybe<Scalars['String']['input']>;
  pastOffsetSeconds?: InputMaybe<Scalars['Float']['input']>;
  source: Scalars['String']['input'];
  time?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationCreateMeetingArgs = {
  attendees?: InputMaybe<Array<MeetingAttendeeInput>>;
  client?: InputMaybe<Scalars['String']['input']>;
  customLanguage?: InputMaybe<Scalars['String']['input']>;
  enableRealtime?: InputMaybe<Scalars['Boolean']['input']>;
  endTime?: InputMaybe<Scalars['DateTime']['input']>;
  iCalUID?: InputMaybe<Scalars['String']['input']>;
  notesPrivacy?: InputMaybe<MeetingNotesPrivacy>;
  startTime?: InputMaybe<Scalars['DateTime']['input']>;
  title: Scalars['String']['input'];
  url?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateMeetingInMediaStorageArgs = {
  assetType: Scalars['String']['input'];
  contentType: Scalars['String']['input'];
  customLanguage?: InputMaybe<Scalars['String']['input']>;
  extension: Scalars['String']['input'];
  meetingDate?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};


export type MutationCreateMeetingInMediaStorageWithUrlArgs = {
  allEmails?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  customLanguage?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  url: Scalars['String']['input'];
};


export type MutationCreateNpsSurveyArgs = {
  answer?: InputMaybe<Scalars['String']['input']>;
  score?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationCreatePlaylistArgs = {
  biteIds: Array<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  privacy: PlaylistPrivacy;
  ref?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateReferralsArgs = {
  emails: Array<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateRuleArgs = {
  extension: CreateRuleInput;
};


export type MutationCreateRuleV2Args = {
  extension: CreateRuleInput;
};


export type MutationCreateSoundbiteArgs = {
  endTime: Scalars['Float']['input'];
  mediaType?: InputMaybe<Scalars['String']['input']>;
  meetingId: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  privacies?: InputMaybe<Array<SoundbitePrivacy>>;
  ref?: InputMaybe<Scalars['String']['input']>;
  startTime: Scalars['Float']['input'];
  summary?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateSoundbitesArgs = {
  ref?: InputMaybe<Scalars['String']['input']>;
  soundbites: Array<CreateSoundbiteInput>;
};


export type MutationCreateSubscriptionArgs = {
  input: CreateSubscriptionInput;
};


export type MutationCreateSummarySettingsArgs = {
  input: CreateSummarySettingsInput;
};


export type MutationCreateSummaryTemplateArgs = {
  input: CreateSummaryTemplateInput;
};


export type MutationCreateSummaryTemplateFromSampleArgs = {
  input: CreateSummaryTemplateFromSampleInput;
};


export type MutationCreateTaskArgs = {
  input: CreateTaskInput;
  meetingId: Scalars['ID']['input'];
};


export type MutationCreateTeamRuleArgs = {
  extension: CreateTeamRuleInput;
};


export type MutationCreateTeamRuleV2Args = {
  extension: CreateTeamRuleInput;
};


export type MutationCreateTeamSummaryTemplateArgs = {
  input: CreateTeamSummaryTemplateInput;
};


export type MutationCreateTeamSummaryTemplateFromSampleArgs = {
  input: CreateTeamSummaryTemplateFromSampleInput;
};


export type MutationCreateTeamsAccountArgs = {
  minutes?: InputMaybe<Scalars['Int']['input']>;
  seats?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateUserFileArgs = {
  audioUrl?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  fileName: Scalars['String']['input'];
  fileSize?: InputMaybe<Scalars['Float']['input']>;
  fileType: Scalars['String']['input'];
  meetingId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateUserGroupArgs = {
  input: CreateUserGroupInput;
};


export type MutationCreateVoiceAgentFromMeetingsArgs = {
  input: CreateVoiceAgentFromMeetingsInput;
};


export type MutationCreateVoiceCloneArgs = {
  input: CreateVoiceCloneParams;
};


export type MutationDeclinePaymentAutomaticRefundArgs = {
  token: Scalars['String']['input'];
};


export type MutationDeleteAccountArgs = {
  information?: InputMaybe<Scalars['String']['input']>;
  reason: Scalars['String']['input'];
  reasonSubcategory?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteAllMeetingsArgs = {
  channelId: Scalars['String']['input'];
  source?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteAnalyticsViewArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAppOutputArgs = {
  eventId: Scalars['String']['input'];
};


export type MutationDeleteAppSettingsArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteAutofillConfigArgs = {
  connectorId: Scalars['String']['input'];
};


export type MutationDeleteAutofillConfigV2Args = {
  connectorId: Scalars['String']['input'];
};


export type MutationDeleteAutopilotAgentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAutopilotAgentScenarioArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCategoriesArgs = {
  _id: Scalars['String']['input'];
};


export type MutationDeleteChannelArgs = {
  channelId: Scalars['String']['input'];
  createdBy: Scalars['String']['input'];
  isPrivate: Scalars['Boolean']['input'];
};


export type MutationDeleteConnectorSetupArgs = {
  connectorId: Scalars['String']['input'];
  setupId: Scalars['String']['input'];
};


export type MutationDeleteEmailRuleArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteKnowledgeBaseDocumentArgs = {
  input: DeleteKnowledgeBaseDocumentInput;
};


export type MutationDeleteMarkArgs = {
  markId: Scalars['String']['input'];
  meetingId: Scalars['String']['input'];
};


export type MutationDeleteMeetingNoteCommentArgs = {
  commentId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteMeetingNoteCommentV2Args = {
  commentId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteMeetingsArgs = {
  meetingIds: Array<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeletePhoneNumberArgs = {
  phoneNumberId: Scalars['String']['input'];
};


export type MutationDeletePlaylistArgs = {
  id: Scalars['ID']['input'];
  ref?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteRuleArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteRuleV2Args = {
  id: Scalars['String']['input'];
};


export type MutationDeleteSlackWorkspaceArgs = {
  slackWorkspaceId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteSoundbiteArgs = {
  id: Scalars['ID']['input'];
  ref?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteSummarySettingsArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteSummaryTemplateArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteTaskArgs = {
  source?: InputMaybe<Scalars['String']['input']>;
  taskId: Scalars['ID']['input'];
};


export type MutationDeleteTasksArgs = {
  source?: InputMaybe<Scalars['String']['input']>;
  taskIds: Array<Scalars['ID']['input']>;
};


export type MutationDeleteTeamArgs = {
  information?: InputMaybe<Scalars['String']['input']>;
  reason: Scalars['String']['input'];
  reasonSubcategory?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteTeamRuleArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteTeamRuleV2Args = {
  id: Scalars['String']['input'];
};


export type MutationDeleteUserFileArgs = {
  fileId: Scalars['String']['input'];
};


export type MutationDeleteUserGroupArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteVoiceCloneArgs = {
  input: DeleteVoiceCloneInput;
};


export type MutationDenyMeetingAccessRequestArgs = {
  inviteeId: Scalars['ID']['input'];
  meetingId: Scalars['ID']['input'];
};


export type MutationDenyTeamJoinRequestArgs = {
  requesterId: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
};


export type MutationDenyTeamRequestArgs = {
  requestId: Scalars['String']['input'];
};


export type MutationDestroyDeviceSessionArgs = {
  id: Scalars['String']['input'];
};


export type MutationDestroyDeviceSessionV2Args = {
  id: Scalars['String']['input'];
};


export type MutationDisconnectConnectorV2Args = {
  connectorId: Scalars['String']['input'];
};


export type MutationDisconnectIntegrationArgs = {
  category: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type MutationDowngradeAccountArgs = {
  reason: Scalars['String']['input'];
  reasonSubcategory?: InputMaybe<Scalars['String']['input']>;
  reasonType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDowngradeTeamMembersArgs = {
  reason: Scalars['String']['input'];
  reasonSubcategory?: InputMaybe<Scalars['String']['input']>;
  reasonType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDynamicRenderingSaveCreateFormArgs = {
  fieldName: Scalars['String']['input'];
  formValues: Scalars['JSON']['input'];
  integrationCategory: Scalars['String']['input'];
  integrationName: Scalars['String']['input'];
  isConnected: Scalars['Boolean']['input'];
};


export type MutationEndConnectorAuthorizationArgs = {
  completionToken?: InputMaybe<Scalars['String']['input']>;
  connectorId: Scalars['String']['input'];
};


export type MutationEndLiveMeetingCallArgs = {
  meetingId: Scalars['String']['input'];
};


export type MutationEndMeetingArgs = {
  meetingId: Scalars['String']['input'];
};


export type MutationEnhanceSummaryTemplateDescriptionArgs = {
  input: EnhanceSummaryTemplateDescriptionInput;
};


export type MutationEvaluateRuleArgs = {
  input: EvaluateRuleInput;
};


export type MutationEvaluateRuleV2Args = {
  input: EvaluateRuleInput;
};


export type MutationExpandAppOutputItemArgs = {
  input: ExpandAppOutputItemInput;
};


export type MutationExpandSectionArgs = {
  meetingId: Scalars['String']['input'];
  sectionStr: Scalars['String']['input'];
  sectionTitle: Scalars['String']['input'];
};


export type MutationGenerateAgentIconUploadUrlArgs = {
  input: GenerateAgentIconUploadUrlInput;
};


export type MutationGenerateAgentVoicePreviewArgs = {
  input: GenerateAgentVoicePreviewParams;
};


export type MutationGenerateAiAppArgs = {
  input: Scalars['String']['input'];
};


export type MutationGenerateAiAppV2Args = {
  input: Scalars['String']['input'];
};


export type MutationGenerateAppOutputAudioArgs = {
  eventId: Scalars['String']['input'];
};


export type MutationGenerateAppPreviewArgs = {
  input: GenerateAppPreviewInput;
};


export type MutationGenerateAppRecommendationsForMeetingArgs = {
  input: GenerateAppRecommendationsForMeetingInput;
};


export type MutationGenerateAutopilotAgentContentArgs = {
  input: GenerateAutopilotAgentContentInput;
};


export type MutationGenerateAutopilotMeetingArgs = {
  input: GenerateAutopilotMeetingParams;
};


export type MutationGenerateAutopilotOtpArgs = {
  email: Scalars['String']['input'];
};


export type MutationGenerateContactBioArgs = {
  id: Scalars['ID']['input'];
};


export type MutationGenerateDealContactBioArgs = {
  id: Scalars['ID']['input'];
};


export type MutationGenerateKnowledgeBaseUploadUrlArgs = {
  input: GenerateKnowledgeBaseUploadUrlInput;
};


export type MutationGenerateScenarioUploadUrlArgs = {
  input: GenerateScenarioUploadUrlInput;
};


export type MutationGenerateSummaryTemplateStyleFromSampleArgs = {
  input: GenerateSummaryTemplateStyleFromSampleInput;
};


export type MutationGenerateSummaryTemplateUploadUrlArgs = {
  input: GenerateSummaryTemplateUploadUrlInput;
};


export type MutationGenerateSummaryTemplateUploadUrlV2Args = {
  input: GenerateSummaryTemplateUploadUrlInput;
};


export type MutationGenerateVoiceAgentQuestionsArgs = {
  input: GenerateVoiceAgentQuestionsInput;
};


export type MutationGetClonedVoiceSignedUrlArgs = {
  input: GetClonedVoiceSignedUrlInput;
};


export type MutationGetLiveMeetingRecommendationsArgs = {
  input: GetLiveMeetingRecommendationsInput;
};


export type MutationGiveFeedbackArgs = {
  input: GiveFeedbackInput;
};


export type MutationHideAppEventsForSkillArgs = {
  appId: Scalars['String']['input'];
};


export type MutationIngestKnowledgeBaseDocumentArgs = {
  input: IngestKnowledgeBaseDocumentInput;
};


export type MutationIngestKnowledgeBaseDocumentAsyncArgs = {
  input: IngestKnowledgeBaseDocumentInput;
};


export type MutationIngestKnowledgeBaseUrlArgs = {
  input: IngestKnowledgeBaseUrlInput;
};


export type MutationIngestKnowledgeBaseUrlAsyncArgs = {
  input: IngestKnowledgeBaseUrlInput;
};


export type MutationInitMailAboutSettingsArgs = {
  toggledUnlimitedSummary?: InputMaybe<Scalars['Boolean']['input']>;
  toggledUnlimitedTranscriptions?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationInitiateVideoTranscriptionArgs = {
  input: InitiateVideoTranscriptionInput;
};


export type MutationInsertCategoriesArgs = {
  name: Scalars['String']['input'];
  subProperties: Array<InputMaybe<Scalars['String']['input']>>;
  teamAccess?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationInviteFredToSlackHuddleArgs = {
  huddleLink?: InputMaybe<Scalars['String']['input']>;
  huddleTitle?: InputMaybe<Scalars['String']['input']>;
};


export type MutationInviteTeammatesArgs = {
  campaign?: InputMaybe<Scalars['String']['input']>;
  inviteMetadata?: InputMaybe<InviteMetadataInput>;
  source?: InputMaybe<Scalars['String']['input']>;
  teamEmails: Array<Scalars['String']['input']>;
  teamId: Scalars['String']['input'];
};


export type MutationJoinAllUpcomingMeetingsArgs = {
  addedBy?: InputMaybe<Scalars['String']['input']>;
};


export type MutationJoinAutoAddTeamArgs = {
  teamId: Scalars['ID']['input'];
};


export type MutationLeaveTeamArgs = {
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationMakePhoneCallArgs = {
  phoneNumberId: Scalars['String']['input'];
  toNumber: Scalars['String']['input'];
};


export type MutationMarkAppEventSeenArgs = {
  eventId: Scalars['String']['input'];
};


export type MutationMarkMeetingSharePopoverAsSeenArgs = {
  meetingId: Scalars['String']['input'];
};


export type MutationMarkMessagesAsReadArgs = {
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationMarkSeenPaywallArgs = {
  extra?: InputMaybe<Scalars['JSON']['input']>;
  paywall: Scalars['String']['input'];
};


export type MutationMarkTeamRequestAsSeenArgs = {
  requestId: Scalars['ID']['input'];
};


export type MutationMoveChannelMeetingsArgs = {
  fromChannelId: Scalars['String']['input'];
  meetingIds: Array<Scalars['String']['input']>;
  toChannelId: Scalars['String']['input'];
};


export type MutationNewMeetingNoteCommentArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  isBookmarked?: InputMaybe<Scalars['Boolean']['input']>;
  meetingId: Scalars['String']['input'];
  privacy: Scalars['String']['input'];
  replyToCommentId?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationNewMeetingNoteCommentV2Args = {
  comment?: InputMaybe<Scalars['String']['input']>;
  isBookmarked?: InputMaybe<Scalars['Boolean']['input']>;
  meetingId: Scalars['String']['input'];
  privacy: Scalars['String']['input'];
  replyToCommentId?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationNotifyStealthRecordingStartedArgs = {
  input: NotifyStealthRecordingStartedInput;
};


export type MutationPauseRealtimeMeetingArgs = {
  meetingId: Scalars['ID']['input'];
};


export type MutationPaywallClickArgs = {
  event?: InputMaybe<Scalars['String']['input']>;
  others?: InputMaybe<Scalars['String']['input']>;
  timeSpentSoFarByCurrentUser?: InputMaybe<Scalars['String']['input']>;
};


export type MutationPaywallClickV2Args = {
  event?: InputMaybe<Scalars['String']['input']>;
  others?: InputMaybe<Scalars['String']['input']>;
  timeSpentSoFarByCurrentUser?: InputMaybe<Scalars['String']['input']>;
};


export type MutationPinAppSettingsArgs = {
  id: Scalars['String']['input'];
};


export type MutationPrepareChurnDefenderSessionArgs = {
  input: PrepareChurnDefenderInput;
};


export type MutationPreviewDraftArgs = {
  input?: InputMaybe<PreviewDraftInput>;
};


export type MutationPreviewSummaryTemplateArgs = {
  input: PreviewSummaryTemplateInput;
};


export type MutationPublishMeetingEditArgs = {
  mediaType?: InputMaybe<Scalars['String']['input']>;
  meetingId: Scalars['String']['input'];
  ref?: InputMaybe<Scalars['String']['input']>;
  segments: Array<ClipSegmentInput>;
};


export type MutationPushAutofillToCrmArgs = {
  connectorId: Scalars['String']['input'];
  extractions: AutofillPushExtractionsInput;
  participants: Array<InputMaybe<Scalars['String']['input']>>;
  targetRecords?: InputMaybe<Array<AutofillTargetRecordInput>>;
};


export type MutationPushAutofillToCrmv2Args = {
  connectorId: Scalars['String']['input'];
  extractions: AutofillPushExtractionsInput;
  participants: Array<InputMaybe<Scalars['String']['input']>>;
  targetRecords?: InputMaybe<Array<AutofillTargetRecordInput>>;
};


export type MutationPushPastMeetingsArgs = {
  connectorId: Scalars['String']['input'];
  endDate: Scalars['String']['input'];
  meetingFilter: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};


export type MutationPushSampleDataArgs = {
  category: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type MutationRateAskFredArgs = {
  qaId: Scalars['ID']['input'];
  rating: Scalars['String']['input'];
  urlRef?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRateGlobalAskFredResponseArgs = {
  abTestMeta?: InputMaybe<AbTestMetaInput>;
  answer: Scalars['String']['input'];
  meta?: InputMaybe<Scalars['JSON']['input']>;
  model: Scalars['String']['input'];
  negativeDetailedFeedback?: InputMaybe<Scalars['String']['input']>;
  negativeFeedbackReasons?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  question: Scalars['String']['input'];
  rating: GlobalFredResponseRating;
  timePassed?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationRateNotepadArgs = {
  feedback?: InputMaybe<Scalars['String']['input']>;
  rating: Scalars['Int']['input'];
  suggestions?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MutationRateNotepadV2Args = {
  feedback?: InputMaybe<Scalars['String']['input']>;
  rating: Scalars['Int']['input'];
  suggestions?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MutationRateSummaryArgs = {
  appEngine?: InputMaybe<Scalars['String']['input']>;
  commentId?: InputMaybe<Scalars['String']['input']>;
  feedback?: InputMaybe<Scalars['String']['input']>;
  isRefinedSummary?: InputMaybe<Scalars['Boolean']['input']>;
  keyTakeawaysRemoved?: InputMaybe<Scalars['Boolean']['input']>;
  meetingId: Scalars['String']['input'];
  platform?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  score: Scalars['Int']['input'];
  source?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRateSummaryV2Args = {
  appEngine?: InputMaybe<Scalars['String']['input']>;
  commentId?: InputMaybe<Scalars['String']['input']>;
  feedback?: InputMaybe<Scalars['String']['input']>;
  isRefinedSummary?: InputMaybe<Scalars['Boolean']['input']>;
  keyTakeawaysRemoved?: InputMaybe<Scalars['Boolean']['input']>;
  meetingId: Scalars['String']['input'];
  platform?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  score: Scalars['Int']['input'];
  source?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRealtimePanelFeedbackArgs = {
  feedback?: InputMaybe<Scalars['String']['input']>;
  rating: Scalars['Int']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRealtimePanelFeedbackV2Args = {
  feedback?: InputMaybe<Scalars['String']['input']>;
  rating: Scalars['Int']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRecordConsentNoticeArgs = {
  input: RecordConsentNoticeInput;
};


export type MutationRecoverIntegrationsArgs = {
  numToGoBack?: InputMaybe<Scalars['Int']['input']>;
  sendAll?: InputMaybe<Scalars['Boolean']['input']>;
  specificMeeting?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
};


export type MutationRecrawlKnowledgeBaseUrlArgs = {
  input: RecrawlKnowledgeBaseUrlInput;
};


export type MutationRefineSummaryArgs = {
  input: RefineSummaryInput;
};


export type MutationRefineSummaryPreviewArgs = {
  input: RefineSummaryInput;
};


export type MutationRegenerateAppOutputArgs = {
  input: RegenerateAppOutputInput;
};


export type MutationRegenerateSoundbiteTitleAndSummaryArgs = {
  soundbiteId: Scalars['String']['input'];
};


export type MutationRegisterDeviceTokenArgs = {
  buildNumber?: InputMaybe<Scalars['Int']['input']>;
  deviceToken: Scalars['String']['input'];
  expoToken?: InputMaybe<Scalars['String']['input']>;
  osVersion?: InputMaybe<Scalars['String']['input']>;
  platform: DevicePlatform;
};


export type MutationRegisterSlackWorkspaceArgs = {
  slackWorkspaceUrl: Scalars['String']['input'];
};


export type MutationRegisterSsoArgs = {
  input?: InputMaybe<RegisterInput>;
};


export type MutationRegisterSsoV2Args = {
  input?: InputMaybe<RegisterInput>;
};


export type MutationRemoteDisconnectUserArgs = {
  connectorId: Scalars['String']['input'];
  userConnectorId: Scalars['String']['input'];
};


export type MutationRemoveCardArgs = {
  cardId: Scalars['String']['input'];
};


export type MutationRemoveChannelMeetingsArgs = {
  channelId: Scalars['String']['input'];
  meetingIds: Array<Scalars['String']['input']>;
};


export type MutationRemoveMemberArgs = {
  channelId: Scalars['String']['input'];
  memberId: Scalars['String']['input'];
};


export type MutationRemoveTeammateFromUserGroupArgs = {
  id: Scalars['ID']['input'];
  teammateId: Scalars['ID']['input'];
};


export type MutationRemoveUserFromTeamArgs = {
  teamId?: InputMaybe<Scalars['String']['input']>;
  teammateId: Scalars['String']['input'];
};


export type MutationRenameChannelArgs = {
  channelId: Scalars['String']['input'];
  title: Scalars['String']['input'];
};


export type MutationReorderTeamRulesArgs = {
  ruleIds: Array<Scalars['String']['input']>;
};


export type MutationReorderTeamRulesV2Args = {
  ruleIds: Array<Scalars['String']['input']>;
};


export type MutationRequestMeetingAccessArgs = {
  meetingId: Scalars['String']['input'];
};


export type MutationRequestPhoneNumberVerificationArgs = {
  phoneNumberId: Scalars['String']['input'];
};


export type MutationRequestToJoinTeamArgs = {
  source?: InputMaybe<Scalars['String']['input']>;
  teamId: Scalars['ID']['input'];
};


export type MutationResendInviteToTeamArgs = {
  inviteId: Scalars['String']['input'];
};


export type MutationResendReferralArgs = {
  id: Scalars['String']['input'];
};


export type MutationResetScimApiKeyArgs = {
  domain: Scalars['String']['input'];
  guid: Scalars['String']['input'];
  platformName: Scalars['String']['input'];
};


export type MutationResetScimApiKeyV2Args = {
  domain: Scalars['String']['input'];
  guid: Scalars['String']['input'];
  platformName: Scalars['String']['input'];
};


export type MutationResetTeamPermissionPolicyArgs = {
  input: ResetTeamPermissionPolicyInput;
};


export type MutationResumeRealtimeMeetingArgs = {
  meetingId: Scalars['ID']['input'];
};


export type MutationResyncSingleIntegrationArgs = {
  integrationName?: InputMaybe<Scalars['String']['input']>;
  numToGoBack: Scalars['Int']['input'];
  sendAll: Scalars['Boolean']['input'];
};


export type MutationRetryAskFredArgs = {
  model?: InputMaybe<Scalars['String']['input']>;
  qaId: Scalars['ID']['input'];
  urlRef?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRetryConnectorJobArgs = {
  jobId: Scalars['String']['input'];
};


export type MutationRetryFailedAppEventArgs = {
  input: RetryFailedAppEventInput;
};


export type MutationRetryManualUploadItemArgs = {
  batchId: Scalars['ID']['input'];
  itemId: Scalars['ID']['input'];
};


export type MutationRunAppManuallyArgs = {
  input: RunAppManuallyInput;
};


export type MutationRunSummaryManuallyArgs = {
  input: RunSummaryManuallyInput;
};


export type MutationSaveAutofillConfigArgs = {
  autofillConfig: AutofillConfigInput;
  connectorId: Scalars['String']['input'];
  rule?: InputMaybe<RuleInput>;
};


export type MutationSaveAutofillConfigV2Args = {
  autofillConfig: AutofillConfigInput;
  connectorId: Scalars['String']['input'];
  rule?: InputMaybe<RuleInput>;
};


export type MutationSaveNotesArgs = {
  labelMeta?: InputMaybe<Scalars['JSON']['input']>;
  meetingId: Scalars['String']['input'];
  paragraphMeta?: InputMaybe<Scalars['JSON']['input']>;
  sentenceMeta?: InputMaybe<Scalars['JSON']['input']>;
  speakerMeta?: InputMaybe<Scalars['JSON']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSaveOptionsArgs = {
  afterCommands?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  aiAppsPreferences?: InputMaybe<Array<InputMaybe<AiAppsPreferenceInput>>>;
  aiAppsPrivacy?: InputMaybe<Scalars['String']['input']>;
  alias?: InputMaybe<Scalars['String']['input']>;
  announceFred?: InputMaybe<Scalars['Boolean']['input']>;
  askFredModel?: InputMaybe<Scalars['String']['input']>;
  askFredTooltipViewed?: InputMaybe<Scalars['Boolean']['input']>;
  autoJoin?: InputMaybe<Scalars['String']['input']>;
  barRules?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  beforeCommands?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  changedSettingsFrom?: InputMaybe<Scalars['String']['input']>;
  customAlerts?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  customBotName?: InputMaybe<Scalars['String']['input']>;
  dispatch?: InputMaybe<Scalars['String']['input']>;
  focusSettings?: InputMaybe<FocusSettingsInput>;
  freeMeetingsLeft?: InputMaybe<Scalars['Int']['input']>;
  fullName?: InputMaybe<Scalars['String']['input']>;
  givenRealtimeFeedback?: InputMaybe<Scalars['Boolean']['input']>;
  hasDismissedVideoPaywallBanner?: InputMaybe<Scalars['Boolean']['input']>;
  hasSeenAskFredOnboarding?: InputMaybe<Scalars['Boolean']['input']>;
  ignoreMeetings?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  industry?: InputMaybe<Scalars['String']['input']>;
  invitesFrom?: InputMaybe<Scalars['String']['input']>;
  isVoiceAgentEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  joinRules?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  linkRef?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  meetingChatMessage?: InputMaybe<Scalars['String']['input']>;
  meetingExpirySettings?: InputMaybe<MeetingExpirySettingsInput>;
  meetingPrepEmailNotificationPreference?: InputMaybe<Scalars['String']['input']>;
  notesInjected?: InputMaybe<Scalars['Int']['input']>;
  numMeetingsWithNotes?: InputMaybe<Scalars['Int']['input']>;
  numberNotes?: InputMaybe<Scalars['Int']['input']>;
  onlyMeetings?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  paidUser?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  preferredLanguage?: InputMaybe<Scalars['String']['input']>;
  privacy?: InputMaybe<Scalars['String']['input']>;
  puppetRecordingMessageEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  realtimeEmailNotificationPreference?: InputMaybe<Scalars['String']['input']>;
  realtimeSettings?: InputMaybe<RealtimeSettingsInput>;
  recordingNoti?: InputMaybe<Scalars['String']['input']>;
  screenSharingEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  seenAIExtensionsModal?: InputMaybe<Scalars['Boolean']['input']>;
  seenAskFredAnnouncement?: InputMaybe<Scalars['Boolean']['input']>;
  seenAskFredTooltip?: InputMaybe<Scalars['Boolean']['input']>;
  seenFeedAnnouncement?: InputMaybe<Scalars['Boolean']['input']>;
  seenFreeTrialModal?: InputMaybe<Scalars['Boolean']['input']>;
  seenHuddlesAnnouncement?: InputMaybe<Scalars['Boolean']['input']>;
  seenLanguageAnnouncement?: InputMaybe<Scalars['Boolean']['input']>;
  seenNotepadTour?: InputMaybe<Scalars['Boolean']['input']>;
  seenPrivacyModal?: InputMaybe<Scalars['Boolean']['input']>;
  seenReferralCashBalanceModal?: InputMaybe<Scalars['Boolean']['input']>;
  seenZoomConnectModal?: InputMaybe<Scalars['Boolean']['input']>;
  sendNotesTo?: InputMaybe<Scalars['String']['input']>;
  sendRealtimeChatNotification?: InputMaybe<Scalars['Boolean']['input']>;
  service?: InputMaybe<Scalars['String']['input']>;
  shouldRequestMeetingAccessImParticipantOf?: InputMaybe<Scalars['Boolean']['input']>;
  shouldVideoRecordMeeting?: InputMaybe<Scalars['Boolean']['input']>;
  siteReferral?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  tier?: InputMaybe<Scalars['String']['input']>;
  timesSeenCreditExhuast?: InputMaybe<Scalars['Int']['input']>;
  timesSeenNotepadTour?: InputMaybe<Scalars['Int']['input']>;
  timesSeenPromptsExhaust?: InputMaybe<Scalars['Int']['input']>;
  transcriptionService?: InputMaybe<Scalars['String']['input']>;
  txReferral?: InputMaybe<Scalars['String']['input']>;
  updatePrevPrivacy?: InputMaybe<Scalars['Boolean']['input']>;
  userReferral?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSaveRefinedSummaryArgs = {
  input: SaveRefinedSummaryInput;
};


export type MutationSaveTeamSettingsArgs = {
  connectorId: Scalars['String']['input'];
  entireWorkspace: Scalars['Boolean']['input'];
  restricted: Scalars['Boolean']['input'];
};


export type MutationSegmentLogArgs = {
  linkref?: InputMaybe<Scalars['String']['input']>;
  paperformReferral?: InputMaybe<Scalars['String']['input']>;
  segmentTracker?: InputMaybe<Scalars['String']['input']>;
  siteReferral?: InputMaybe<Scalars['String']['input']>;
  trackTxReferral?: InputMaybe<Scalars['String']['input']>;
  userReferral?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSegmentLogV2Args = {
  linkref?: InputMaybe<Scalars['String']['input']>;
  paperformReferral?: InputMaybe<Scalars['String']['input']>;
  segmentTracker?: InputMaybe<Scalars['String']['input']>;
  siteReferral?: InputMaybe<Scalars['String']['input']>;
  trackTxReferral?: InputMaybe<Scalars['String']['input']>;
  userReferral?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSendChurnChatArgs = {
  input: SendChurnChatInput;
};


export type MutationSendMessageToSlackArgs = {
  channelId?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  meetingId?: InputMaybe<Scalars['String']['input']>;
  slackUserId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSendSummaryToIntegrationArgs = {
  category: Scalars['String']['input'];
  emails?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  integrationId: Scalars['String']['input'];
  meetingId: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type MutationSendTasksToIntegrationArgs = {
  connectorId: Scalars['String']['input'];
  meetingId: Scalars['String']['input'];
  taskIds: Array<Scalars['String']['input']>;
};


export type MutationSetAppEventFollowUpThreadArgs = {
  appEventId: Scalars['String']['input'];
  replaceStale?: InputMaybe<Scalars['Boolean']['input']>;
  threadId: Scalars['String']['input'];
};


export type MutationSetDefaultCardArgs = {
  cardId: Scalars['String']['input'];
};


export type MutationSetDefaultSummaryTemplateArgs = {
  input: SetDefaultSummaryTemplateInput;
};


export type MutationSetEmailSettingsArgs = {
  input: SetEmailSettingsInput;
};


export type MutationSetMeetingLanguageArgs = {
  customLanguage: Scalars['String']['input'];
  meetingId: Scalars['String']['input'];
};


export type MutationSetMeetingPrivacyArgs = {
  meetingId: Scalars['String']['input'];
  privacy: Scalars['String']['input'];
};


export type MutationSetTeamPermissionPolicyArgs = {
  input: SetTeamPermissionPolicyInput;
};


export type MutationSetTeamSummaryTemplateArgs = {
  input: SetTeamSummaryTemplateInput;
};


export type MutationSetTeamsConsentEnabledArgs = {
  enabled: Scalars['Boolean']['input'];
};


export type MutationSetupPrivateStorageArgs = {
  input: SetupPrivateStorageInput;
};


export type MutationShareDealWithUsersArgs = {
  dealId: Scalars['ID']['input'];
  input: ShareDealWithUsersInput;
};


export type MutationShareMeetingViaEmailArgs = {
  emails: Array<Scalars['String']['input']>;
  meetingId: Scalars['ID']['input'];
  ref?: InputMaybe<Scalars['String']['input']>;
};


export type MutationShareMeetingsArgs = {
  inviteeList?: InputMaybe<Array<Scalars['String']['input']>>;
  isAutoGenerated?: InputMaybe<Scalars['Boolean']['input']>;
  meetingId: Scalars['ID']['input'];
  password?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  shareType?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  ttl?: InputMaybe<SharedMeetingTtlInput>;
};


export type MutationSharePlaylistViaEmailArgs = {
  emails: Array<Scalars['String']['input']>;
  playlistId: Scalars['ID']['input'];
  ref?: InputMaybe<Scalars['String']['input']>;
};


export type MutationShareSoundbiteViaEmailArgs = {
  emails: Array<Scalars['String']['input']>;
  ref?: InputMaybe<Scalars['String']['input']>;
  soundbiteId: Scalars['ID']['input'];
};


export type MutationShareWeeklyUsageViaEmailArgs = {
  emails: Array<Scalars['String']['input']>;
};


export type MutationStartAuthorizationArgs = {
  connectorId: Scalars['String']['input'];
  formData: Scalars['JSON']['input'];
};


export type MutationStartConnectorAuthorizationArgs = {
  authSetup?: InputMaybe<Scalars['JSON']['input']>;
  connectorId: Scalars['String']['input'];
  returnUrl?: InputMaybe<Scalars['String']['input']>;
};


export type MutationStartFileUploadsArgs = {
  client: Scalars['String']['input'];
  filenames: Array<Scalars['String']['input']>;
  meetingId: Scalars['String']['input'];
};


export type MutationStartMigrationArgs = {
  input: StartMigrationInput;
};


export type MutationStartPlatformOAuthArgs = {
  platform: Scalars['String']['input'];
};


export type MutationStartUploadArgs = {
  client: Scalars['String']['input'];
  meetingId: Scalars['String']['input'];
  mimeType: Scalars['String']['input'];
  size: Scalars['Float']['input'];
};


export type MutationStopRealtimeMeetingArgs = {
  completed?: InputMaybe<Scalars['Boolean']['input']>;
  duration?: InputMaybe<Scalars['Float']['input']>;
  meetingId: Scalars['ID']['input'];
};


export type MutationSubmitAccountMigrationArgs = {
  input: AccountMigrationInput;
};


export type MutationSubmitDataExportRequestArgs = {
  input: DataExportRequestInput;
};


export type MutationSubscribeAiExtensionsArgs = {
  input: SubscribeAiExtensionsInput;
};


export type MutationSyncPastDealsArgs = {
  input: SyncPastDealsInput;
};


export type MutationTestPullFlowArgs = {
  integrationCategory: Scalars['String']['input'];
  integrationName: Scalars['String']['input'];
};


export type MutationTestPushFlowArgs = {
  integrationCategory: Scalars['String']['input'];
  integrationName: Scalars['String']['input'];
};


export type MutationToggleAppSettingsArgs = {
  active: Scalars['Boolean']['input'];
  id: Scalars['ID']['input'];
};


export type MutationToggleConnectorSetupEnabledStatusArgs = {
  connectorId: Scalars['String']['input'];
  setupId: Scalars['String']['input'];
};


export type MutationToggleEmailAssistantArgs = {
  source?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationTogglePersonalAssistantArgs = {
  input: TogglePersonalAssistantInput;
};


export type MutationTogglePrivateStorageArgs = {
  enabled: Scalars['Boolean']['input'];
};


export type MutationToggleSlackAutoJoinArgs = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  slackWorkspaceId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationToggleTeammateInviteArgs = {
  teamInviteDisabled: Scalars['Boolean']['input'];
};


export type MutationToggleTeammateRoleArgs = {
  isAdmin: Scalars['Boolean']['input'];
  teammateId: Scalars['String']['input'];
};


export type MutationToggleUpcomingEventArgs = {
  calendarType?: InputMaybe<Scalars['String']['input']>;
  fredAdded: Scalars['Boolean']['input'];
  iCalUID?: InputMaybe<Scalars['String']['input']>;
  meetingId: Scalars['String']['input'];
  scheduleType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationTrackAnonymousEventArgs = {
  event: Scalars['String']['input'];
  properties?: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationTrackAnonymousEventV2Args = {
  event: Scalars['String']['input'];
  properties?: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationTrackAppOutputViewArgs = {
  appEngine?: InputMaybe<Scalars['String']['input']>;
  appId?: InputMaybe<Scalars['String']['input']>;
  appTitle?: InputMaybe<Scalars['String']['input']>;
  outputId: Scalars['String']['input'];
  source?: InputMaybe<AppOutputViewSource>;
};


export type MutationTrackAppOutputViewV2Args = {
  appEngine?: InputMaybe<Scalars['String']['input']>;
  appId?: InputMaybe<Scalars['String']['input']>;
  appTitle?: InputMaybe<Scalars['String']['input']>;
  outputId: Scalars['String']['input'];
  source?: InputMaybe<AppOutputViewSource>;
};


export type MutationTrackDownloadsArgs = {
  properties?: InputMaybe<DownloadsInput>;
};


export type MutationTrackDownloadsV2Args = {
  properties?: InputMaybe<DownloadsPropertiesInputV2>;
};


export type MutationTrackEventArgs = {
  event: Scalars['String']['input'];
  properties?: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationTrackEventV2Args = {
  event: Scalars['String']['input'];
  properties?: InputMaybe<Scalars['JSON']['input']>;
};


export type MutationTrackExperimentsArgs = {
  experiment?: InputMaybe<ExperimentInput>;
  feature?: InputMaybe<FeatureInput>;
};


export type MutationTrackExperimentsV2Args = {
  experiment?: InputMaybe<ExperimentInputV2>;
  feature?: InputMaybe<FeatureInputV2>;
};


export type MutationTrackLoginPopupArgs = {
  isNewUser?: InputMaybe<Scalars['Boolean']['input']>;
  meetingId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationTrackLoginPopupV2Args = {
  isNewUser?: InputMaybe<Scalars['Boolean']['input']>;
  meetingId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationTrackPaywallShownArgs = {
  from: Scalars['String']['input'];
  paywall: Scalars['String']['input'];
  source: Scalars['String']['input'];
};


export type MutationTrackSeenStorageArgs = {
  properties: SeenStorageProperites;
};


export type MutationTrackSeenStorageV2Args = {
  properties: SeenStoragePropertiesInputV2;
};


export type MutationTrackTourArgs = {
  index: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
};


export type MutationTrackTourV2Args = {
  index: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
};


export type MutationTrackTranscriptViewArgs = {
  globalSearchSource?: InputMaybe<Scalars['String']['input']>;
  guestId?: InputMaybe<Scalars['String']['input']>;
  meetingId: Scalars['String']['input'];
  showSummaryToGuest?: InputMaybe<Scalars['String']['input']>;
};


export type MutationTrackTranscriptViewV2Args = {
  globalSearchSource?: InputMaybe<Scalars['String']['input']>;
  guestId?: InputMaybe<Scalars['String']['input']>;
  meetingId: Scalars['String']['input'];
  showSummaryToGuest?: InputMaybe<Scalars['String']['input']>;
};


export type MutationTrackVideoRecordingArgs = {
  event: VideoRecordingEventInput;
  value?: InputMaybe<Scalars['String']['input']>;
};


export type MutationTrackVideoRecordingV2Args = {
  event: VideoRecordingEventInput;
  value?: InputMaybe<Scalars['String']['input']>;
};


export type MutationTranscribeCustomLangArgs = {
  customLanguage: Scalars['String']['input'];
  meetingId: Scalars['ID']['input'];
};


export type MutationTranscribeMeetingArgs = {
  meetingId: Scalars['ID']['input'];
  type: TranscribeType;
};


export type MutationTriggerOnDemandExtractionArgs = {
  connectorId: Scalars['String']['input'];
  force?: InputMaybe<Scalars['Boolean']['input']>;
  meetingId: Scalars['String']['input'];
};


export type MutationTriggerOnDemandExtractionV2Args = {
  connectorId: Scalars['String']['input'];
  force?: InputMaybe<Scalars['Boolean']['input']>;
  meetingId: Scalars['String']['input'];
};


export type MutationUnblockUserArgs = {
  isUserReActivatingAccount?: InputMaybe<Scalars['Boolean']['input']>;
  teamId: Scalars['String']['input'];
  teammateId: Scalars['String']['input'];
};


export type MutationUnpinAppSettingsArgs = {
  id: Scalars['String']['input'];
};


export type MutationUnshareDealFromUsersArgs = {
  dealId: Scalars['ID']['input'];
  input: UnshareDealFromUsersInput;
};


export type MutationUpdateAiCreditSettingsArgs = {
  input: UpdateAiCreditSettingsInput;
};


export type MutationUpdateAiExtensionsPlanArgs = {
  input: UpdateAiExtensionsPlanInput;
};


export type MutationUpdateAmazonQBusinessSettingsArgs = {
  input?: InputMaybe<UpdateAmazonQBusinessSettingsInput>;
};


export type MutationUpdateAnalyticsViewArgs = {
  conditions?: InputMaybe<Array<AnalyticsViewConditionInput>>;
  id: Scalars['ID']['input'];
  logicalOperator?: InputMaybe<AnalyticsViewLogicalOperator>;
  name?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateAnnouncementStateArgs = {
  input: UpdateAnnouncementStateInput;
};


export type MutationUpdateAppOutputArgs = {
  input: UpdateAppOutputInput;
};


export type MutationUpdateAppSettingsArgs = {
  id: Scalars['String']['input'];
  input: UpdateAppSettingsInput;
};


export type MutationUpdateAutoAddSettingsArgs = {
  autoAddDomains: Array<Scalars['String']['input']>;
  autoAddEnabled: Scalars['Boolean']['input'];
  source?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateAutofillExtractionsArgs = {
  connectorId: Scalars['String']['input'];
  extractions: AutofillUpdateExtractionsInput;
  meetingId: Scalars['String']['input'];
};


export type MutationUpdateAutofillExtractionsV2Args = {
  connectorId: Scalars['String']['input'];
  extractions: AutofillUpdateExtractionsInput;
  meetingId: Scalars['String']['input'];
};


export type MutationUpdateAutopilotAgentArgs = {
  id: Scalars['ID']['input'];
  input: UpdateAutopilotAgentInput;
};


export type MutationUpdateAutopilotAgentScenarioArgs = {
  id: Scalars['ID']['input'];
  input: UpdateScenarioInput;
};


export type MutationUpdateBillingAdminArgs = {
  newBillingAdminId: Scalars['String']['input'];
};


export type MutationUpdateBillingInfoArgs = {
  input: UpdateBillingInfoInput;
};


export type MutationUpdateBillingSettingsArgs = {
  billingSettings: UpdateBillingSettingsInput;
};


export type MutationUpdateBitePlaylistsArgs = {
  adding?: InputMaybe<Array<Scalars['ID']['input']>>;
  id: Scalars['ID']['input'];
  ref?: InputMaybe<Scalars['String']['input']>;
  removing?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationUpdateCategoriesArgs = {
  _id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  subProperties: Array<InputMaybe<Scalars['String']['input']>>;
  teamAccess?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationUpdateCommentReactionArgs = {
  commentId: Scalars['String']['input'];
  reaction: ReactionInput;
};


export type MutationUpdateCommentReactionV2Args = {
  commentId: Scalars['String']['input'];
  reaction: ReactionInput;
};


export type MutationUpdateConnectorSetupArgs = {
  connectorId: Scalars['String']['input'];
  setup: ConnectorSetupInput;
  setupId: Scalars['String']['input'];
};


export type MutationUpdateContactArgs = {
  contactId: Scalars['ID']['input'];
  input: UpdateContactInput;
};


export type MutationUpdateCustomBotNameArgs = {
  input: UpdateCustomBotNameInput;
};


export type MutationUpdateDealActionItemStatusArgs = {
  dealId: Scalars['ID']['input'];
  input: UpdateDealActionItemStatusInput;
};


export type MutationUpdateDealAiStateArgs = {
  dealId: Scalars['ID']['input'];
  input: UpdateDealAiStateInput;
};


export type MutationUpdateDealIntelligenceSettingsArgs = {
  input: UpdateDealIntelligenceSettingsInput;
};


export type MutationUpdateDealPrivacyArgs = {
  dealId: Scalars['ID']['input'];
  input: UpdateDealPrivacyInput;
};


export type MutationUpdateEmailRuleArgs = {
  input: UpdateEmailRuleInput;
};


export type MutationUpdateFree1kAiCreditsCampaignStatusArgs = {
  input: UpdateFree1kAiCreditsCampaignStatusInput;
};


export type MutationUpdateIntegrationPermissionArgs = {
  input: UpdatePermissionInput;
};


export type MutationUpdateMeetingArgs = {
  attendees?: InputMaybe<Array<MeetingAttendeeInput>>;
  customLanguage?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  notesPrivacy?: InputMaybe<MeetingNotesPrivacy>;
  title?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateMeetingNoteCommentArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  commentId?: InputMaybe<Scalars['String']['input']>;
  isPrivate?: InputMaybe<Scalars['Boolean']['input']>;
  privacy: Scalars['String']['input'];
};


export type MutationUpdateMeetingNoteCommentV2Args = {
  comment?: InputMaybe<Scalars['String']['input']>;
  commentId?: InputMaybe<Scalars['String']['input']>;
  isPrivate?: InputMaybe<Scalars['Boolean']['input']>;
  privacy: Scalars['String']['input'];
};


export type MutationUpdateMeetingNoteSummaryArgs = {
  jsonComment?: InputMaybe<Array<InputMaybe<SummarySectionsInput>>>;
  meetingId: Scalars['String']['input'];
};


export type MutationUpdateMeetingStateArgs = {
  action: Scalars['String']['input'];
  meetingId: Scalars['String']['input'];
};


export type MutationUpdateMeetingTitleArgs = {
  meetingId: Scalars['String']['input'];
  title: Scalars['String']['input'];
};


export type MutationUpdateNotificationSettingArgs = {
  notificationSetting?: InputMaybe<Scalars['String']['input']>;
  teamDispatch?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdatePersonalAssistantSettingsArgs = {
  input: UpdatePersonalAssistantSettingsInput;
};


export type MutationUpdatePlanWith3dsArgs = {
  input: UpdatePlanInput;
};


export type MutationUpdatePlaylistArgs = {
  biteIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  privacy?: InputMaybe<PlaylistPrivacy>;
  ref?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdatePlaylistBitesArgs = {
  adding?: InputMaybe<Array<Scalars['ID']['input']>>;
  id: Scalars['ID']['input'];
  ref?: InputMaybe<Scalars['String']['input']>;
  removing?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationUpdateRecapConfigArgs = {
  sections: Array<RecapConfigSectionInput>;
};


export type MutationUpdateRuleArgs = {
  extension: UpdateRuleInput;
};


export type MutationUpdateRuleV2Args = {
  extension: UpdateRuleInput;
};


export type MutationUpdateSetupToWebHookArgs = {
  category: Scalars['String']['input'];
  name: Scalars['String']['input'];
  setup: Scalars['JSON']['input'];
  teamId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateSoundbiteArgs = {
  endTime?: InputMaybe<Scalars['Float']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  privacies?: InputMaybe<Array<SoundbitePrivacy>>;
  ref?: InputMaybe<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['Float']['input']>;
  summary?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateSsoArgs = {
  certificate: Scalars['String']['input'];
  domain: Scalars['String']['input'];
  enforceSso?: InputMaybe<Scalars['Boolean']['input']>;
  guid: Scalars['String']['input'];
  idpUrl: Scalars['String']['input'];
  type: SsoType;
};


export type MutationUpdateSsoV2Args = {
  certificate: Scalars['String']['input'];
  domain: Scalars['String']['input'];
  enforceSso?: InputMaybe<Scalars['Boolean']['input']>;
  guid: Scalars['String']['input'];
  idpUrl: Scalars['String']['input'];
  type: SsoType;
};


export type MutationUpdateSummarySettingsArgs = {
  input: UpdateSummarySettingsInput;
};


export type MutationUpdateSummaryTemplateArgs = {
  id: Scalars['String']['input'];
  input: UpdateSummaryTemplateInput;
};


export type MutationUpdateSummaryTemplateFromPromptArgs = {
  id: Scalars['String']['input'];
  input: UpdateSummaryTemplateFromPromptInput;
};


export type MutationUpdateSummaryTemplateFromSampleArgs = {
  id: Scalars['String']['input'];
  input: UpdateSummaryTemplateFromSampleInput;
};


export type MutationUpdateSyncPreferenceArgs = {
  input: UpdateSyncPreferenceInput;
};


export type MutationUpdateTaskArgs = {
  input: UpdateTaskInput;
  taskId: Scalars['ID']['input'];
};


export type MutationUpdateTaskOwnerArgs = {
  input: UpdateTaskOwnerInput;
  taskId: Scalars['ID']['input'];
};


export type MutationUpdateTaskStatusArgs = {
  source?: InputMaybe<Scalars['String']['input']>;
  status: EnumTaskStatus;
  taskId: Scalars['ID']['input'];
};


export type MutationUpdateTeamRuleArgs = {
  extension: UpdateTeamRuleInput;
};


export type MutationUpdateTeamRuleV2Args = {
  extension: UpdateTeamRuleInput;
};


export type MutationUpdateTeamSettingsArgs = {
  settings: UserTeamSettings;
};


export type MutationUpdateUserDynamicMetadataArgs = {
  input: UpdateUserDynamicMetadataInput;
};


export type MutationUpdateUserFileArgs = {
  fileId: Scalars['String']['input'];
  meetingId?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateUserGroupArgs = {
  id: Scalars['ID']['input'];
  input: UpdateUserGroupInput;
};


export type MutationUpdateUserGroupMemberRoleArgs = {
  id: Scalars['ID']['input'];
  role: EnumUserGroupMemberRole;
  teammateId: Scalars['ID']['input'];
};


export type MutationUpdateUserGroupSettingsArgs = {
  input: UpdateUserGroupSettingsInput;
};


export type MutationUpdateUserMetadataArgs = {
  metadata?: InputMaybe<UserMetaInput>;
};


export type MutationUpdateUserTrackingParamsArgs = {
  anonymousId?: InputMaybe<Scalars['String']['input']>;
  fbp?: InputMaybe<Scalars['String']['input']>;
  gaClientId?: InputMaybe<Scalars['String']['input']>;
  lastClientIP?: InputMaybe<Scalars['String']['input']>;
  userAgent?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateUserTrackingParamsV2Args = {
  anonymousId?: InputMaybe<Scalars['String']['input']>;
  fbp?: InputMaybe<Scalars['String']['input']>;
  gaClientId?: InputMaybe<Scalars['String']['input']>;
  lastClientIP?: InputMaybe<Scalars['String']['input']>;
  userAgent?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateWebhookArgs = {
  secret?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateWebhookSubscriptionsArgs = {
  subscriptions: Scalars['JSON']['input'];
};


export type MutationUploadClonedVoiceArgs = {
  input: UploadClonedVoiceParams;
};


export type MutationUploadManualNotesArgs = {
  meetingId: Scalars['String']['input'];
  notes: Scalars['String']['input'];
  shouldMerge: Scalars['Boolean']['input'];
};


export type MutationUploadTranscriptArgs = {
  allEmails?: InputMaybe<Array<Scalars['String']['input']>>;
  client: Scalars['String']['input'];
  duration: Scalars['Float']['input'];
  meetingId: Scalars['String']['input'];
  shareSettings?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  transcript: Scalars['String']['input'];
  validAttendees?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type MutationUpsertMeetingPrepAppArgs = {
  input: UpsertMeetingPrepAppInput;
};


export type MutationUserClosedBrowserArgs = {
  timeSpentByUser: Scalars['String']['input'];
};


export type MutationUserClosedBrowserV2Args = {
  timeSpentByUser: Scalars['String']['input'];
};


export type MutationUserInteractingWithHelpArgs = {
  column: Scalars['String']['input'];
  title: Scalars['String']['input'];
};


export type MutationUserInteractingWithHelpV2Args = {
  column: Scalars['String']['input'];
  title: Scalars['String']['input'];
};


export type MutationVerifyAutopilotOtpArgs = {
  code: Scalars['String']['input'];
  email: Scalars['String']['input'];
};


export type MutationVerifyConnectorSetupArgs = {
  connectorId: Scalars['String']['input'];
  connectorSetup?: InputMaybe<Scalars['JSON']['input']>;
  setupName: Scalars['String']['input'];
};


export type MutationVerifyDomainArgs = {
  initiator: Scalars['String']['input'];
};


export type MutationVerifyDomainV2Args = {
  initiator: Scalars['String']['input'];
};


export type MutationVerifyPhoneNumberArgs = {
  code?: InputMaybe<Scalars['String']['input']>;
  phoneNumberId: Scalars['String']['input'];
};

export type MutationResponse = {
  __typename?: 'MutationResponse';
  error?: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
};

export type NpsSurvey = {
  __typename?: 'NPSSurvey';
  answer?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  score?: Maybe<Scalars['Int']['output']>;
  userId: Scalars['String']['output'];
};

export enum NamespaceType {
  Agent = 'agent',
  Team = 'team'
}

export type NextInvoice = {
  __typename?: 'NextInvoice';
  amountDue: Scalars['Float']['output'];
  description?: Maybe<Scalars['String']['output']>;
  discount?: Maybe<InvoiceDiscount>;
  nextPaymentAttempt?: Maybe<Scalars['DateTime']['output']>;
  stripeSubscriptionId: Scalars['String']['output'];
};

export type NodeSettingsOutput = {
  __typename?: 'NodeSettingsOutput';
  autoDelete?: Maybe<AutoDeleteSettingsOutput>;
  channel?: Maybe<ChannelSettingsOutput>;
  passwordLink?: Maybe<PasswordLinkSettings>;
  privacy?: Maybe<PrivacyOutput>;
  updateLanguage?: Maybe<UpdateLanguageSettingsOutput>;
  userGroup?: Maybe<UserGroupSettingsOutput>;
};

export type NotebookMeeting = {
  __typename?: 'NotebookMeeting';
  creator?: Maybe<Scalars['String']['output']>;
  creator_email?: Maybe<Scalars['String']['output']>;
  date?: Maybe<Scalars['String']['output']>;
  durationMins?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  owner?: Maybe<Scalars['String']['output']>;
  parseId?: Maybe<Scalars['String']['output']>;
  privacy?: Maybe<Scalars['String']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  storageLimitHit?: Maybe<Scalars['Boolean']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  users?: Maybe<Array<Scalars['String']['output']>>;
  validAttendees?: Maybe<Array<Scalars['String']['output']>>;
};

export type NotificationAction = {
  __typename?: 'NotificationAction';
  label: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export enum NotificationDeliveryStatus {
  Opened = 'opened',
  Sent = 'sent'
}

export type NotificationIcon = {
  __typename?: 'NotificationIcon';
  backgroundColor?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
};

export type NotifyStealthRecordingStartedInput = {
  correlationId: Scalars['String']['input'];
  /** Teams meeting join URL. Optional — when omitted the server falls back to listing recent meeting chats via Microsoft Graph Chat.Read scope. */
  joinUrl?: InputMaybe<Scalars['String']['input']>;
  /** The meeting this notice belongs to. Optional only for desktop builds that predate it — without it the consent record cannot be tied to a recording. */
  meetingId?: InputMaybe<Scalars['ID']['input']>;
  source: Scalars['String']['input'];
};

export type NotifyStealthRecordingStartedPayload = {
  __typename?: 'NotifyStealthRecordingStartedPayload';
  ok: Scalars['Boolean']['output'];
  /** Human-readable reason when the message was skipped or failed. Null when the message was dispatched successfully. */
  reason?: Maybe<Scalars['String']['output']>;
};

export type OAuthFlowSchema = {
  __typename?: 'OAuthFlowSchema';
  buttonLabel: Scalars['String']['output'];
  startMutation: Scalars['String']['output'];
  statusQuery: Scalars['String']['output'];
};

export type OngoingCalendarEvent = {
  __typename?: 'OngoingCalendarEvent';
  _id?: Maybe<Scalars['String']['output']>;
  attendees?: Maybe<Array<Attendee>>;
  calendarType?: Maybe<Scalars['String']['output']>;
  callStatus?: Maybe<Scalars['String']['output']>;
  creator_email?: Maybe<Scalars['String']['output']>;
  date?: Maybe<Scalars['String']['output']>;
  endDate?: Maybe<Scalars['String']['output']>;
  fredAdded?: Maybe<Scalars['Boolean']['output']>;
  iCalUID?: Maybe<Scalars['String']['output']>;
  isOrganizer?: Maybe<Scalars['Boolean']['output']>;
  meetingId?: Maybe<Scalars['String']['output']>;
  organizerEmail?: Maybe<Scalars['String']['output']>;
  ownerProfile?: Maybe<Profile>;
  title?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type OngoingMeetings = {
  __typename?: 'OngoingMeetings';
  events: Array<OngoingCalendarEvent>;
};

export type OrganizationHeadline = {
  __typename?: 'OrganizationHeadline';
  content: Scalars['String']['output'];
  emoji: Scalars['String']['output'];
  occurredAt: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  currentPage: Scalars['Int']['output'];
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  itemCount: Scalars['Int']['output'];
  pageCount: Scalars['Int']['output'];
  perPage: Scalars['Int']['output'];
};

export type PaginatedDeals = {
  __typename?: 'PaginatedDeals';
  count: Scalars['Int']['output'];
  items: Array<Deal>;
  pageInfo: PageInfo;
};

export type PaginatedMessagesResponse = {
  __typename?: 'PaginatedMessagesResponse';
  hasMore: Scalars['Boolean']['output'];
  items: Array<InAppMessage>;
  /** Cursor to fetch the next page. Null when there are no more pages. */
  nextCursor?: Maybe<Scalars['String']['output']>;
  totalCount: Scalars['Int']['output'];
};

export type PaginationInput = {
  /** Cursor for cursor-based pagination. Pass the `nextCursor` from the previous response. When provided, `offset` is ignored. */
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type PaginationInviteSuggestions = {
  __typename?: 'PaginationInviteSuggestions';
  count: Scalars['Int']['output'];
  emails: Array<Scalars['String']['output']>;
  items: Array<SuggestionPublicProfile>;
  pageInfo: PageInfo;
};

export enum ParticipantInfoField {
  Email = 'Email',
  Name = 'Name'
}

export type ParticipantInsight = {
  __typename?: 'ParticipantInsight';
  /** @deprecated Superseded by interestingFacts */
  areasOfFocus?: Maybe<Array<Scalars['String']['output']>>;
  bio?: Maybe<Scalars['String']['output']>;
  brief: Scalars['String']['output'];
  citations?: Maybe<Array<Scalars['String']['output']>>;
  email: Scalars['String']['output'];
  interestingFacts?: Maybe<Array<Scalars['String']['output']>>;
  linkedIn?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  quickSnapshot?: Maybe<Array<Scalars['String']['output']>>;
  recentActivity?: Maybe<Array<Scalars['String']['output']>>;
  /** @deprecated Superseded by quickSnapshot */
  responsibilities?: Maybe<Array<Scalars['String']['output']>>;
  title?: Maybe<Scalars['String']['output']>;
};

export type PartnerPerk = {
  __typename?: 'PartnerPerk';
  _id: Scalars['String']['output'];
  campaign: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  partner: Scalars['String']['output'];
  status: EnumPartnerPerkStatus;
  updatedAt: Scalars['DateTime']['output'];
  value: Scalars['String']['output'];
};

export type PartnerPerkInfo = {
  __typename?: 'PartnerPerkInfo';
  couponRedemptions: Array<CouponRedemption>;
  partnerPerks: Array<PartnerPerk>;
  subscriptionStartAt: Scalars['DateTime']['output'];
};

export type PasswordLinkSettings = {
  __typename?: 'PasswordLinkSettings';
  enabled?: Maybe<Scalars['Boolean']['output']>;
};

export type PasswordLinkSettingsInput = {
  enabled: Scalars['Boolean']['input'];
};

export type PastMeetingsFilterOption = {
  __typename?: 'PastMeetingsFilterOption';
  description: Scalars['String']['output'];
  key: Scalars['String']['output'];
  label: Scalars['String']['output'];
};

export type PastMeetingsSync = {
  __typename?: 'PastMeetingsSync';
  last_date_range?: Maybe<PastMeetingsSyncDateRange>;
  last_sync_job_id?: Maybe<Scalars['String']['output']>;
  last_sync_status?: Maybe<Scalars['String']['output']>;
  last_synced_at?: Maybe<Scalars['String']['output']>;
  total_pushed?: Maybe<Scalars['Int']['output']>;
};

export type PastMeetingsSyncDateRange = {
  __typename?: 'PastMeetingsSyncDateRange';
  end?: Maybe<Scalars['String']['output']>;
  start?: Maybe<Scalars['String']['output']>;
};

export type PastNotes = {
  __typename?: 'PastNotes';
  bulletGist?: Maybe<Array<BulletGistItem>>;
  meetingId: Scalars['String']['output'];
  overview?: Maybe<Scalars['String']['output']>;
  shorthandBullet?: Maybe<Array<ShorthandBulletItem>>;
  startTime: Scalars['DateTime']['output'];
  tasks?: Maybe<Array<MeetingPrepTask>>;
  title: Scalars['String']['output'];
};

export type PastSyncMeeting = {
  __typename?: 'PastSyncMeeting';
  creator_email?: Maybe<Scalars['String']['output']>;
  date: Scalars['String']['output'];
  id: Scalars['String']['output'];
  organizerName: Scalars['String']['output'];
  organizerPicture?: Maybe<Scalars['String']['output']>;
  owner?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type PastSyncsSummary = {
  __typename?: 'PastSyncsSummary';
  meetings: Array<PastSyncMeeting>;
  summary?: Maybe<Scalars['String']['output']>;
};

export enum PaywallVisibility {
  Hidden = 'HIDDEN',
  NoAction = 'NO_ACTION',
  Show = 'SHOW'
}

/**
 * Permission level for a team capability. Mirrors the internal policy engine
 * levels; the numeric ordering is intentionally not exposed.
 */
export enum PermissionLevel {
  /** Team admins only. The owner is not included unless they are also an admin. Super admins are always included. */
  AdminsOnly = 'ADMINS_ONLY',
  /** Only members of a capability-specific custom list are allowed. */
  Custom = 'CUSTOM',
  /** No one is allowed, including owners and admins. */
  NoOne = 'NO_ONE',
  /** The resource owner only. Super admins are always included. */
  Owner = 'OWNER',
  /**
   * The resource owner or a team admin. Super admins are always included. This is
   * the pre-policy behavior for capabilities that permitted the owner and their
   * team admins.
   */
  OwnerAndAdmins = 'OWNER_AND_ADMINS',
  /** Any (non-blocked) teammate is allowed. */
  Teammates = 'TEAMMATES'
}

export type PersonalAssistantSettings = {
  __typename?: 'PersonalAssistantSettings';
  autoUpgrade?: Maybe<Scalars['Boolean']['output']>;
};

export type PersonalAssistantTeamSettings = {
  __typename?: 'PersonalAssistantTeamSettings';
  dailyDigest?: Maybe<Scalars['Boolean']['output']>;
  meetingPrep?: Maybe<Scalars['Boolean']['output']>;
};

export type PersonalAssistantTeamSettingsInput = {
  dailyDigest?: InputMaybe<Scalars['Boolean']['input']>;
  meetingPrep?: InputMaybe<Scalars['Boolean']['input']>;
};

export type PhoneCall = {
  __typename?: 'PhoneCall';
  createdAt: Scalars['DateTime']['output'];
  durationMins?: Maybe<Scalars['Float']['output']>;
  endTime?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  phoneNumber?: Maybe<PhoneNumber>;
  phoneNumberId: Scalars['String']['output'];
  startTime?: Maybe<Scalars['DateTime']['output']>;
  status: CallStatus;
  toNumber: Scalars['String']['output'];
};

export type PhoneNumber = {
  __typename?: 'PhoneNumber';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  lastRequestVerificationAt?: Maybe<Scalars['DateTime']['output']>;
  number: Scalars['String']['output'];
  userId: Scalars['String']['output'];
  verified: Scalars['Boolean']['output'];
};

export type PhoneNumberVerification = {
  __typename?: 'PhoneNumberVerification';
  code?: Maybe<Scalars['String']['output']>;
  expectedCodeLength?: Maybe<Scalars['Int']['output']>;
  type: PhoneNumberVerificationType;
};

export enum PhoneNumberVerificationType {
  CallInput = 'call_input',
  CallOtp = 'call_otp',
  SmsOtp = 'sms_otp'
}

export type PlatformAuthSchema = {
  __typename?: 'PlatformAuthSchema';
  description: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  fieldGroups: Array<AuthFieldGroup>;
  iconUrl?: Maybe<Scalars['String']['output']>;
  instructionsUrl?: Maybe<Scalars['String']['output']>;
  oauth?: Maybe<OAuthFlowSchema>;
  platform: Scalars['String']['output'];
  upload?: Maybe<UploadFlowSchema>;
};

export type PlatformInfo = {
  __typename?: 'PlatformInfo';
  description: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  iconUrl?: Maybe<Scalars['String']['output']>;
  instructionsUrl?: Maybe<Scalars['String']['output']>;
  platform: Scalars['String']['output'];
};

export type PlatformMainfest = {
  __typename?: 'PlatformMainfest';
  setup?: Maybe<Array<Scalars['JSON']['output']>>;
  version?: Maybe<Scalars['String']['output']>;
};

export type PlatformOAuthStatus = {
  __typename?: 'PlatformOAuthStatus';
  connected: Scalars['Boolean']['output'];
  firefliesUserEmail?: Maybe<Scalars['String']['output']>;
};

export type PlatformOAuthUrl = {
  __typename?: 'PlatformOAuthUrl';
  state: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type Playlist = {
  __typename?: 'Playlist';
  aiGenerated?: Maybe<Scalars['Boolean']['output']>;
  biteIds?: Maybe<Array<Scalars['ID']['output']>>;
  bites?: Maybe<Array<Soundbite>>;
  count?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  privacy: PlaylistPrivacy;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  user?: Maybe<BiteUser>;
  userId: Scalars['String']['output'];
};

export enum PlaylistPrivacy {
  Private = 'private',
  Public = 'public',
  Team = 'team'
}

export type PopularTopicsMetadata = {
  __typename?: 'PopularTopicsMetadata';
  appSettings: AppSettings;
  topicCount: Scalars['Float']['output'];
};

export type PredictedLtv = {
  __typename?: 'PredictedLtv';
  ltv12Months: Scalars['Float']['output'];
};

export type PredictedLtvResponse = {
  __typename?: 'PredictedLtvResponse';
  country: Scalars['String']['output'];
  emailType: EmailType;
  ltvForCountry: Scalars['Float']['output'];
  predictedLtv: PredictedLtv;
};

export type PrefetchMeta = {
  __typename?: 'PrefetchMeta';
  has_more?: Maybe<Scalars['Boolean']['output']>;
  pagination?: Maybe<ConnectorPagination>;
  status?: Maybe<Scalars['String']['output']>;
  synced_at?: Maybe<Scalars['String']['output']>;
};

export type PrefetchResource = {
  __typename?: 'PrefetchResource';
  list?: Maybe<Array<ConnectorResourceItem>>;
  meta?: Maybe<PrefetchMeta>;
};

export type PrepareChurnDefenderInput = {
  churnReason?: InputMaybe<Scalars['String']['input']>;
  initialMessage?: InputMaybe<ChurnDefenderMessageInput>;
  sessionId?: InputMaybe<Scalars['String']['input']>;
};

export type PreviewDraftInput = {
  regenerate?: InputMaybe<Scalars['Boolean']['input']>;
};

export type PreviewDraftResult = {
  __typename?: 'PreviewDraftResult';
  content?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  senderName: Scalars['String']['output'];
};

export type PreviewSummarySectionInput = {
  description: Scalars['String']['input'];
  prompt: Scalars['String']['input'];
  style: EnumSummaryStyle;
  title: Scalars['String']['input'];
  type: EnumSummaryType;
};

export type PreviewSummaryTemplateInput = {
  extendedSections: Array<PreviewSummarySectionInput>;
  meetingId: Scalars['String']['input'];
  title: Scalars['String']['input'];
  userEmail: Scalars['String']['input'];
};

export type Price = {
  __typename?: 'Price';
  active: Scalars['Boolean']['output'];
  billing_scheme: Scalars['String']['output'];
  created: Scalars['Int']['output'];
  currency: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  metadata: Scalars['JSON']['output'];
  nickname?: Maybe<Scalars['String']['output']>;
  product: Scalars['String']['output'];
  recurring?: Maybe<PriceRecurring>;
  tiers?: Maybe<Array<PriceTier>>;
  tiers_mode?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  unit_amount?: Maybe<Scalars['Float']['output']>;
};

export type PriceRecurring = {
  __typename?: 'PriceRecurring';
  interval: Scalars['String']['output'];
  interval_count: Scalars['Int']['output'];
};

export type PriceTier = {
  __typename?: 'PriceTier';
  flat_amount?: Maybe<Scalars['Int']['output']>;
  unit_amount?: Maybe<Scalars['Float']['output']>;
  up_to?: Maybe<Scalars['Int']['output']>;
};

export type PrivacyInput = {
  meetingPrivacy?: InputMaybe<Scalars['String']['input']>;
  userGroupIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type PrivacyOutput = {
  __typename?: 'PrivacyOutput';
  meetingPrivacy?: Maybe<Scalars['String']['output']>;
  userGroupIds?: Maybe<Array<Scalars['String']['output']>>;
};

export type PrivateStorageDetails = {
  __typename?: 'PrivateStorageDetails';
  provider: Scalars['String']['output'];
  region: Scalars['String']['output'];
};

export type PrivateStorageMetadata = {
  __typename?: 'PrivateStorageMetadata';
  enabled?: Maybe<Scalars['Boolean']['output']>;
  provider?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
};

export type Profile = {
  __typename?: 'Profile';
  canUseAICredits?: Maybe<Scalars['Boolean']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  isGoogle?: Maybe<Scalars['Boolean']['output']>;
  isOutlook?: Maybe<Scalars['Boolean']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  picture?: Maybe<Scalars['String']['output']>;
  preferredLanguage?: Maybe<Scalars['String']['output']>;
  tier?: Maybe<Scalars['String']['output']>;
};

export type Properties = {
  __typename?: 'Properties';
  name?: Maybe<Scalars['String']['output']>;
  subProperties?: Maybe<Array<Scalars['String']['output']>>;
};

export type ProviderCalendarConnectionStatus = {
  __typename?: 'ProviderCalendarConnectionStatus';
  connected: Scalars['Boolean']['output'];
  write: Scalars['Boolean']['output'];
};

export type PublicAutopilotAgent = {
  __typename?: 'PublicAutopilotAgent';
  color: Scalars['String']['output'];
  error?: Maybe<AutopilotAgentError>;
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  language: Scalars['String']['output'];
  name: Scalars['String']['output'];
  organization?: Maybe<Scalars['String']['output']>;
  participantInfo?: Maybe<Array<ParticipantInfoField>>;
  platform: AutopilotPlatform;
};

export type PuppetState = {
  __typename?: 'PuppetState';
  elapsedTime?: Maybe<Scalars['Float']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  time?: Maybe<Scalars['Float']['output']>;
  timeSpent?: Maybe<Scalars['Float']['output']>;
};

export type PuppetStatusUpdate = {
  __typename?: 'PuppetStatusUpdate';
  fredLeftCallAt?: Maybe<Scalars['String']['output']>;
  meetingId: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type PushAutofillToCrmResponse = {
  __typename?: 'PushAutofillToCRMResponse';
  message?: Maybe<Scalars['String']['output']>;
  ok?: Maybe<Scalars['Boolean']['output']>;
  results?: Maybe<Array<AutofillPushResult>>;
  status?: Maybe<Scalars['String']['output']>;
};

export type PushPastMeetingsResponse = {
  __typename?: 'PushPastMeetingsResponse';
  message?: Maybe<Scalars['String']['output']>;
  ok?: Maybe<Scalars['Boolean']['output']>;
  syncJobId?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  adminConnectedUsers: AdminConnectedUsersResponse;
  adminIntegrationOverview: AdminIntegrationOverviewResponse;
  adminIntegrationPermission: AdminPermissionResponse;
  adminSyncPreference: AdminSyncPreferenceResponse;
  analyticsViews: Array<AnalyticsView>;
  autopilotAgent: AutopilotAgent;
  autopilotAgentCategories: Array<AutopilotAgentCategory>;
  autopilotAgentScenarios: Array<AutopilotAgentScenario>;
  autopilotAgentTemplates: Array<AutopilotAgentTemplate>;
  autopilotAgents: AutopilotAgentsResponse;
  availableAnnouncements: Array<Announcement>;
  awaitConnectorAuthorization?: Maybe<AwaitConnectorAuthorizationResponse>;
  backendIntegrations: Array<Integration>;
  canRegenerateSummary?: Maybe<Scalars['Boolean']['output']>;
  canRegenerateSummaryV2?: Maybe<Scalars['Boolean']['output']>;
  /**
   * Evaluate one capability for the authenticated caller against many resources in a
   * single call. Each result echoes the resource it was evaluated against, so a
   * batched caller correlates decisions by resource, never by array position. Every
   * resource is resolved authoritatively server-side (a meeting's owner and owning
   * team are never client-supplied), so no caller may self-assert ownership. A
   * caller with no standing in a resource's owning team is out of policy scope for
   * that resource and is allowed (the share grant governs). Errors only for a
   * missing/invalid token; a per-resource resolution failure fails closed for that
   * resource, not the whole query. The batch is capped; see the caller for the
   * maximum number of resources per call.
   */
  capabilitiesForResources: Array<ResourceCapabilityDecision>;
  /**
   * The authoritative audience model for every registered capability: which
   * levels exist, who each admits, whether it is selectable, and its canonical
   * copy. Drives the settings UI (choices, narrowing detection, copy) without the
   * client re-deriving policy meaning. Team-independent in v0; teamId is accepted
   * for auth parity and future tier-scoping.
   */
  capabilityAudiences: Array<CapabilityAudiences>;
  checkDomainVerification: Scalars['Boolean']['output'];
  checkDomainVerificationV2: Scalars['Boolean']['output'];
  companyOpenPositions: CompanyOpenPositionsResponse;
  comparedMeetingAnalytics: ComparedMeetingAnalytics;
  comparedMeetingNotesAnalytics: ComparedMeetingNotesAnalytics;
  countAppOutputsByUserId: Scalars['Float']['output'];
  dictionary?: Maybe<CustomDictionary>;
  dictionaryV2?: Maybe<CustomDictionary>;
  dynamicRenderingRequestDynamicChoices?: Maybe<Scalars['JSON']['output']>;
  eligibleCreditIncentive?: Maybe<CreditIncentive>;
  emailActionUsage: Array<EmailActionUsageDatapoint>;
  emailRules: Array<EmailRule>;
  emailSettings?: Maybe<EmailSettings>;
  endAuthorization?: Maybe<Scalars['JSON']['output']>;
  enrichDomains?: Maybe<Array<EnrichedOrganization>>;
  fetchConnectedConnectors?: Maybe<Array<Scalars['JSON']['output']>>;
  fetchConnectorContacts?: Maybe<ConnectorContact>;
  fetchConnectorHistory?: Maybe<ConnectorHistory>;
  fetchInvitations: Array<Invitation>;
  fetchManualNotes?: Maybe<ManualNotes>;
  fetchRules?: Maybe<FetchRulesOutput>;
  fetchRulesV2?: Maybe<FetchRulesOutput>;
  fetchSampleMeeting?: Maybe<SampleMeeting>;
  fetchScheduledMaintenance?: Maybe<ScheduledMaintenance>;
  fetchScheduledMaintenanceV2?: Maybe<ScheduledMaintenanceV2>;
  fetchSmartSearchFilters?: Maybe<FetchSmartSearchFiltersResponse>;
  fetchSummaryStatus?: Maybe<MeetingSummaryStatus>;
  fetchSummaryStatusV2?: Maybe<MeetingSummaryStatus>;
  fetchTeamRules?: Maybe<FetchTeamRulesOutput>;
  fetchTeamRulesV2?: Maybe<FetchTeamRulesOutput>;
  fetchTimeSpentBySummaryTemplate?: Maybe<TimeSpentBySummaryTemplateResponse>;
  fetchTimeSpentBySummaryTemplateV2?: Maybe<TimeSpentBySummaryTemplateResponse>;
  fetchUploadedFiles: Array<Files>;
  fetchUserProperties?: Maybe<UserProperties>;
  fetchWelcomeSoundbites?: Maybe<WelcomeSoundbitesResponse>;
  /** @deprecated Learned insights were removed from vocabulary settings. This field will be deleted in a future release. */
  fetchWordChangesV2?: Maybe<VocabModulation>;
  findUsersMeetingIsSharedWith?: Maybe<FindUsersMeetingIsSharedWithResponse>;
  generateHighlights: Array<HighlightSegment>;
  getAICreditUsageByConsumerId: Array<AiCreditUsageByConsumerIdDatapoint>;
  getAICreditUsageByConsumerType: Array<AiCreditUsageByConsumerTypeDatapoint>;
  getAICreditUsageByTeammate: Array<AiCreditUsageDatapoint>;
  getAcceptedTeamRequest?: Maybe<TeamRequest>;
  getAiAppRecommendations?: Maybe<Array<Scalars['String']['output']>>;
  getAiAppRecommendationsV2?: Maybe<Array<Scalars['String']['output']>>;
  getApiKey?: Maybe<Scalars['String']['output']>;
  getApiKeyV2?: Maybe<Scalars['String']['output']>;
  getAppEventsByUserId: GetAppEventsByUserIdResponseDto;
  getAppOutputById?: Maybe<AppOutputEventWithNullableSettings>;
  getAppOutputsByAppId: GetAppOutputsByAppIdResponseDto;
  getAppOutputsByMeetingId: Array<AppOutputEvent>;
  getAppOutputsByUserId: GetAppOutputsByUserIdResponseDto;
  getAppPreviewByAppId?: Maybe<AppPreview>;
  getAppRecommendation: RecommendationRule;
  getAppRecommendationByKey: RecommendationRule;
  /** @deprecated No longer supported. Recommendations are now cached per meeting. */
  getAppRecommendationsForMeeting?: Maybe<AppRecommendationsForMeetingResponse>;
  getAppRecommendedByFred: Array<AppTemplate>;
  getAppSettingsById: AppSettings;
  getAskFredChatFromUrl: Array<FredResponse>;
  getAuthSchema?: Maybe<PlatformAuthSchema>;
  getAutofillConfig?: Maybe<GetAutofillConfigResponse>;
  getAutofillConfigV2: GetAutofillConfigResponse;
  getAutofillCustomFields?: Maybe<GetAutofillCustomFieldsResponse>;
  getAutofillCustomFieldsV2: GetAutofillCustomFieldsResponse;
  getAutofillExtractions?: Maybe<GetAutofillExtractionsResponse>;
  getAutofillExtractionsV2: GetAutofillExtractionsResponse;
  getAutofillMappings?: Maybe<GetAutofillMappingsResponse>;
  getAutofillMappingsV2: GetAutofillMappingsResponse;
  getAutofillOpportunities?: Maybe<GetAutofillOpportunitiesResponse>;
  getAutofillOpportunitiesV2: GetAutofillOpportunitiesResponse;
  getAutopilotAudioConfig?: Maybe<Array<AutopilotAudioConfig>>;
  getAutopilotAudioConfigV2?: Maybe<Array<AutopilotAudioConfig>>;
  getBillingInfo?: Maybe<BillingInfo>;
  getByAppSettingsOrTemplateId: GetByAppSettingsOrTemplateIdResult;
  getCalendarConnectionStatus: CalendarConnectionStatus;
  getCalendarEvents?: Maybe<UpcomingMeetings>;
  getCategories?: Maybe<Topic>;
  getCategoriesV2?: Maybe<Topic>;
  getChannel?: Maybe<Channel>;
  getChannelMeetings?: Maybe<Meetings>;
  getChannelMeetingsCount?: Maybe<Scalars['Int']['output']>;
  getChannelMeetingsExtended: Array<MeetingsExtended>;
  getChannelsList?: Maybe<Array<Channel>>;
  getConnectedConnectors?: Maybe<ConnectedConnectors>;
  getConnectorContactsForInvite: ConnectorInviteContactsResult;
  getConnectorDetails?: Maybe<ConnectorDetails>;
  getConnectorList?: Maybe<ConnectorList>;
  getConnectorListConnected?: Maybe<Array<Scalars['JSON']['output']>>;
  getConnectorManualSetup?: Maybe<ConnectorSetupList>;
  getConnectorResource?: Maybe<ConnectorResource>;
  getConnectorSetupList?: Maybe<ConnectorSetupList>;
  getContact: Contact;
  getCouponByCode: Coupon;
  getDeal: Deal;
  getDealAccessibleMeetings: DealMeetingAccess;
  getDealContacts: Array<DealContact>;
  getDealFilters: DealFilters;
  getDealIntelligenceAccess?: Maybe<DealIntelligenceAccess>;
  getDealStageMetrics: Array<DealStageMetrics>;
  getDealUpcomingMeetings: Array<DealUpcomingMeeting>;
  getDeals: PaginatedDeals;
  getDealsByRepresentative: PaginatedDeals;
  getDomainContracts: Array<TeamContract>;
  getEmailConnectionStatus?: Maybe<EmailConnectionStatus>;
  getFeatures: GrowthbookFeatures;
  getFeaturesV2: GrowthbookFeaturesV2;
  getFeedAIApps?: Maybe<FeedAiAppsResult>;
  getFeedContacts: Array<FeedContact>;
  getFeedMeetingById?: Maybe<FeedMeeting>;
  getFeedMeetings: FeedResults;
  getFeedOutputs: GetFeedOutputsResponseDto;
  getFeedTasks: FeedResults;
  getFeedbackByExperiment?: Maybe<Feedback>;
  getFilteredMeetings: Meetings;
  getGenericUserTasks: GetUserTasksResponse;
  getGlobalSearchSuggestions: GlobalSearchSuggestionsResponse;
  getIngestionJobStatus?: Maybe<IngestionJob>;
  getIntegrationsListing: Array<Integration>;
  getInviteDetails?: Maybe<InvitationDetails>;
  getInviteSuggestions: InviteSuggestions;
  getKnowledgeBaseCategories: Array<KnowledgeBaseCategory>;
  getLastMeetingByMeetingId?: Maybe<FeedMeeting>;
  getLiveMeeting: MeetingStatusData;
  getLiveMeetingInsights?: Maybe<LiveInsights>;
  getLiveMeetingMarks: Array<WaveMark>;
  getLiveTranscript?: Maybe<Array<LiveTranscriptItem>>;
  getMeetingByDeletionTime?: Maybe<GetMeetingByDeletionTimeResult>;
  getMeetingById?: Maybe<MeetingByIdResponse>;
  getMeetingMarks: Array<WaveMark>;
  getMeetingMediaUrls: MeetingMediaUrls;
  getMeetingPrep?: Maybe<MeetingPrep>;
  getMeetingPrepApp?: Maybe<MeetingPrepApp>;
  getMeetingPrepOutput?: Maybe<MeetingPrepOutput>;
  getMeetingSummary?: Maybe<MeetingSummaryResponse>;
  getMeetingSummaryAccessLogs: Array<SummaryAccessLog>;
  getMeetingSummaryAccessLogsV2: Array<SummaryAccessLog>;
  getMeetingSummaryV2?: Maybe<MeetingSummaryResponse>;
  getMeetingsMetadata: Array<MeetingMetadata>;
  getMigrationStatus: MigrationStatusResult;
  getOnboardingChecklist: Checklist;
  getOngoingCalendarEvents?: Maybe<OngoingMeetings>;
  getPartnerPerksInfo: PartnerPerkInfo;
  getPaymentAutomaticRefundDataById?: Maybe<AutomaticRefund>;
  getPersonalAssistant: GetPersonalAssistantResponseDto;
  getPredictedLtv: PredictedLtvResponse;
  getPublicAppOutputById: AppOutputEventWithNullableSettings;
  getPublicProfileForInvite?: Maybe<SuggestionPublicProfile>;
  getPublicProfiles: Array<SuggestionPublicProfile>;
  getReferralSuggestions: PaginationInviteSuggestions;
  getRegionalPricingCoupon?: Maybe<Coupon>;
  getResolvedTeamSummaryTemplate?: Maybe<TeamSummaryTemplateDefault>;
  getRolesWithTitles: Array<RoleWithTitles>;
  getSampleMeeting?: Maybe<Source>;
  getSendNotesIntegrations: Array<SendNotesIntegration>;
  getSharedIntegrationApps?: Maybe<Array<IntegrationApps>>;
  getSharedMeetingByShareType?: Maybe<ShareMeeting>;
  getSharedSections: Array<SummaryTemplateSection>;
  getSignedMediaUrl: Scalars['String']['output'];
  getSlackConnectorSetup?: Maybe<SlackConnectorSetup>;
  getSlackWorkspace?: Maybe<Array<SlackWorkSpace>>;
  getSso?: Maybe<GetSsoResponse>;
  getSsoRedirect?: Maybe<Scalars['String']['output']>;
  getSsoRedirectByEmail?: Maybe<Scalars['String']['output']>;
  getSsoRedirectByEmailV2?: Maybe<Scalars['String']['output']>;
  getSsoRedirectV2?: Maybe<Scalars['String']['output']>;
  getSsoV2?: Maybe<GetSsoResponse>;
  getSummarySettingsById?: Maybe<SummarySettings>;
  getSummarySettingsList?: Maybe<Array<SummarySettings>>;
  getSummaryTemplateById?: Maybe<SummaryTemplate>;
  getSupportedPlatforms: Array<PlatformInfo>;
  getTeamOnboardingSuggestion: TeamOnboardingSuggestion;
  getTeamRequests: Array<TeamRequest>;
  getTeamSuggestion?: Maybe<TeamSuggestion>;
  getTeamSummaryTemplate?: Maybe<SummaryTemplate>;
  getTemplates: Array<SummaryTemplate>;
  getTemplatesGroupedByCategory: Array<GroupedSummaryTemplatesDto>;
  getTopicInsights: TopicInsights;
  getTranscriptFFAuth?: Maybe<Scalars['String']['output']>;
  getUserGroups: Array<UserGroup>;
  getUserLoginOptions: GetUserLoginOptionsResponse;
  getUserMeetingsForStatus?: Maybe<MeetingStatusList>;
  getUserReferral?: Maybe<Referral>;
  getUserReferrer?: Maybe<UserReferral>;
  getUserSessionsDetails?: Maybe<Array<SessionDetails>>;
  getUserSessionsDetailsV2?: Maybe<Array<SessionDetailsV2>>;
  getUserTasks: GetUserTasksResponse;
  getUserTasksCount: GetUserTasksCountResponse;
  getVoiceClones?: Maybe<VoiceCloneResponse>;
  getWebhook?: Maybe<Webhook>;
  globalSearch: Meetings;
  hasAccessToCampaign: HasAccessToCampaignResponse;
  hasAccessToExpansionCampaign: HasAccessToExpansionCampaignResponse;
  hasAccessToFreeExpansionCampaign: HasAccessToFreeExpansionCampaignResponse;
  integration?: Maybe<Integration>;
  inviteSuggestionsForIntegration?: Maybe<Array<UserIntegrationContact>>;
  isAutoAddAllowed: Scalars['Boolean']['output'];
  listAppCategories: Array<AppCategory>;
  listAppSettings: Array<AppSettings>;
  listAppTemplates: Array<AppTemplate>;
  listDefaultAppTemplates: Array<AppTemplate>;
  listKnowledgeBaseCategories: Array<KnowledgeBaseCategory>;
  listKnowledgeBaseDocuments: Array<KnowledgeBaseDocument>;
  listMeetingPreps: MeetingPrepList;
  listMigrations: Array<MigrationListItem>;
  listRuleExecutions?: Maybe<RuleExecutionOutput>;
  listRuleExecutionsByMeeting?: Maybe<RuleExecutionsByMeetingOutput>;
  listRuleExecutionsByMeetingV2?: Maybe<RuleExecutionsByMeetingOutput>;
  listRuleExecutionsV2?: Maybe<RuleExecutionOutput>;
  manualUploadBatch: ManualUploadBatch;
  manualUploadLimits: ManualUploadLimits;
  meeting?: Maybe<Meeting>;
  meetingEdit?: Maybe<Soundbite>;
  meetingFredQa: Array<FredResponse>;
  meetingNote?: Maybe<MeetingNote>;
  meetingNoteAnalytics: MeetingNoteAnalytics;
  meetingNoteComments?: Maybe<Array<MeetingNoteComment>>;
  meetingNoteCommentsV2: Array<MeetingNoteComment>;
  meetingSummary: MeetingSummary;
  messages: PaginatedMessagesResponse;
  /**
   * Evaluate every registered capability for the authenticated caller on a team,
   * returning one decision per capability. The caller is taken solely from the
   * verified bearer token (never a passed user id). A caller with no team standing
   * is not an error: every decision is allowed: false with reason NOT_A_MEMBER.
   *
   * Evaluation is team-scoped and owner-agnostic: it does not accept a resource
   * owner, because on this front-end surface a caller-supplied owner is
   * attacker-controllable and would let a caller self-assert ownership. Owner-
   * scoped enforcement is done by the resource-owning service via the gRPC PDP,
   * which supplies the authoritative owner.
   */
  myCapabilities: Array<CapabilityDecision>;
  /**
   * Evaluate a single capability for the authenticated caller. Errors only for a
   * missing/invalid token; the capability is constrained to the Capability enum, so
   * an unknown capability is rejected at schema validation.
   *
   * Without resource, the check is team-scoped and owner-agnostic (see
   * myCapabilities). With resource, the check is evaluated against the resource's
   * owning team policy and the caller's standing in that owning team: the meeting
   * owner is resolved server-side (never client-supplied), so ownership cannot be
   * self-asserted. A caller with no standing in the owning team is out of policy
   * scope and is allowed (the resource's share grant governs), not denied.
   */
  myCapability: CapabilityDecision;
  myManualUploadBatches: Array<ManualUploadBatch>;
  notificationStatus?: Maybe<Scalars['Boolean']['output']>;
  phoneCalls: Array<PhoneCall>;
  phoneNumbers: Array<PhoneNumber>;
  platformOAuthStatus: PlatformOAuthStatus;
  playlist?: Maybe<Playlist>;
  playlists: Array<Playlist>;
  publicAutopilotAgent: PublicAutopilotAgent;
  recapConfig: RecapConfig;
  recordingPreferences: RecordingPreferences;
  reloadMeetingCall?: Maybe<Scalars['String']['output']>;
  remoteConstants: RemoteConstants;
  rewindData?: Maybe<RewindData>;
  searchConnectorResource?: Maybe<PrefetchResource>;
  searchKnowledgeBase: SearchKnowledgeBaseResult;
  /** @deprecated Use playlists(query: String) instead */
  searchPlaylists: Array<Playlist>;
  /** @deprecated Use soundbites(query: String) instead */
  searchSoundbites: Array<Soundbite>;
  shouldShowNPSSurvey: Scalars['Boolean']['output'];
  soundbite?: Maybe<Soundbite>;
  soundbites: Array<Soundbite>;
  startAutofill?: Maybe<StartAutofillResponse>;
  startAutofillV2: StartAutofillResponse;
  suggestCategories?: Maybe<Array<Suggestion>>;
  teamAccount?: Maybe<Team>;
  /**
   * All capability policies for a team, one entry per registered capability,
   * with the effective level (stored override or registry default).
   */
  teamPermissionPolicies: Array<TeamCapabilityPolicy>;
  trackGlobalSearchClicked?: Maybe<Scalars['Boolean']['output']>;
  trackReferrals: TrackReferralsResponse;
  /** @deprecated Use messages(..., deliveryStatus: [sent]) instead */
  unreadMessagesCount: Scalars['Int']['output'];
  user?: Maybe<User>;
  userIntegrationContacts?: Maybe<Array<UserIntegrationContact>>;
  userIntegrations: Array<UserIntegration>;
  validConnectorAuthorization?: Maybe<ValidConnectorAuthorizationResponse>;
  validateShareSlug?: Maybe<ShareSlugValidation>;
  verifyConnectorApiKey?: Maybe<Scalars['JSON']['output']>;
  weeklyUsage?: Maybe<WeeklyUsage>;
};


export type QueryAdminConnectedUsersArgs = {
  connectorId: Scalars['String']['input'];
};


export type QueryAdminIntegrationPermissionArgs = {
  connectorId: Scalars['String']['input'];
};


export type QueryAdminSyncPreferenceArgs = {
  connectorId: Scalars['String']['input'];
};


export type QueryAutopilotAgentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAutopilotAgentScenariosArgs = {
  agentId: Scalars['ID']['input'];
};


export type QueryAutopilotAgentTemplatesArgs = {
  categoryId?: InputMaybe<Scalars['ID']['input']>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryAutopilotAgentsArgs = {
  pagination?: InputMaybe<PaginationInput>;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAwaitConnectorAuthorizationArgs = {
  connectorId: Scalars['String']['input'];
  streamToken: Scalars['String']['input'];
};


export type QueryBackendIntegrationsArgs = {
  category: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type QueryCanRegenerateSummaryArgs = {
  meetingId: Scalars['String']['input'];
};


export type QueryCanRegenerateSummaryV2Args = {
  meetingId: Scalars['String']['input'];
};


export type QueryCapabilitiesForResourcesArgs = {
  capability: Capability;
  resources: Array<ResourceInput>;
};


export type QueryCapabilityAudiencesArgs = {
  teamId: Scalars['String']['input'];
};


export type QueryCheckDomainVerificationArgs = {
  token: Scalars['String']['input'];
};


export type QueryCheckDomainVerificationV2Args = {
  token: Scalars['String']['input'];
};


export type QueryCompanyOpenPositionsArgs = {
  input: GetCompanyOpenPositionsInput;
};


export type QueryComparedMeetingAnalyticsArgs = {
  compareToDays?: InputMaybe<Scalars['Int']['input']>;
  endTime?: InputMaybe<Scalars['DateTime']['input']>;
  startTime?: InputMaybe<Scalars['DateTime']['input']>;
  viewFilter?: InputMaybe<AnalyticsViewFilterInput>;
};


export type QueryComparedMeetingNotesAnalyticsArgs = {
  compareToDays?: InputMaybe<Scalars['Int']['input']>;
  endTime?: InputMaybe<Scalars['DateTime']['input']>;
  startTime?: InputMaybe<Scalars['DateTime']['input']>;
  viewFilter?: InputMaybe<AnalyticsViewFilterInput>;
};


export type QueryCountAppOutputsByUserIdArgs = {
  from: Scalars['DateTime']['input'];
};


export type QueryDynamicRenderingRequestDynamicChoicesArgs = {
  fieldName: Scalars['String']['input'];
  formValues: Scalars['JSON']['input'];
  integrationCategory: Scalars['String']['input'];
  integrationName: Scalars['String']['input'];
  isConnected: Scalars['Boolean']['input'];
  nextCursor?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEligibleCreditIncentiveArgs = {
  campaignSlug: Scalars['String']['input'];
};


export type QueryEmailActionUsageArgs = {
  input: GetEmailActionUsageInput;
};


export type QueryEndAuthorizationArgs = {
  connectorId: Scalars['String']['input'];
};


export type QueryEnrichDomainsArgs = {
  iCalUID?: InputMaybe<Scalars['String']['input']>;
  meetingId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFetchConnectorContactsArgs = {
  connectorId: Scalars['String']['input'];
  pagination?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryFetchConnectorHistoryArgs = {
  connectorId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFetchManualNotesArgs = {
  meetingId: Scalars['String']['input'];
};


export type QueryFetchRulesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFetchRulesV2Args = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFetchScheduledMaintenanceArgs = {
  target?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFetchScheduledMaintenanceV2Args = {
  target?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFetchSmartSearchFiltersArgs = {
  meetingId: Scalars['String']['input'];
};


export type QueryFetchSummaryStatusArgs = {
  meetingId: Scalars['ID']['input'];
};


export type QueryFetchSummaryStatusV2Args = {
  meetingId: Scalars['ID']['input'];
};


export type QueryFetchTeamRulesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFetchTeamRulesV2Args = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFetchTimeSpentBySummaryTemplateArgs = {
  templateId: Scalars['String']['input'];
};


export type QueryFetchTimeSpentBySummaryTemplateV2Args = {
  templateId: Scalars['String']['input'];
};


export type QueryFetchUserPropertiesArgs = {
  isAdminScript?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryFetchWelcomeSoundbitesArgs = {
  aiGenerated?: InputMaybe<Scalars['Boolean']['input']>;
  dateFilter?: InputMaybe<DateFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  meetingId?: InputMaybe<Scalars['String']['input']>;
  meetingIds?: InputMaybe<Array<Scalars['String']['input']>>;
  mine?: InputMaybe<Scalars['Boolean']['input']>;
  myTeam?: InputMaybe<Scalars['Boolean']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  userIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryFindUsersMeetingIsSharedWithArgs = {
  meetingId: Scalars['ID']['input'];
};


export type QueryGenerateHighlightsArgs = {
  meetingId?: InputMaybe<Scalars['String']['input']>;
  minDuration?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAiCreditUsageByConsumerIdArgs = {
  input: GetAiCreditUsageByConsumerIdInput;
};


export type QueryGetAiCreditUsageByConsumerTypeArgs = {
  input: GetAiCreditUsageByConsumerTypeInput;
};


export type QueryGetAiCreditUsageByTeammateArgs = {
  input: GetAiCreditUsageByTeammateInput;
};


export type QueryGetAiAppRecommendationsArgs = {
  role?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAiAppRecommendationsV2Args = {
  role?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAppEventsByUserIdArgs = {
  dateRange?: InputMaybe<DateRange>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type QueryGetAppOutputByIdArgs = {
  eventId: Scalars['String']['input'];
};


export type QueryGetAppOutputsByAppIdArgs = {
  appId: Scalars['String']['input'];
  dateRange?: InputMaybe<DateRange>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  excludeHiddenFromSkillsNav?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
  startDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAppOutputsByMeetingIdArgs = {
  limit?: Scalars['Int']['input'];
  meetingId: Scalars['String']['input'];
  skip?: Scalars['Int']['input'];
};


export type QueryGetAppOutputsByUserIdArgs = {
  from?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: Scalars['Int']['input'];
  skip?: Scalars['Int']['input'];
};


export type QueryGetAppPreviewByAppIdArgs = {
  appId: Scalars['String']['input'];
  meetingIds: Array<Scalars['String']['input']>;
};


export type QueryGetAppRecommendationArgs = {
  input?: InputMaybe<GetAppRecommendationInput>;
};


export type QueryGetAppRecommendationByKeyArgs = {
  input?: InputMaybe<GetAppRecommendationByKeyInput>;
};


export type QueryGetAppRecommendationsForMeetingArgs = {
  meetingId: Scalars['String']['input'];
};


export type QueryGetAppSettingsByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetAskFredChatFromUrlArgs = {
  url: Scalars['String']['input'];
};


export type QueryGetAuthSchemaArgs = {
  platform: Scalars['String']['input'];
};


export type QueryGetAutofillConfigArgs = {
  connectorId: Scalars['String']['input'];
};


export type QueryGetAutofillConfigV2Args = {
  connectorId: Scalars['String']['input'];
};


export type QueryGetAutofillCustomFieldsArgs = {
  connectorId: Scalars['String']['input'];
  entityTypes: Array<Scalars['String']['input']>;
};


export type QueryGetAutofillCustomFieldsV2Args = {
  connectorId: Scalars['String']['input'];
  entityTypes: Array<Scalars['String']['input']>;
};


export type QueryGetAutofillExtractionsArgs = {
  connectorId: Scalars['String']['input'];
  meetingId: Scalars['String']['input'];
};


export type QueryGetAutofillExtractionsV2Args = {
  connectorId: Scalars['String']['input'];
  meetingId: Scalars['String']['input'];
};


export type QueryGetAutofillMappingsArgs = {
  connectorId: Scalars['String']['input'];
  entityTypes: Array<Scalars['String']['input']>;
  refresh?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryGetAutofillMappingsV2Args = {
  connectorId: Scalars['String']['input'];
  entityTypes: Array<Scalars['String']['input']>;
  refresh?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryGetAutofillOpportunitiesArgs = {
  connectorId: Scalars['String']['input'];
  participants: Array<Scalars['String']['input']>;
};


export type QueryGetAutofillOpportunitiesV2Args = {
  connectorId: Scalars['String']['input'];
  participants: Array<Scalars['String']['input']>;
};


export type QueryGetAutopilotAudioConfigArgs = {
  provider: Scalars['String']['input'];
};


export type QueryGetAutopilotAudioConfigV2Args = {
  provider: Scalars['String']['input'];
};


export type QueryGetBillingInfoArgs = {
  invoiceFilters?: InputMaybe<InvoiceFilters>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  startingAfter?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetByAppSettingsOrTemplateIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetCategoriesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sourceIsNotepad?: InputMaybe<Scalars['Boolean']['input']>;
  type?: InputMaybe<TopicType>;
};


export type QueryGetCategoriesV2Args = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sourceIsNotepad?: InputMaybe<Scalars['Boolean']['input']>;
  type?: InputMaybe<TopicType>;
};


export type QueryGetChannelArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetChannelMeetingsArgs = {
  channelId: Scalars['String']['input'];
  from: Scalars['Int']['input'];
  isPrivate?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  size: Scalars['Int']['input'];
};


export type QueryGetChannelMeetingsCountArgs = {
  channelId: Scalars['String']['input'];
};


export type QueryGetChannelMeetingsExtendedArgs = {
  channelId: Scalars['String']['input'];
  from: Scalars['Int']['input'];
  isPrivate?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  size: Scalars['Int']['input'];
};


export type QueryGetConnectorContactsForInviteArgs = {
  connectorId: Scalars['String']['input'];
  fetchAll?: InputMaybe<Scalars['Boolean']['input']>;
  pagination?: InputMaybe<ConnectorInviteContactsPaginationInput>;
};


export type QueryGetConnectorDetailsArgs = {
  connectorId: Scalars['String']['input'];
};


export type QueryGetConnectorManualSetupArgs = {
  connectorId: Scalars['String']['input'];
};


export type QueryGetConnectorResourceArgs = {
  connectorId: Scalars['String']['input'];
  connectorSetup?: InputMaybe<Scalars['JSON']['input']>;
  pagination?: InputMaybe<Scalars['JSON']['input']>;
  resourceName: Scalars['String']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetConnectorSetupListArgs = {
  connectorId: Scalars['String']['input'];
};


export type QueryGetContactArgs = {
  email: Scalars['String']['input'];
  generateBio?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
};


export type QueryGetCouponByCodeArgs = {
  code: Scalars['String']['input'];
};


export type QueryGetDealArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetDealAccessibleMeetingsArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetDealContactsArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetDealIntelligenceAccessArgs = {
  connectorIds: Array<Scalars['String']['input']>;
  userGroupId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetDealStageMetricsArgs = {
  input: GetDealStageMetricsInput;
};


export type QueryGetDealUpcomingMeetingsArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetDealsArgs = {
  input: GetDealsInput;
};


export type QueryGetDealsByRepresentativeArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  representativeId: Scalars['ID']['input'];
};


export type QueryGetFeedAiAppsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetFeedMeetingByIdArgs = {
  meetingId: Scalars['String']['input'];
};


export type QueryGetFeedMeetingsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetFeedOutputsArgs = {
  appId?: InputMaybe<Array<Scalars['String']['input']>>;
  createdBy?: InputMaybe<Array<Scalars['String']['input']>>;
  limit?: Scalars['Int']['input'];
  runFor?: InputMaybe<Array<Scalars['String']['input']>>;
  schedule?: InputMaybe<Array<EnumAppScheduleFilter>>;
  skip?: Scalars['Int']['input'];
  sortBy?: InputMaybe<EnumSortOrder>;
};


export type QueryGetFeedTasksArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  onlyMine?: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetFeedbackByExperimentArgs = {
  experiment: Scalars['String']['input'];
};


export type QueryGetFilteredMeetingsArgs = {
  channelId: Scalars['String']['input'];
  filters?: InputMaybe<SearchFilters>;
  from: Scalars['Int']['input'];
  keywords?: InputMaybe<Scalars['String']['input']>;
  onlyMine?: InputMaybe<Scalars['Boolean']['input']>;
  size: Scalars['Int']['input'];
  sort?: InputMaybe<Array<GlobalSearchSortInput>>;
};


export type QueryGetGenericUserTasksArgs = {
  input?: InputMaybe<GetUserTasksInput>;
};


export type QueryGetGlobalSearchSuggestionsArgs = {
  channelId?: InputMaybe<Scalars['String']['input']>;
  from?: InputMaybe<Scalars['Int']['input']>;
  keywords: Scalars['String']['input'];
  select?: InputMaybe<Array<EnumGlobalSearchSuggestionsMatch>>;
  size?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetIngestionJobStatusArgs = {
  input: GetIngestionJobStatusInput;
};


export type QueryGetIntegrationsListingArgs = {
  supportUserContacts?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryGetInviteDetailsArgs = {
  code: Scalars['String']['input'];
};


export type QueryGetInviteSuggestionsArgs = {
  group?: InputMaybe<EnumInviteSuggestionsGroup>;
  isAutoAdd?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryGetKnowledgeBaseCategoriesArgs = {
  input: GetKnowledgeBaseCategoriesInput;
};


export type QueryGetLastMeetingByMeetingIdArgs = {
  meetingId: Scalars['String']['input'];
};


export type QueryGetLiveMeetingArgs = {
  meetingId: Scalars['String']['input'];
};


export type QueryGetLiveMeetingInsightsArgs = {
  meetingId: Scalars['String']['input'];
  realtimeToken: Scalars['String']['input'];
};


export type QueryGetLiveMeetingMarksArgs = {
  meetingId: Scalars['String']['input'];
};


export type QueryGetLiveTranscriptArgs = {
  meetingId: Scalars['String']['input'];
  realtimeToken: Scalars['String']['input'];
};


export type QueryGetMeetingByDeletionTimeArgs = {
  getCount?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryGetMeetingByIdArgs = {
  meetingId: Scalars['String']['input'];
};


export type QueryGetMeetingMarksArgs = {
  meetingId: Scalars['String']['input'];
};


export type QueryGetMeetingMediaUrlsArgs = {
  meetingId: Scalars['String']['input'];
};


export type QueryGetMeetingPrepArgs = {
  meetingId: Scalars['ID']['input'];
};


export type QueryGetMeetingPrepOutputArgs = {
  input: GetMeetingPrepOutputInput;
};


export type QueryGetMeetingSummaryArgs = {
  meetingId: Scalars['ID']['input'];
};


export type QueryGetMeetingSummaryAccessLogsArgs = {
  meetingId: Scalars['ID']['input'];
};


export type QueryGetMeetingSummaryAccessLogsV2Args = {
  meetingId: Scalars['ID']['input'];
};


export type QueryGetMeetingSummaryV2Args = {
  meetingId: Scalars['ID']['input'];
};


export type QueryGetMeetingsMetadataArgs = {
  meetingIds: Array<Scalars['String']['input']>;
};


export type QueryGetMigrationStatusArgs = {
  migrationId: Scalars['String']['input'];
};


export type QueryGetPaymentAutomaticRefundDataByIdArgs = {
  refundId: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type QueryGetPredictedLtvArgs = {
  country?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetPublicAppOutputByIdArgs = {
  eventId: Scalars['String']['input'];
};


export type QueryGetPublicProfileForInviteArgs = {
  email: Scalars['String']['input'];
};


export type QueryGetPublicProfilesArgs = {
  emails: Array<Scalars['String']['input']>;
};


export type QueryGetSharedMeetingByShareTypeArgs = {
  meetingId: Scalars['ID']['input'];
  shareType: Scalars['String']['input'];
};


export type QueryGetSignedMediaUrlArgs = {
  contentType: Scalars['String']['input'];
  extension: Scalars['String']['input'];
  meetingId: Scalars['String']['input'];
};


export type QueryGetSsoRedirectArgs = {
  domain?: InputMaybe<Scalars['String']['input']>;
  guid?: InputMaybe<Scalars['String']['input']>;
  invite?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetSsoRedirectByEmailArgs = {
  email: Scalars['String']['input'];
};


export type QueryGetSsoRedirectByEmailV2Args = {
  email: Scalars['String']['input'];
};


export type QueryGetSsoRedirectV2Args = {
  domain?: InputMaybe<Scalars['String']['input']>;
  guid?: InputMaybe<Scalars['String']['input']>;
  invite?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetSummarySettingsByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetSummaryTemplateByIdArgs = {
  id: Scalars['String']['input'];
  meetingId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetTeamRequestsArgs = {
  status?: InputMaybe<EnumTeamRequestStatus>;
};


export type QueryGetTeamSummaryTemplateArgs = {
  userGroupIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryGetTopicInsightsArgs = {
  endTime?: InputMaybe<Scalars['DateTime']['input']>;
  startTime?: InputMaybe<Scalars['DateTime']['input']>;
  viewFilter?: InputMaybe<AnalyticsViewFilterInput>;
};


export type QueryGetTranscriptFfAuthArgs = {
  meetingId: Scalars['String']['input'];
  source?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetUserLoginOptionsArgs = {
  email: Scalars['String']['input'];
};


export type QueryGetUserMeetingsForStatusArgs = {
  batch?: InputMaybe<Scalars['Int']['input']>;
  computedStatus?: InputMaybe<Scalars['String']['input']>;
  end?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  next?: InputMaybe<Scalars['String']['input']>;
  start?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  totalCount?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetUserTasksArgs = {
  input?: InputMaybe<GetUserTasksInput>;
};


export type QueryGetUserTasksCountArgs = {
  input?: InputMaybe<GetUserTasksCountInput>;
};


export type QueryGlobalSearchArgs = {
  channelId: Scalars['String']['input'];
  filterOperators?: InputMaybe<GlobalSearchFilterOperatorsInput>;
  filters?: InputMaybe<SearchFilters>;
  from: Scalars['Int']['input'];
  keywords?: InputMaybe<Scalars['String']['input']>;
  size: Scalars['Int']['input'];
  sort?: InputMaybe<Array<GlobalSearchSortInput>>;
};


export type QueryIntegrationArgs = {
  enabled: Scalars['Boolean']['input'];
  event: Scalars['String']['input'];
};


export type QueryInviteSuggestionsForIntegrationArgs = {
  category: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type QueryListKnowledgeBaseCategoriesArgs = {
  input: ListKnowledgeBaseCategoriesInput;
};


export type QueryListKnowledgeBaseDocumentsArgs = {
  input: ListKnowledgeBaseDocumentsInput;
};


export type QueryListRuleExecutionsArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<RuleExecutionFilters>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryListRuleExecutionsByMeetingArgs = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<RuleExecutionFilters>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  logsPerMeeting?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryListRuleExecutionsByMeetingV2Args = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<RuleExecutionFilters>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  logsPerMeeting?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryListRuleExecutionsV2Args = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<RuleExecutionFilters>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryManualUploadBatchArgs = {
  batchId: Scalars['ID']['input'];
};


export type QueryMeetingArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMeetingEditArgs = {
  meetingId: Scalars['String']['input'];
};


export type QueryMeetingFredQaArgs = {
  meetingId: Scalars['ID']['input'];
};


export type QueryMeetingNoteArgs = {
  _id?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  shareSlug?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMeetingNoteAnalyticsArgs = {
  forceCompute?: InputMaybe<Scalars['Boolean']['input']>;
  parseId: Scalars['ID']['input'];
};


export type QueryMeetingNoteCommentsArgs = {
  meetingId: Scalars['String']['input'];
};


export type QueryMeetingNoteCommentsV2Args = {
  meetingId: Scalars['String']['input'];
  password?: InputMaybe<Scalars['String']['input']>;
  shareSlug?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMeetingSummaryArgs = {
  meetingId: Scalars['ID']['input'];
};


export type QueryMessagesArgs = {
  deliveryStatus?: InputMaybe<Array<NotificationDeliveryStatus>>;
  pagination: PaginationInput;
  templateIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryMyCapabilitiesArgs = {
  teamId: Scalars['String']['input'];
};


export type QueryMyCapabilityArgs = {
  capability: Capability;
  resource?: InputMaybe<ResourceInput>;
  teamId: Scalars['String']['input'];
};


export type QueryMyManualUploadBatchesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPlatformOAuthStatusArgs = {
  platform: Scalars['String']['input'];
  state: Scalars['String']['input'];
};


export type QueryPlaylistArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPlaylistsArgs = {
  biteId?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  mine?: InputMaybe<Scalars['Boolean']['input']>;
  myTeam?: InputMaybe<Scalars['Boolean']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPublicAutopilotAgentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryReloadMeetingCallArgs = {
  meetingId: Scalars['String']['input'];
};


export type QueryRemoteConstantsArgs = {
  os?: InputMaybe<Scalars['String']['input']>;
  regionCode?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySearchConnectorResourceArgs = {
  connectorId: Scalars['String']['input'];
  connectorSetup?: InputMaybe<Scalars['JSON']['input']>;
  pagination?: InputMaybe<Scalars['JSON']['input']>;
  refresh?: InputMaybe<Scalars['Boolean']['input']>;
  resourceName: Scalars['String']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySearchKnowledgeBaseArgs = {
  input: SearchKnowledgeBaseInput;
};


export type QuerySearchPlaylistsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  mine?: InputMaybe<Scalars['Boolean']['input']>;
  query: Scalars['String']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  teammateOnly?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QuerySearchSoundbitesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  mine?: InputMaybe<Scalars['Boolean']['input']>;
  query: Scalars['String']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  teammateOnly?: InputMaybe<Scalars['Boolean']['input']>;
  userIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QuerySoundbiteArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySoundbitesArgs = {
  aiGenerated?: InputMaybe<Scalars['Boolean']['input']>;
  dateFilter?: InputMaybe<DateFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  meetingId?: InputMaybe<Scalars['String']['input']>;
  meetingIds?: InputMaybe<Array<Scalars['String']['input']>>;
  mine?: InputMaybe<Scalars['Boolean']['input']>;
  myTeam?: InputMaybe<Scalars['Boolean']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  userIds?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryStartAutofillArgs = {
  connectorId: Scalars['String']['input'];
};


export type QueryStartAutofillV2Args = {
  connectorId: Scalars['String']['input'];
};


export type QuerySuggestCategoriesArgs = {
  subProperties: Array<InputMaybe<Scalars['String']['input']>>;
};


export type QueryTeamPermissionPoliciesArgs = {
  teamId: Scalars['String']['input'];
};


export type QueryTrackGlobalSearchClickedArgs = {
  channelId: Scalars['String']['input'];
  filters?: InputMaybe<SearchFilters>;
  keywords?: InputMaybe<Scalars['String']['input']>;
  meetingId: Scalars['String']['input'];
  page: Scalars['Int']['input'];
  region?: InputMaybe<Scalars['String']['input']>;
};


export type QueryUserArgs = {
  timezone?: InputMaybe<Scalars['String']['input']>;
};


export type QueryUserIntegrationContactsArgs = {
  category: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type QueryUserIntegrationsArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
  fetchTeamIntegrations?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


export type QueryValidConnectorAuthorizationArgs = {
  connectorId: Scalars['String']['input'];
};


export type QueryValidateShareSlugArgs = {
  shareSlug: Scalars['String']['input'];
};


export type QueryVerifyConnectorApiKeyArgs = {
  authSetup?: InputMaybe<Scalars['JSON']['input']>;
  connectorId: Scalars['String']['input'];
};


export type QueryWeeklyUsageArgs = {
  weekNo?: InputMaybe<Scalars['Int']['input']>;
  year?: InputMaybe<Scalars['Int']['input']>;
};

export type RandomNote = {
  __typename?: 'RandomNote';
  audio_url?: Maybe<Scalars['String']['output']>;
  calId?: Maybe<Scalars['String']['output']>;
  contact?: Maybe<Scalars['String']['output']>;
  contact2?: Maybe<Scalars['String']['output']>;
  contact_email?: Maybe<Scalars['String']['output']>;
  creator?: Maybe<Scalars['String']['output']>;
  creator_email?: Maybe<Scalars['String']['output']>;
  date?: Maybe<Scalars['Float']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['Int']['output']>;
  endDate?: Maybe<Scalars['Float']['output']>;
  fredAdded?: Maybe<Scalars['Boolean']['output']>;
  fullText?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  note?: Maybe<Scalars['String']['output']>;
  owner?: Maybe<Scalars['String']['output']>;
  parseId?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  title2?: Maybe<Scalars['String']['output']>;
  transcriptParseId?: Maybe<Scalars['String']['output']>;
  users?: Maybe<Array<Scalars['Int']['output']>>;
};

export type Reaction = {
  __typename?: 'Reaction';
  reaction?: Maybe<Scalars['String']['output']>;
  unifiedId?: Maybe<Scalars['String']['output']>;
  userEmail?: Maybe<Scalars['String']['output']>;
};

export type ReactionInput = {
  reaction?: InputMaybe<Scalars['String']['input']>;
  unifiedId?: InputMaybe<Scalars['String']['input']>;
};

export type RealTimeAddOnsAppMetadata = {
  __typename?: 'RealTimeAddOnsAppMetadata';
  zoomApp?: Maybe<ZoomAppMetadata>;
};

export type RealtimeSettings = {
  __typename?: 'RealtimeSettings';
  enableRealtimeTranscription?: Maybe<Scalars['Boolean']['output']>;
};

export type RealtimeSettingsInput = {
  enableRealtimeTranscription?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RealtimeSettingsMeta = {
  __typename?: 'RealtimeSettingsMeta';
  sendRealtimeInsightsInChat?: Maybe<Scalars['Boolean']['output']>;
};

export type RealtimeSettingsMetaInput = {
  sendRealtimeInsightsInChat?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RecapConfig = {
  __typename?: 'RecapConfig';
  id: Scalars['ID']['output'];
  sections: Array<RecapConfigSection>;
  userId: Scalars['String']['output'];
};

export type RecapConfigSection = {
  __typename?: 'RecapConfigSection';
  key: Scalars['ID']['output'];
};

export type RecapConfigSectionInput = {
  key: Scalars['ID']['input'];
};

export type RecentHeadline = {
  __typename?: 'RecentHeadline';
  content?: Maybe<Scalars['String']['output']>;
  emoji?: Maybe<Scalars['String']['output']>;
  occurredAt?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type RecommendationRule = {
  __typename?: 'RecommendationRule';
  aiAppIds: Array<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  default?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  roleId: Scalars['String']['output'];
  titleId?: Maybe<Scalars['String']['output']>;
  type: EnumAppRecommendationDocumentType;
  updatedAt: Scalars['DateTime']['output'];
};

export type RecommendedApp = {
  __typename?: 'RecommendedApp';
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  relevanceScore?: Maybe<Scalars['Float']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type RecordConsentNoticeInput = {
  channel: ClientConsentChannel;
  /** Ties the row to this client's log lines. */
  correlationId: Scalars['String']['input'];
  meetingId: Scalars['ID']['input'];
  /** What participants saw or heard, as this build rendered it. Sent by the client because the wording lives in the app bundle, not on the server. */
  noticeBody?: InputMaybe<Scalars['String']['input']>;
  outcome: ClientConsentOutcome;
  /** Machine-readable cause, required in practice when outcome is `failed`. */
  reason?: InputMaybe<Scalars['String']['input']>;
  source: Scalars['String']['input'];
};

export type RecordConsentNoticePayload = {
  __typename?: 'RecordConsentNoticePayload';
  ok: Scalars['Boolean']['output'];
};

export type RecorderMetadata = {
  __typename?: 'RecorderMetadata';
  recorder_type?: Maybe<Scalars['String']['output']>;
  recorder_version?: Maybe<Scalars['String']['output']>;
};

export type RecordingPreferences = {
  __typename?: 'RecordingPreferences';
  teamsConsentEnabled: Scalars['Boolean']['output'];
};

export type RecrawlKnowledgeBaseUrlInput = {
  category: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  subPages?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<NamespaceType>;
  urls: Array<Scalars['String']['input']>;
};

export type Referral = {
  __typename?: 'Referral';
  _id: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['ID']['output'];
  creditAmount?: Maybe<Scalars['Int']['output']>;
  creditType?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  lastSentAt?: Maybe<Scalars['DateTime']['output']>;
  referralEmail: Scalars['String']['output'];
  slackThreadId?: Maybe<Scalars['String']['output']>;
  status: EnumReferralStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type ReferralCreditsAwarded = {
  __typename?: 'ReferralCreditsAwarded';
  count: Scalars['Float']['output'];
  creditAmount: Scalars['Float']['output'];
  creditType: Scalars['String']['output'];
};

export type RefineSummaryInput = {
  customPrompt?: InputMaybe<Scalars['String']['input']>;
  length?: InputMaybe<EnumSummaryLength>;
  meetingId: Scalars['String']['input'];
  preserveSectionStructure?: InputMaybe<Scalars['Boolean']['input']>;
  refineType?: InputMaybe<EnumRefineType>;
  templateId?: InputMaybe<Scalars['String']['input']>;
};

export type RefineSummaryResult = {
  __typename?: 'RefineSummaryResult';
  basicSections?: Maybe<Scalars['JSON']['output']>;
  cost: Scalars['Float']['output'];
  extendedSections?: Maybe<Scalars['JSON']['output']>;
  keywords: Scalars['String']['output'];
  /** @deprecated No longer used. Sections are returned directly. */
  refinementId?: Maybe<Scalars['String']['output']>;
  summary: Scalars['String']['output'];
};

export type RegenerateAppOutputInput = {
  eventId: Scalars['String']['input'];
  overwrite?: Scalars['Boolean']['input'];
};

export type RegisterInput = {
  certificate?: InputMaybe<Scalars['String']['input']>;
  clientId?: InputMaybe<Scalars['String']['input']>;
  discoverUrl?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  idpUrl?: InputMaybe<Scalars['String']['input']>;
  token: Scalars['String']['input'];
  type: SsoType;
};

export type RegisterSsoResponse = {
  __typename?: 'RegisterSsoResponse';
  domain?: Maybe<Scalars['String']['output']>;
  guid?: Maybe<Scalars['String']['output']>;
  redirectUrl?: Maybe<Scalars['String']['output']>;
};

export type RemoteConstants = {
  __typename?: 'RemoteConstants';
  DEMO_MEETING_ID: Scalars['String']['output'];
  HIDE_PAID_FEATURES: Scalars['Boolean']['output'];
  MAX_RECORDING_DURATION: Scalars['Float']['output'];
  PAYWALL_VISIBILITY: PaywallVisibility;
  SUPPORTED_LANGUAGES: Array<SupportedLanguage>;
  VOICE_AGENT_BASE_URL: Scalars['String']['output'];
};

export type Representative = {
  __typename?: 'Representative';
  email: Scalars['String']['output'];
  externalRepresentativeId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type ResetMigrationsResult = {
  __typename?: 'ResetMigrationsResult';
  clearedCount: Scalars['Int']['output'];
  failedCount: Scalars['Int']['output'];
  skippedCount: Scalars['Int']['output'];
};

export type ResetTeamPermissionPolicyInput = {
  capability: Capability;
  teamId: Scalars['String']['input'];
};

/**
 * An owner-aware capability decision paired with the resource it was evaluated
 * against, so a batched caller can correlate each decision with its resource
 * through the type system rather than by array position.
 */
export type ResourceCapabilityDecision = {
  __typename?: 'ResourceCapabilityDecision';
  /** The evaluated decision for this resource. */
  decision: CapabilityDecision;
  /** The resource this decision was evaluated against. */
  resource: ResourceOutput;
};

/**
 * ResourceInput names the resource a capability is checked against. When meetingId
 * is set, access-service resolves the meeting's authoritative owner and owning team
 * so the decision is owner-aware without trusting a client-supplied owner.
 */
export type ResourceInput = {
  meetingId?: InputMaybe<Scalars['String']['input']>;
};

/**
 * ResourceOutput identifies which resource a batched decision belongs to. It is a
 * union so each result names its resource kind in the type system; a new resource
 * kind is added as a new member, mirroring how ResourceInput grows.
 */
export type ResourceOutput = MeetingResource;

export type RetryFailedAppEventInput = {
  eventId: Scalars['String']['input'];
};

export type RetryFailedAppEventResult = {
  __typename?: 'RetryFailedAppEventResult';
  appEventId: Scalars['String']['output'];
  integrationsDispatched: Array<Scalars['String']['output']>;
  integrationsError?: Maybe<Scalars['String']['output']>;
};

export type RewindData = {
  __typename?: 'RewindData';
  calendarDurationMin?: Maybe<Scalars['Float']['output']>;
  calendarMeetingCount?: Maybe<Scalars['Int']['output']>;
  durationMin: Scalars['Float']['output'];
  globalMostOccurringDayOfWeek?: Maybe<Scalars['Int']['output']>;
  globalMostOccurringMonth?: Maybe<Scalars['Int']['output']>;
  globalTalkToListenRatio?: Maybe<Scalars['Float']['output']>;
  globalWordsPerMinute?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  meetingCount: Scalars['Int']['output'];
  mostOccurringDay?: Maybe<RewindDay>;
  mostOccurringDayOfWeek?: Maybe<RewindDayOfWeek>;
  mostOccurringMonth?: Maybe<RewindMonth>;
  mostOccurringParticipant?: Maybe<RewindParticipant>;
  mostOccurringWeek?: Maybe<RewindWeek>;
  talkListenRatio?: Maybe<Scalars['Float']['output']>;
  user: AnalyticsUser;
  wordsPerMinute?: Maybe<Scalars['Float']['output']>;
};

export type RewindDay = {
  __typename?: 'RewindDay';
  date: Scalars['String']['output'];
  meetingCount: Scalars['Int']['output'];
};

export type RewindDayOfWeek = {
  __typename?: 'RewindDayOfWeek';
  dayOfWeek: Scalars['Int']['output'];
  meetingCount: Scalars['Int']['output'];
  morePercentage?: Maybe<Scalars['Float']['output']>;
  percentageOfMeetings?: Maybe<Scalars['Int']['output']>;
};

export type RewindMonth = {
  __typename?: 'RewindMonth';
  meetingCount: Scalars['Int']['output'];
  month: Scalars['Int']['output'];
};

export type RewindParticipant = {
  __typename?: 'RewindParticipant';
  meetingCount: Scalars['Int']['output'];
  user: AnalyticsUser;
  userEmail: Scalars['String']['output'];
};

export type RewindWeek = {
  __typename?: 'RewindWeek';
  meetingCount: Scalars['Int']['output'];
  weekNo: Scalars['Int']['output'];
};

export type RoleWithTitles = {
  __typename?: 'RoleWithTitles';
  aiAppIds?: Maybe<Array<Scalars['String']['output']>>;
  createdAt: Scalars['DateTime']['output'];
  default?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
  titles: Array<AppRecommendationTitle>;
  type: EnumAppRecommendationDocumentType;
  updatedAt: Scalars['DateTime']['output'];
};

export type RuleActionInput = {
  channelId?: InputMaybe<Scalars['String']['input']>;
  groupIds?: InputMaybe<Scalars['String']['input']>;
  language?: InputMaybe<Scalars['String']['input']>;
  meetingPrivacy?: InputMaybe<Scalars['String']['input']>;
  meetingTtl?: InputMaybe<Scalars['Int']['input']>;
  orderIndex: Scalars['Int']['input'];
  type: Scalars['String']['input'];
  unit?: InputMaybe<Scalars['String']['input']>;
};

export type RuleActionOutput = {
  __typename?: 'RuleActionOutput';
  channelId?: Maybe<Scalars['String']['output']>;
  groupIds?: Maybe<Scalars['String']['output']>;
  language?: Maybe<Scalars['String']['output']>;
  meetingPrivacy?: Maybe<Scalars['String']['output']>;
  meetingTtl?: Maybe<Scalars['Int']['output']>;
  orderIndex: Scalars['Int']['output'];
  type: Scalars['String']['output'];
  unit?: Maybe<Scalars['String']['output']>;
};

export type RuleConditionInput = {
  filters: Array<RuleFilterInput>;
  operator: FilterOperator;
};

export type RuleConditionOutput = {
  __typename?: 'RuleConditionOutput';
  filters: Array<RuleFilterOutput>;
  operator: FilterOperator;
};

export type RuleExecution = {
  __typename?: 'RuleExecution';
  autoDelete?: Maybe<RuleExecutionAutoDelete>;
  channel?: Maybe<RuleExecutionChannel>;
  extensionId: Scalars['String']['output'];
  extensionTitle?: Maybe<Scalars['String']['output']>;
  meeting: RuleExecutionMeeting;
  meetingId?: Maybe<Scalars['String']['output']>;
  meetingPrivacy?: Maybe<RuleExecutionMeetingPrivacy>;
  passwordLink?: Maybe<RuleExecutionPasswordLink>;
  resourceAttributes?: Maybe<RuleExecutionResourceAttributes>;
  share?: Maybe<RuleExecutionShare>;
  stoppedAt?: Maybe<Scalars['String']['output']>;
  updateLanguage?: Maybe<RuleExecutionUpdateLanguage>;
  userName?: Maybe<Scalars['String']['output']>;
};

export type RuleExecutionAutoDelete = {
  __typename?: 'RuleExecutionAutoDelete';
  meetingTtl?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
};

export type RuleExecutionChannel = {
  __typename?: 'RuleExecutionChannel';
  channelId?: Maybe<Scalars['String']['output']>;
};

export type RuleExecutionFilters = {
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  dateTo?: InputMaybe<Scalars['String']['input']>;
  isTest?: InputMaybe<Scalars['Boolean']['input']>;
  meetingId?: InputMaybe<Scalars['String']['input']>;
  ruleId?: InputMaybe<Scalars['String']['input']>;
};

export type RuleExecutionMeeting = {
  __typename?: 'RuleExecutionMeeting';
  _id: Scalars['String']['output'];
  id: Scalars['String']['output'];
  organizerEmail: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type RuleExecutionMeetingGroup = {
  __typename?: 'RuleExecutionMeetingGroup';
  executions?: Maybe<Array<RuleExecution>>;
  meeting?: Maybe<RuleExecutionMeeting>;
  meetingId: Scalars['String']['output'];
  resourceAttributes?: Maybe<RuleExecutionResourceAttributes>;
};

export type RuleExecutionMeetingPrivacy = {
  __typename?: 'RuleExecutionMeetingPrivacy';
  privacy?: Maybe<Scalars['String']['output']>;
};

export type RuleExecutionOutput = {
  __typename?: 'RuleExecutionOutput';
  hasMore?: Maybe<Scalars['Boolean']['output']>;
  nextCursor?: Maybe<Scalars['String']['output']>;
  ruleExecutions?: Maybe<Array<RuleExecution>>;
  total?: Maybe<Scalars['Int']['output']>;
};

export type RuleExecutionPasswordLink = {
  __typename?: 'RuleExecutionPasswordLink';
  enabled?: Maybe<Scalars['Boolean']['output']>;
};

export type RuleExecutionResourceAttributes = {
  __typename?: 'RuleExecutionResourceAttributes';
  attendees?: Maybe<Array<Scalars['String']['output']>>;
  external?: Maybe<Scalars['Boolean']['output']>;
  host?: Maybe<Scalars['String']['output']>;
  hostUserGroupIds?: Maybe<Array<Scalars['String']['output']>>;
  organizerEmail?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  userGroupIds?: Maybe<Array<Scalars['String']['output']>>;
};

export type RuleExecutionShare = {
  __typename?: 'RuleExecutionShare';
  groupIds?: Maybe<Scalars['String']['output']>;
};

export type RuleExecutionUpdateLanguage = {
  __typename?: 'RuleExecutionUpdateLanguage';
  language?: Maybe<Scalars['String']['output']>;
};

export type RuleExecutionsByMeetingOutput = {
  __typename?: 'RuleExecutionsByMeetingOutput';
  hasMore?: Maybe<Scalars['Boolean']['output']>;
  meetings?: Maybe<Array<RuleExecutionMeetingGroup>>;
  nextCursor?: Maybe<Scalars['String']['output']>;
};

export type RuleFilterInput = {
  field: Scalars['String']['input'];
  fieldType: FieldType;
  operator: RuleOperator;
  value: Scalars['String']['input'];
};

export type RuleFilterOutput = {
  __typename?: 'RuleFilterOutput';
  field: Scalars['String']['output'];
  fieldType: FieldType;
  operator: RuleOperator;
  value: Scalars['String']['output'];
};

export type RuleInput = {
  conditions: Array<InputMaybe<ConditionInput>>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export enum RuleOperator {
  ContainsDomain = 'CONTAINS_DOMAIN',
  EndsWith = 'ENDS_WITH',
  Equals = 'EQUALS',
  GreaterThan = 'GREATER_THAN',
  GreaterThanOrEqual = 'GREATER_THAN_OR_EQUAL',
  Includes = 'INCLUDES',
  LessThan = 'LESS_THAN',
  LessThanOrEqual = 'LESS_THAN_OR_EQUAL',
  NotContainsDomain = 'NOT_CONTAINS_DOMAIN',
  NotEquals = 'NOT_EQUALS',
  NotIncludes = 'NOT_INCLUDES',
  StartsWith = 'STARTS_WITH'
}

export type RuleOutput = {
  __typename?: 'RuleOutput';
  active?: Maybe<Scalars['Boolean']['output']>;
  categories?: Maybe<Array<Scalars['String']['output']>>;
  createdAt?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  globalRuleId?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  nodeSettings?: Maybe<NodeSettingsOutput>;
  privacy?: Maybe<Scalars['String']['output']>;
  teamEnabled?: Maybe<Scalars['Boolean']['output']>;
  templateId?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  trigger: TriggerOutput;
  type?: Maybe<ExtensionType>;
  userId?: Maybe<Scalars['String']['output']>;
  workflowId?: Maybe<Scalars['String']['output']>;
};

export type RuleTriggerInput = {
  condition?: InputMaybe<RuleConditionInput>;
  source: Scalars['String']['input'];
};

export type RuleTriggerOutput = {
  __typename?: 'RuleTriggerOutput';
  condition?: Maybe<RuleConditionOutput>;
  source: Scalars['String']['output'];
};

export type RulesNodeSettingsInput = {
  autoDelete?: InputMaybe<AutoDeleteSettingsInput>;
  channel?: InputMaybe<ChannelSettingsInput>;
  passwordLink?: InputMaybe<PasswordLinkSettingsInput>;
  privacy?: InputMaybe<PrivacyInput>;
  updateLanguage?: InputMaybe<UpdateLanguageSettingsInput>;
  userGroup?: InputMaybe<UserGroupSettingsInput>;
};

export type RunAppManuallyInput = {
  appSettingsId?: InputMaybe<Scalars['String']['input']>;
  appTemplateId?: InputMaybe<Scalars['String']['input']>;
  meetingIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type RunSummaryManuallyInput = {
  meetingId: Scalars['String']['input'];
  mergeManualNotes?: InputMaybe<Scalars['Boolean']['input']>;
  /** One-off language code for this summary only; the saved summary language preference is not changed */
  summaryLanguage?: InputMaybe<Scalars['String']['input']>;
  templateId?: InputMaybe<Scalars['String']['input']>;
};

export type SampleMeeting = {
  __typename?: 'SampleMeeting';
  addedBy?: Maybe<Scalars['String']['output']>;
  allEmails?: Maybe<Scalars['String']['output']>;
  audioOnly?: Maybe<Scalars['Boolean']['output']>;
  audioServiceMetadata?: Maybe<AudioMetaData>;
  audio_url?: Maybe<Scalars['String']['output']>;
  channelIds?: Maybe<Array<Scalars['String']['output']>>;
  createdAt?: Maybe<Scalars['String']['output']>;
  creator?: Maybe<Scalars['String']['output']>;
  creator_email?: Maybe<Scalars['String']['output']>;
  date?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['Float']['output']>;
  durationMins?: Maybe<Scalars['Float']['output']>;
  hasCaptions?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  organizerEmail?: Maybe<Scalars['String']['output']>;
  organizerProfile?: Maybe<Profile>;
  owner?: Maybe<Scalars['String']['output']>;
  parseId?: Maybe<Scalars['String']['output']>;
  privacy?: Maybe<Scalars['String']['output']>;
  private?: Maybe<Scalars['Boolean']['output']>;
  processMeetingStatus?: Maybe<Scalars['String']['output']>;
  sort?: Maybe<Scalars['Float']['output']>;
  startTime?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  users?: Maybe<Array<Scalars['String']['output']>>;
  validAttendees?: Maybe<Array<Scalars['String']['output']>>;
};

export type SaveAutofillConfigResponse = {
  __typename?: 'SaveAutofillConfigResponse';
  config?: Maybe<AutofillConfig>;
  message?: Maybe<Scalars['String']['output']>;
  ok?: Maybe<Scalars['Boolean']['output']>;
  rule?: Maybe<AutofillRule>;
};

export type SaveRefinedSummaryInput = {
  basicSections?: InputMaybe<Array<Scalars['JSON']['input']>>;
  cost?: InputMaybe<Scalars['Float']['input']>;
  extendedSections?: InputMaybe<Array<Scalars['JSON']['input']>>;
  meetingId: Scalars['String']['input'];
  refineType?: InputMaybe<EnumRefineType>;
  refinementId?: InputMaybe<Scalars['String']['input']>;
  templateId?: InputMaybe<Scalars['String']['input']>;
};

export enum ScenarioActionType {
  Image = 'image',
  Text = 'text',
  Url = 'url',
  Video = 'video'
}

export type ScheduledAiCreditsIntervalChange = {
  __typename?: 'ScheduledAICreditsIntervalChange';
  effectiveAt: Scalars['DateTime']['output'];
  interval: Scalars['String']['output'];
  quantity: Scalars['Float']['output'];
};

export type ScheduledMaintenance = {
  __typename?: 'ScheduledMaintenance';
  endDate?: Maybe<Scalars['Date']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  startDate?: Maybe<Scalars['Date']['output']>;
};

export type ScheduledMaintenanceV2 = {
  __typename?: 'ScheduledMaintenanceV2';
  endDate?: Maybe<Scalars['Date']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  startDate?: Maybe<Scalars['Date']['output']>;
};

export type SearchDate = {
  from: Scalars['String']['input'];
  to?: InputMaybe<Scalars['String']['input']>;
};

export type SearchFilters = {
  addedBy?: InputMaybe<Array<Scalars['String']['input']>>;
  company?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  date?: InputMaybe<SearchDate>;
  duration?: InputMaybe<DurationFilter>;
  exact?: InputMaybe<Scalars['Boolean']['input']>;
  match?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  /** Used to return only meetings which has a list of emails as participants/creators. Deprecated from Mongo search due performance */
  participants?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  people?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  privacy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  titles?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  topic?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type SearchKnowledgeBaseInput = {
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  ids: Array<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
  scoreThreshold?: InputMaybe<Scalars['Float']['input']>;
  searchType?: InputMaybe<SearchType>;
  type?: InputMaybe<NamespaceType>;
};

export type SearchKnowledgeBaseResult = {
  __typename?: 'SearchKnowledgeBaseResult';
  cost: Scalars['Float']['output'];
  results: Array<SearchKnowledgeBaseResultItem>;
};

export type SearchKnowledgeBaseResultItem = {
  __typename?: 'SearchKnowledgeBaseResultItem';
  content: Scalars['String']['output'];
  metadata: Scalars['JSON']['output'];
  score: Scalars['Float']['output'];
};

export enum SearchType {
  HybridReranker = 'hybrid_reranker',
  HybridSimple = 'hybrid_simple',
  Text = 'text',
  Vector = 'vector'
}

export type SeenStorageProperites = {
  action: Scalars['String']['input'];
  emails?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  link?: InputMaybe<Scalars['String']['input']>;
};

export type SeenStoragePropertiesInputV2 = {
  action: Scalars['String']['input'];
  emails?: InputMaybe<Array<Scalars['String']['input']>>;
  link?: InputMaybe<Scalars['String']['input']>;
};

export type SelectOption = {
  __typename?: 'SelectOption';
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type SendChurnChatInput = {
  content: Scalars['String']['input'];
  metadata: ChurnMetadataInput;
  requesterEmail: Scalars['String']['input'];
  sessionId?: InputMaybe<Scalars['String']['input']>;
  source: Scalars['String']['input'];
  traceId: Scalars['String']['input'];
};

export type SendNotesIntegration = {
  __typename?: 'SendNotesIntegration';
  _id: Scalars['String']['output'];
  aiAppsTriggerSourcesFilter?: Maybe<Array<Scalars['String']['output']>>;
  authType?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  isConnected: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  shortDescription?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  supportsAutofill?: Maybe<Scalars['Boolean']['output']>;
  supportsConnectorFramework?: Maybe<Scalars['Boolean']['output']>;
};

export enum SendRecapEmailOption {
  Domainparticipants = 'domainparticipants',
  Everyone = 'everyone',
  Owner = 'owner',
  Teamparticipants = 'teamparticipants'
}

export type Sentiments = {
  __typename?: 'Sentiments';
  negative?: Maybe<Scalars['Int']['output']>;
  negativePct?: Maybe<Scalars['Float']['output']>;
  neutral?: Maybe<Scalars['Int']['output']>;
  neutralPct?: Maybe<Scalars['Float']['output']>;
  positive?: Maybe<Scalars['Int']['output']>;
  positivePct?: Maybe<Scalars['Float']['output']>;
};

export type SessionDetails = {
  __typename?: 'SessionDetails';
  browser?: Maybe<Scalars['String']['output']>;
  currentSession?: Maybe<Scalars['Boolean']['output']>;
  date?: Maybe<Scalars['String']['output']>;
  device?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  os?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['Float']['output']>;
};

export type SessionDetailsV2 = {
  __typename?: 'SessionDetailsV2';
  browser?: Maybe<Scalars['String']['output']>;
  currentSession?: Maybe<Scalars['Boolean']['output']>;
  date?: Maybe<Scalars['String']['output']>;
  device?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  os?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['Float']['output']>;
};

export enum SessionPrivacy {
  Link = 'link',
  Owner = 'owner',
  Participatingteammates = 'participatingteammates',
  Teammates = 'teammates',
  Teammatesandparticipants = 'teammatesandparticipants'
}

export type SetDefaultSummaryTemplateInput = {
  templateId: Scalars['String']['input'];
};

export type SetEmailSettingsInput = {
  draftSettings?: InputMaybe<EmailDraftSettingsInput>;
  enabledFeatures?: InputMaybe<Array<EnumEmailFeature>>;
  sortingSettings?: InputMaybe<EmailSortingSettingsInput>;
  source?: InputMaybe<Scalars['String']['input']>;
  updateSample?: InputMaybe<Scalars['Boolean']['input']>;
};

export type SetTeamPermissionPolicyInput = {
  capability: Capability;
  level: PermissionLevel;
  teamId: Scalars['String']['input'];
};

export type SetTeamSummaryTemplateInput = {
  templateId: Scalars['String']['input'];
  userGroupIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SetupIntent = {
  __typename?: 'SetupIntent';
  clientSecret: Scalars['String']['output'];
  id: Scalars['String']['output'];
};

export type SetupPrivateStorageInput = {
  bucket: Scalars['String']['input'];
  provider: EnumPrivateStorageProvider;
  region: Scalars['String']['input'];
};

export type ShareDealWithUsersInput = {
  userIds: Array<Scalars['ID']['input']>;
};

export type ShareMeeting = {
  __typename?: 'ShareMeeting';
  expiresAt?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  invalidationReason?: Maybe<Scalars['String']['output']>;
  inviteeEmail: Scalars['String']['output'];
  inviteeId?: Maybe<Scalars['String']['output']>;
  inviterEmail: Scalars['String']['output'];
  inviterId: Scalars['String']['output'];
  isInvalidated?: Maybe<Scalars['Boolean']['output']>;
  meetingId: Scalars['String']['output'];
  password?: Maybe<Scalars['String']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  shareSlug?: Maybe<Scalars['String']['output']>;
  shareType?: Maybe<Scalars['String']['output']>;
  sharedAt?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  ttl?: Maybe<SharedMeetingTtl>;
};

export type ShareMeetingPayload = {
  __typename?: 'ShareMeetingPayload';
  inviteeList: Array<Scalars['String']['output']>;
  meetingId: Scalars['ID']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  shareType?: Maybe<Scalars['String']['output']>;
  ttl?: Maybe<SharedMeetingTtl>;
};

export type ShareMeetingResponse = {
  __typename?: 'ShareMeetingResponse';
  invite: Array<ShareMeeting>;
  message: Scalars['String']['output'];
  status?: Maybe<Scalars['Boolean']['output']>;
};

export type ShareSlugValidation = {
  __typename?: 'ShareSlugValidation';
  valid: Scalars['Boolean']['output'];
};

export type SharedMeetingTtl = {
  __typename?: 'SharedMeetingTTL';
  duration?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
};

export type SharedMeetingTtlInput = {
  duration?: InputMaybe<Scalars['Int']['input']>;
  unit?: InputMaybe<Scalars['String']['input']>;
};

export type SharedUser = {
  __typename?: 'SharedUser';
  email: Scalars['String']['output'];
  expiresAt?: Maybe<Scalars['String']['output']>;
  host?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  photoUrl?: Maybe<Scalars['String']['output']>;
  sharedMeetingId?: Maybe<Scalars['String']['output']>;
};

export type ShorthandBulletItem = {
  __typename?: 'ShorthandBulletItem';
  contents: Array<Scalars['String']['output']>;
  emoji: Scalars['String']['output'];
  endTime: Scalars['String']['output'];
  startTime: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type SkillToggleInput = {
  active: Scalars['Boolean']['input'];
  appTemplateId: Scalars['String']['input'];
};

export type SlackConnectorSetup = {
  __typename?: 'SlackConnectorSetup';
  busyThreads?: Maybe<Scalars['JSON']['output']>;
  channel?: Maybe<Scalars['JSON']['output']>;
  dailyBrief?: Maybe<Scalars['JSON']['output']>;
  enabled: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  label?: Maybe<Scalars['String']['output']>;
  meetingPrep?: Maybe<Scalars['JSON']['output']>;
};

export type SlackWorkSpace = {
  __typename?: 'SlackWorkSpace';
  id: Scalars['String']['output'];
  isActive?: Maybe<Scalars['Boolean']['output']>;
  registrationFailureReason?: Maybe<Scalars['String']['output']>;
  registrationStatus?: Maybe<Scalars['String']['output']>;
  slackUserEmail?: Maybe<Scalars['String']['output']>;
  slackWorkspaceUrl?: Maybe<Scalars['String']['output']>;
};

export enum Sort {
  Asc = 'asc',
  Desc = 'desc'
}

/** Sort direction */
export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type Soundbite = {
  __typename?: 'Soundbite';
  aiGenerated?: Maybe<Scalars['Boolean']['output']>;
  captions?: Maybe<Array<BiteCaption>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdFrom?: Maybe<BiteOrigin>;
  endTime: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  kind?: Maybe<Scalars['String']['output']>;
  mediaType?: Maybe<Scalars['String']['output']>;
  meetingId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  preview?: Maybe<Scalars['String']['output']>;
  privacies: Array<SoundbitePrivacy>;
  segments?: Maybe<Array<ClipSegment>>;
  sources?: Maybe<Array<MediaSource>>;
  startTime: Scalars['Float']['output'];
  status?: Maybe<Scalars['String']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
  summaryStatus?: Maybe<Scalars['String']['output']>;
  thumbnail?: Maybe<Scalars['String']['output']>;
  user?: Maybe<BiteUser>;
  userId: Scalars['String']['output'];
};

export enum SoundbitePrivacy {
  Participants = 'participants',
  Public = 'public',
  Team = 'team'
}

export type Source = {
  __typename?: 'Source';
  _highlight?: Maybe<Highlight>;
  addedBy?: Maybe<Scalars['String']['output']>;
  allEmails?: Maybe<Scalars['String']['output']>;
  audioOnly?: Maybe<Scalars['Boolean']['output']>;
  audioServiceMetadata?: Maybe<AudioMetaData>;
  audio_url?: Maybe<Scalars['String']['output']>;
  channelIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  createdAt?: Maybe<Scalars['String']['output']>;
  creator?: Maybe<Scalars['String']['output']>;
  creatorProfile?: Maybe<Profile>;
  creator_email?: Maybe<Scalars['String']['output']>;
  date?: Maybe<Scalars['String']['output']>;
  defaultChannelAccess?: Maybe<Scalars['Boolean']['output']>;
  duration?: Maybe<Scalars['Float']['output']>;
  durationMins?: Maybe<Scalars['Float']['output']>;
  hasCaptions?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  isShared?: Maybe<Scalars['Boolean']['output']>;
  meetingExpirySettings?: Maybe<MeetingExpirySettings>;
  owner?: Maybe<Scalars['String']['output']>;
  ownersList?: Maybe<Array<Maybe<Profile>>>;
  parseId?: Maybe<Scalars['String']['output']>;
  privacy?: Maybe<Scalars['String']['output']>;
  private?: Maybe<Scalars['Boolean']['output']>;
  processMeetingStatus?: Maybe<Scalars['String']['output']>;
  sharedMeetingId?: Maybe<Scalars['String']['output']>;
  shortSummary?: Maybe<Scalars['String']['output']>;
  sort?: Maybe<Scalars['Float']['output']>;
  startTime?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  users?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  validAttendees?: Maybe<Array<Scalars['String']['output']>>;
};

export type SpeakerAnalytics = {
  __typename?: 'SpeakerAnalytics';
  duration?: Maybe<Scalars['Float']['output']>;
  durationPct?: Maybe<Scalars['Float']['output']>;
  longestMonologue?: Maybe<Scalars['Float']['output']>;
  monologuesCount?: Maybe<Scalars['Int']['output']>;
  speakerId?: Maybe<Scalars['Int']['output']>;
  speakerName?: Maybe<Scalars['String']['output']>;
  wordCount?: Maybe<Scalars['Int']['output']>;
  wordsPerMinute?: Maybe<Scalars['Float']['output']>;
};

export type SsoLoginOption = {
  __typename?: 'SsoLoginOption';
  label?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
};

export enum SsoType {
  Oauth = 'oauth',
  Saml = 'saml'
}

export type StageStatus = {
  __typename?: 'StageStatus';
  completed: Scalars['Int']['output'];
  failed: Scalars['Int']['output'];
  pending: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type StartAutofillResponse = {
  __typename?: 'StartAutofillResponse';
  ok?: Maybe<Scalars['Boolean']['output']>;
};

export type StartMigrationInput = {
  credentials: Scalars['JSON']['input'];
  platform: Scalars['String']['input'];
};

export type StartMigrationResult = MigrationError | MigrationSuccess;

export type StartUploadResponse = {
  __typename?: 'StartUploadResponse';
  mediaUrl: Scalars['String']['output'];
  uploadUrl: Scalars['String']['output'];
};

export type StripeCoupon = {
  __typename?: 'StripeCoupon';
  amount_off?: Maybe<Scalars['Float']['output']>;
  duration: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  percent_off?: Maybe<Scalars['Float']['output']>;
  valid: Scalars['Boolean']['output'];
};

export type StripeSubscription = {
  __typename?: 'StripeSubscription';
  billing_cycle_anchor: Scalars['Float']['output'];
  cancel_at?: Maybe<Scalars['Float']['output']>;
  cancel_at_period_end: Scalars['Boolean']['output'];
  canceled_at?: Maybe<Scalars['Float']['output']>;
  created: Scalars['Float']['output'];
  current_period_end: Scalars['DateTime']['output'];
  current_period_start: Scalars['DateTime']['output'];
  customer: Scalars['String']['output'];
  days_until_due?: Maybe<Scalars['Float']['output']>;
  ended_at?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  items: SubscriptionItem;
  latest_invoice: SubscriptionInvoice;
  metadata: Scalars['JSON']['output'];
  start_date: Scalars['DateTime']['output'];
  status: EnumSubscriptionStatus;
  stripeCoupon?: Maybe<StripeCoupon>;
  trial_end?: Maybe<Scalars['Float']['output']>;
  trial_start?: Maybe<Scalars['Float']['output']>;
};

export type SubPageInfo = {
  __typename?: 'SubPageInfo';
  title?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
};

export type SubscribeAiExtensionsInput = {
  autoUpgrade?: InputMaybe<Scalars['Boolean']['input']>;
  billingInterval?: InputMaybe<EnumBillingInterval>;
  cardInfo?: InputMaybe<CardInfoInput>;
  defaultSource?: InputMaybe<Scalars['String']['input']>;
  paywall?: InputMaybe<Scalars['String']['input']>;
  prompts: Scalars['Int']['input'];
  referral?: InputMaybe<Scalars['String']['input']>;
  trialPeriodDays?: InputMaybe<Scalars['Int']['input']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  /** Real-time puppet (notetaker) status updates for meetings owned by the authenticated user, delivered over GraphQL subscriptions (SSE). */
  puppetStatusUpdated: PuppetStatusUpdate;
};

export type SubscriptionInvoice = {
  __typename?: 'SubscriptionInvoice';
  amount_due: Scalars['Int']['output'];
  amount_paid: Scalars['Int']['output'];
  attempt_count: Scalars['Int']['output'];
  attempted: Scalars['Boolean']['output'];
  billing_reason?: Maybe<Scalars['String']['output']>;
  created: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  paid: Scalars['Boolean']['output'];
  period_end: Scalars['Int']['output'];
  period_start: Scalars['Int']['output'];
};

export type SubscriptionItem = {
  __typename?: 'SubscriptionItem';
  data: Array<SubscriptionItemData>;
};

export type SubscriptionItemData = {
  __typename?: 'SubscriptionItemData';
  created: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  metadata: Scalars['JSON']['output'];
  plan: SubscriptionPlan;
  price: SubscriptionPrice;
  quantity?: Maybe<Scalars['Int']['output']>;
  subscription: Scalars['String']['output'];
};

export type SubscriptionPlan = {
  __typename?: 'SubscriptionPlan';
  active: Scalars['Boolean']['output'];
  created: Scalars['Int']['output'];
  currency: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  interval: Scalars['String']['output'];
  interval_count: Scalars['Int']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  nickname?: Maybe<Scalars['String']['output']>;
  product: Scalars['String']['output'];
  usage_type: Scalars['String']['output'];
};

export type SubscriptionPrice = {
  __typename?: 'SubscriptionPrice';
  active: Scalars['Boolean']['output'];
  billing_scheme: Scalars['String']['output'];
  created: Scalars['Int']['output'];
  currency: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  metadata: Scalars['JSON']['output'];
  nickname?: Maybe<Scalars['String']['output']>;
  product: Scalars['String']['output'];
  unit_amount?: Maybe<Scalars['Float']['output']>;
};

export type SuggestedApp = {
  __typename?: 'SuggestedApp';
  appTemplateId: Scalars['String']['output'];
  description: Scalars['String']['output'];
  reason: Scalars['String']['output'];
  relevanceScore: Scalars['Float']['output'];
  title: Scalars['String']['output'];
};

export type SuggestedAppResponse = {
  __typename?: 'SuggestedAppResponse';
  appTemplate: AppTemplate;
  reason: Scalars['String']['output'];
  relevanceScore: Scalars['Float']['output'];
};

export type Suggestion = {
  __typename?: 'Suggestion';
  name?: Maybe<Scalars['String']['output']>;
  score?: Maybe<Scalars['Float']['output']>;
};

export type SuggestionPublicProfile = {
  __typename?: 'SuggestionPublicProfile';
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  group?: Maybe<EnumInviteSuggestionsGroup>;
  isOutlook?: Maybe<Scalars['Boolean']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  picture?: Maybe<Scalars['String']['output']>;
};

export type Summary = {
  __typename?: 'Summary';
  actionItems?: Maybe<Scalars['String']['output']>;
  bulletGist?: Maybe<Scalars['String']['output']>;
  freeStyleNotes?: Maybe<Scalars['String']['output']>;
  gist?: Maybe<Scalars['String']['output']>;
  keywords?: Maybe<Array<Scalars['String']['output']>>;
  outline?: Maybe<Scalars['String']['output']>;
  overview?: Maybe<Scalars['String']['output']>;
  promptSuggestions?: Maybe<Array<Scalars['String']['output']>>;
  shortSummary?: Maybe<Scalars['String']['output']>;
  shorthandBullet?: Maybe<Scalars['String']['output']>;
};

export type SummaryAccessLog = {
  __typename?: 'SummaryAccessLog';
  action: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  timestamp: Scalars['Date']['output'];
  userEmail: Scalars['String']['output'];
  userId: Scalars['String']['output'];
  userName?: Maybe<Scalars['String']['output']>;
  userPicture?: Maybe<Scalars['String']['output']>;
};

export type SummarySectionOutput = {
  __typename?: 'SummarySectionOutput';
  json?: Maybe<Scalars['JSON']['output']>;
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
  variant?: Maybe<Scalars['String']['output']>;
};

export type SummarySections = {
  __typename?: 'SummarySections';
  key?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type SummarySectionsInput = {
  key?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type SummarySettings = {
  __typename?: 'SummarySettings';
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  enabled: Scalars['Boolean']['output'];
  extendedSections?: Maybe<Array<SummarySettingsSection>>;
  id: Scalars['ID']['output'];
  length: EnumSummaryLength;
  templateId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['String']['output'];
};

export type SummarySettingsSection = {
  __typename?: 'SummarySettingsSection';
  enabled: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
};

export type SummarySettingsSectionInput = {
  enabled: Scalars['Boolean']['input'];
  id: Scalars['String']['input'];
};

export type SummaryTemplate = {
  __typename?: 'SummaryTemplate';
  categoryId?: Maybe<Scalars['String']['output']>;
  confirmedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  creationMethod?: Maybe<EnumSummaryTemplateCreationMethod>;
  creditsChargedAt?: Maybe<Scalars['DateTime']['output']>;
  default?: Maybe<Scalars['Boolean']['output']>;
  description: Scalars['String']['output'];
  extendedSections: Array<SummaryTemplateSection>;
  id: Scalars['ID']['output'];
  includeInAutoClassification?: Maybe<Scalars['Boolean']['output']>;
  index?: Maybe<Scalars['Float']['output']>;
  sampleFileName?: Maybe<Scalars['String']['output']>;
  sampleMimeType?: Maybe<Scalars['String']['output']>;
  sampleObjectKey?: Maybe<Scalars['String']['output']>;
  sharedUserGroupIds?: Maybe<Array<Scalars['String']['output']>>;
  teamId?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

export type SummaryTemplateSection = {
  __typename?: 'SummaryTemplateSection';
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  prompt: Scalars['String']['output'];
  shared: Scalars['Boolean']['output'];
  style: EnumSummaryStyle;
  title: Scalars['String']['output'];
  type: EnumSummaryType;
  updatedAt: Scalars['DateTime']['output'];
};

/** Visibility scope of a custom summary template */
export enum SummaryTemplateShareScope {
  Team = 'TEAM',
  User = 'USER',
  UserGroup = 'USER_GROUP'
}

export type SupportedLanguage = {
  __typename?: 'SupportedLanguage';
  code: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type SyncPastDealsInput = {
  connectorId?: InputMaybe<Scalars['String']['input']>;
  creatorEmail: Scalars['String']['input'];
  numberOfDays: Scalars['Int']['input'];
  targetGroupId?: InputMaybe<Scalars['String']['input']>;
};

export type TargetScopeMeta = {
  __typename?: 'TargetScopeMeta';
  entire_workspace?: Maybe<Scalars['Boolean']['output']>;
  restricted?: Maybe<Scalars['Boolean']['output']>;
};

export type Task = {
  __typename?: 'Task';
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  completedByUserId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdById: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['DateTime']['output']>;
  generatedOwnerName?: Maybe<Scalars['String']['output']>;
  hasChangedOwner?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  meetingCaptionIndex?: Maybe<Scalars['Int']['output']>;
  meetingId?: Maybe<Scalars['String']['output']>;
  meetingTimestamp?: Maybe<Scalars['String']['output']>;
  origin: EnumTaskOrigin;
  ownerEmail?: Maybe<Scalars['String']['output']>;
  ownerId?: Maybe<Scalars['ID']['output']>;
  ownerProfile?: Maybe<TaskOwnerProfileUnion>;
  ownerType?: Maybe<EnumTaskOwnerType>;
  parentId?: Maybe<Scalars['String']['output']>;
  rank: Scalars['String']['output'];
  status: EnumTaskStatus;
  title: Scalars['String']['output'];
  type: EnumTaskType;
  updatedAt: Scalars['DateTime']['output'];
};

export type TaskFilters = {
  createdAt?: InputMaybe<SearchDate>;
  status?: InputMaybe<Array<EnumTaskStatus>>;
};

export type TaskOwnerProfileUnion = Profile | UserGroup;

export type Team = {
  __typename?: 'Team';
  _id?: Maybe<Scalars['String']['output']>;
  admin?: Maybe<Scalars['String']['output']>;
  admins?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  aiCreditSettings?: Maybe<AiCreditSettings>;
  aiCreditsFreeAccess?: Maybe<AiCreditsFreeAccess>;
  aiCreditsTiers: AiCreditsTiers;
  aiTeammateFreeAccessCanceledAt?: Maybe<Scalars['DateTime']['output']>;
  aiTeammateFreeAccessCanceledReason?: Maybe<Scalars['String']['output']>;
  aiTeammateFreeAccessEndsAt?: Maybe<Scalars['DateTime']['output']>;
  aiTeammateFreeAccessStartedAt?: Maybe<Scalars['DateTime']['output']>;
  amazonQBusinessSettings?: Maybe<AmazonQBusinessSettings>;
  analytics?: Maybe<Scalars['Boolean']['output']>;
  autoAddDomains?: Maybe<Array<Scalars['String']['output']>>;
  autoAddEnabled?: Maybe<Scalars['Boolean']['output']>;
  billingCancelDate?: Maybe<Scalars['DateTime']['output']>;
  billingSettings?: Maybe<BillingSettings>;
  billingStartDate?: Maybe<Scalars['DateTime']['output']>;
  contracts?: Maybe<Array<TeamContract>>;
  counters: Counters;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  dealIntelligenceSettings?: Maybe<DealIntelligenceSettings>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  deletedById?: Maybe<Scalars['String']['output']>;
  downgradeReason?: Maybe<Scalars['String']['output']>;
  grantedAICredits?: Maybe<Array<GrantedAiCredit>>;
  hasTransitionedFromTrialToPaid: Scalars['Boolean']['output'];
  isActive?: Maybe<Scalars['Boolean']['output']>;
  lastBillDate?: Maybe<Scalars['DateTime']['output']>;
  lastMeetingCountedDate?: Maybe<Scalars['DateTime']['output']>;
  metadata?: Maybe<TeamMetadata>;
  minSeats: Scalars['Int']['output'];
  minutes?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  notificationSetting?: Maybe<Scalars['String']['output']>;
  parseTeamId?: Maybe<Scalars['String']['output']>;
  personalAssistantSettings?: Maybe<PersonalAssistantSettings>;
  privateStorageMetadata?: Maybe<PrivateStorageMetadata>;
  settings?: Maybe<TeamSettings>;
  settingsControl?: Maybe<Scalars['Boolean']['output']>;
  ssoGuid?: Maybe<Scalars['String']['output']>;
  storageLimitHitDate?: Maybe<Scalars['DateTime']['output']>;
  stripeObjects: Array<TeamStripeAccount>;
  subscriptionStartedAt?: Maybe<Scalars['DateTime']['output']>;
  teamDispatch?: Maybe<Scalars['String']['output']>;
  teamInviteDisabled?: Maybe<Scalars['Boolean']['output']>;
  teamSize?: Maybe<Scalars['Float']['output']>;
  teammates: Array<Teammate>;
  tier?: Maybe<Scalars['String']['output']>;
  unpaidInvoices?: Maybe<Array<UnpaidInvoice>>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** The resolved permission level for one capability on a team. */
export type TeamCapabilityPolicy = {
  __typename?: 'TeamCapabilityPolicy';
  /** The governed capability. */
  capability: Capability;
  /** True when the level is the registry default (no team override stored). */
  isDefault: Scalars['Boolean']['output'];
  /**
   * Effective level for this team: the stored override if set, otherwise the
   * capability's registry default.
   */
  level: PermissionLevel;
};

export type TeamContract = {
  __typename?: 'TeamContract';
  id: Scalars['String']['output'];
  signed: Scalars['Boolean']['output'];
  type: Scalars['String']['output'];
};

export type TeamMeetingExpirySettings = {
  __typename?: 'TeamMeetingExpirySettings';
  isDisabledByAdmin?: Maybe<Scalars['Boolean']['output']>;
  meetingTtl: Scalars['Int']['output'];
  unit: EnumMeetingExpirySettingsTimeUnits;
};

export type TeamMeetingExpirySettingsInput = {
  isDisabledByAdmin?: InputMaybe<Scalars['Boolean']['input']>;
  meetingTtl: Scalars['Int']['input'];
  unit: EnumMeetingExpirySettingsTimeUnits;
};

export type TeamMetadata = {
  __typename?: 'TeamMetadata';
  _id: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  flags?: Maybe<TeamMetadataFlags>;
  id: Scalars['String']['output'];
  teamId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type TeamMetadataFlags = {
  __typename?: 'TeamMetadataFlags';
  hasClaimedAICreditsActivationCampaign?: Maybe<Scalars['Boolean']['output']>;
};

export type TeamMinutesConsumed = {
  __typename?: 'TeamMinutesConsumed';
  isInfinity?: Maybe<Scalars['Boolean']['output']>;
  minutesConsumed?: Maybe<Scalars['Float']['output']>;
  shouldGiveUnlimitedMeetings?: Maybe<Scalars['Boolean']['output']>;
  storageLimitHitDate?: Maybe<Scalars['DateTime']['output']>;
  tierLimit?: Maybe<Scalars['Float']['output']>;
};

export type TeamOnboardingSuggestion = {
  __typename?: 'TeamOnboardingSuggestion';
  freeTrial: Scalars['Boolean']['output'];
  suggestion: Scalars['String']['output'];
  teams: Array<TeamSuggested>;
};

export type TeamPromptsConsumed = {
  __typename?: 'TeamPromptsConsumed';
  allMicroCreditsUsed?: Maybe<Scalars['Float']['output']>;
  allPromptsUsed?: Maybe<Scalars['Float']['output']>;
  freePrompts?: Maybe<Scalars['Float']['output']>;
  grantedCreditsLeft?: Maybe<Scalars['Float']['output']>;
  microCreditsLeft?: Maybe<Scalars['Float']['output']>;
  monthlyMicroCreditsUsed?: Maybe<Scalars['Float']['output']>;
  monthlyPromptsLimit?: Maybe<Scalars['Float']['output']>;
  monthlyPromptsUsed?: Maybe<Scalars['Float']['output']>;
  promptsLeft?: Maybe<Scalars['Float']['output']>;
  yearlyAICreditsQuantity?: Maybe<Scalars['Float']['output']>;
};

export type TeamRequest = {
  __typename?: 'TeamRequest';
  _id: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  hasUserSeen: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  profile?: Maybe<Profile>;
  requestedBy: Scalars['String']['output'];
  status: EnumTeamRequestStatus;
  teamId: Scalars['String']['output'];
  teamName?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  updatedBy?: Maybe<Scalars['String']['output']>;
};

export type TeamRuleOutput = {
  __typename?: 'TeamRuleOutput';
  actions?: Maybe<Array<RuleActionOutput>>;
  active?: Maybe<Scalars['Boolean']['output']>;
  categories?: Maybe<Array<Scalars['String']['output']>>;
  createdAt?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  globalRuleId?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  nodeSettings?: Maybe<NodeSettingsOutput>;
  priority?: Maybe<Scalars['Int']['output']>;
  privacy?: Maybe<Scalars['String']['output']>;
  teamEnabled?: Maybe<Scalars['Boolean']['output']>;
  templateId?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  trigger: RuleTriggerOutput;
  type?: Maybe<ExtensionType>;
  userId?: Maybe<Scalars['String']['output']>;
  workflowId?: Maybe<Scalars['String']['output']>;
};

export type TeamSettings = {
  __typename?: 'TeamSettings';
  aiAppsPrivacy?: Maybe<Scalars['String']['output']>;
  allowPersonalAssistant?: Maybe<Scalars['Boolean']['output']>;
  applyToAdminsKeys?: Maybe<Array<Scalars['String']['output']>>;
  autoJoin?: Maybe<Scalars['String']['output']>;
  barRules?: Maybe<Array<Scalars['String']['output']>>;
  copilotAgentSettings?: Maybe<CopilotAgentTeamSettings>;
  customBotName?: Maybe<Scalars['String']['output']>;
  disableChromeExtensionRecording?: Maybe<Scalars['Boolean']['output']>;
  disableDesktopRecording?: Maybe<Scalars['Boolean']['output']>;
  disableEmailAssistant?: Maybe<Scalars['Boolean']['output']>;
  disableFirefliesTalk?: Maybe<Scalars['Boolean']['output']>;
  disableMobileRecording?: Maybe<Scalars['Boolean']['output']>;
  disableTeammatesFromConnectingIntegrations?: Maybe<Scalars['Boolean']['output']>;
  enforceDesktopConsentAudio?: Maybe<Scalars['Boolean']['output']>;
  enforceDesktopConsentCamera?: Maybe<Scalars['Boolean']['output']>;
  enforceDesktopConsentChat?: Maybe<Scalars['Boolean']['output']>;
  isAllowedToCreateAIApps?: Maybe<Scalars['String']['output']>;
  isAllowedToSeePrompts?: Maybe<Scalars['Boolean']['output']>;
  isPrivacyLocked?: Maybe<Scalars['Boolean']['output']>;
  joinRules?: Maybe<Array<Scalars['String']['output']>>;
  lockedSettings?: Maybe<Array<Scalars['String']['output']>>;
  meetingChatMessage?: Maybe<Scalars['String']['output']>;
  meetingExpirySettings?: Maybe<TeamMeetingExpirySettings>;
  meetingVideoRecording?: Maybe<Scalars['String']['output']>;
  personalAssistantSkills?: Maybe<PersonalAssistantTeamSettings>;
  preferredLanguage?: Maybe<Scalars['String']['output']>;
  privacy?: Maybe<Scalars['String']['output']>;
  puppetRecordingMessageEnabled?: Maybe<Scalars['Boolean']['output']>;
  recordingNoti?: Maybe<Scalars['String']['output']>;
  recordingNotiLocked?: Maybe<Scalars['Boolean']['output']>;
  retainArtifactsSetting?: Maybe<Scalars['String']['output']>;
  sendNotesTo?: Maybe<Scalars['String']['output']>;
  sendRealtimeChatNotification?: Maybe<Scalars['String']['output']>;
  sendRealtimeInsightsInChat?: Maybe<Scalars['String']['output']>;
  sharePublicMeetingWithoutInterruption?: Maybe<Scalars['Boolean']['output']>;
  summaryAutoClassification?: Maybe<Scalars['String']['output']>;
  summaryLanguage?: Maybe<Scalars['String']['output']>;
};

export type TeamStripeAccount = {
  __typename?: 'TeamStripeAccount';
  _id?: Maybe<Scalars['String']['output']>;
  aiExtensionsSubscription?: Maybe<AiExtensionsSubscription>;
  couponCampaign?: Maybe<Scalars['String']['output']>;
  couponCountry?: Maybe<Scalars['String']['output']>;
  customBotNameSubscription?: Maybe<CustomBotNameSubscription>;
  freePeriodEndsAt?: Maybe<Scalars['DateTime']['output']>;
  freePeriodPlanId?: Maybe<Scalars['String']['output']>;
  freePeriodSeats?: Maybe<Scalars['Float']['output']>;
  freeTrial?: Maybe<EnumFreeTrial>;
  hasTrialed?: Maybe<Scalars['Boolean']['output']>;
  hasTrialedAIExtensions?: Maybe<Scalars['Boolean']['output']>;
  hasTrialedAfterChurn?: Maybe<Scalars['Boolean']['output']>;
  hasUsedChurnDiscount?: Maybe<Scalars['Boolean']['output']>;
  isUserAdmin?: Maybe<Scalars['Boolean']['output']>;
  seats?: Maybe<Scalars['Int']['output']>;
  stripeCustomer?: Maybe<Scalars['String']['output']>;
  stripePlanId?: Maybe<Scalars['String']['output']>;
  stripePlanNickname?: Maybe<Scalars['String']['output']>;
  stripeSubscriptionId?: Maybe<Scalars['String']['output']>;
  subscribedAt?: Maybe<Scalars['DateTime']['output']>;
  trialEndsAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type TeamSuggested = {
  __typename?: 'TeamSuggested';
  admin: Teammate;
  customName?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  isRequested: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  teamSize: Scalars['Int']['output'];
  teammates: Array<Teammate>;
};

export type TeamSuggestion = {
  __typename?: 'TeamSuggestion';
  suggestion: Scalars['String']['output'];
  team?: Maybe<TeamSuggested>;
};

export type TeamSummaryTemplateDefault = {
  __typename?: 'TeamSummaryTemplateDefault';
  template?: Maybe<SummaryTemplate>;
  templateId: Scalars['String']['output'];
};

export type TeamSummaryTemplateUserGroupSetting = {
  __typename?: 'TeamSummaryTemplateUserGroupSetting';
  templateId: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedByUserId: Scalars['String']['output'];
  userGroupIds: Array<Scalars['String']['output']>;
};

export type Teammate = {
  __typename?: 'Teammate';
  blocked?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  isAdmin?: Maybe<Scalars['Boolean']['output']>;
  isFromSignUp?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  profile?: Maybe<Profile>;
  promptsUsed?: Maybe<Scalars['Float']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  seenAutoAddModal?: Maybe<Scalars['Boolean']['output']>;
  skipSeats?: Maybe<Scalars['Boolean']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
};

export type TextContent = {
  __typename?: 'TextContent';
  type: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type TimeSpentBySummaryTemplateResponse = {
  __typename?: 'TimeSpentBySummaryTemplateResponse';
  timeSpent?: Maybe<Scalars['Int']['output']>;
  totalMeetingsNumber?: Maybe<Scalars['Int']['output']>;
};

export type TogglePersonalAssistantInput = {
  active: Scalars['Boolean']['input'];
  applyForTeam?: InputMaybe<Scalars['Boolean']['input']>;
  skills?: InputMaybe<Array<SkillToggleInput>>;
};

export type TogglePersonalAssistantResponseDto = {
  __typename?: 'TogglePersonalAssistantResponseDto';
  active: Scalars['Boolean']['output'];
  applyForTeam?: Maybe<Scalars['Boolean']['output']>;
};

export type ToggleResponse = {
  __typename?: 'ToggleResponse';
  fredAdded?: Maybe<Scalars['Boolean']['output']>;
  iCalUID?: Maybe<Scalars['String']['output']>;
  meetingId?: Maybe<Scalars['String']['output']>;
};

export type Topic = {
  __typename?: 'Topic';
  isEnd?: Maybe<Scalars['Boolean']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  nodes?: Maybe<Array<Categories>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type TopicHighlight = {
  __typename?: 'TopicHighlight';
  highlightedSentences?: Maybe<Array<HighlightedSentence>>;
  highlightedWords?: Maybe<Array<HighlightedWords>>;
  length?: Maybe<Scalars['Int']['output']>;
  topic?: Maybe<Scalars['String']['output']>;
};

export type TopicInsights = {
  __typename?: 'TopicInsights';
  endTime: Scalars['DateTime']['output'];
  startTime: Scalars['DateTime']['output'];
  teammates: Array<TopicInsightsTeammates>;
  topics: Array<Topics>;
};

export type TopicInsightsTeammates = {
  __typename?: 'TopicInsightsTeammates';
  endTime: Scalars['DateTime']['output'];
  meetingNotesCount: Scalars['Int']['output'];
  meetingsCount: Scalars['Int']['output'];
  startTime: Scalars['DateTime']['output'];
  topics: Array<Topics>;
  user: AnalyticsUser;
};

export enum TopicType {
  Enabled = 'enabled',
  Mine = 'mine',
  Team = 'team'
}

export type Topics = {
  __typename?: 'Topics';
  conversations: Scalars['Int']['output'];
  keywords: Array<Keyword>;
  mentions: Scalars['Int']['output'];
  topic: Scalars['String']['output'];
};

export type TrackReferralsResponse = {
  __typename?: 'TrackReferralsResponse';
  creditsAwarded: Array<ReferralCreditsAwarded>;
  referrals: Array<Referral>;
};

export type TrackingParams = {
  __typename?: 'TrackingParams';
  anonymTrackingIDs?: Maybe<AnonymTrackingIDs>;
  clickIds?: Maybe<ClickIds>;
  lastClientIP?: Maybe<Scalars['String']['output']>;
  userAgent?: Maybe<Scalars['String']['output']>;
};

export enum TranscribeType {
  Credit = 'CREDIT',
  Paid = 'PAID',
  RetryFailed = 'RETRY_FAILED'
}

export type TriggerConditionInput = {
  filters: Array<TriggerFilterInput>;
  operator: FilterOperator;
};

export type TriggerConditionOutput = {
  __typename?: 'TriggerConditionOutput';
  filters: Array<TriggerFilterOutput>;
  operator: FilterOperator;
};

export type TriggerFilterInput = {
  field: Scalars['String']['input'];
  fieldType: FieldType;
  operator: TriggerOperator;
  value: Scalars['String']['input'];
};

export type TriggerFilterOutput = {
  __typename?: 'TriggerFilterOutput';
  field: Scalars['String']['output'];
  fieldType: FieldType;
  operator: TriggerOperator;
  value: Scalars['String']['output'];
};

export type TriggerInput = {
  condition?: InputMaybe<TriggerConditionInput>;
  source: Scalars['String']['input'];
};

export type TriggerOnDemandExtractionResponse = {
  __typename?: 'TriggerOnDemandExtractionResponse';
  message?: Maybe<Scalars['String']['output']>;
  ok?: Maybe<Scalars['Boolean']['output']>;
};

export enum TriggerOperator {
  EndsWith = 'ENDS_WITH',
  Equals = 'EQUALS',
  GreaterThan = 'GREATER_THAN',
  GreaterThanOrEqual = 'GREATER_THAN_OR_EQUAL',
  Includes = 'INCLUDES',
  LessThan = 'LESS_THAN',
  LessThanOrEqual = 'LESS_THAN_OR_EQUAL',
  NotEquals = 'NOT_EQUALS',
  NotIncludes = 'NOT_INCLUDES',
  StartsWith = 'STARTS_WITH'
}

export type TriggerOutput = {
  __typename?: 'TriggerOutput';
  condition?: Maybe<TriggerConditionOutput>;
  source: Scalars['String']['output'];
};

export type UnpaidInvoice = {
  __typename?: 'UnpaidInvoice';
  collectionMethod: UnpaidInvoiceCollectionMethod;
  invoiceCreatedAt: Scalars['DateTime']['output'];
  invoiceDueAt?: Maybe<Scalars['DateTime']['output']>;
  planInterval?: Maybe<Scalars['String']['output']>;
  planNickname?: Maybe<Scalars['String']['output']>;
  reason: UnpaidInvoiceReason;
  stripeInvoiceId: Scalars['String']['output'];
  stripeSubscriptionId?: Maybe<Scalars['String']['output']>;
};

export enum UnpaidInvoiceCollectionMethod {
  ChargeAutomatically = 'CHARGE_AUTOMATICALLY',
  SendInvoice = 'SEND_INVOICE'
}

export enum UnpaidInvoiceReason {
  InvoiceOverdue = 'INVOICE_OVERDUE',
  PaymentFailed = 'PAYMENT_FAILED'
}

export type UnshareDealFromUsersInput = {
  userIds: Array<Scalars['ID']['input']>;
};

export type UpcomingMeetings = {
  __typename?: 'UpcomingMeetings';
  events?: Maybe<Array<CalendarEvents>>;
  isSignedIn?: Maybe<Scalars['Boolean']['output']>;
};

export type UpdateAiCreditSettingsInput = {
  autoUpgrade?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateAiExtensionsPlanInput = {
  autoUpgrade?: InputMaybe<Scalars['Boolean']['input']>;
  billingInterval?: InputMaybe<EnumBillingInterval>;
  endTrial?: InputMaybe<Scalars['Boolean']['input']>;
  paywall?: InputMaybe<Scalars['String']['input']>;
  prompts?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateAiExtensionsSubscription = {
  __typename?: 'UpdateAIExtensionsSubscription';
  aiExtensionsSubscription?: Maybe<AiExtensionsSubscription>;
  billingInfo: BillingInfo;
  teamPromptsConsumed?: Maybe<TeamPromptsConsumed>;
};

export type UpdateAmazonQBusinessSettingsInput = {
  appARN: Scalars['String']['input'];
  awsRegion: Scalars['String']['input'];
  iamIdentityCenterRegion: Scalars['String']['input'];
  qBusinessApplicationId: Scalars['String']['input'];
  qRetrieverId: Scalars['String']['input'];
};

export type UpdateAnnouncementStateInput = {
  announcementId: Scalars['ID']['input'];
};

export type UpdateAppOutputInput = {
  eventId: Scalars['String']['input'];
  output: Scalars['String']['input'];
};

export type UpdateAppSettingsInput = {
  active: Scalars['Boolean']['input'];
  agentic?: InputMaybe<AppSettingsAgenticConfigInput>;
  appPrivacy: EnumAppPrivacy;
  appTemplateId?: InputMaybe<Scalars['String']['input']>;
  autoEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  brandGuidelinesId?: InputMaybe<Scalars['String']['input']>;
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  engine?: InputMaybe<EnumAppEngine>;
  integrations?: InputMaybe<Array<CreateAppIntegrationInput>>;
  model?: InputMaybe<Scalars['String']['input']>;
  outputPrivacy: EnumAppOutputPrivacyType;
  outputPrivacyUserGroupIds?: InputMaybe<Array<Scalars['String']['input']>>;
  outputType?: InputMaybe<EnumAppOutputType>;
  prompt: AppPromptInput;
  ref?: InputMaybe<Scalars['String']['input']>;
  sharedUserGroupIds?: InputMaybe<Array<Scalars['String']['input']>>;
  sources?: InputMaybe<Array<EnumKnowledgeSource>>;
  teamId?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  trigger: CreateAppTriggerInput;
};

export type UpdateAutofillExtractionsResponse = {
  __typename?: 'UpdateAutofillExtractionsResponse';
  message?: Maybe<Scalars['String']['output']>;
  ok?: Maybe<Scalars['Boolean']['output']>;
};

export type UpdateAutopilotAgentInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  isPublished: Scalars['Boolean']['input'];
  knowledgeBase?: InputMaybe<Array<KnowledgeBaseItemInput>>;
  knowledgeBaseCategories?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  name: Scalars['String']['input'];
  organization?: InputMaybe<Scalars['String']['input']>;
  questionParagraph: Scalars['String']['input'];
  settings: AutopilotAgentSettingsInput;
  userInstructions?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateBillingInfoAddressInput = {
  city: Scalars['String']['input'];
  country: Scalars['String']['input'];
  line1: Scalars['String']['input'];
  line2?: InputMaybe<Scalars['String']['input']>;
  postalCode: Scalars['String']['input'];
  state?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateBillingInfoInput = {
  address?: InputMaybe<UpdateBillingInfoAddressInput>;
  name?: InputMaybe<Scalars['String']['input']>;
  taxId?: InputMaybe<UpdateBillingInfoTaxIdInput>;
};

export type UpdateBillingInfoTaxIdInput = {
  type: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type UpdateBillingSettingsInput = {
  billingEmails?: InputMaybe<Array<Scalars['String']['input']>>;
  sendReceiptEnabled?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateContactInput = {
  bio?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCustomBotNameInput = {
  name: Scalars['String']['input'];
};

export type UpdateDealActionItemStatusInput = {
  actionItemId: Scalars['ID']['input'];
  status: EnumAiDealActionItemStatus;
};

export type UpdateDealAiStateInput = {
  aiState: EnumAiDealState;
};

export type UpdateDealIntelligenceSettingsInput = {
  defaultDealPrivacy?: InputMaybe<EnumDealPrivacy>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  userGroupId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDealPrivacyInput = {
  privacy: DealPrivacy;
};

export type UpdateEmailRuleInput = {
  actions?: InputMaybe<Array<EmailRuleActionInput>>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  filters?: InputMaybe<Array<EmailRuleFilterInput>>;
  id: Scalars['ID']['input'];
};

export type UpdateFree1kAiCreditsCampaignStatusInput = {
  accepted: Scalars['Boolean']['input'];
};

export type UpdateLanguageSettingsInput = {
  language?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateLanguageSettingsOutput = {
  __typename?: 'UpdateLanguageSettingsOutput';
  language?: Maybe<Scalars['String']['output']>;
};

export type UpdatePermissionInput = {
  allowedGroupIds?: InputMaybe<Array<Scalars['String']['input']>>;
  allowedUserIds?: InputMaybe<Array<Scalars['String']['input']>>;
  connectorId?: InputMaybe<Scalars['String']['input']>;
  connectorIds?: InputMaybe<Array<Scalars['String']['input']>>;
  permissionLevel: Scalars['String']['input'];
};

export type UpdatePersonalAssistantSettingsInput = {
  autoUpgrade?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdatePlanInput = {
  /** Internal coupon ID from the Coupons collection */
  couponId?: InputMaybe<Scalars['String']['input']>;
  defaultSource?: InputMaybe<Scalars['ID']['input']>;
  discountCouponId?: InputMaybe<Scalars['String']['input']>;
  endTrial?: InputMaybe<Scalars['Boolean']['input']>;
  newPlanId?: InputMaybe<Scalars['String']['input']>;
  paywall?: InputMaybe<Scalars['String']['input']>;
  removeCoupon?: InputMaybe<Scalars['Boolean']['input']>;
  seats?: InputMaybe<Scalars['Int']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePlanWith3ds = {
  __typename?: 'UpdatePlanWith3ds';
  billingInfo?: Maybe<BillingInfo>;
  is3ds?: Maybe<Scalars['Boolean']['output']>;
  redirectUrl?: Maybe<Scalars['String']['output']>;
};

export type UpdateRuleInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  extensionId: Scalars['String']['input'];
  nodeSettings?: InputMaybe<RulesNodeSettingsInput>;
  resourceType?: InputMaybe<Scalars['String']['input']>;
  teamEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  trigger?: InputMaybe<TriggerInput>;
};

export type UpdateScenarioInput = {
  action: Scalars['String']['input'];
  actionType: ScenarioActionType;
  rule: Scalars['String']['input'];
};

export type UpdateSummarySectionInput = {
  id: Scalars['String']['input'];
};

export type UpdateSummarySettingsInput = {
  enabled: Scalars['Boolean']['input'];
  extendedSections?: InputMaybe<Array<SummarySettingsSectionInput>>;
  id: Scalars['String']['input'];
  length: EnumSummaryLength;
  templateId: Scalars['String']['input'];
};

export type UpdateSummaryTemplateFromPromptInput = {
  description: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type UpdateSummaryTemplateFromSampleInput = {
  customStyle?: InputMaybe<Scalars['String']['input']>;
  mimeType?: InputMaybe<Scalars['String']['input']>;
  objectKey?: InputMaybe<Scalars['String']['input']>;
  sampleContent?: InputMaybe<Scalars['String']['input']>;
  sampleFileName?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSummaryTemplateInput = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  extendedSections: Array<UpdateSummarySectionInput>;
  includeInAutoClassification?: InputMaybe<Scalars['Boolean']['input']>;
  index?: InputMaybe<Scalars['Float']['input']>;
  shareScope?: InputMaybe<SummaryTemplateShareScope>;
  teamId?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  userGroupIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateSyncPreferenceInput = {
  applyToAllWorkspaceMembers: Scalars['Boolean']['input'];
  connectorId: Scalars['String']['input'];
  restrictNonAdminConfiguration: Scalars['Boolean']['input'];
};

export type UpdateTaskInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** Fractional-indexing key that places the task on the board for the calling user */
  rank?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EnumTaskStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTaskOwnerInput = {
  ownerId?: InputMaybe<Scalars['String']['input']>;
  ownerType?: InputMaybe<EnumCreateTaskOwnerType>;
  source?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTeamRuleInput = {
  actions?: InputMaybe<Array<RuleActionInput>>;
  active?: InputMaybe<Scalars['Boolean']['input']>;
  extensionId: Scalars['String']['input'];
  nodeSettings?: InputMaybe<RulesNodeSettingsInput>;
  resourceType?: InputMaybe<Scalars['String']['input']>;
  teamEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  trigger?: InputMaybe<RuleTriggerInput>;
};

export type UpdateUserCountersInput = {
  numberOfGuideTipsForAppsStoreV2Seen?: InputMaybe<Scalars['Int']['input']>;
  timesAccepted1kCreditsCampaignReview?: InputMaybe<Scalars['Int']['input']>;
  timesCanceledSub1kCreditsCampaignReview?: InputMaybe<Scalars['Int']['input']>;
  timesClosedStorageExhaustedPopup?: InputMaybe<Scalars['Int']['input']>;
  timesSeen1kCreditsCampaign?: InputMaybe<Scalars['Int']['input']>;
  timesSeen1kCreditsCampaignReview?: InputMaybe<Scalars['Int']['input']>;
  timesSeenBlackFridayBanner?: InputMaybe<Scalars['Int']['input']>;
  timesSeenEmailAssistantBanner?: InputMaybe<Scalars['Int']['input']>;
  timesSeenEmailAssistantReconnectBanner?: InputMaybe<Scalars['Int']['input']>;
  timesSeenFreeHighValueCampaignBanner?: InputMaybe<Scalars['Int']['input']>;
  timesSeenFreeHighValueCampaignPopupBanner?: InputMaybe<Scalars['Int']['input']>;
  timesSeenHighProfileUserCampaignPopup?: InputMaybe<Scalars['Int']['input']>;
  timesSeenLiteUpgradeModal?: InputMaybe<Scalars['Int']['input']>;
  timesSeenMeetingPageAgentNudge?: InputMaybe<Scalars['Int']['input']>;
  timesSeenPaidHighValueCampaignBanner?: InputMaybe<Scalars['Int']['input']>;
  timesSeenPaidHighValueCampaignPopupBanner?: InputMaybe<Scalars['Int']['input']>;
  timesSeenSkillsRecommendationPopup?: InputMaybe<Scalars['Int']['input']>;
  timesSeenSlackAssistantWelcome?: InputMaybe<Scalars['Int']['input']>;
  timesSeenTalkEmailAssistantNudge?: InputMaybe<Scalars['Int']['input']>;
  timesSeenTalkFeedbackNudge?: InputMaybe<Scalars['Int']['input']>;
  timesSeenTalkSlackAssistantNudge?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateUserDynamicMetadataInput = {
  counters?: InputMaybe<UpdateUserCountersInput>;
  flags?: InputMaybe<UpdateUserFlagsInput>;
  timestamps?: InputMaybe<UpdateUserTimestampsInput>;
};

export type UpdateUserFlagsInput = {
  acceptedTosUpdate?: InputMaybe<Scalars['Boolean']['input']>;
  askFredSidebarModePreferred?: InputMaybe<Scalars['Boolean']['input']>;
  completedEmailAssistantOnboarding?: InputMaybe<Scalars['Boolean']['input']>;
  completedSlackFredOnboarding?: InputMaybe<Scalars['Boolean']['input']>;
  completedTalkFeedbackNudge?: InputMaybe<Scalars['Boolean']['input']>;
  giftedAITeammateCredits?: InputMaybe<Scalars['Boolean']['input']>;
  hasAcceptedTosUpdate2?: InputMaybe<Scalars['Boolean']['input']>;
  hasAccessToEmailAssistant?: InputMaybe<Scalars['Boolean']['input']>;
  hasAccessToSlackAssistant?: InputMaybe<Scalars['Boolean']['input']>;
  hasDismissedEmailAssistantFeedbackBanner?: InputMaybe<Scalars['Boolean']['input']>;
  hasFinishedEmailConnectorOnboarding?: InputMaybe<Scalars['Boolean']['input']>;
  hasFinishedSlackConnectorOnboarding?: InputMaybe<Scalars['Boolean']['input']>;
  isCustomVoiceModalOpened?: InputMaybe<Scalars['Boolean']['input']>;
  isFirstEverAgentCreated?: InputMaybe<Scalars['Boolean']['input']>;
  isVoiceCloneInfoBannerClosed?: InputMaybe<Scalars['Boolean']['input']>;
  needsToOnboardVoiceAgent?: InputMaybe<Scalars['Boolean']['input']>;
  puppetMeetingEndNotificationEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  seenAITeammateGiftedCreditsModal?: InputMaybe<Scalars['Boolean']['input']>;
  seenAITeammatesGuideTooltip?: InputMaybe<Scalars['Boolean']['input']>;
  seenAITeammatesPage?: InputMaybe<Scalars['Boolean']['input']>;
  seenAiAppsCardTooltip?: InputMaybe<Scalars['Boolean']['input']>;
  seenAiAppsFeedWalkthrough?: InputMaybe<Scalars['Boolean']['input']>;
  seenAiAppsOutputMeetingsTooltip?: InputMaybe<Scalars['Boolean']['input']>;
  seenAiAppsTabGuideTip?: InputMaybe<Scalars['Boolean']['input']>;
  seenAppsScheduleGuideTip?: InputMaybe<Scalars['Boolean']['input']>;
  seenAskFredFloatingToSidebarTip?: InputMaybe<Scalars['Boolean']['input']>;
  seenAskFredORatingBar?: InputMaybe<Scalars['Boolean']['input']>;
  seenAskFredSaveSkillCoachmark?: InputMaybe<Scalars['Boolean']['input']>;
  seenAskFredShareResponseTip?: InputMaybe<Scalars['Boolean']['input']>;
  seenAskFredSidebarToFloatingTip?: InputMaybe<Scalars['Boolean']['input']>;
  seenAssistFredTooltip?: InputMaybe<Scalars['Boolean']['input']>;
  seenAutoClassificationToolTip?: InputMaybe<Scalars['Boolean']['input']>;
  seenAutoFillPopup?: InputMaybe<Scalars['Boolean']['input']>;
  seenAutoPilotAgentFeedback?: InputMaybe<Scalars['Boolean']['input']>;
  seenAutopilotTeammateFormTour?: InputMaybe<Scalars['Boolean']['input']>;
  seenCustomSummaryFeatureTip?: InputMaybe<Scalars['Boolean']['input']>;
  seenDarkModeFeedbackNudge?: InputMaybe<Scalars['Boolean']['input']>;
  seenEmailAssistantGuidingTips?: InputMaybe<Scalars['Boolean']['input']>;
  seenExhaustedTopNavTooltip?: InputMaybe<Scalars['Boolean']['input']>;
  seenFreeAICreditsModal?: InputMaybe<Scalars['Boolean']['input']>;
  seenFreeExpansionCampaignTrialModal?: InputMaybe<Scalars['Boolean']['input']>;
  seenFreeHighValueCampaignTrialModal?: InputMaybe<Scalars['Boolean']['input']>;
  seenGiveFreeCreditsToggleOnOnboarding?: InputMaybe<Scalars['Boolean']['input']>;
  seenHomeMeetingNotesPreference?: InputMaybe<Scalars['Boolean']['input']>;
  seenHomeV2AskFredModeWalkthrough?: InputMaybe<Scalars['Boolean']['input']>;
  seenHomeV2Walkthrough?: InputMaybe<Scalars['Boolean']['input']>;
  seenMeetingAccessTooltip?: InputMaybe<Scalars['Boolean']['input']>;
  seenMeetingNotesPreference?: InputMaybe<Scalars['Boolean']['input']>;
  seenMeetingPrepTooltip?: InputMaybe<Scalars['Boolean']['input']>;
  seenMembersUserGroupsGuideTip?: InputMaybe<Scalars['Boolean']['input']>;
  seenNavigationWalkthrough?: InputMaybe<Scalars['Boolean']['input']>;
  seenNotebookWalkthroughGroup1?: InputMaybe<Scalars['Boolean']['input']>;
  seenNotebookWalkthroughGroup2?: InputMaybe<Scalars['Boolean']['input']>;
  seenNotepadAiSkillsTabGuideTip?: InputMaybe<Scalars['Boolean']['input']>;
  seenNotepadExperimentWalkthrough?: InputMaybe<Scalars['Boolean']['input']>;
  seenNotesLengthOptIn?: InputMaybe<Scalars['Boolean']['input']>;
  seenPersonalAssistantTooltip?: InputMaybe<Scalars['Boolean']['input']>;
  seenRefineSummaryCoachmark?: InputMaybe<Scalars['Boolean']['input']>;
  seenRefineSummaryTip?: InputMaybe<Scalars['Boolean']['input']>;
  seenSkillsOnboardingDialog?: InputMaybe<Scalars['Boolean']['input']>;
  seenSlackAnnouncementModal?: InputMaybe<Scalars['Boolean']['input']>;
  seenSlackNudgeInAskFred?: InputMaybe<Scalars['Boolean']['input']>;
  seenSummaryTemplatesTip?: InputMaybe<Scalars['Boolean']['input']>;
  seenTeamSettingsOnboardingModal?: InputMaybe<Scalars['Boolean']['input']>;
  seenWelcomePageWalkthrough?: InputMaybe<Scalars['Boolean']['input']>;
  subscribedFreeTrialOnAiTeammates?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateUserGroupInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  handle?: InputMaybe<Scalars['String']['input']>;
  memberIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserGroupSettingsInput = {
  settings: UpdateUserGroupSettingsSettingsInput;
  userGroupId: Scalars['ID']['input'];
};

export type UpdateUserGroupSettingsSettingsInput = {
  aiAppsPrivacy?: InputMaybe<Scalars['String']['input']>;
  autoJoin?: InputMaybe<Scalars['String']['input']>;
  meetingExpirySettings?: InputMaybe<TeamMeetingExpirySettingsInput>;
  privacy?: InputMaybe<Scalars['String']['input']>;
  retainArtifactsSetting?: InputMaybe<Scalars['String']['input']>;
  sendNotesTo?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserTimestampsInput = {
  acceptedTosUpdate2At?: InputMaybe<Scalars['Date']['input']>;
  acceptedTosUpdateAt?: InputMaybe<Scalars['Date']['input']>;
  lastSeen1kCreditsCampaign?: InputMaybe<Scalars['Date']['input']>;
  lastTimeSeenEmailAssistantBanner?: InputMaybe<Scalars['Date']['input']>;
  lastTimeSeenEmailAssistantReconnectBanner?: InputMaybe<Scalars['Date']['input']>;
  lastTimeSeenFreeHighValueCampaignBanner?: InputMaybe<Scalars['Date']['input']>;
  lastTimeSeenFreeHighValueCampaignPopupBanner?: InputMaybe<Scalars['Date']['input']>;
  lastTimeSeenHighProfileUserCampaignPopup?: InputMaybe<Scalars['Date']['input']>;
  lastTimeSeenLiteUpgradeModal?: InputMaybe<Scalars['Date']['input']>;
  lastTimeSeenPaidHighValueCampaignBanner?: InputMaybe<Scalars['Date']['input']>;
  lastTimeSeenPaidHighValueCampaignPopupBanner?: InputMaybe<Scalars['Date']['input']>;
  lastTimeSeenSlackAssistantWelcome?: InputMaybe<Scalars['Date']['input']>;
  lastTimeSeenTalkEmailAssistantNudge?: InputMaybe<Scalars['Date']['input']>;
  lastTimeSeenTalkSlackAssistantNudge?: InputMaybe<Scalars['Date']['input']>;
};

export type UploadClonedVoiceParams = {
  mimeType: Scalars['String']['input'];
  voiceBase64: Scalars['String']['input'];
};

export type UploadClonedVoiceResponse = {
  __typename?: 'UploadClonedVoiceResponse';
  message?: Maybe<Scalars['String']['output']>;
  storageKey?: Maybe<Scalars['String']['output']>;
};

export type UploadFlowSchema = {
  __typename?: 'UploadFlowSchema';
  acceptedFormats: Array<Scalars['String']['output']>;
  buttonLabel: Scalars['String']['output'];
};

export type UpsertMeetingPrepAppInput = {
  active: Scalars['Boolean']['input'];
  notificationPreference: EnumMeetingPrepAppNotificationType;
  showCompanyInsights: Scalars['Boolean']['input'];
  showEmailInsights?: InputMaybe<Scalars['Boolean']['input']>;
  showParticipantInfo: Scalars['Boolean']['input'];
  showPastNotes: Scalars['Boolean']['input'];
  showPastSyncsSummary: Scalars['Boolean']['input'];
};

export type User = {
  __typename?: 'User';
  _id?: Maybe<Scalars['String']['output']>;
  aiAppsPreferences?: Maybe<Array<AiAppsPreference>>;
  aiAppsPrivacy?: Maybe<Scalars['String']['output']>;
  aiCreditsCost?: Maybe<Scalars['Int']['output']>;
  aiExtensionsPermission?: Maybe<EnumAiExtensionsPermissionType>;
  alias?: Maybe<Scalars['String']['output']>;
  approvedTerms?: Maybe<Scalars['Boolean']['output']>;
  askFredModel?: Maybe<Scalars['String']['output']>;
  askFredTooltipViewed?: Maybe<Scalars['Boolean']['output']>;
  autoJoin?: Maybe<Scalars['String']['output']>;
  banAccountLogin?: Maybe<Scalars['Boolean']['output']>;
  barRules?: Maybe<Array<Scalars['String']['output']>>;
  calendarStatus?: Maybe<CalendarStatus>;
  cancelledAccount?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  customBotName?: Maybe<Scalars['String']['output']>;
  dictionaries?: Maybe<Array<CustomDictionary>>;
  disableShowFreeTrialModal?: Maybe<Scalars['Boolean']['output']>;
  dispatch?: Maybe<Scalars['String']['output']>;
  domain?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  emails?: Maybe<Array<Email>>;
  firefliesChatWidgetIdentity?: Maybe<Scalars['String']['output']>;
  flags?: Maybe<UserFlags>;
  focusSettings?: Maybe<FocusSettings>;
  freeMeetingsLeft?: Maybe<Scalars['Int']['output']>;
  freeTrial?: Maybe<EnumFreeTrial>;
  freeUploadPoints?: Maybe<Scalars['Int']['output']>;
  freeUploadsClaimed?: Maybe<Array<Scalars['String']['output']>>;
  givenRealtimeFeedback?: Maybe<Scalars['Boolean']['output']>;
  hasCalender?: Maybe<Scalars['Boolean']['output']>;
  hasDismissedVideoPaywallBanner?: Maybe<Scalars['Boolean']['output']>;
  hasSeenAskFredOnboarding?: Maybe<Scalars['Boolean']['output']>;
  hasTeammates?: Maybe<Scalars['Boolean']['output']>;
  industry?: Maybe<Scalars['String']['output']>;
  isAdmin?: Maybe<Scalars['Boolean']['output']>;
  isAllowedToUseAICredits: Scalars['Boolean']['output'];
  isAllowedToUsePrompts: Scalars['Boolean']['output'];
  isPrivateStorageAllowed: Scalars['Boolean']['output'];
  joinRules?: Maybe<Array<Scalars['String']['output']>>;
  lastLogin?: Maybe<Scalars['Date']['output']>;
  lastTimeSeenFreeTrialModal?: Maybe<Scalars['Date']['output']>;
  lastTranscribedMeetingId?: Maybe<Scalars['String']['output']>;
  meetingChatMessage?: Maybe<Scalars['String']['output']>;
  meetingExpirySettings?: Maybe<MeetingExpirySettings>;
  meetingPrepEmailNotificationPreference?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  minutesConsumed?: Maybe<Scalars['Int']['output']>;
  needsToOnboard?: Maybe<Scalars['Boolean']['output']>;
  notesInjected?: Maybe<Scalars['Int']['output']>;
  numMeetingsWithNotes?: Maybe<Scalars['Int']['output']>;
  numberNotes?: Maybe<Scalars['Int']['output']>;
  onboardingStepsCompleted?: Maybe<Array<Scalars['String']['output']>>;
  paidUser?: Maybe<Scalars['String']['output']>;
  parseUserId?: Maybe<Scalars['String']['output']>;
  photoUrl?: Maybe<Scalars['String']['output']>;
  picture?: Maybe<Scalars['String']['output']>;
  preferredLanguage?: Maybe<Scalars['String']['output']>;
  privacy?: Maybe<Scalars['String']['output']>;
  profile?: Maybe<Profile>;
  puppetRecordingMessageEnabled?: Maybe<Scalars['Boolean']['output']>;
  pylonIdentityHash?: Maybe<Scalars['String']['output']>;
  realTimeAddOnsAppMetadata?: Maybe<RealTimeAddOnsAppMetadata>;
  realtimeEmailNotificationPreference?: Maybe<Scalars['String']['output']>;
  realtimeSettings?: Maybe<RealtimeSettings>;
  recordingNoti?: Maybe<Scalars['String']['output']>;
  referralCode?: Maybe<Scalars['String']['output']>;
  screenSharingEnabled?: Maybe<Scalars['Boolean']['output']>;
  seenAIExtensionsModal?: Maybe<Scalars['Boolean']['output']>;
  seenAskFredAnnouncement?: Maybe<Scalars['Boolean']['output']>;
  seenAskFredTooltip?: Maybe<Scalars['Boolean']['output']>;
  seenFeedAnnouncement?: Maybe<Scalars['Boolean']['output']>;
  seenFreeTrialModal?: Maybe<Scalars['Boolean']['output']>;
  seenHuddlesAnnouncement?: Maybe<Scalars['Boolean']['output']>;
  seenLanguageAnnouncement?: Maybe<Scalars['Boolean']['output']>;
  seenNotepadTour?: Maybe<Scalars['Boolean']['output']>;
  seenPrivacyModal?: Maybe<Scalars['Boolean']['output']>;
  seenReferralCashBalanceModal?: Maybe<Scalars['Boolean']['output']>;
  seenZoomConnectModal?: Maybe<Scalars['Boolean']['output']>;
  sendNotesTo?: Maybe<Scalars['String']['output']>;
  sendRealtimeChatNotification?: Maybe<Scalars['Boolean']['output']>;
  shouldRequestMeetingAccessImParticipantOf?: Maybe<Scalars['Boolean']['output']>;
  shouldVideoRecordMeeting?: Maybe<Scalars['Boolean']['output']>;
  signUpSource?: Maybe<Scalars['String']['output']>;
  skipEmail?: Maybe<Scalars['Boolean']['output']>;
  skipSetup?: Maybe<Scalars['Boolean']['output']>;
  stripeCustomer?: Maybe<Scalars['String']['output']>;
  stripePlanId?: Maybe<Scalars['String']['output']>;
  stripePlanNickname?: Maybe<Scalars['String']['output']>;
  stripeSubscriptionId?: Maybe<Scalars['String']['output']>;
  teamMinutesConsumed?: Maybe<TeamMinutesConsumed>;
  teamPromptsConsumed?: Maybe<TeamPromptsConsumed>;
  teamReferral?: Maybe<Scalars['String']['output']>;
  teamStripeAccount?: Maybe<Array<Maybe<TeamStripeAccount>>>;
  testSchemaChange1204PM?: Maybe<Array<Scalars['Date']['output']>>;
  tier?: Maybe<Scalars['String']['output']>;
  timesSeenCreditExhuast?: Maybe<Scalars['Int']['output']>;
  timesSeenFreeTrialModal?: Maybe<Scalars['Int']['output']>;
  timesSeenNotepadTour?: Maybe<Scalars['Int']['output']>;
  timesSeenPromptsExhaust?: Maybe<Scalars['Int']['output']>;
  timezone?: Maybe<Scalars['String']['output']>;
  trackingParams?: Maybe<TrackingParams>;
  traits?: Maybe<UserTrait>;
  transcriptionMinutesConsumed?: Maybe<Scalars['Int']['output']>;
  transcriptionService?: Maybe<Scalars['String']['output']>;
  txReferral?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
  userCustomVocabularyId?: Maybe<Scalars['String']['output']>;
  userMetaData?: Maybe<UserMetadata>;
  userPlatforms?: Maybe<Array<Scalars['String']['output']>>;
  userReferral?: Maybe<Scalars['String']['output']>;
  voiceAgentSettings?: Maybe<VoiceAgentSettings>;
};

export type UserAnnouncementState = {
  __typename?: 'UserAnnouncementState';
  announcementId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  seenAt: Scalars['DateTime']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userEmail: Scalars['String']['output'];
};

export type UserConnector = {
  __typename?: 'UserConnector';
  connector_id?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  creator_id?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  is_disconnected?: Maybe<Scalars['String']['output']>;
  owner_id?: Maybe<Scalars['String']['output']>;
  past_meetings_sync?: Maybe<PastMeetingsSync>;
  requires_reconnect?: Maybe<Scalars['Boolean']['output']>;
  target_scope?: Maybe<Scalars['String']['output']>;
  target_scope_meta?: Maybe<TargetScopeMeta>;
  updated_at?: Maybe<Scalars['String']['output']>;
};

export type UserCounters = {
  __typename?: 'UserCounters';
  numberOfGuideTipsForAppsStoreV2Seen?: Maybe<Scalars['Int']['output']>;
  timesAccepted1kCreditsCampaignReview?: Maybe<Scalars['Int']['output']>;
  timesCanceledSub1kCreditsCampaignReview?: Maybe<Scalars['Int']['output']>;
  timesClosedStorageExhaustedPopup?: Maybe<Scalars['Int']['output']>;
  timesSeen1kCreditsCampaign?: Maybe<Scalars['Int']['output']>;
  timesSeen1kCreditsCampaignReview?: Maybe<Scalars['Int']['output']>;
  timesSeenBlackFridayBanner?: Maybe<Scalars['Int']['output']>;
  timesSeenEmailAssistantBanner?: Maybe<Scalars['Int']['output']>;
  timesSeenEmailAssistantReconnectBanner?: Maybe<Scalars['Int']['output']>;
  timesSeenFreeHighValueCampaignBanner?: Maybe<Scalars['Int']['output']>;
  timesSeenFreeHighValueCampaignPopupBanner?: Maybe<Scalars['Int']['output']>;
  timesSeenHighProfileUserCampaignPopup?: Maybe<Scalars['Int']['output']>;
  timesSeenLiteUpgradeModal?: Maybe<Scalars['Int']['output']>;
  timesSeenMeetingPageAgentNudge?: Maybe<Scalars['Int']['output']>;
  timesSeenPaidHighValueCampaignBanner?: Maybe<Scalars['Int']['output']>;
  timesSeenPaidHighValueCampaignPopupBanner?: Maybe<Scalars['Int']['output']>;
  timesSeenSkillsRecommendationPopup?: Maybe<Scalars['Int']['output']>;
  timesSeenSlackAssistantWelcome?: Maybe<Scalars['Int']['output']>;
  timesSeenTalkEmailAssistantNudge?: Maybe<Scalars['Int']['output']>;
  timesSeenTalkFeedbackNudge?: Maybe<Scalars['Int']['output']>;
  timesSeenTalkSlackAssistantNudge?: Maybe<Scalars['Int']['output']>;
};

export type UserDynamicMetadata = {
  __typename?: 'UserDynamicMetadata';
  counters?: Maybe<UserCounters>;
  flags?: Maybe<UserFlags>;
  timestamps?: Maybe<UserTimestamps>;
};

export type UserFlags = {
  __typename?: 'UserFlags';
  acceptedTosUpdate?: Maybe<Scalars['Boolean']['output']>;
  askFredSidebarModePreferred?: Maybe<Scalars['Boolean']['output']>;
  completedEmailAssistantOnboarding?: Maybe<Scalars['Boolean']['output']>;
  completedSlackFredOnboarding?: Maybe<Scalars['Boolean']['output']>;
  completedTalkFeedbackNudge?: Maybe<Scalars['Boolean']['output']>;
  giftedAITeammateCredits?: Maybe<Scalars['Boolean']['output']>;
  hasAcceptedTosUpdate2?: Maybe<Scalars['Boolean']['output']>;
  hasAccessToAITeammates?: Maybe<Scalars['Boolean']['output']>;
  hasAccessToEmailAssistant?: Maybe<Scalars['Boolean']['output']>;
  hasAccessToSlackAssistant?: Maybe<Scalars['Boolean']['output']>;
  hasDismissedEmailAssistantFeedbackBanner?: Maybe<Scalars['Boolean']['output']>;
  hasFinishedEmailConnectorOnboarding?: Maybe<Scalars['Boolean']['output']>;
  hasFinishedSlackConnectorOnboarding?: Maybe<Scalars['Boolean']['output']>;
  isCustomVoiceModalOpened?: Maybe<Scalars['Boolean']['output']>;
  isFirstEverAgentCreated?: Maybe<Scalars['Boolean']['output']>;
  isVoiceCloneInfoBannerClosed?: Maybe<Scalars['Boolean']['output']>;
  needsToOnboardVoiceAgent?: Maybe<Scalars['Boolean']['output']>;
  puppetMeetingEndNotificationEnabled?: Maybe<Scalars['Boolean']['output']>;
  seenAITeammateGiftedCreditsModal?: Maybe<Scalars['Boolean']['output']>;
  seenAITeammatesGuideTooltip?: Maybe<Scalars['Boolean']['output']>;
  seenAITeammatesPage?: Maybe<Scalars['Boolean']['output']>;
  seenAiAppsCardTooltip?: Maybe<Scalars['Boolean']['output']>;
  seenAiAppsFeedWalkthrough?: Maybe<Scalars['Boolean']['output']>;
  seenAiAppsOutputMeetingsTooltip?: Maybe<Scalars['Boolean']['output']>;
  seenAiAppsTabGuideTip?: Maybe<Scalars['Boolean']['output']>;
  seenAppsScheduleGuideTip?: Maybe<Scalars['Boolean']['output']>;
  seenAskFredFloatingToSidebarTip?: Maybe<Scalars['Boolean']['output']>;
  seenAskFredORatingBar?: Maybe<Scalars['Boolean']['output']>;
  seenAskFredSaveSkillCoachmark?: Maybe<Scalars['Boolean']['output']>;
  seenAskFredShareResponseTip?: Maybe<Scalars['Boolean']['output']>;
  seenAskFredSidebarToFloatingTip?: Maybe<Scalars['Boolean']['output']>;
  seenAssistFredTooltip?: Maybe<Scalars['Boolean']['output']>;
  seenAutoClassificationToolTip?: Maybe<Scalars['Boolean']['output']>;
  seenAutoFillPopup?: Maybe<Scalars['Boolean']['output']>;
  seenAutoPilotAgentFeedback?: Maybe<Scalars['Boolean']['output']>;
  seenAutopilotTeammateFormTour?: Maybe<Scalars['Boolean']['output']>;
  seenCustomSummaryFeatureTip?: Maybe<Scalars['Boolean']['output']>;
  seenDarkModeFeedbackNudge?: Maybe<Scalars['Boolean']['output']>;
  seenEmailAssistantGuidingTips?: Maybe<Scalars['Boolean']['output']>;
  seenExhaustedTopNavTooltip?: Maybe<Scalars['Boolean']['output']>;
  seenFreeAICreditsModal?: Maybe<Scalars['Boolean']['output']>;
  seenFreeExpansionCampaignTrialModal?: Maybe<Scalars['Boolean']['output']>;
  seenFreeHighValueCampaignTrialModal?: Maybe<Scalars['Boolean']['output']>;
  seenGiveFreeCreditsToggleOnOnboarding?: Maybe<Scalars['Boolean']['output']>;
  seenHomeMeetingNotesPreference?: Maybe<Scalars['Boolean']['output']>;
  seenHomeV2AskFredModeWalkthrough?: Maybe<Scalars['Boolean']['output']>;
  seenHomeV2Walkthrough?: Maybe<Scalars['Boolean']['output']>;
  seenMeetingAccessTooltip?: Maybe<Scalars['Boolean']['output']>;
  seenMeetingNotesPreference?: Maybe<Scalars['Boolean']['output']>;
  seenMeetingPrepTooltip?: Maybe<Scalars['Boolean']['output']>;
  seenMembersUserGroupsGuideTip?: Maybe<Scalars['Boolean']['output']>;
  seenNavigationWalkthrough?: Maybe<Scalars['Boolean']['output']>;
  seenNotebookWalkthroughGroup1?: Maybe<Scalars['Boolean']['output']>;
  seenNotebookWalkthroughGroup2?: Maybe<Scalars['Boolean']['output']>;
  seenNotepadAiSkillsTabGuideTip?: Maybe<Scalars['Boolean']['output']>;
  seenNotepadExperimentWalkthrough?: Maybe<Scalars['Boolean']['output']>;
  seenNotesLengthOptIn?: Maybe<Scalars['Boolean']['output']>;
  seenPersonalAssistantTooltip?: Maybe<Scalars['Boolean']['output']>;
  seenRefineSummaryCoachmark?: Maybe<Scalars['Boolean']['output']>;
  seenRefineSummaryTip?: Maybe<Scalars['Boolean']['output']>;
  seenSkillsOnboardingDialog?: Maybe<Scalars['Boolean']['output']>;
  seenSlackAnnouncementModal?: Maybe<Scalars['Boolean']['output']>;
  seenSlackNudgeInAskFred?: Maybe<Scalars['Boolean']['output']>;
  seenSummaryTemplatesTip?: Maybe<Scalars['Boolean']['output']>;
  seenTeamSettingsOnboardingModal?: Maybe<Scalars['Boolean']['output']>;
  seenWelcomePageWalkthrough?: Maybe<Scalars['Boolean']['output']>;
  subscribedFreeTrialOnAiTeammates?: Maybe<Scalars['Boolean']['output']>;
};

export type UserGroup = {
  __typename?: 'UserGroup';
  _id: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  handle: Scalars['String']['output'];
  id: Scalars['String']['output'];
  members: Array<Member>;
  name: Scalars['String']['output'];
  settings?: Maybe<UserGroupSettings>;
  settingsUpdatedAt?: Maybe<Scalars['DateTime']['output']>;
  teamId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type UserGroupSettings = {
  __typename?: 'UserGroupSettings';
  aiAppsPrivacy?: Maybe<Scalars['String']['output']>;
  autoJoin?: Maybe<Scalars['String']['output']>;
  meetingExpirySettings?: Maybe<TeamMeetingExpirySettings>;
  privacy?: Maybe<Scalars['String']['output']>;
  retainArtifactsSetting?: Maybe<Scalars['String']['output']>;
  sendNotesTo?: Maybe<Scalars['String']['output']>;
};

export type UserGroupSettingsInput = {
  groupIds?: InputMaybe<Scalars['String']['input']>;
};

export type UserGroupSettingsOutput = {
  __typename?: 'UserGroupSettingsOutput';
  groupIds?: Maybe<Scalars['String']['output']>;
};

export type UserIntegration = {
  __typename?: 'UserIntegration';
  _id: Scalars['String']['output'];
  access_token?: Maybe<Scalars['String']['output']>;
  actions?: Maybe<Array<Scalars['String']['output']>>;
  activities?: Maybe<Array<Scalars['String']['output']>>;
  activityLogs?: Maybe<Scalars['JSON']['output']>;
  apiKey?: Maybe<Scalars['String']['output']>;
  apiKeyEmail?: Maybe<Scalars['String']['output']>;
  authEndpoint?: Maybe<Scalars['String']['output']>;
  authParamsDelimiter?: Maybe<Scalars['String']['output']>;
  authType?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  clientId?: Maybe<Scalars['String']['output']>;
  clientSecret?: Maybe<Scalars['String']['output']>;
  connectButtonLink?: Maybe<Scalars['String']['output']>;
  connectButtonText?: Maybe<Scalars['String']['output']>;
  connectCallbackUrl?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['Int']['output']>;
  disconnectCallbackUrl?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  enabled?: Maybe<Scalars['Boolean']['output']>;
  event?: Maybe<Scalars['String']['output']>;
  expires_in?: Maybe<Scalars['Int']['output']>;
  extraAuthAttributes?: Maybe<Array<Scalars['String']['output']>>;
  files?: Maybe<Scalars['String']['output']>;
  folderId?: Maybe<Scalars['String']['output']>;
  guid?: Maybe<Scalars['String']['output']>;
  guide?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id_token?: Maybe<Scalars['String']['output']>;
  integration?: Maybe<Integration>;
  lastTestPullFlowResult?: Maybe<Scalars['JSON']['output']>;
  lastTestPushFlowResult?: Maybe<Scalars['JSON']['output']>;
  longDescription?: Maybe<Scalars['String']['output']>;
  migratedToConnectorFramework?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  redirectUri?: Maybe<Scalars['String']['output']>;
  refresh_token?: Maybe<Scalars['String']['output']>;
  scope?: Maybe<Array<Scalars['String']['output']>>;
  serverBaseUrl?: Maybe<Scalars['String']['output']>;
  settings?: Maybe<Scalars['JSON']['output']>;
  setup?: Maybe<Scalars['JSON']['output']>;
  shortDescription?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  targetContext?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type UserIntegrationContact = {
  __typename?: 'UserIntegrationContact';
  email: Scalars['String']['output'];
  name: Scalars['String']['output'];
  pictureUrl?: Maybe<Scalars['String']['output']>;
  slackUserId?: Maybe<Scalars['String']['output']>;
};

export type UserMetaInput = {
  artifactExpirySettings?: InputMaybe<ArtifactExpirySettingsInput>;
  copilotAgentSettings?: InputMaybe<CopilotAgentSettingsInput>;
  disableFirefliesTalk?: InputMaybe<Scalars['Boolean']['input']>;
  meetingNotesPreference?: InputMaybe<Array<InputMaybe<MeetingNotePreferenceInput>>>;
  newCopilotAgentSettings?: InputMaybe<CopilotAgentSettingsInput>;
  realtimeSettings?: InputMaybe<RealtimeSettingsMetaInput>;
  retainArtifactsSetting?: InputMaybe<Scalars['String']['input']>;
  sharePublicMeetingWithoutInterruption?: InputMaybe<Scalars['Boolean']['input']>;
  summaryAutoClassification?: InputMaybe<Scalars['String']['input']>;
  summaryLanguage?: InputMaybe<Scalars['String']['input']>;
  theme?: InputMaybe<Scalars['String']['input']>;
  welcomePageState?: InputMaybe<Scalars['String']['input']>;
};

export type UserMetadata = {
  __typename?: 'UserMetadata';
  artifactExpirySettings?: Maybe<ArtifactExpirySettings>;
  contracts?: Maybe<Array<Contract>>;
  copilotAgentSettings?: Maybe<CopilotAgentSettingsMeta>;
  counters?: Maybe<UserCounters>;
  disableChromeExtensionRecording?: Maybe<Scalars['Boolean']['output']>;
  disableFirefliesTalk?: Maybe<Scalars['Boolean']['output']>;
  flags?: Maybe<UserFlags>;
  id?: Maybe<Scalars['String']['output']>;
  lastTimeSeenFreeExpansionCampaignBanner?: Maybe<Scalars['Date']['output']>;
  lastTimeSeenInviteCampaignBanner?: Maybe<Scalars['Date']['output']>;
  lastTimeSeenMeetingSharePopover?: Maybe<Scalars['Date']['output']>;
  meetingNotesPreference?: Maybe<Array<MeetingNotePreference>>;
  realtimeSettings?: Maybe<RealtimeSettingsMeta>;
  retainArtifactsSetting?: Maybe<Scalars['String']['output']>;
  sessions?: Maybe<Array<Scalars['String']['output']>>;
  sharePublicMeetingWithoutInterruption?: Maybe<Scalars['Boolean']['output']>;
  summaryAutoClassification?: Maybe<Scalars['String']['output']>;
  summaryLanguage?: Maybe<Scalars['String']['output']>;
  theme?: Maybe<Scalars['String']['output']>;
  timesSeenFreeExpansionCampaignBanner?: Maybe<Scalars['Int']['output']>;
  timesSeenInviteCampaignBanner?: Maybe<Scalars['Int']['output']>;
  timesSeenMeetingSharePopover?: Maybe<Scalars['Int']['output']>;
  timestamps?: Maybe<UserTimestamps>;
  userImpersonateToken?: Maybe<Scalars['String']['output']>;
  welcomePageState?: Maybe<Scalars['String']['output']>;
};

export type UserPrivacySetting = {
  __typename?: 'UserPrivacySetting';
  actualPrivacy?: Maybe<Scalars['String']['output']>;
  domain?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  isAdmin?: Maybe<Scalars['Boolean']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
};

export type UserProperties = {
  __typename?: 'UserProperties';
  traits?: Maybe<UserTrait>;
  zendeskJwtToken?: Maybe<Scalars['String']['output']>;
};

export type UserReferral = {
  __typename?: 'UserReferral';
  email: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type UserTeamSettings = {
  aiAppsPrivacy?: InputMaybe<Scalars['String']['input']>;
  allowPersonalAssistant?: InputMaybe<Scalars['Boolean']['input']>;
  applyToAdminsKeys?: InputMaybe<Array<Scalars['String']['input']>>;
  autoJoin?: InputMaybe<Scalars['String']['input']>;
  barRules?: InputMaybe<Array<Scalars['String']['input']>>;
  copilotAgentSettings?: InputMaybe<CopilotAgentTeamSettingsInput>;
  disableChromeExtensionRecording?: InputMaybe<Scalars['Boolean']['input']>;
  disableDesktopRecording?: InputMaybe<Scalars['Boolean']['input']>;
  disableEmailAssistant?: InputMaybe<Scalars['Boolean']['input']>;
  disableFirefliesTalk?: InputMaybe<Scalars['Boolean']['input']>;
  disableMobileRecording?: InputMaybe<Scalars['Boolean']['input']>;
  disableTeammatesFromConnectingIntegrations?: InputMaybe<Scalars['Boolean']['input']>;
  enforceDesktopConsentAudio?: InputMaybe<Scalars['Boolean']['input']>;
  enforceDesktopConsentCamera?: InputMaybe<Scalars['Boolean']['input']>;
  enforceDesktopConsentChat?: InputMaybe<Scalars['Boolean']['input']>;
  isAllowedToCreateAIApps?: InputMaybe<Scalars['String']['input']>;
  isAllowedToSeePrompts?: InputMaybe<Scalars['Boolean']['input']>;
  isPrivacyLocked?: InputMaybe<Scalars['Boolean']['input']>;
  joinRules?: InputMaybe<Array<Scalars['String']['input']>>;
  lockedSettings?: InputMaybe<Array<Scalars['String']['input']>>;
  meetingChatMessage?: InputMaybe<Scalars['String']['input']>;
  meetingExpirySettings?: InputMaybe<TeamMeetingExpirySettingsInput>;
  meetingVideoRecording?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  personalAssistantSkills?: InputMaybe<PersonalAssistantTeamSettingsInput>;
  preferredLanguage?: InputMaybe<Scalars['String']['input']>;
  privacy?: InputMaybe<Scalars['String']['input']>;
  puppetRecordingMessageEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  recordingNoti?: InputMaybe<Scalars['String']['input']>;
  recordingNotiLocked?: InputMaybe<Scalars['Boolean']['input']>;
  retainArtifactsSetting?: InputMaybe<Scalars['String']['input']>;
  sendNotesTo?: InputMaybe<Scalars['String']['input']>;
  sendRealtimeChatNotification?: InputMaybe<Scalars['String']['input']>;
  sendRealtimeInsightsInChat?: InputMaybe<Scalars['String']['input']>;
  sharePublicMeetingWithoutInterruption?: InputMaybe<Scalars['Boolean']['input']>;
  summaryAutoClassification?: InputMaybe<Scalars['String']['input']>;
  summaryLanguage?: InputMaybe<Scalars['String']['input']>;
};

export enum UserTier {
  Business = 'business',
  Enterprise = 'enterprise',
  Free = 'free',
  Pro = 'pro'
}

export type UserTimestamps = {
  __typename?: 'UserTimestamps';
  acceptedTosUpdate2At?: Maybe<Scalars['Date']['output']>;
  acceptedTosUpdateAt?: Maybe<Scalars['Date']['output']>;
  lastSeen1kCreditsCampaign?: Maybe<Scalars['Date']['output']>;
  lastTimeSeenEmailAssistantBanner?: Maybe<Scalars['Date']['output']>;
  lastTimeSeenEmailAssistantReconnectBanner?: Maybe<Scalars['Date']['output']>;
  lastTimeSeenFreeHighValueCampaignBanner?: Maybe<Scalars['Date']['output']>;
  lastTimeSeenFreeHighValueCampaignPopupBanner?: Maybe<Scalars['Date']['output']>;
  lastTimeSeenHighProfileUserCampaignPopup?: Maybe<Scalars['Date']['output']>;
  lastTimeSeenLiteUpgradeModal?: Maybe<Scalars['Date']['output']>;
  lastTimeSeenPaidHighValueCampaignBanner?: Maybe<Scalars['Date']['output']>;
  lastTimeSeenPaidHighValueCampaignPopupBanner?: Maybe<Scalars['Date']['output']>;
  lastTimeSeenSlackAssistantWelcome?: Maybe<Scalars['Date']['output']>;
  lastTimeSeenTalkEmailAssistantNudge?: Maybe<Scalars['Date']['output']>;
  lastTimeSeenTalkSlackAssistantNudge?: Maybe<Scalars['Date']['output']>;
};

export type UserTrait = {
  __typename?: 'UserTrait';
  AccountType?: Maybe<Scalars['String']['output']>;
  autoJoin?: Maybe<Scalars['String']['output']>;
  companyEmail?: Maybe<Scalars['String']['output']>;
  companyName?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  createdAtMC?: Maybe<Scalars['String']['output']>;
  datelastused?: Maybe<Scalars['String']['output']>;
  datesignedup?: Maybe<Scalars['Date']['output']>;
  email: Scalars['String']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  firstname?: Maybe<Scalars['String']['output']>;
  industry?: Maybe<Scalars['String']['output']>;
  lastLogin?: Maybe<Scalars['Date']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  lastname?: Maybe<Scalars['String']['output']>;
  linkrefstring?: Maybe<Scalars['String']['output']>;
  loginType?: Maybe<Scalars['String']['output']>;
  meetingExpirySettings?: Maybe<MeetingExpirySettings>;
  meetingPrepEmailNotificationPreference?: Maybe<Scalars['String']['output']>;
  meetingusecase?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  notesInjected?: Maybe<Scalars['Int']['output']>;
  numAlerts?: Maybe<Scalars['Int']['output']>;
  numCommands?: Maybe<Scalars['Int']['output']>;
  numMeetingsWithNotes?: Maybe<Scalars['Int']['output']>;
  nummeetings?: Maybe<Scalars['Int']['output']>;
  nummeetingstheyhave?: Maybe<Scalars['Int']['output']>;
  paidUser?: Maybe<Scalars['String']['output']>;
  paywallsComma?: Maybe<Scalars['String']['output']>;
  paywallshit?: Maybe<Scalars['String']['output']>;
  preferredLanguage?: Maybe<Scalars['String']['output']>;
  privacy?: Maybe<Scalars['String']['output']>;
  realTimeAddOnsAppMetadata?: Maybe<RealTimeAddOnsAppMetadata>;
  realtimeEmailNotificationPreference?: Maybe<Scalars['String']['output']>;
  realtimeSettings?: Maybe<RealtimeSettings>;
  role?: Maybe<Scalars['String']['output']>;
  screenSharingEnabled?: Maybe<Scalars['Boolean']['output']>;
  selfserveuserstage?: Maybe<Scalars['String']['output']>;
  sendNotesTo?: Maybe<Scalars['String']['output']>;
  sendRealtimeChatNotification?: Maybe<Scalars['Boolean']['output']>;
  shouldVideoRecordMeeting?: Maybe<Scalars['Boolean']['output']>;
  teamId?: Maybe<Scalars['String']['output']>;
  teammatesusingfireflies?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  tools?: Maybe<Array<Scalars['String']['output']>>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
};

export type ValidConnectorAuthorizationResponse = {
  __typename?: 'ValidConnectorAuthorizationResponse';
  error?: Maybe<Scalars['String']['output']>;
  retry?: Maybe<Scalars['Boolean']['output']>;
};

export type VerifyPhoneNumberResult = {
  __typename?: 'VerifyPhoneNumberResult';
  error?: Maybe<Scalars['String']['output']>;
  phoneNumber: PhoneNumber;
  verified: Scalars['Boolean']['output'];
};

export type VerifySsoDomainResponse = {
  __typename?: 'VerifySSODomainResponse';
  message?: Maybe<Scalars['String']['output']>;
  ok?: Maybe<Scalars['Boolean']['output']>;
};

export enum VideoRecordingEventInput {
  UserClickedOnVideoRecordingBanner = 'USER_CLICKED_ON_VIDEO_RECORDING_BANNER',
  UserClickedOnVideoRecordingPaywall = 'USER_CLICKED_ON_VIDEO_RECORDING_PAYWALL',
  UserToggledVideoRecording = 'USER_TOGGLED_VIDEO_RECORDING'
}

export type VocabModulation = {
  __typename?: 'VocabModulation';
  changes?: Maybe<Array<WordChange>>;
  toSave?: Maybe<Array<Scalars['String']['output']>>;
};

export type VoiceAgentSettings = {
  __typename?: 'VoiceAgentSettings';
  enabled?: Maybe<Scalars['Boolean']['output']>;
};

/** Predefined voice-agent categories. Use `other` together with `customAgentType` to describe an agent that doesn't fit a predefined category. */
export enum VoiceAgentType {
  DiscoveryCalls = 'discovery_calls',
  Other = 'other',
  ScreeningInterviews = 'screening_interviews',
  SupportCalls = 'support_calls',
  TeamCheckIns = 'team_check_ins',
  UserInterviews = 'user_interviews'
}

export type VoiceClone = {
  __typename?: 'VoiceClone';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
};

export type VoiceCloneResponse = {
  __typename?: 'VoiceCloneResponse';
  message?: Maybe<Scalars['String']['output']>;
  voices?: Maybe<Array<VoiceClone>>;
};

export type WaveMark = {
  __typename?: 'WaveMark';
  _id: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['Date']['output']>;
  futureOffsetSeconds?: Maybe<Scalars['Float']['output']>;
  markPinType?: Maybe<Scalars['String']['output']>;
  markType?: Maybe<Scalars['String']['output']>;
  meetingId?: Maybe<Scalars['String']['output']>;
  meetingOwnerId?: Maybe<Scalars['String']['output']>;
  pastOffsetSeconds?: Maybe<Scalars['Float']['output']>;
  recentlyAdded?: Maybe<Scalars['Boolean']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
  time?: Maybe<Scalars['Float']['output']>;
  transcriptParseId?: Maybe<Scalars['String']['output']>;
  userFirstName?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
  userPicture?: Maybe<Scalars['String']['output']>;
};

export type Webhook = {
  __typename?: 'Webhook';
  secret?: Maybe<Scalars['String']['output']>;
  subscriptions?: Maybe<Scalars['JSON']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type WeeklyUsage = {
  __typename?: 'WeeklyUsage';
  durationMinCount: Scalars['Int']['output'];
  from: Scalars['DateTime']['output'];
  meetingCount: Scalars['Int']['output'];
  to: Scalars['DateTime']['output'];
};

export type WelcomeSoundbitesResponse = {
  __typename?: 'WelcomeSoundbitesResponse';
  groupedSoundbites?: Maybe<Scalars['JSON']['output']>;
  soundbites?: Maybe<Scalars['JSON']['output']>;
};

export type WordChange = {
  __typename?: 'WordChange';
  newWord?: Maybe<Scalars['String']['output']>;
  originalWord?: Maybe<Scalars['String']['output']>;
};

export type ZoomAppMetadata = {
  __typename?: 'ZoomAppMetadata';
  onboardingStepsCompleted?: Maybe<Array<Scalars['String']['output']>>;
};

export type MyCapabilityQueryVariables = Exact<{
  teamId: Scalars['String']['input'];
  capability: Capability;
  resource?: InputMaybe<ResourceInput>;
}>;


export type MyCapabilityQuery = { __typename?: 'Query', myCapability: { __typename?: 'CapabilityDecision', capability: Capability, allowed: boolean } };

export type RunSummaryManuallyMutationVariables = Exact<{
  meetingId: Scalars['String']['input'];
  mergeManualNotes?: InputMaybe<Scalars['Boolean']['input']>;
  templateId?: InputMaybe<Scalars['String']['input']>;
}>;


export type RunSummaryManuallyMutation = { __typename?: 'Mutation', runSummaryManually: boolean };

export type ListAppTemplatesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListAppTemplatesQuery = { __typename?: 'Query', listAppTemplates: Array<{ __typename?: 'AppTemplate', id: string, title: string, description?: string | null, categoryId?: string | null, createdAt: any, updatedAt: any, lastUpdatedBy: string, type: EnumAppType, sources?: Array<EnumKnowledgeSource> | null, engine?: EnumAppEngine | null, outputType?: EnumAppOutputType | null, prompt: { __typename?: 'AppPrompt', system?: string | null, user: string }, trigger?: { __typename?: 'AppTrigger', source: EnumAppTriggerSource, sources?: Array<EnumAppTriggerSource> | null, cron?: string | null, rulesCompositionType?: EnumAppTriggerRulesCompositionType | null, rules?: Array<{ __typename?: 'AppTriggerRule', field: EnumAppTriggerRuleFieldType, operator: EnumAppTriggerRuleFieldOperator, values: Array<string> }> | null } | null }> };

export type ListAppSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListAppSettingsQuery = { __typename?: 'Query', listAppSettings: Array<{ __typename?: 'AppSettings', id: string, title: string, description?: string | null, type: EnumAppType, categoryId?: string | null, active: boolean, userId?: string | null, teamId?: string | null, appPrivacy: EnumAppPrivacy, outputPrivacy: EnumAppOutputPrivacyType, appTemplateId?: string | null, sharedUserGroupIds?: Array<string> | null, model?: string | null, createdAt: any, updatedAt: any, lastUpdatedBy: string, outputType?: EnumAppOutputType | null, pinned?: boolean | null, engine?: EnumAppEngine | null, sources?: Array<EnumKnowledgeSource> | null, prompt: { __typename?: 'AppPrompt', user: string, system?: string | null }, trigger: { __typename?: 'AppTrigger', source: EnumAppTriggerSource, sources?: Array<EnumAppTriggerSource> | null, cron?: string | null, rulesCompositionType?: EnumAppTriggerRulesCompositionType | null, rules?: Array<{ __typename?: 'AppTriggerRule', field: EnumAppTriggerRuleFieldType, operator: EnumAppTriggerRuleFieldOperator, values: Array<string> }> | null } }> };

export type CoreAskFredFieldsFragment = { __typename?: 'FredResponse', id: string, question: string, answer?: string | null, rating?: string | null, status?: string | null, meetingId?: string | null, privacy?: string | null, source?: string | null, createdAt: any };

export type AskFredMutationVariables = Exact<{
  meetingId: Scalars['String']['input'];
  query: Scalars['String']['input'];
  captionIndices?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>> | InputMaybe<Scalars['Int']['input']>>;
  privacy?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  model?: InputMaybe<Scalars['String']['input']>;
}>;


export type AskFredMutation = { __typename?: 'Mutation', askFred: { __typename?: 'FredResponse', id: string, question: string, answer?: string | null, rating?: string | null, status?: string | null, meetingId?: string | null, privacy?: string | null, source?: string | null, createdAt: any } };

export type RateAskFredMutationVariables = Exact<{
  qaId: Scalars['ID']['input'];
  rating: Scalars['String']['input'];
}>;


export type RateAskFredMutation = { __typename?: 'Mutation', rateAskFred: { __typename?: 'FredResponse', id: string, question: string, answer?: string | null, rating?: string | null, status?: string | null, meetingId?: string | null, privacy?: string | null, source?: string | null, createdAt: any } };

export type RetryAskFredMutationVariables = Exact<{
  qaId: Scalars['ID']['input'];
}>;


export type RetryAskFredMutation = { __typename?: 'Mutation', retryAskFred: { __typename?: 'FredResponse', id: string, question: string, answer?: string | null, rating?: string | null, status?: string | null, meetingId?: string | null, privacy?: string | null, source?: string | null, createdAt: any } };

export type MeetingFredQaQueryVariables = Exact<{
  meetingId: Scalars['ID']['input'];
}>;


export type MeetingFredQaQuery = { __typename?: 'Query', meetingFredQa: Array<{ __typename?: 'FredResponse', id: string, question: string, answer?: string | null, rating?: string | null, status?: string | null, meetingId?: string | null, privacy?: string | null, source?: string | null, createdAt: any }> };

export type GetUserLoginOptionsQueryVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type GetUserLoginOptionsQuery = { __typename?: 'Query', getUserLoginOptions: { __typename?: 'GetUserLoginOptionsResponse', ssoEnforced: boolean, ssoOptions: Array<{ __typename?: 'SsoLoginOption', url: string, label?: string | null }> } };

export type CoreTeamPromptsConsumedFieldsFragment = { __typename?: 'TeamPromptsConsumed', allPromptsUsed?: number | null, monthlyPromptsUsed?: number | null, monthlyPromptsLimit?: number | null, freePrompts?: number | null, promptsLeft?: number | null, monthlyMicroCreditsUsed?: number | null, allMicroCreditsUsed?: number | null, microCreditsLeft?: number | null, grantedCreditsLeft?: number | null };

export type CoreAiExtensionsSubscriptionFieldsFragment = { __typename?: 'AIExtensionsSubscription', stripePlanNickname: string, stripeSubscriptionId: string, quantity: number, nextPaymentAt?: any | null, autoUpgrade?: boolean | null, cancelAt?: any | null, status: string, createdAt: any, trialEndsAt?: any | null, userId: string, stripePlanId: string, updatedAt: any };

export type CreateSubscriptionMutationVariables = Exact<{
  plan: Scalars['String']['input'];
  seats: Scalars['Int']['input'];
  trialPeriodDays?: InputMaybe<Scalars['Int']['input']>;
  cardInfo?: InputMaybe<CardInfoInput>;
  paywall?: InputMaybe<Scalars['String']['input']>;
  referral?: InputMaybe<Scalars['String']['input']>;
  couponId?: InputMaybe<Scalars['String']['input']>;
  discountCouponId?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateSubscriptionMutation = { __typename?: 'Mutation', createSubscription: { __typename?: 'CreateSubscription', is3ds?: boolean | null, redirectUrl?: string | null, subscription?: { __typename?: 'StripeSubscription', id: string, status: EnumSubscriptionStatus, customer: string, trial_end?: number | null, items: { __typename?: 'SubscriptionItem', data: Array<{ __typename?: 'SubscriptionItemData', price: { __typename?: 'SubscriptionPrice', id: string, nickname?: string | null, unit_amount?: number | null, currency: string } }> } } | null } };

export type GetWelcomeMeetingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetWelcomeMeetingsQuery = { __typename?: 'Query', getCalendarEvents?: { __typename?: 'UpcomingMeetings', events?: Array<{ __typename?: 'CalendarEvents', _id?: string | null, date?: string | null, endDate?: string | null, title?: string | null, creator_email?: string | null, fredAdded?: boolean | null, calendarType?: string | null, manuallyToggled?: boolean | null, isValidMeeting?: boolean | null, userCanToggle?: boolean | null, cancelReason?: string | null, isOrganizer?: boolean | null, url?: string | null, iCalUID?: string | null, meetingId?: string | null, customLanguage?: string | null, isMeetingAdmin?: boolean | null, organizerEmail?: string | null, attendees?: Array<{ __typename?: 'Attendee', email?: string | null, organizer?: boolean | null, responseStatus?: string | null, self?: boolean | null }> | null, ownerProfile?: { __typename?: 'Profile', name?: string | null, email?: string | null, picture?: string | null, preferredLanguage?: string | null } | null, lastMeeting?: { __typename?: 'FeedMeeting', meetingLink?: string | null, _id: string, title: string, organizerEmail: string, owner?: string | null, startTime?: any | null, endTime?: any | null, addedBy?: string | null, brief?: { __typename?: 'Brief', gist?: string | null, overview?: string | null } | null, organizerProfile?: { __typename?: 'Profile', name?: string | null, email?: string | null, picture?: string | null } | null, participantsProfiles: Array<{ __typename?: 'Profile', name?: string | null, email?: string | null, picture?: string | null }>, summary: Array<{ __typename?: 'FeedSummary', emoji?: string | null, title?: string | null, sentence: string }>, tasks: Array<{ __typename?: 'Task', id: string, title: string, description?: string | null, status: EnumTaskStatus, ownerId?: string | null, ownerType?: EnumTaskOwnerType | null, ownerEmail?: string | null, meetingId?: string | null, meetingTimestamp?: string | null, meetingCaptionIndex?: number | null, createdById: string, completedAt?: any | null, completedByUserId?: string | null, createdAt: any, updatedAt: any, hasChangedOwner?: boolean | null, generatedOwnerName?: string | null, ownerProfile?: { __typename?: 'Profile', name?: string | null, email?: string | null, picture?: string | null } | { __typename?: 'UserGroup', _id: string, handle: string, groupName: string } | null }> } | null }> | null } | null };

export type GetLiveMeetingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLiveMeetingsQuery = { __typename?: 'Query', liveMeetings?: { __typename?: 'MeetingStatusList', meetings?: Array<{ __typename?: 'MeetingStatusData', objectId?: string | null, title?: string | null, audio_url?: string | null, endTime?: number | null, hostEmail?: string | null, startTime?: number | null, status?: string | null, userEmail?: string | null, userIsHost?: boolean | null, userIsParticipant?: boolean | null, addedBy?: string | null, url?: string | null, userProfile?: { __typename?: 'Profile', picture?: string | null, email?: string | null } | null }> | null } | null };

export type ToggleUpcomingEventMutationVariables = Exact<{
  fredAdded: Scalars['Boolean']['input'];
  meetingId: Scalars['String']['input'];
  scheduleType?: InputMaybe<Scalars['String']['input']>;
  iCalUID?: InputMaybe<Scalars['String']['input']>;
  calendarType?: InputMaybe<Scalars['String']['input']>;
}>;


export type ToggleUpcomingEventMutation = { __typename?: 'Mutation', toggleUpcomingEvent: { __typename?: 'CalendarEvents', _id?: string | null, meetingId?: string | null, fredAdded?: boolean | null, iCalUID?: string | null, organizerEmail?: string | null, isMeetingAdmin?: boolean | null, ownerProfile?: { __typename?: 'Profile', name?: string | null, email?: string | null, picture?: string | null, preferredLanguage?: string | null } | null } };

export type JoinAllUpcomingMeetingsMutationVariables = Exact<{
  addedBy?: InputMaybe<Scalars['String']['input']>;
}>;


export type JoinAllUpcomingMeetingsMutation = { __typename?: 'Mutation', joinAllUpcomingMeetings: Array<{ __typename?: 'JoinAllUpcomingMeetingResult', calId: string, status: boolean, message?: string | null, meetingId?: string | null }> };

export type SetMeetingLanguageMutationVariables = Exact<{
  meetingId: Scalars['String']['input'];
  language: Scalars['String']['input'];
}>;


export type SetMeetingLanguageMutation = { __typename?: 'Mutation', setMeetingLanguage?: { __typename?: 'CalendarEvents', _id?: string | null, meetingId?: string | null, customLanguage?: string | null } | null };

export type FetchChannelMeetingsQueryVariables = Exact<{
  from: Scalars['Int']['input'];
  size: Scalars['Int']['input'];
  channelId: Scalars['String']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  isPrivate?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type FetchChannelMeetingsQuery = { __typename?: 'Query', getChannelMeetings?: { __typename?: 'Meetings', total?: number | null, meetings: Array<{ __typename?: 'Source', parseId?: string | null, hasCaptions?: boolean | null, date?: string | null, owner?: string | null, title?: string | null, createdAt?: string | null, creator_email?: string | null, privacy?: string | null, id?: string | null, users?: Array<string | null> | null, validAttendees?: Array<string> | null, durationMins?: number | null, duration?: number | null, allEmails?: string | null, audioOnly?: boolean | null, processMeetingStatus?: string | null, audio_url?: string | null, addedBy?: string | null, creatorProfile?: { __typename?: 'Profile', picture?: string | null, name?: string | null, lastName?: string | null, firstName?: string | null, email?: string | null } | null, audioServiceMetadata?: { __typename?: 'AudioMetaData', apiSource?: string | null, silentMeeting?: boolean | null } | null }> } | null };

export type GetChannelsListQueryVariables = Exact<{ [key: string]: never; }>;


export type GetChannelsListQuery = { __typename?: 'Query', getChannelsList?: Array<{ __typename?: 'Channel', _id: string, title?: string | null, createdBy?: string | null, isPrivate?: boolean | null, members?: Array<{ __typename?: 'ChannelMember', picture?: string | null, name?: string | null, email?: string | null, isAdmin?: boolean | null, _id?: string | null }> | null }> | null };

export type ChannelQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ChannelQuery = { __typename?: 'Query', getChannel?: { __typename?: 'Channel', _id: string, title?: string | null, isPrivate?: boolean | null, createdBy?: string | null, teamId?: string | null, members?: Array<{ __typename?: 'ChannelMember', picture?: string | null, name?: string | null, email?: string | null, isAdmin?: boolean | null, _id?: string | null }> | null } | null };

export type GetEmailAssistantSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEmailAssistantSettingsQuery = { __typename?: 'Query', emailSettings?: { __typename?: 'EmailSettings', id: string, isAssistantEnabled: boolean } | null };

export type GetFeaturesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetFeaturesQuery = { __typename?: 'Query', getFeatures: { __typename?: 'GrowthbookFeatures', features: any } };

export type CoreFeedMeetingFieldsFragment = { __typename?: 'FeedMeeting', _id: string, title: string, organizerEmail: string, owner?: string | null, startTime?: any | null, endTime?: any | null, addedBy?: string | null, organizerProfile?: { __typename?: 'Profile', name?: string | null, email?: string | null, picture?: string | null } | null, participantsProfiles: Array<{ __typename?: 'Profile', name?: string | null, email?: string | null, picture?: string | null }>, summary: Array<{ __typename?: 'FeedSummary', emoji?: string | null, title?: string | null, sentence: string }>, tasks: Array<{ __typename?: 'Task', id: string, title: string, description?: string | null, status: EnumTaskStatus, ownerId?: string | null, ownerType?: EnumTaskOwnerType | null, ownerEmail?: string | null, meetingId?: string | null, meetingTimestamp?: string | null, meetingCaptionIndex?: number | null, createdById: string, completedAt?: any | null, completedByUserId?: string | null, createdAt: any, updatedAt: any, hasChangedOwner?: boolean | null, generatedOwnerName?: string | null, ownerProfile?: { __typename?: 'Profile', name?: string | null, email?: string | null, picture?: string | null } | { __typename?: 'UserGroup', _id: string, handle: string, groupName: string } | null }> };

export type GetFeedMeetingsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetFeedMeetingsQuery = { __typename?: 'Query', getFeedMeetings: { __typename?: 'FeedResults', total: number, meetings: Array<{ __typename?: 'FeedMeeting', _id: string, title: string, organizerEmail: string, owner?: string | null, startTime?: any | null, endTime?: any | null, addedBy?: string | null, organizerProfile?: { __typename?: 'Profile', name?: string | null, email?: string | null, picture?: string | null } | null, participantsProfiles: Array<{ __typename?: 'Profile', name?: string | null, email?: string | null, picture?: string | null }>, summary: Array<{ __typename?: 'FeedSummary', emoji?: string | null, title?: string | null, sentence: string }>, tasks: Array<{ __typename?: 'Task', id: string, title: string, description?: string | null, status: EnumTaskStatus, ownerId?: string | null, ownerType?: EnumTaskOwnerType | null, ownerEmail?: string | null, meetingId?: string | null, meetingTimestamp?: string | null, meetingCaptionIndex?: number | null, createdById: string, completedAt?: any | null, completedByUserId?: string | null, createdAt: any, updatedAt: any, hasChangedOwner?: boolean | null, generatedOwnerName?: string | null, ownerProfile?: { __typename?: 'Profile', name?: string | null, email?: string | null, picture?: string | null } | { __typename?: 'UserGroup', _id: string, handle: string, groupName: string } | null }> }> } };

export type GetFeedMeetingByIdQueryVariables = Exact<{
  meetingId: Scalars['String']['input'];
}>;


export type GetFeedMeetingByIdQuery = { __typename?: 'Query', getFeedMeetingById?: { __typename?: 'FeedMeeting', _id: string, title: string, organizerEmail: string, owner?: string | null, startTime?: any | null, endTime?: any | null, addedBy?: string | null, organizerProfile?: { __typename?: 'Profile', name?: string | null, email?: string | null, picture?: string | null } | null, participantsProfiles: Array<{ __typename?: 'Profile', name?: string | null, email?: string | null, picture?: string | null }>, summary: Array<{ __typename?: 'FeedSummary', emoji?: string | null, title?: string | null, sentence: string }>, tasks: Array<{ __typename?: 'Task', id: string, title: string, description?: string | null, status: EnumTaskStatus, ownerId?: string | null, ownerType?: EnumTaskOwnerType | null, ownerEmail?: string | null, meetingId?: string | null, meetingTimestamp?: string | null, meetingCaptionIndex?: number | null, createdById: string, completedAt?: any | null, completedByUserId?: string | null, createdAt: any, updatedAt: any, hasChangedOwner?: boolean | null, generatedOwnerName?: string | null, ownerProfile?: { __typename?: 'Profile', name?: string | null, email?: string | null, picture?: string | null } | { __typename?: 'UserGroup', _id: string, handle: string, groupName: string } | null }> } | null };

export type GiveFeedbackMutationVariables = Exact<{
  input: GiveFeedbackInput;
}>;


export type GiveFeedbackMutation = { __typename?: 'Mutation', giveFeedback: { __typename: 'Feedback', _id: string, csmCalendlyLink?: string | null } };

export type FetchScheduledMaintenanceQueryVariables = Exact<{
  target?: InputMaybe<Scalars['String']['input']>;
}>;


export type FetchScheduledMaintenanceQuery = { __typename?: 'Query', fetchScheduledMaintenance?: { __typename?: 'ScheduledMaintenance', endDate?: any | null, startDate?: any | null, message?: string | null, isActive?: boolean | null } | null };

export type NewMeetingNoteCommentMutationVariables = Exact<{
  meetingId: Scalars['String']['input'];
  comment?: InputMaybe<Scalars['String']['input']>;
  replyToCommentId?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['Int']['input']>;
  privacy: Scalars['String']['input'];
  isBookmarked?: InputMaybe<Scalars['Boolean']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
}>;


export type NewMeetingNoteCommentMutation = { __typename?: 'Mutation', newMeetingNoteComment?: { __typename?: 'MeetingNoteComment', _id: string, userId?: string | null, meetingId?: string | null, comment?: string | null, replyToCommentId?: string | null, name?: string | null, timestamp?: number | null, createdAt?: string | null, isPrivate?: boolean | null, privacy?: string | null, isBookmarked?: boolean | null, source?: string | null } | null };

export type UpdateMeetingNoteCommentMutationVariables = Exact<{
  commentId?: InputMaybe<Scalars['String']['input']>;
  comment?: InputMaybe<Scalars['String']['input']>;
  privacy: Scalars['String']['input'];
}>;


export type UpdateMeetingNoteCommentMutation = { __typename?: 'Mutation', updateMeetingNoteComment?: { __typename?: 'MeetingNoteComment', _id: string, meetingNoteId?: string | null, meetingId?: string | null, comment?: string | null, replyToCommentId?: string | null, name?: string | null, timestamp?: number | null, isPrivate?: boolean | null, createdAt?: string | null, privacy?: string | null } | null };

export type DeleteMeetingNoteCommentMutationVariables = Exact<{
  commentId?: InputMaybe<Scalars['String']['input']>;
}>;


export type DeleteMeetingNoteCommentMutation = { __typename?: 'Mutation', deleteMeetingNoteComment?: boolean | null };

export type MeetingNoteCommentsQueryVariables = Exact<{
  meetingId: Scalars['String']['input'];
}>;


export type MeetingNoteCommentsQuery = { __typename?: 'Query', meetingNoteComments?: Array<{ __typename?: 'MeetingNoteComment', _id: string, comment?: string | null, createdAt?: string | null, meetingId?: string | null, picture?: string | null, userId?: string | null, name?: string | null, timestamp?: number | null, replyToCommentId?: string | null, isPrivate?: boolean | null, privacy?: string | null, isBookmarked?: boolean | null, source?: string | null, creatorProfile?: { __typename?: 'Profile', picture?: string | null, name?: string | null, lastName?: string | null, firstName?: string | null, email?: string | null } | null }> | null };

export type EnrichedDomainFieldsFragment = { __typename?: 'EnrichedDomain', domain: string, name: string, description?: string | null, recentHeadlines: Array<{ __typename?: 'OrganizationHeadline', title: string, content: string, emoji: string, occurredAt: string }> };

export type MeetingPrepOutputFieldsFragment = { __typename?: 'MeetingPrepOutput', charged?: boolean | null, participantInfo?: string | null, companyInsights?: Array<{ __typename?: 'EnrichedDomain', domain: string, name: string, description?: string | null, recentHeadlines: Array<{ __typename?: 'OrganizationHeadline', title: string, content: string, emoji: string, occurredAt: string }> }> | null, pastNotes?: { __typename?: 'PastNotes', meetingId: string, overview?: string | null, startTime: any, title: string, bulletGist?: Array<{ __typename?: 'BulletGistItem', emoji: string, sentence: string, title: string }> | null, shorthandBullet?: Array<{ __typename?: 'ShorthandBulletItem', title: string, emoji: string }> | null, tasks?: Array<{ __typename?: 'MeetingPrepTask', id: string, title: string, description?: string | null, status: string, dueDate?: string | null, ownerEmail?: string | null, ownerId?: string | null, ownerType?: string | null, generatedOwnerName?: string | null, hasChangedOwner?: boolean | null, meetingId: string, meetingTimestamp?: string | null, meetingCaptionIndex?: number | null, parentId?: string | null, createdAt: string, createdById: string, updatedAt: string, completedAt?: string | null, completedByUserId?: string | null }> | null } | null, pastSyncsSummary?: { __typename?: 'PastSyncsSummary', summary?: string | null, meetings: Array<{ __typename?: 'PastSyncMeeting', id: string, title: string, date: string, organizerPicture?: string | null, organizerName: string }> } | null };

export type GetMeetingPrepOutputQueryVariables = Exact<{
  input: GetMeetingPrepOutputInput;
}>;


export type GetMeetingPrepOutputQuery = { __typename?: 'Query', getMeetingPrepOutput?: { __typename?: 'MeetingPrepOutput', charged?: boolean | null, participantInfo?: string | null, companyInsights?: Array<{ __typename?: 'EnrichedDomain', domain: string, name: string, description?: string | null, recentHeadlines: Array<{ __typename?: 'OrganizationHeadline', title: string, content: string, emoji: string, occurredAt: string }> }> | null, pastNotes?: { __typename?: 'PastNotes', meetingId: string, overview?: string | null, startTime: any, title: string, bulletGist?: Array<{ __typename?: 'BulletGistItem', emoji: string, sentence: string, title: string }> | null, shorthandBullet?: Array<{ __typename?: 'ShorthandBulletItem', title: string, emoji: string }> | null, tasks?: Array<{ __typename?: 'MeetingPrepTask', id: string, title: string, description?: string | null, status: string, dueDate?: string | null, ownerEmail?: string | null, ownerId?: string | null, ownerType?: string | null, generatedOwnerName?: string | null, hasChangedOwner?: boolean | null, meetingId: string, meetingTimestamp?: string | null, meetingCaptionIndex?: number | null, parentId?: string | null, createdAt: string, createdById: string, updatedAt: string, completedAt?: string | null, completedByUserId?: string | null }> | null } | null, pastSyncsSummary?: { __typename?: 'PastSyncsSummary', summary?: string | null, meetings: Array<{ __typename?: 'PastSyncMeeting', id: string, title: string, date: string, organizerPicture?: string | null, organizerName: string }> } | null } | null };

export type ShareMeetingsMutationVariables = Exact<{
  shareType?: InputMaybe<Scalars['String']['input']>;
  inviteeList: Array<Scalars['String']['input']> | Scalars['String']['input'];
  meetingId: Scalars['ID']['input'];
  ttl?: InputMaybe<SharedMeetingTtlInput>;
  reason?: InputMaybe<Scalars['String']['input']>;
}>;


export type ShareMeetingsMutation = { __typename?: 'Mutation', shareMeetings?: { __typename?: 'ShareMeetingResponse', status?: boolean | null, message: string, invite: Array<{ __typename?: 'ShareMeeting', id: string, inviteeEmail: string, inviterEmail: string, meetingId: string, reason?: string | null, ttl?: { __typename?: 'SharedMeetingTTL', duration?: number | null, unit?: string | null } | null }> } | null };

export type CancelSharedMeetingAccessMutationVariables = Exact<{
  meetingId: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  sharedMeetingId: Scalars['String']['input'];
}>;


export type CancelSharedMeetingAccessMutation = { __typename?: 'Mutation', cancelSharedMeetingAccess?: boolean | null };

export type FindUsersMeetingIsSharedWithQueryVariables = Exact<{
  meetingId: Scalars['ID']['input'];
}>;


export type FindUsersMeetingIsSharedWithQuery = { __typename?: 'Query', findUsersMeetingIsSharedWith?: { __typename?: 'FindUsersMeetingIsSharedWithResponse', teammates: Array<{ __typename?: 'SharedUser', id?: string | null, email: string, name?: string | null, photoUrl?: string | null, host?: boolean | null, sharedMeetingId?: string | null }>, nonTeammates: Array<{ __typename?: 'SharedUser', id?: string | null, email: string, name?: string | null, photoUrl?: string | null, sharedMeetingId?: string | null }> } | null };

export type GetUserMeetingsForStatusQueryVariables = Exact<{
  start?: InputMaybe<Scalars['String']['input']>;
  end?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  computedStatus?: InputMaybe<Scalars['String']['input']>;
  next?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetUserMeetingsForStatusQuery = { __typename?: 'Query', getUserMeetingsForStatus?: { __typename: 'MeetingStatusList', next?: string | null, hasNext?: boolean | null, meetings?: Array<{ __typename: 'MeetingStatusData', audio_url?: string | null, endTime?: number | null, hostEmail?: string | null, message?: string | null, objectId?: string | null, openNotebook?: boolean | null, reloadMeeting?: boolean | null, startTime?: number | null, status?: string | null, title?: string | null, userEmail?: string | null, userIsHost?: boolean | null, meetingSource?: string | null, addedBy?: string | null, url?: string | null, computedStatus?: string | null, processMeetingStatus?: string | null, audioIsTooSmall?: boolean | null, started?: boolean | null }> | null } | null };

export type EndLiveMeetingCallMutationVariables = Exact<{
  meetingId: Scalars['String']['input'];
}>;


export type EndLiveMeetingCallMutation = { __typename?: 'Mutation', endLiveMeetingCall?: boolean | null };

export type ReloadMeetingCallQueryVariables = Exact<{
  meetingId: Scalars['String']['input'];
}>;


export type ReloadMeetingCallQuery = { __typename?: 'Query', reloadMeetingCall?: string | null };

export type DeleteMeetingsMutationVariables = Exact<{
  meetingIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
  source?: InputMaybe<Scalars['String']['input']>;
}>;


export type DeleteMeetingsMutation = { __typename?: 'Mutation', deleteMeetings?: string | null };

export type TranscribeMeetingMutationVariables = Exact<{
  meetingId: Scalars['ID']['input'];
  type: TranscribeType;
}>;


export type TranscribeMeetingMutation = { __typename?: 'Mutation', transcribeMeeting: boolean };

export type SaveNotesMutationVariables = Exact<{
  meetingId: Scalars['String']['input'];
  speakerMeta?: InputMaybe<Scalars['JSON']['input']>;
  sentenceMeta?: InputMaybe<Scalars['JSON']['input']>;
  paragraphMeta?: InputMaybe<Scalars['JSON']['input']>;
  labelMeta?: InputMaybe<Scalars['JSON']['input']>;
}>;


export type SaveNotesMutation = { __typename?: 'Mutation', saveNotes?: { __typename?: 'MeetingNote', speakerMeta?: any | null, sentenceMeta?: any | null, paragraphMeta?: any | null, labelMeta?: any | null } | null };

export type UpdateMeetingTitleMutationVariables = Exact<{
  meetingId: Scalars['String']['input'];
  title: Scalars['String']['input'];
}>;


export type UpdateMeetingTitleMutation = { __typename?: 'Mutation', updateMeetingTitle?: string | null };

export type UpdateMeetingStateMutationVariables = Exact<{
  meetingId: Scalars['String']['input'];
  action: Scalars['String']['input'];
}>;


export type UpdateMeetingStateMutation = { __typename?: 'Mutation', updateMeetingState?: boolean | null };

export type UploadManualNotesMutationVariables = Exact<{
  meetingId: Scalars['String']['input'];
  notes: Scalars['String']['input'];
  shouldMerge: Scalars['Boolean']['input'];
}>;


export type UploadManualNotesMutation = { __typename?: 'Mutation', uploadManualNotes?: boolean | null };

export type FetchIsGuestAccessEnabledQueryVariables = Exact<{
  meetingNoteId: Scalars['String']['input'];
}>;


export type FetchIsGuestAccessEnabledQuery = { __typename?: 'Query', meetingNote?: { __typename?: 'MeetingNote', _id?: string | null, isGuestAccessEnabled?: boolean | null } | null };

export type CreateMeetingInMediaStorageWithUrlMutationVariables = Exact<{
  title: Scalars['String']['input'];
  url: Scalars['String']['input'];
  allEmails?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
  customLanguage?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateMeetingInMediaStorageWithUrlMutation = { __typename?: 'Mutation', createMeetingInMediaStorageWithURL?: { __typename?: 'MeetingInMediaStorageResponse', meeting: any } | null };

export type CreateMarkMutationVariables = Exact<{
  meetingId: Scalars['String']['input'];
  time?: InputMaybe<Scalars['Float']['input']>;
  markType: Scalars['String']['input'];
  actionType?: InputMaybe<Scalars['String']['input']>;
  markPinType?: InputMaybe<Scalars['String']['input']>;
  source: Scalars['String']['input'];
  pastOffsetSeconds?: InputMaybe<Scalars['Float']['input']>;
  futureOffsetSeconds?: InputMaybe<Scalars['Float']['input']>;
}>;


export type CreateMarkMutation = { __typename?: 'Mutation', createMark?: { __typename?: 'WaveMark', _id: string, createdAt?: any | null, markType?: string | null, markPinType?: string | null, meetingId?: string | null, meetingOwnerId?: string | null, time?: number | null, transcriptParseId?: string | null, userFirstName?: string | null, userPicture?: string | null, source?: string | null, userId?: string | null, pastOffsetSeconds?: number | null, futureOffsetSeconds?: number | null } | null };

export type DeleteMarkMutationVariables = Exact<{
  markId: Scalars['String']['input'];
  meetingId: Scalars['String']['input'];
}>;


export type DeleteMarkMutation = { __typename?: 'Mutation', deleteMark: string };

export type TranscribeCustomLangMutationVariables = Exact<{
  meetingId: Scalars['ID']['input'];
  customLanguage: Scalars['String']['input'];
}>;


export type TranscribeCustomLangMutation = { __typename?: 'Mutation', transcribeCustomLang: boolean };

export type FetchSummaryStatusQueryVariables = Exact<{
  meetingId: Scalars['ID']['input'];
}>;


export type FetchSummaryStatusQuery = { __typename?: 'Query', fetchSummaryStatus?: MeetingSummaryStatus | null };

export type GetMeetingManualNotesQueryVariables = Exact<{
  meetingId: Scalars['String']['input'];
}>;


export type GetMeetingManualNotesQuery = { __typename?: 'Query', meetingNote?: { __typename?: 'MeetingNote', _id?: string | null, summaryStatus?: MeetingSummaryStatus | null, manualNotes?: { __typename?: 'ManualNotes', notes?: string | null, shouldMerge?: boolean | null } | null, audioServiceMetadata?: { __typename?: 'AudioMetadata', hasManualNotesMerged?: boolean | null } | null } | null };

export type UpdateMeetingNoteSummaryMutationVariables = Exact<{
  meetingId: Scalars['String']['input'];
  jsonComment?: InputMaybe<Array<InputMaybe<SummarySectionsInput>> | InputMaybe<SummarySectionsInput>>;
}>;


export type UpdateMeetingNoteSummaryMutation = { __typename?: 'Mutation', updateMeetingNoteSummary?: boolean | null };

export type GetTeamOnboardingSuggestionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTeamOnboardingSuggestionQuery = { __typename?: 'Query', teamOnboardingSuggestion: { __typename?: 'TeamOnboardingSuggestion', suggestion: string, freeTrial: boolean, teams: Array<{ __typename?: 'TeamSuggested', id: string, name: string, teamSize: number, isRequested: boolean, admin: { __typename?: 'Teammate', id?: string | null, name?: string | null, email?: string | null, profile?: { __typename?: 'Profile', picture?: string | null, name?: string | null, lastName?: string | null, firstName?: string | null, email?: string | null } | null }, teammates: Array<{ __typename?: 'Teammate', id?: string | null, name?: string | null, email?: string | null, profile?: { __typename?: 'Profile', picture?: string | null, name?: string | null, lastName?: string | null, firstName?: string | null, email?: string | null } | null }> }> } };

export type CompleteOnboardingStepMutationVariables = Exact<{
  step: EnumOnboardingStep;
  skip?: InputMaybe<Scalars['Boolean']['input']>;
  extraInfo: CompleteOnboardingStepExtraInfoInput;
}>;


export type CompleteOnboardingStepMutation = { __typename?: 'Mutation', completeOnboardingStep: boolean };

export type ApproveTermsMutationVariables = Exact<{ [key: string]: never; }>;


export type ApproveTermsMutation = { __typename?: 'Mutation', approveTerms?: string | null };

export type AppSettingsFieldsFragment = { __typename?: 'AppSettings', id: string, active: boolean, autoEnabled?: boolean | null, title: string, description?: string | null, type: EnumAppType, createdAt: any, updatedAt: any };

export type GetPersonalAssistantResponseDtoFieldsFragment = { __typename?: 'GetPersonalAssistantResponseDto', dailyDigest?: { __typename?: 'DailyDigestMetadata', lastOutputCreatedAt?: any | null, meetingCount: number, audioUrl?: string | null, appSettings: { __typename?: 'AppSettings', id: string, active: boolean, autoEnabled?: boolean | null, title: string, description?: string | null, type: EnumAppType, createdAt: any, updatedAt: any } } | null, popularTopics?: { __typename?: 'PopularTopicsMetadata', appSettings: { __typename?: 'AppSettings', id: string, active: boolean, autoEnabled?: boolean | null, title: string, description?: string | null, type: EnumAppType, createdAt: any, updatedAt: any } } | null };

export type MeetingPrepAppFieldsFragment = { __typename?: 'MeetingPrepApp', id: string, active: boolean, notificationPreference: EnumMeetingPrepAppNotificationType, showCompanyInsights: boolean, showParticipantInfo: boolean, showPastNotes: boolean, showPastSyncsSummary: boolean, userId: string, createdAt: any, updatedAt: any };

export type AppOutputEventFieldsFragment = { __typename?: 'AppOutputEvent', appId: string, audioUrl?: string | null, createdAt: any, eventId: string, meetingIds: Array<string>, origin: EnumAppOutputOrigin, output: string, outputJson?: any | null, updatedAt: any, event: { __typename?: 'AppEvent', id: string, isSeen?: boolean | null, appSettings: { __typename?: 'AppSettings', id: string, title: string, active: boolean } }, meetings: Array<{ __typename?: 'AiAppsMeeting', id: string, title: string, startTime: string, ownerName?: string | null, ownerPicture?: string | null }> };

export type GetPersonalAssistantQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPersonalAssistantQuery = { __typename?: 'Query', getPersonalAssistant: { __typename?: 'GetPersonalAssistantResponseDto', dailyDigest?: { __typename?: 'DailyDigestMetadata', lastOutputCreatedAt?: any | null, meetingCount: number, audioUrl?: string | null, appSettings: { __typename?: 'AppSettings', id: string, active: boolean, autoEnabled?: boolean | null, title: string, description?: string | null, type: EnumAppType, createdAt: any, updatedAt: any } } | null, popularTopics?: { __typename?: 'PopularTopicsMetadata', appSettings: { __typename?: 'AppSettings', id: string, active: boolean, autoEnabled?: boolean | null, title: string, description?: string | null, type: EnumAppType, createdAt: any, updatedAt: any } } | null } };

export type GetPersonalAssistantForDailyBriefNotificationQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPersonalAssistantForDailyBriefNotificationQuery = { __typename?: 'Query', getPersonalAssistant: { __typename?: 'GetPersonalAssistantResponseDto', dailyDigest?: { __typename?: 'DailyDigestMetadata', lastOutputCreatedAt?: any | null, appSettings: { __typename?: 'AppSettings', id: string, title: string, active: boolean } } | null } };

export type GetMeetingPrepAppQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeetingPrepAppQuery = { __typename?: 'Query', getMeetingPrepApp?: { __typename?: 'MeetingPrepApp', id: string, active: boolean, notificationPreference: EnumMeetingPrepAppNotificationType, showCompanyInsights: boolean, showParticipantInfo: boolean, showPastNotes: boolean, showPastSyncsSummary: boolean, userId: string, createdAt: any, updatedAt: any } | null };

export type GetAppOutputsByAppIdQueryVariables = Exact<{
  appId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  dateRange?: InputMaybe<DateRange>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetAppOutputsByAppIdQuery = { __typename?: 'Query', getAppOutputsByAppId: { __typename?: 'GetAppOutputsByAppIdResponseDto', hasMore: boolean, appOutputs: Array<{ __typename?: 'AppOutputEvent', appId: string, audioUrl?: string | null, createdAt: any, eventId: string, meetingIds: Array<string>, origin: EnumAppOutputOrigin, output: string, outputJson?: any | null, updatedAt: any, event: { __typename?: 'AppEvent', id: string, isSeen?: boolean | null, appSettings: { __typename?: 'AppSettings', id: string, title: string, active: boolean } }, meetings: Array<{ __typename?: 'AiAppsMeeting', id: string, title: string, startTime: string, ownerName?: string | null, ownerPicture?: string | null }> }> } };

export type GenerateAppOutputAudioMutationVariables = Exact<{
  eventId: Scalars['String']['input'];
}>;


export type GenerateAppOutputAudioMutation = { __typename?: 'Mutation', generateAppOutputAudio?: string | null };

export type TogglePersonalAssistantMutationVariables = Exact<{
  input: TogglePersonalAssistantInput;
}>;


export type TogglePersonalAssistantMutation = { __typename?: 'Mutation', togglePersonalAssistant: { __typename?: 'TogglePersonalAssistantResponseDto', active: boolean, applyForTeam?: boolean | null } };

export type UpdatePersonalAssistantSettingsMutationVariables = Exact<{
  input: UpdatePersonalAssistantSettingsInput;
}>;


export type UpdatePersonalAssistantSettingsMutation = { __typename?: 'Mutation', updatePersonalAssistantSettings: { __typename?: 'Team', _id?: string | null, personalAssistantSettings?: { __typename?: 'PersonalAssistantSettings', autoUpgrade?: boolean | null } | null } };

export type UpsertMeetingPrepAppMutationVariables = Exact<{
  input: UpsertMeetingPrepAppInput;
}>;


export type UpsertMeetingPrepAppMutation = { __typename?: 'Mutation', upsertMeetingPrepApp: { __typename?: 'MeetingPrepApp', id: string, active: boolean, notificationPreference: EnumMeetingPrepAppNotificationType, showCompanyInsights: boolean, showParticipantInfo: boolean, showPastNotes: boolean, showPastSyncsSummary: boolean, userId: string, createdAt: any, updatedAt: any } };

export type ToggleAppSettingsMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  active: Scalars['Boolean']['input'];
}>;


export type ToggleAppSettingsMutation = { __typename?: 'Mutation', toggleAppSettings: { __typename?: 'AppSettings', id: string, active: boolean, title: string } };

export type GetTranscriptFfAuthQueryVariables = Exact<{
  meetingId: Scalars['String']['input'];
  source?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetTranscriptFfAuthQuery = { __typename?: 'Query', getTranscriptFFAuth?: string | null };

export type GetLiveMeetingInsightsQueryVariables = Exact<{
  meetingId: Scalars['String']['input'];
  realtimeToken: Scalars['String']['input'];
}>;


export type GetLiveMeetingInsightsQuery = { __typename?: 'Query', getLiveMeetingInsights?: { __typename?: 'LiveInsights', chapterizedNotes: any, notes?: Array<{ __typename?: 'LiveNote', id: string, parseId: string, note: string, time: number, endTime: number, emoji?: string | null, title?: string | null }> | null, actionItems?: Array<{ __typename?: 'LiveActionItem', id: string, parseId: string, personName: string, personEmail?: string | null, captionIndex?: number | null, actionItem: string, actionItemTimestamp: number, checked?: boolean | null }> | null } | null };

export type GetLiveMeetingMarksQueryVariables = Exact<{
  meetingId: Scalars['String']['input'];
}>;


export type GetLiveMeetingMarksQuery = { __typename?: 'Query', getLiveMeetingMarks: Array<{ __typename?: 'WaveMark', createdAt?: any | null, markType?: string | null, markPinType?: string | null, meetingOwnerId?: string | null, meetingId?: string | null, time?: number | null, transcriptParseId?: string | null, userFirstName?: string | null, source?: string | null, summary?: string | null, userPicture?: string | null, _id: string, userId?: string | null, pastOffsetSeconds?: number | null, futureOffsetSeconds?: number | null }> };

export type GetLiveTranscriptQueryVariables = Exact<{
  meetingId: Scalars['String']['input'];
  realtimeToken: Scalars['String']['input'];
}>;


export type GetLiveTranscriptQuery = { __typename?: 'Query', getLiveTranscript?: Array<{ __typename?: 'LiveTranscriptItem', parseId: string, transcript_id: string, sentence: string, speaker_id: number, time: number, endTime: number, speaker: number, speaker_name?: string | null, text?: string | null }> | null };

export type EnrichDomainsQueryVariables = Exact<{
  meetingId?: InputMaybe<Scalars['String']['input']>;
  iCalUID?: InputMaybe<Scalars['String']['input']>;
}>;


export type EnrichDomainsQuery = { __typename?: 'Query', enrichDomains?: Array<{ __typename?: 'EnrichedOrganization', _id: string, domain: string, name?: string | null, description?: string | null, recentHeadlines?: Array<{ __typename?: 'RecentHeadline', emoji?: string | null, title?: string | null, content?: string | null, occurredAt?: string | null }> | null }> | null };

export type EnrichDomainsByICalUidQueryVariables = Exact<{
  iCalUID?: InputMaybe<Scalars['String']['input']>;
}>;


export type EnrichDomainsByICalUidQuery = { __typename?: 'Query', enrichDomains?: Array<{ __typename?: 'EnrichedOrganization', _id: string, domain: string, name?: string | null, description?: string | null, recentHeadlines?: Array<{ __typename?: 'RecentHeadline', emoji?: string | null, title?: string | null, content?: string | null, occurredAt?: string | null }> | null }> | null };

export type EnrichDomainsByMeetingIdQueryVariables = Exact<{
  meetingId?: InputMaybe<Scalars['String']['input']>;
}>;


export type EnrichDomainsByMeetingIdQuery = { __typename?: 'Query', enrichDomains?: Array<{ __typename?: 'EnrichedOrganization', _id: string, domain: string, name?: string | null, description?: string | null, recentHeadlines?: Array<{ __typename?: 'RecentHeadline', emoji?: string | null, title?: string | null, content?: string | null, occurredAt?: string | null }> | null }> | null };

export type ListKnowledgeBaseDocumentsQueryVariables = Exact<{
  input: ListKnowledgeBaseDocumentsInput;
}>;


export type ListKnowledgeBaseDocumentsQuery = { __typename?: 'Query', listKnowledgeBaseDocuments: Array<{ __typename?: 'KnowledgeBaseDocument', category: string, contentType: string, documentId: string, fileName: string, uploadedAt: string, metadata?: { __typename?: 'KnowledgeBaseDocumentMetadata', fileUrl?: string | null, url?: string | null, domain?: string | null, title?: string | null, subpagesCount?: number | null, provider?: string | null, scrapedAt?: string | null, subPages?: Array<{ __typename?: 'SubPageInfo', url: string, title?: string | null }> | null } | null }> };

export type GlobalSearchQueryVariables = Exact<{
  from: Scalars['Int']['input'];
  size: Scalars['Int']['input'];
  channelId: Scalars['String']['input'];
  keywords?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<SearchFilters>;
}>;


export type GlobalSearchQuery = { __typename?: 'Query', globalSearch: { __typename?: 'Meetings', total?: number | null, meetings: Array<{ __typename?: 'Source', id?: string | null, title?: string | null, parseId?: string | null, owner?: string | null, date?: string | null, createdAt?: string | null, audioOnly?: boolean | null, addedBy?: string | null, creator_email?: string | null, durationMins?: number | null, duration?: number | null, allEmails?: string | null, processMeetingStatus?: string | null, privacy?: string | null, creatorProfile?: { __typename?: 'Profile', name?: string | null, picture?: string | null } | null, _highlight?: { __typename?: 'Highlight', title?: Array<string> | null, creator_email?: Array<string> | null, captions?: Array<{ __typename?: 'Caption', index?: number | null, sentence?: string | null, time?: number | null, endTime?: number | null, speaker_id?: number | null }> | null } | null }> } };

export type SaveOptionsMutationVariables = Exact<{
  sendNotesTo?: InputMaybe<Scalars['String']['input']>;
  announceFred?: InputMaybe<Scalars['Boolean']['input']>;
  autoJoin?: InputMaybe<Scalars['String']['input']>;
  preferredLanguage?: InputMaybe<Scalars['String']['input']>;
  invitesFrom?: InputMaybe<Scalars['String']['input']>;
  barRules?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
  joinRules?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
  dispatch?: InputMaybe<Scalars['String']['input']>;
  recordingNoti?: InputMaybe<Scalars['String']['input']>;
  customAlerts?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
  industry?: InputMaybe<Scalars['String']['input']>;
  privacy?: InputMaybe<Scalars['String']['input']>;
  updateForAll?: InputMaybe<Scalars['Boolean']['input']>;
  changedSettingsFrom?: InputMaybe<Scalars['String']['input']>;
  shouldVideoRecordMeeting?: InputMaybe<Scalars['Boolean']['input']>;
  meetingExpirySettings?: InputMaybe<MeetingExpirySettingsInput>;
  timesSeenCreditExhuast?: InputMaybe<Scalars['Int']['input']>;
  timesSeenPromptsExhaust?: InputMaybe<Scalars['Int']['input']>;
  seenFreeTrialModal?: InputMaybe<Scalars['Boolean']['input']>;
  seenAIExtensionsModal?: InputMaybe<Scalars['Boolean']['input']>;
  hasDismissedVideoPaywallBanner?: InputMaybe<Scalars['Boolean']['input']>;
  seenAskFredAnnouncement?: InputMaybe<Scalars['Boolean']['input']>;
  hasSeenAskFredOnboarding?: InputMaybe<Scalars['Boolean']['input']>;
  seenLanguageAnnouncement?: InputMaybe<Scalars['Boolean']['input']>;
  seenPrivacyModal?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type SaveOptionsMutation = { __typename?: 'Mutation', saveOptions?: { __typename?: 'User', message?: string | null, _id?: string | null, sendNotesTo?: string | null, autoJoin?: string | null, preferredLanguage?: string | null, email?: string | null, txReferral?: string | null, recordingNoti?: string | null, dispatch?: string | null, industry?: string | null, privacy?: string | null, joinRules?: Array<string> | null, barRules?: Array<string> | null, isAdmin?: boolean | null, hasTeammates?: boolean | null, skipSetup?: boolean | null, needsToOnboard?: boolean | null, parseUserId?: string | null, approvedTerms?: boolean | null, skipEmail?: boolean | null, teamReferral?: string | null, minutesConsumed?: number | null, transcriptionMinutesConsumed?: number | null, stripeCustomer?: string | null, paidUser?: string | null, stripePlanId?: string | null, stripePlanNickname?: string | null, stripeSubscriptionId?: string | null, tier?: string | null, freeMeetingsLeft?: number | null, cancelledAccount?: string | null, notesInjected?: number | null, numMeetingsWithNotes?: number | null, numberNotes?: number | null, referralCode?: string | null, createdAt?: any | null, updatedAt?: any | null, lastLogin?: any | null, shouldVideoRecordMeeting?: boolean | null, freeUploadPoints?: number | null, freeUploadsClaimed?: Array<string> | null, timesSeenCreditExhuast?: number | null, timesSeenPromptsExhaust?: number | null, freeTrial?: EnumFreeTrial | null, aiCreditsCost?: number | null, seenFreeTrialModal?: boolean | null, seenAIExtensionsModal?: boolean | null, signUpSource?: string | null, hasCalender?: boolean | null, onboardingStepsCompleted?: Array<string> | null, seenAskFredAnnouncement?: boolean | null, lastTranscribedMeetingId?: string | null, domain?: string | null, hasSeenAskFredOnboarding?: boolean | null, seenLanguageAnnouncement?: boolean | null, seenPrivacyModal?: boolean | null, timesSeenFreeTrialModal?: number | null, lastTimeSeenFreeTrialModal?: any | null, isAllowedToUsePrompts: boolean, isAllowedToUseAICredits: boolean, isPrivateStorageAllowed: boolean, profile?: { __typename?: 'Profile', email?: string | null, picture?: string | null, isOutlook?: boolean | null, firstName?: string | null, lastName?: string | null, name?: string | null } | null, teamMinutesConsumed?: { __typename?: 'TeamMinutesConsumed', minutesConsumed?: number | null, tierLimit?: number | null, isInfinity?: boolean | null, storageLimitHitDate?: any | null } | null, teamStripeAccount?: Array<{ __typename?: 'TeamStripeAccount', _id?: string | null, stripeCustomer?: string | null, stripePlanId?: string | null, stripePlanNickname?: string | null, stripeSubscriptionId?: string | null, userId?: string | null, freeTrial?: EnumFreeTrial | null, trialEndsAt?: any | null, hasTrialed?: boolean | null, hasTrialedAIExtensions?: boolean | null, hasTrialedAfterChurn?: boolean | null, aiExtensionsSubscription?: { __typename?: 'AIExtensionsSubscription', stripePlanNickname: string, stripeSubscriptionId: string, quantity: number, nextPaymentAt?: any | null, autoUpgrade?: boolean | null, cancelAt?: any | null, status: string, createdAt: any, trialEndsAt?: any | null, userId: string, stripePlanId: string, updatedAt: any } | null } | null> | null, teamPromptsConsumed?: { __typename?: 'TeamPromptsConsumed', allPromptsUsed?: number | null, monthlyPromptsUsed?: number | null, monthlyPromptsLimit?: number | null, freePrompts?: number | null, promptsLeft?: number | null, monthlyMicroCreditsUsed?: number | null, allMicroCreditsUsed?: number | null, microCreditsLeft?: number | null, grantedCreditsLeft?: number | null } | null, flags?: { __typename?: 'UserFlags', hasAccessToAITeammates?: boolean | null, hasAccessToEmailAssistant?: boolean | null, hasAcceptedTosUpdate2?: boolean | null, completedTalkFeedbackNudge?: boolean | null, completedSlackFredOnboarding?: boolean | null } | null } | null };

export type UpdateDisableFirefliesTalkMutationVariables = Exact<{
  metadata: UserMetaInput;
}>;


export type UpdateDisableFirefliesTalkMutation = { __typename?: 'Mutation', updateUserMetadata?: { __typename?: 'UserMetadata', id?: string | null, disableFirefliesTalk?: boolean | null } | null };

export type GetSlackConnectionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSlackConnectionQuery = { __typename?: 'Query', getConnectorListConnected?: Array<any> | null, getConnectorList?: { __typename?: 'ConnectorList', integrations?: Array<{ __typename?: 'ConnectorIntegration', id?: string | null, name?: string | null }> | null } | null };

export type GetTemplatesGroupedByCategoryQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTemplatesGroupedByCategoryQuery = { __typename?: 'Query', getTemplatesGroupedByCategory: Array<{ __typename?: 'GroupedSummaryTemplatesDto', id: string, index: number, name: string, templates: Array<{ __typename?: 'SummaryTemplate', id: string, title: string, description: string, categoryId?: string | null, default?: boolean | null, index?: number | null }> }> };

export type GetMeetingSummaryTemplateQueryVariables = Exact<{
  meetingId: Scalars['ID']['input'];
}>;


export type GetMeetingSummaryTemplateQuery = { __typename?: 'Query', getMeetingSummary?: { __typename?: 'MeetingSummaryResponse', meetingId: string, templateId?: string | null } | null };

export type CoreTeamFieldsFragment = { __typename?: 'Team', _id?: string | null, parseTeamId?: string | null, analytics?: boolean | null, admin?: string | null, admins?: Array<string | null> | null, settingsControl?: boolean | null, isActive?: boolean | null, autoAddEnabled?: boolean | null, autoAddDomains?: Array<string> | null, notificationSetting?: string | null, teamDispatch?: string | null, teamInviteDisabled?: boolean | null, createdAt?: any | null, teammates: Array<{ __typename?: 'Teammate', id?: string | null, email?: string | null, name?: string | null, blocked?: boolean | null, isAdmin?: boolean | null, status?: string | null, source?: string | null, seenAutoAddModal?: boolean | null, isFromSignUp?: boolean | null, skipSeats?: boolean | null, profile?: { __typename?: 'Profile', picture?: string | null, name?: string | null, lastName?: string | null, firstName?: string | null, email?: string | null } | null }>, settings?: { __typename?: 'TeamSettings', autoJoin?: string | null, sendNotesTo?: string | null, privacy?: string | null, meetingVideoRecording?: string | null, aiAppsPrivacy?: string | null, isAllowedToSeePrompts?: boolean | null, isAllowedToCreateAIApps?: string | null, recordingNoti?: string | null, recordingNotiLocked?: boolean | null, allowPersonalAssistant?: boolean | null, disableFirefliesTalk?: boolean | null } | null, personalAssistantSettings?: { __typename?: 'PersonalAssistantSettings', autoUpgrade?: boolean | null } | null, billingSettings?: { __typename?: 'BillingSettings', sendReceiptEnabled?: boolean | null, billingEmails?: Array<string> | null } | null, grantedAICredits?: Array<{ __typename?: 'GrantedAICredit', amount: number, amountUsed: number }> | null, aiCreditsFreeAccess?: { __typename?: 'AICreditsFreeAccess', campaign: EnumAiCreditsFreeAccessCampaigns, startedAt: any, endsAt: any, canceledAt?: any | null } | null };

export type GetTeamQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTeamQuery = { __typename?: 'Query', team?: { __typename?: 'Team', _id?: string | null, parseTeamId?: string | null, analytics?: boolean | null, admin?: string | null, admins?: Array<string | null> | null, settingsControl?: boolean | null, isActive?: boolean | null, autoAddEnabled?: boolean | null, autoAddDomains?: Array<string> | null, notificationSetting?: string | null, teamDispatch?: string | null, teamInviteDisabled?: boolean | null, createdAt?: any | null, teammates: Array<{ __typename?: 'Teammate', id?: string | null, email?: string | null, name?: string | null, blocked?: boolean | null, isAdmin?: boolean | null, status?: string | null, source?: string | null, seenAutoAddModal?: boolean | null, isFromSignUp?: boolean | null, skipSeats?: boolean | null, profile?: { __typename?: 'Profile', picture?: string | null, name?: string | null, lastName?: string | null, firstName?: string | null, email?: string | null } | null }>, settings?: { __typename?: 'TeamSettings', autoJoin?: string | null, sendNotesTo?: string | null, privacy?: string | null, meetingVideoRecording?: string | null, aiAppsPrivacy?: string | null, isAllowedToSeePrompts?: boolean | null, isAllowedToCreateAIApps?: string | null, recordingNoti?: string | null, recordingNotiLocked?: boolean | null, allowPersonalAssistant?: boolean | null, disableFirefliesTalk?: boolean | null } | null, personalAssistantSettings?: { __typename?: 'PersonalAssistantSettings', autoUpgrade?: boolean | null } | null, billingSettings?: { __typename?: 'BillingSettings', sendReceiptEnabled?: boolean | null, billingEmails?: Array<string> | null } | null, grantedAICredits?: Array<{ __typename?: 'GrantedAICredit', amount: number, amountUsed: number }> | null, aiCreditsFreeAccess?: { __typename?: 'AICreditsFreeAccess', campaign: EnumAiCreditsFreeAccessCampaigns, startedAt: any, endsAt: any, canceledAt?: any | null } | null } | null };

export type RequestToJoinTeamMutationVariables = Exact<{
  teamId: Scalars['ID']['input'];
  source?: InputMaybe<Scalars['String']['input']>;
}>;


export type RequestToJoinTeamMutation = { __typename?: 'Mutation', requestToJoinTeam: { __typename?: 'TeamRequest', id: string } };

export type GetInviteSuggestionsQueryVariables = Exact<{
  group?: InputMaybe<EnumInviteSuggestionsGroup>;
  isAutoAdd?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetInviteSuggestionsQuery = { __typename?: 'Query', inviteSuggestions: { __typename?: 'InviteSuggestions', totalCount: number, integrations?: Array<{ __typename?: 'Integration', name?: string | null, displayName?: string | null, category?: string | null, icon?: string | null, _id?: string | null, authType?: string | null, connectButtonLink?: string | null }> | null, users?: { __typename?: 'PaginationInviteSuggestions', count: number, emails: Array<string>, items: Array<{ __typename?: 'SuggestionPublicProfile', name?: string | null, email?: string | null, picture?: string | null, group?: EnumInviteSuggestionsGroup | null }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, currentPage: number, itemCount: number, pageCount: number, perPage: number } } | null, nonUsers?: { __typename?: 'PaginationInviteSuggestions', count: number, emails: Array<string>, items: Array<{ __typename?: 'SuggestionPublicProfile', name?: string | null, email?: string | null, picture?: string | null, group?: EnumInviteSuggestionsGroup | null }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, currentPage: number, itemCount: number, pageCount: number, perPage: number } } | null } };

export type InviteTeammatesMutationVariables = Exact<{
  teamId: Scalars['String']['input'];
  teamEmails: Array<Scalars['String']['input']> | Scalars['String']['input'];
  source: Scalars['String']['input'];
}>;


export type InviteTeammatesMutation = { __typename?: 'Mutation', inviteTeammates: string };

export type GetPublicProfileForInviteQueryVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type GetPublicProfileForInviteQuery = { __typename?: 'Query', getPublicProfileForInvite?: { __typename?: 'SuggestionPublicProfile', name?: string | null, email?: string | null, picture?: string | null, group?: EnumInviteSuggestionsGroup | null } | null };

export type RecordingPreferencesQueryVariables = Exact<{ [key: string]: never; }>;


export type RecordingPreferencesQuery = { __typename?: 'Query', recordingPreferences: { __typename?: 'RecordingPreferences', teamsConsentEnabled: boolean } };

export type SetTeamsConsentEnabledMutationVariables = Exact<{
  enabled: Scalars['Boolean']['input'];
}>;


export type SetTeamsConsentEnabledMutation = { __typename?: 'Mutation', setTeamsConsentEnabled: { __typename?: 'RecordingPreferences', teamsConsentEnabled: boolean } };

export type NotifyStealthRecordingStartedMutationVariables = Exact<{
  input: NotifyStealthRecordingStartedInput;
}>;


export type NotifyStealthRecordingStartedMutation = { __typename?: 'Mutation', notifyStealthRecordingStarted: { __typename?: 'NotifyStealthRecordingStartedPayload', ok: boolean, reason?: string | null } };

export type GetCategoriesQueryVariables = Exact<{
  skip?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  sourceIsNotepad?: InputMaybe<Scalars['Boolean']['input']>;
  type?: InputMaybe<TopicType>;
}>;


export type GetCategoriesQuery = { __typename?: 'Query', getCategories?: { __typename?: 'Topic', isEnd?: boolean | null, message?: string | null, nodes?: Array<{ __typename?: 'Categories', _id: string, createdAt?: any | null, owner?: string | null, teamAccess?: boolean | null, property?: { __typename?: 'Properties', name?: string | null, subProperties?: Array<string> | null } | null }> | null } | null };

export type SuggestCategoriesQueryVariables = Exact<{
  subProperties: Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>;
}>;


export type SuggestCategoriesQuery = { __typename?: 'Query', suggestCategories?: Array<{ __typename?: 'Suggestion', name?: string | null, score?: number | null }> | null };

export type UpdateCategoriesMutationVariables = Exact<{
  _id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  subProperties: Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>;
  teamAccess?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type UpdateCategoriesMutation = { __typename?: 'Mutation', updateCategories?: { __typename?: 'Categories', _id: string, owner?: string | null, teamAccess?: boolean | null, property?: { __typename?: 'Properties', name?: string | null, subProperties?: Array<string> | null } | null } | null };

export type InsertCategoriesMutationVariables = Exact<{
  name: Scalars['String']['input'];
  subProperties: Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>;
  teamAccess?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type InsertCategoriesMutation = { __typename?: 'Mutation', insertCategories: { __typename?: 'Categories', _id: string, owner?: string | null, createdAt?: any | null, teamAccess?: boolean | null, property?: { __typename?: 'Properties', name?: string | null, subProperties?: Array<string> | null } | null } };

export type DeleteCategoriesMutationVariables = Exact<{
  _id: Scalars['String']['input'];
}>;


export type DeleteCategoriesMutation = { __typename?: 'Mutation', deleteCategories?: string | null };

export type FetchUploadedFilesQueryVariables = Exact<{ [key: string]: never; }>;


export type FetchUploadedFilesQuery = { __typename?: 'Query', fetchUploadedFiles: Array<{ __typename?: 'Files', audio_url: string, createdAt: any, isAudio: boolean, name: string, processing?: boolean | null, size: number, type: string, userId: string, _id: string, meetingId?: string | null }> };

export type CreateUserFileMutationVariables = Exact<{
  fileName: Scalars['String']['input'];
  fileType: Scalars['String']['input'];
  fileSize: Scalars['Float']['input'];
  audioUrl: Scalars['String']['input'];
  meetingId: Scalars['String']['input'];
}>;


export type CreateUserFileMutation = { __typename?: 'Mutation', createUserFile?: string | null };

export type DeleteUserFileMutationVariables = Exact<{
  fileId: Scalars['String']['input'];
}>;


export type DeleteUserFileMutation = { __typename?: 'Mutation', deleteUserFile?: boolean | null };

export type CoreUserFieldsFragment = { __typename?: 'User', _id?: string | null, sendNotesTo?: string | null, autoJoin?: string | null, preferredLanguage?: string | null, email?: string | null, txReferral?: string | null, recordingNoti?: string | null, dispatch?: string | null, industry?: string | null, privacy?: string | null, joinRules?: Array<string> | null, barRules?: Array<string> | null, isAdmin?: boolean | null, hasTeammates?: boolean | null, skipSetup?: boolean | null, needsToOnboard?: boolean | null, parseUserId?: string | null, approvedTerms?: boolean | null, skipEmail?: boolean | null, teamReferral?: string | null, minutesConsumed?: number | null, transcriptionMinutesConsumed?: number | null, stripeCustomer?: string | null, paidUser?: string | null, stripePlanId?: string | null, stripePlanNickname?: string | null, stripeSubscriptionId?: string | null, tier?: string | null, freeMeetingsLeft?: number | null, cancelledAccount?: string | null, notesInjected?: number | null, numMeetingsWithNotes?: number | null, numberNotes?: number | null, referralCode?: string | null, createdAt?: any | null, updatedAt?: any | null, lastLogin?: any | null, shouldVideoRecordMeeting?: boolean | null, freeUploadPoints?: number | null, freeUploadsClaimed?: Array<string> | null, timesSeenCreditExhuast?: number | null, timesSeenPromptsExhaust?: number | null, freeTrial?: EnumFreeTrial | null, aiCreditsCost?: number | null, seenFreeTrialModal?: boolean | null, seenAIExtensionsModal?: boolean | null, signUpSource?: string | null, hasCalender?: boolean | null, onboardingStepsCompleted?: Array<string> | null, seenAskFredAnnouncement?: boolean | null, lastTranscribedMeetingId?: string | null, domain?: string | null, hasSeenAskFredOnboarding?: boolean | null, seenLanguageAnnouncement?: boolean | null, seenPrivacyModal?: boolean | null, timesSeenFreeTrialModal?: number | null, lastTimeSeenFreeTrialModal?: any | null, isAllowedToUsePrompts: boolean, isAllowedToUseAICredits: boolean, isPrivateStorageAllowed: boolean, profile?: { __typename?: 'Profile', email?: string | null, picture?: string | null, isOutlook?: boolean | null, firstName?: string | null, lastName?: string | null, name?: string | null } | null, teamMinutesConsumed?: { __typename?: 'TeamMinutesConsumed', minutesConsumed?: number | null, tierLimit?: number | null, isInfinity?: boolean | null, storageLimitHitDate?: any | null } | null, teamStripeAccount?: Array<{ __typename?: 'TeamStripeAccount', _id?: string | null, stripeCustomer?: string | null, stripePlanId?: string | null, stripePlanNickname?: string | null, stripeSubscriptionId?: string | null, userId?: string | null, freeTrial?: EnumFreeTrial | null, trialEndsAt?: any | null, hasTrialed?: boolean | null, hasTrialedAIExtensions?: boolean | null, hasTrialedAfterChurn?: boolean | null, aiExtensionsSubscription?: { __typename?: 'AIExtensionsSubscription', stripePlanNickname: string, stripeSubscriptionId: string, quantity: number, nextPaymentAt?: any | null, autoUpgrade?: boolean | null, cancelAt?: any | null, status: string, createdAt: any, trialEndsAt?: any | null, userId: string, stripePlanId: string, updatedAt: any } | null } | null> | null, teamPromptsConsumed?: { __typename?: 'TeamPromptsConsumed', allPromptsUsed?: number | null, monthlyPromptsUsed?: number | null, monthlyPromptsLimit?: number | null, freePrompts?: number | null, promptsLeft?: number | null, monthlyMicroCreditsUsed?: number | null, allMicroCreditsUsed?: number | null, microCreditsLeft?: number | null, grantedCreditsLeft?: number | null } | null, flags?: { __typename?: 'UserFlags', hasAccessToAITeammates?: boolean | null, hasAccessToEmailAssistant?: boolean | null, hasAcceptedTosUpdate2?: boolean | null, completedTalkFeedbackNudge?: boolean | null, completedSlackFredOnboarding?: boolean | null } | null };

export type GetCurrentUserQueryVariables = Exact<{
  timezone?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetCurrentUserQuery = { __typename?: 'Query', user?: { __typename?: 'User', _id?: string | null, sendNotesTo?: string | null, autoJoin?: string | null, preferredLanguage?: string | null, email?: string | null, txReferral?: string | null, recordingNoti?: string | null, dispatch?: string | null, industry?: string | null, privacy?: string | null, joinRules?: Array<string> | null, barRules?: Array<string> | null, isAdmin?: boolean | null, hasTeammates?: boolean | null, skipSetup?: boolean | null, needsToOnboard?: boolean | null, parseUserId?: string | null, approvedTerms?: boolean | null, skipEmail?: boolean | null, teamReferral?: string | null, minutesConsumed?: number | null, transcriptionMinutesConsumed?: number | null, stripeCustomer?: string | null, paidUser?: string | null, stripePlanId?: string | null, stripePlanNickname?: string | null, stripeSubscriptionId?: string | null, tier?: string | null, freeMeetingsLeft?: number | null, cancelledAccount?: string | null, notesInjected?: number | null, numMeetingsWithNotes?: number | null, numberNotes?: number | null, referralCode?: string | null, createdAt?: any | null, updatedAt?: any | null, lastLogin?: any | null, shouldVideoRecordMeeting?: boolean | null, freeUploadPoints?: number | null, freeUploadsClaimed?: Array<string> | null, timesSeenCreditExhuast?: number | null, timesSeenPromptsExhaust?: number | null, freeTrial?: EnumFreeTrial | null, aiCreditsCost?: number | null, seenFreeTrialModal?: boolean | null, seenAIExtensionsModal?: boolean | null, signUpSource?: string | null, hasCalender?: boolean | null, onboardingStepsCompleted?: Array<string> | null, seenAskFredAnnouncement?: boolean | null, lastTranscribedMeetingId?: string | null, domain?: string | null, hasSeenAskFredOnboarding?: boolean | null, seenLanguageAnnouncement?: boolean | null, seenPrivacyModal?: boolean | null, timesSeenFreeTrialModal?: number | null, lastTimeSeenFreeTrialModal?: any | null, isAllowedToUsePrompts: boolean, isAllowedToUseAICredits: boolean, isPrivateStorageAllowed: boolean, userMetaData?: { __typename?: 'UserMetadata', disableFirefliesTalk?: boolean | null, counters?: { __typename?: 'UserCounters', timesSeenTalkFeedbackNudge?: number | null, timesSeenTalkEmailAssistantNudge?: number | null, timesSeenTalkSlackAssistantNudge?: number | null } | null, timestamps?: { __typename?: 'UserTimestamps', lastTimeSeenTalkEmailAssistantNudge?: any | null, lastTimeSeenTalkSlackAssistantNudge?: any | null } | null } | null, profile?: { __typename?: 'Profile', email?: string | null, picture?: string | null, isOutlook?: boolean | null, firstName?: string | null, lastName?: string | null, name?: string | null } | null, teamMinutesConsumed?: { __typename?: 'TeamMinutesConsumed', minutesConsumed?: number | null, tierLimit?: number | null, isInfinity?: boolean | null, storageLimitHitDate?: any | null } | null, teamStripeAccount?: Array<{ __typename?: 'TeamStripeAccount', _id?: string | null, stripeCustomer?: string | null, stripePlanId?: string | null, stripePlanNickname?: string | null, stripeSubscriptionId?: string | null, userId?: string | null, freeTrial?: EnumFreeTrial | null, trialEndsAt?: any | null, hasTrialed?: boolean | null, hasTrialedAIExtensions?: boolean | null, hasTrialedAfterChurn?: boolean | null, aiExtensionsSubscription?: { __typename?: 'AIExtensionsSubscription', stripePlanNickname: string, stripeSubscriptionId: string, quantity: number, nextPaymentAt?: any | null, autoUpgrade?: boolean | null, cancelAt?: any | null, status: string, createdAt: any, trialEndsAt?: any | null, userId: string, stripePlanId: string, updatedAt: any } | null } | null> | null, teamPromptsConsumed?: { __typename?: 'TeamPromptsConsumed', allPromptsUsed?: number | null, monthlyPromptsUsed?: number | null, monthlyPromptsLimit?: number | null, freePrompts?: number | null, promptsLeft?: number | null, monthlyMicroCreditsUsed?: number | null, allMicroCreditsUsed?: number | null, microCreditsLeft?: number | null, grantedCreditsLeft?: number | null } | null, flags?: { __typename?: 'UserFlags', hasAccessToAITeammates?: boolean | null, hasAccessToEmailAssistant?: boolean | null, hasAcceptedTosUpdate2?: boolean | null, completedTalkFeedbackNudge?: boolean | null, completedSlackFredOnboarding?: boolean | null } | null } | null };

export type UpdateUserDynamicMetadataMutationVariables = Exact<{
  input: UpdateUserDynamicMetadataInput;
}>;


export type UpdateUserDynamicMetadataMutation = { __typename?: 'Mutation', updateUserDynamicMetadata?: { __typename?: 'UserDynamicMetadata', flags?: { __typename?: 'UserFlags', hasAcceptedTosUpdate2?: boolean | null, completedTalkFeedbackNudge?: boolean | null } | null, counters?: { __typename?: 'UserCounters', timesSeenTalkFeedbackNudge?: number | null, timesSeenTalkEmailAssistantNudge?: number | null, timesSeenTalkSlackAssistantNudge?: number | null } | null, timestamps?: { __typename?: 'UserTimestamps', acceptedTosUpdateAt?: any | null, acceptedTosUpdate2At?: any | null, lastTimeSeenTalkEmailAssistantNudge?: any | null, lastTimeSeenTalkSlackAssistantNudge?: any | null } | null } | null };

export type GetPublicProfileQueryVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type GetPublicProfileQuery = { __typename?: 'Query', publicProfile?: { __typename?: 'SuggestionPublicProfile', name?: string | null, email?: string | null, picture?: string | null, group?: EnumInviteSuggestionsGroup | null } | null };

export type GetPublicProfilesQueryVariables = Exact<{
  emails: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type GetPublicProfilesQuery = { __typename?: 'Query', publicProfiles: Array<{ __typename?: 'SuggestionPublicProfile', name?: string | null, email?: string | null, picture?: string | null, group?: EnumInviteSuggestionsGroup | null }> };

export const CoreAskFredFieldsFragmentDoc = gql`
    fragment CoreAskFredFields on FredResponse {
  id
  question
  answer
  rating
  status
  rating
  meetingId
  answer
  privacy
  source
  createdAt
}
    `;
export const CoreFeedMeetingFieldsFragmentDoc = gql`
    fragment CoreFeedMeetingFields on FeedMeeting {
  _id
  title
  organizerEmail
  owner
  startTime
  endTime
  addedBy
  organizerProfile {
    name
    email
    picture
  }
  participantsProfiles {
    name
    email
    picture
  }
  summary {
    emoji
    title
    sentence
  }
  tasks {
    id
    title
    description
    status
    ownerId
    ownerType
    ownerEmail
    ownerProfile {
      ... on Profile {
        name
        email
        picture
      }
      ... on UserGroup {
        _id
        handle
        groupName: name
      }
    }
    meetingId
    meetingTimestamp
    meetingCaptionIndex
    createdById
    completedAt
    completedByUserId
    createdAt
    updatedAt
    hasChangedOwner
    generatedOwnerName
  }
}
    `;
export const EnrichedDomainFieldsFragmentDoc = gql`
    fragment EnrichedDomainFields on EnrichedDomain {
  domain
  name
  description
  recentHeadlines {
    title
    content
    emoji
    occurredAt
  }
}
    `;
export const MeetingPrepOutputFieldsFragmentDoc = gql`
    fragment MeetingPrepOutputFields on MeetingPrepOutput {
  charged
  companyInsights {
    ...EnrichedDomainFields
  }
  participantInfo
  pastNotes {
    meetingId
    overview
    startTime
    title
    bulletGist {
      emoji
      sentence
      title
    }
    shorthandBullet {
      title
      emoji
    }
    tasks {
      id
      title
      description
      status
      dueDate
      ownerEmail
      ownerId
      ownerType
      generatedOwnerName
      hasChangedOwner
      meetingId
      meetingTimestamp
      meetingCaptionIndex
      parentId
      createdAt
      createdById
      updatedAt
      completedAt
      completedByUserId
    }
  }
  pastSyncsSummary {
    summary
    meetings {
      id
      title
      date
      organizerPicture
      organizerName
    }
  }
}
    ${EnrichedDomainFieldsFragmentDoc}`;
export const AppSettingsFieldsFragmentDoc = gql`
    fragment AppSettingsFields on AppSettings {
  id
  active
  autoEnabled
  title
  description
  type
  createdAt
  updatedAt
}
    `;
export const GetPersonalAssistantResponseDtoFieldsFragmentDoc = gql`
    fragment GetPersonalAssistantResponseDtoFields on GetPersonalAssistantResponseDto {
  dailyDigest {
    appSettings {
      ...AppSettingsFields
    }
    lastOutputCreatedAt
    meetingCount
    audioUrl
  }
  popularTopics {
    appSettings {
      ...AppSettingsFields
    }
  }
}
    ${AppSettingsFieldsFragmentDoc}`;
export const MeetingPrepAppFieldsFragmentDoc = gql`
    fragment MeetingPrepAppFields on MeetingPrepApp {
  id
  active
  notificationPreference
  showCompanyInsights
  showParticipantInfo
  showPastNotes
  showPastSyncsSummary
  userId
  createdAt
  updatedAt
}
    `;
export const AppOutputEventFieldsFragmentDoc = gql`
    fragment AppOutputEventFields on AppOutputEvent {
  appId
  audioUrl
  createdAt
  eventId
  meetingIds
  origin
  output
  outputJson
  updatedAt
  event {
    id
    isSeen
    appSettings {
      id
      title
      active
    }
  }
  meetings {
    id
    title
    startTime
    ownerName
    ownerPicture
  }
}
    `;
export const CoreTeamFieldsFragmentDoc = gql`
    fragment CoreTeamFields on Team {
  _id
  parseTeamId
  analytics
  admin
  admins
  settingsControl
  isActive
  autoAddEnabled
  autoAddDomains
  notificationSetting
  teamDispatch
  teamInviteDisabled
  createdAt
  teammates {
    id
    email
    name
    blocked
    isAdmin
    status
    source
    seenAutoAddModal
    isFromSignUp
    skipSeats
    profile {
      picture
      name
      lastName
      firstName
      email
    }
  }
  settings {
    autoJoin
    sendNotesTo
    privacy
    meetingVideoRecording
    aiAppsPrivacy
    isAllowedToSeePrompts
    isAllowedToCreateAIApps
    recordingNoti
    recordingNotiLocked
    allowPersonalAssistant
    disableFirefliesTalk
  }
  personalAssistantSettings {
    autoUpgrade
  }
  billingSettings {
    sendReceiptEnabled
    billingEmails
  }
  grantedAICredits {
    amount
    amountUsed
  }
  aiCreditsFreeAccess {
    campaign
    startedAt
    endsAt
    canceledAt
  }
}
    `;
export const CoreAiExtensionsSubscriptionFieldsFragmentDoc = gql`
    fragment CoreAIExtensionsSubscriptionFields on AIExtensionsSubscription {
  stripePlanNickname
  stripeSubscriptionId
  quantity
  nextPaymentAt
  autoUpgrade
  cancelAt
  status
  createdAt
  trialEndsAt
  userId
  stripePlanId
  updatedAt
}
    `;
export const CoreTeamPromptsConsumedFieldsFragmentDoc = gql`
    fragment CoreTeamPromptsConsumedFields on TeamPromptsConsumed {
  allPromptsUsed
  monthlyPromptsUsed
  monthlyPromptsLimit
  freePrompts
  promptsLeft
  monthlyMicroCreditsUsed
  allMicroCreditsUsed
  microCreditsLeft
  grantedCreditsLeft
}
    `;
export const CoreUserFieldsFragmentDoc = gql`
    fragment CoreUserFields on User {
  _id
  sendNotesTo
  autoJoin
  preferredLanguage
  email
  txReferral
  recordingNoti
  dispatch
  industry
  privacy
  joinRules
  barRules
  isAdmin
  hasTeammates
  skipSetup
  needsToOnboard
  parseUserId
  profile {
    email
    picture
    isOutlook
    firstName
    lastName
    name
  }
  approvedTerms
  skipEmail
  teamReferral
  minutesConsumed
  transcriptionMinutesConsumed
  teamMinutesConsumed {
    minutesConsumed
    tierLimit
    isInfinity
    storageLimitHitDate
  }
  stripeCustomer
  paidUser
  stripePlanId
  stripePlanNickname
  stripeSubscriptionId
  tier
  freeMeetingsLeft
  cancelledAccount
  notesInjected
  numMeetingsWithNotes
  numberNotes
  referralCode
  createdAt
  updatedAt
  lastLogin
  shouldVideoRecordMeeting
  freeUploadPoints
  freeUploadsClaimed
  teamStripeAccount {
    _id
    stripeCustomer
    stripePlanId
    stripePlanNickname
    stripeSubscriptionId
    userId
    freeTrial
    trialEndsAt
    hasTrialed
    hasTrialedAIExtensions
    hasTrialedAfterChurn
    aiExtensionsSubscription {
      ...CoreAIExtensionsSubscriptionFields
    }
  }
  teamPromptsConsumed {
    ...CoreTeamPromptsConsumedFields
  }
  timesSeenCreditExhuast
  timesSeenPromptsExhaust
  freeTrial
  aiCreditsCost
  seenFreeTrialModal
  seenAIExtensionsModal
  signUpSource
  hasCalender
  onboardingStepsCompleted
  seenAskFredAnnouncement
  lastTranscribedMeetingId
  domain
  hasSeenAskFredOnboarding
  seenLanguageAnnouncement
  seenPrivacyModal
  timesSeenFreeTrialModal
  lastTimeSeenFreeTrialModal
  isAllowedToUsePrompts
  isAllowedToUseAICredits
  isPrivateStorageAllowed
  flags {
    hasAccessToAITeammates
    hasAccessToEmailAssistant
    hasAcceptedTosUpdate2
    completedTalkFeedbackNudge
    completedSlackFredOnboarding
  }
}
    ${CoreAiExtensionsSubscriptionFieldsFragmentDoc}
${CoreTeamPromptsConsumedFieldsFragmentDoc}`;
export const MyCapabilityDocument = gql`
    query MyCapability($teamId: String!, $capability: Capability!, $resource: ResourceInput) {
  myCapability(teamId: $teamId, capability: $capability, resource: $resource) {
    capability
    allowed
  }
}
    `;

/**
 * __useMyCapabilityQuery__
 *
 * To run a query within a React component, call `useMyCapabilityQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyCapabilityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyCapabilityQuery({
 *   variables: {
 *      teamId: // value for 'teamId'
 *      capability: // value for 'capability'
 *      resource: // value for 'resource'
 *   },
 * });
 */
export function useMyCapabilityQuery(baseOptions: Apollo.QueryHookOptions<MyCapabilityQuery, MyCapabilityQueryVariables> & ({ variables: MyCapabilityQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MyCapabilityQuery, MyCapabilityQueryVariables>(MyCapabilityDocument, options);
      }
export function useMyCapabilityLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyCapabilityQuery, MyCapabilityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MyCapabilityQuery, MyCapabilityQueryVariables>(MyCapabilityDocument, options);
        }
// @ts-ignore
export function useMyCapabilitySuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MyCapabilityQuery, MyCapabilityQueryVariables>): Apollo.UseSuspenseQueryResult<MyCapabilityQuery, MyCapabilityQueryVariables>;
export function useMyCapabilitySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyCapabilityQuery, MyCapabilityQueryVariables>): Apollo.UseSuspenseQueryResult<MyCapabilityQuery | undefined, MyCapabilityQueryVariables>;
export function useMyCapabilitySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyCapabilityQuery, MyCapabilityQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MyCapabilityQuery, MyCapabilityQueryVariables>(MyCapabilityDocument, options);
        }
export type MyCapabilityQueryHookResult = ReturnType<typeof useMyCapabilityQuery>;
export type MyCapabilityLazyQueryHookResult = ReturnType<typeof useMyCapabilityLazyQuery>;
export type MyCapabilitySuspenseQueryHookResult = ReturnType<typeof useMyCapabilitySuspenseQuery>;
export type MyCapabilityQueryResult = Apollo.QueryResult<MyCapabilityQuery, MyCapabilityQueryVariables>;
export const RunSummaryManuallyDocument = gql`
    mutation runSummaryManually($meetingId: String!, $mergeManualNotes: Boolean, $templateId: String) {
  runSummaryManually(
    input: {meetingId: $meetingId, mergeManualNotes: $mergeManualNotes, templateId: $templateId}
  )
}
    `;
export type RunSummaryManuallyMutationFn = Apollo.MutationFunction<RunSummaryManuallyMutation, RunSummaryManuallyMutationVariables>;

/**
 * __useRunSummaryManuallyMutation__
 *
 * To run a mutation, you first call `useRunSummaryManuallyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRunSummaryManuallyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [runSummaryManuallyMutation, { data, loading, error }] = useRunSummaryManuallyMutation({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      mergeManualNotes: // value for 'mergeManualNotes'
 *      templateId: // value for 'templateId'
 *   },
 * });
 */
export function useRunSummaryManuallyMutation(baseOptions?: Apollo.MutationHookOptions<RunSummaryManuallyMutation, RunSummaryManuallyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RunSummaryManuallyMutation, RunSummaryManuallyMutationVariables>(RunSummaryManuallyDocument, options);
      }
export type RunSummaryManuallyMutationHookResult = ReturnType<typeof useRunSummaryManuallyMutation>;
export type RunSummaryManuallyMutationResult = Apollo.MutationResult<RunSummaryManuallyMutation>;
export type RunSummaryManuallyMutationOptions = Apollo.BaseMutationOptions<RunSummaryManuallyMutation, RunSummaryManuallyMutationVariables>;
export const ListAppTemplatesDocument = gql`
    query listAppTemplates {
  listAppTemplates {
    id
    title
    description
    categoryId
    createdAt
    updatedAt
    lastUpdatedBy
    type
    prompt {
      system
      user
    }
    trigger {
      source
      sources
      cron
      rulesCompositionType
      rules {
        field
        operator
        values
      }
    }
    sources
    engine
    outputType
  }
}
    `;

/**
 * __useListAppTemplatesQuery__
 *
 * To run a query within a React component, call `useListAppTemplatesQuery` and pass it any options that fit your needs.
 * When your component renders, `useListAppTemplatesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListAppTemplatesQuery({
 *   variables: {
 *   },
 * });
 */
export function useListAppTemplatesQuery(baseOptions?: Apollo.QueryHookOptions<ListAppTemplatesQuery, ListAppTemplatesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListAppTemplatesQuery, ListAppTemplatesQueryVariables>(ListAppTemplatesDocument, options);
      }
export function useListAppTemplatesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListAppTemplatesQuery, ListAppTemplatesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListAppTemplatesQuery, ListAppTemplatesQueryVariables>(ListAppTemplatesDocument, options);
        }
// @ts-ignore
export function useListAppTemplatesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListAppTemplatesQuery, ListAppTemplatesQueryVariables>): Apollo.UseSuspenseQueryResult<ListAppTemplatesQuery, ListAppTemplatesQueryVariables>;
export function useListAppTemplatesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAppTemplatesQuery, ListAppTemplatesQueryVariables>): Apollo.UseSuspenseQueryResult<ListAppTemplatesQuery | undefined, ListAppTemplatesQueryVariables>;
export function useListAppTemplatesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAppTemplatesQuery, ListAppTemplatesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListAppTemplatesQuery, ListAppTemplatesQueryVariables>(ListAppTemplatesDocument, options);
        }
export type ListAppTemplatesQueryHookResult = ReturnType<typeof useListAppTemplatesQuery>;
export type ListAppTemplatesLazyQueryHookResult = ReturnType<typeof useListAppTemplatesLazyQuery>;
export type ListAppTemplatesSuspenseQueryHookResult = ReturnType<typeof useListAppTemplatesSuspenseQuery>;
export type ListAppTemplatesQueryResult = Apollo.QueryResult<ListAppTemplatesQuery, ListAppTemplatesQueryVariables>;
export const ListAppSettingsDocument = gql`
    query listAppSettings {
  listAppSettings {
    id
    title
    description
    type
    categoryId
    active
    userId
    teamId
    appPrivacy
    outputPrivacy
    appTemplateId
    sharedUserGroupIds
    model
    createdAt
    updatedAt
    lastUpdatedBy
    outputType
    pinned
    prompt {
      user
      system
    }
    trigger {
      source
      sources
      cron
      rulesCompositionType
      rules {
        field
        operator
        values
      }
    }
    engine
    sources
  }
}
    `;

/**
 * __useListAppSettingsQuery__
 *
 * To run a query within a React component, call `useListAppSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListAppSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListAppSettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useListAppSettingsQuery(baseOptions?: Apollo.QueryHookOptions<ListAppSettingsQuery, ListAppSettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListAppSettingsQuery, ListAppSettingsQueryVariables>(ListAppSettingsDocument, options);
      }
export function useListAppSettingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListAppSettingsQuery, ListAppSettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListAppSettingsQuery, ListAppSettingsQueryVariables>(ListAppSettingsDocument, options);
        }
// @ts-ignore
export function useListAppSettingsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListAppSettingsQuery, ListAppSettingsQueryVariables>): Apollo.UseSuspenseQueryResult<ListAppSettingsQuery, ListAppSettingsQueryVariables>;
export function useListAppSettingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAppSettingsQuery, ListAppSettingsQueryVariables>): Apollo.UseSuspenseQueryResult<ListAppSettingsQuery | undefined, ListAppSettingsQueryVariables>;
export function useListAppSettingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListAppSettingsQuery, ListAppSettingsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListAppSettingsQuery, ListAppSettingsQueryVariables>(ListAppSettingsDocument, options);
        }
export type ListAppSettingsQueryHookResult = ReturnType<typeof useListAppSettingsQuery>;
export type ListAppSettingsLazyQueryHookResult = ReturnType<typeof useListAppSettingsLazyQuery>;
export type ListAppSettingsSuspenseQueryHookResult = ReturnType<typeof useListAppSettingsSuspenseQuery>;
export type ListAppSettingsQueryResult = Apollo.QueryResult<ListAppSettingsQuery, ListAppSettingsQueryVariables>;
export const AskFredDocument = gql`
    mutation AskFred($meetingId: String!, $query: String!, $captionIndices: [Int], $privacy: String, $source: String, $model: String) {
  askFred(
    meetingId: $meetingId
    query: $query
    captionIndices: $captionIndices
    privacy: $privacy
    source: $source
    model: $model
  ) {
    ...CoreAskFredFields
  }
}
    ${CoreAskFredFieldsFragmentDoc}`;
export type AskFredMutationFn = Apollo.MutationFunction<AskFredMutation, AskFredMutationVariables>;

/**
 * __useAskFredMutation__
 *
 * To run a mutation, you first call `useAskFredMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAskFredMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [askFredMutation, { data, loading, error }] = useAskFredMutation({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      query: // value for 'query'
 *      captionIndices: // value for 'captionIndices'
 *      privacy: // value for 'privacy'
 *      source: // value for 'source'
 *      model: // value for 'model'
 *   },
 * });
 */
export function useAskFredMutation(baseOptions?: Apollo.MutationHookOptions<AskFredMutation, AskFredMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AskFredMutation, AskFredMutationVariables>(AskFredDocument, options);
      }
export type AskFredMutationHookResult = ReturnType<typeof useAskFredMutation>;
export type AskFredMutationResult = Apollo.MutationResult<AskFredMutation>;
export type AskFredMutationOptions = Apollo.BaseMutationOptions<AskFredMutation, AskFredMutationVariables>;
export const RateAskFredDocument = gql`
    mutation RateAskFred($qaId: ID!, $rating: String!) {
  rateAskFred(qaId: $qaId, rating: $rating) {
    ...CoreAskFredFields
  }
}
    ${CoreAskFredFieldsFragmentDoc}`;
export type RateAskFredMutationFn = Apollo.MutationFunction<RateAskFredMutation, RateAskFredMutationVariables>;

/**
 * __useRateAskFredMutation__
 *
 * To run a mutation, you first call `useRateAskFredMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRateAskFredMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rateAskFredMutation, { data, loading, error }] = useRateAskFredMutation({
 *   variables: {
 *      qaId: // value for 'qaId'
 *      rating: // value for 'rating'
 *   },
 * });
 */
export function useRateAskFredMutation(baseOptions?: Apollo.MutationHookOptions<RateAskFredMutation, RateAskFredMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RateAskFredMutation, RateAskFredMutationVariables>(RateAskFredDocument, options);
      }
export type RateAskFredMutationHookResult = ReturnType<typeof useRateAskFredMutation>;
export type RateAskFredMutationResult = Apollo.MutationResult<RateAskFredMutation>;
export type RateAskFredMutationOptions = Apollo.BaseMutationOptions<RateAskFredMutation, RateAskFredMutationVariables>;
export const RetryAskFredDocument = gql`
    mutation RetryAskFred($qaId: ID!) {
  retryAskFred(qaId: $qaId) {
    ...CoreAskFredFields
  }
}
    ${CoreAskFredFieldsFragmentDoc}`;
export type RetryAskFredMutationFn = Apollo.MutationFunction<RetryAskFredMutation, RetryAskFredMutationVariables>;

/**
 * __useRetryAskFredMutation__
 *
 * To run a mutation, you first call `useRetryAskFredMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRetryAskFredMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [retryAskFredMutation, { data, loading, error }] = useRetryAskFredMutation({
 *   variables: {
 *      qaId: // value for 'qaId'
 *   },
 * });
 */
export function useRetryAskFredMutation(baseOptions?: Apollo.MutationHookOptions<RetryAskFredMutation, RetryAskFredMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RetryAskFredMutation, RetryAskFredMutationVariables>(RetryAskFredDocument, options);
      }
export type RetryAskFredMutationHookResult = ReturnType<typeof useRetryAskFredMutation>;
export type RetryAskFredMutationResult = Apollo.MutationResult<RetryAskFredMutation>;
export type RetryAskFredMutationOptions = Apollo.BaseMutationOptions<RetryAskFredMutation, RetryAskFredMutationVariables>;
export const MeetingFredQaDocument = gql`
    query meetingFredQa($meetingId: ID!) {
  meetingFredQa(meetingId: $meetingId) {
    ...CoreAskFredFields
  }
}
    ${CoreAskFredFieldsFragmentDoc}`;

/**
 * __useMeetingFredQaQuery__
 *
 * To run a query within a React component, call `useMeetingFredQaQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeetingFredQaQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeetingFredQaQuery({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *   },
 * });
 */
export function useMeetingFredQaQuery(baseOptions: Apollo.QueryHookOptions<MeetingFredQaQuery, MeetingFredQaQueryVariables> & ({ variables: MeetingFredQaQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MeetingFredQaQuery, MeetingFredQaQueryVariables>(MeetingFredQaDocument, options);
      }
export function useMeetingFredQaLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MeetingFredQaQuery, MeetingFredQaQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MeetingFredQaQuery, MeetingFredQaQueryVariables>(MeetingFredQaDocument, options);
        }
// @ts-ignore
export function useMeetingFredQaSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MeetingFredQaQuery, MeetingFredQaQueryVariables>): Apollo.UseSuspenseQueryResult<MeetingFredQaQuery, MeetingFredQaQueryVariables>;
export function useMeetingFredQaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeetingFredQaQuery, MeetingFredQaQueryVariables>): Apollo.UseSuspenseQueryResult<MeetingFredQaQuery | undefined, MeetingFredQaQueryVariables>;
export function useMeetingFredQaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeetingFredQaQuery, MeetingFredQaQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MeetingFredQaQuery, MeetingFredQaQueryVariables>(MeetingFredQaDocument, options);
        }
export type MeetingFredQaQueryHookResult = ReturnType<typeof useMeetingFredQaQuery>;
export type MeetingFredQaLazyQueryHookResult = ReturnType<typeof useMeetingFredQaLazyQuery>;
export type MeetingFredQaSuspenseQueryHookResult = ReturnType<typeof useMeetingFredQaSuspenseQuery>;
export type MeetingFredQaQueryResult = Apollo.QueryResult<MeetingFredQaQuery, MeetingFredQaQueryVariables>;
export const GetUserLoginOptionsDocument = gql`
    query getUserLoginOptions($email: String!) {
  getUserLoginOptions(email: $email) {
    ssoOptions {
      url
      label
    }
    ssoEnforced
  }
}
    `;

/**
 * __useGetUserLoginOptionsQuery__
 *
 * To run a query within a React component, call `useGetUserLoginOptionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserLoginOptionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserLoginOptionsQuery({
 *   variables: {
 *      email: // value for 'email'
 *   },
 * });
 */
export function useGetUserLoginOptionsQuery(baseOptions: Apollo.QueryHookOptions<GetUserLoginOptionsQuery, GetUserLoginOptionsQueryVariables> & ({ variables: GetUserLoginOptionsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserLoginOptionsQuery, GetUserLoginOptionsQueryVariables>(GetUserLoginOptionsDocument, options);
      }
export function useGetUserLoginOptionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserLoginOptionsQuery, GetUserLoginOptionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserLoginOptionsQuery, GetUserLoginOptionsQueryVariables>(GetUserLoginOptionsDocument, options);
        }
// @ts-ignore
export function useGetUserLoginOptionsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetUserLoginOptionsQuery, GetUserLoginOptionsQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserLoginOptionsQuery, GetUserLoginOptionsQueryVariables>;
export function useGetUserLoginOptionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserLoginOptionsQuery, GetUserLoginOptionsQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserLoginOptionsQuery | undefined, GetUserLoginOptionsQueryVariables>;
export function useGetUserLoginOptionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserLoginOptionsQuery, GetUserLoginOptionsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserLoginOptionsQuery, GetUserLoginOptionsQueryVariables>(GetUserLoginOptionsDocument, options);
        }
export type GetUserLoginOptionsQueryHookResult = ReturnType<typeof useGetUserLoginOptionsQuery>;
export type GetUserLoginOptionsLazyQueryHookResult = ReturnType<typeof useGetUserLoginOptionsLazyQuery>;
export type GetUserLoginOptionsSuspenseQueryHookResult = ReturnType<typeof useGetUserLoginOptionsSuspenseQuery>;
export type GetUserLoginOptionsQueryResult = Apollo.QueryResult<GetUserLoginOptionsQuery, GetUserLoginOptionsQueryVariables>;
export const CreateSubscriptionDocument = gql`
    mutation createSubscription($plan: String!, $seats: Int!, $trialPeriodDays: Int, $cardInfo: CardInfoInput, $paywall: String, $referral: String, $couponId: String, $discountCouponId: String) {
  createSubscription(
    input: {plan: $plan, seats: $seats, trialPeriodDays: $trialPeriodDays, cardInfo: $cardInfo, paywall: $paywall, referral: $referral, couponId: $couponId, discountCouponId: $discountCouponId}
  ) {
    is3ds
    redirectUrl
    subscription {
      id
      status
      customer
      trial_end
      items {
        data {
          price {
            id
            nickname
            unit_amount
            currency
          }
        }
      }
    }
  }
}
    `;
export type CreateSubscriptionMutationFn = Apollo.MutationFunction<CreateSubscriptionMutation, CreateSubscriptionMutationVariables>;

/**
 * __useCreateSubscriptionMutation__
 *
 * To run a mutation, you first call `useCreateSubscriptionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSubscriptionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSubscriptionMutation, { data, loading, error }] = useCreateSubscriptionMutation({
 *   variables: {
 *      plan: // value for 'plan'
 *      seats: // value for 'seats'
 *      trialPeriodDays: // value for 'trialPeriodDays'
 *      cardInfo: // value for 'cardInfo'
 *      paywall: // value for 'paywall'
 *      referral: // value for 'referral'
 *      couponId: // value for 'couponId'
 *      discountCouponId: // value for 'discountCouponId'
 *   },
 * });
 */
export function useCreateSubscriptionMutation(baseOptions?: Apollo.MutationHookOptions<CreateSubscriptionMutation, CreateSubscriptionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateSubscriptionMutation, CreateSubscriptionMutationVariables>(CreateSubscriptionDocument, options);
      }
export type CreateSubscriptionMutationHookResult = ReturnType<typeof useCreateSubscriptionMutation>;
export type CreateSubscriptionMutationResult = Apollo.MutationResult<CreateSubscriptionMutation>;
export type CreateSubscriptionMutationOptions = Apollo.BaseMutationOptions<CreateSubscriptionMutation, CreateSubscriptionMutationVariables>;
export const GetWelcomeMeetingsDocument = gql`
    query GetWelcomeMeetings {
  getCalendarEvents {
    events {
      _id
      attendees {
        email
        organizer
        responseStatus
        self
      }
      date
      endDate
      title
      creator_email
      fredAdded
      calendarType
      manuallyToggled
      isValidMeeting
      userCanToggle
      cancelReason
      isOrganizer
      url
      iCalUID
      meetingId
      customLanguage
      isMeetingAdmin
      organizerEmail
      ownerProfile {
        name
        email
        picture
        preferredLanguage
      }
      lastMeeting {
        ...CoreFeedMeetingFields
        brief {
          gist
          overview
        }
        meetingLink
      }
    }
  }
}
    ${CoreFeedMeetingFieldsFragmentDoc}`;

/**
 * __useGetWelcomeMeetingsQuery__
 *
 * To run a query within a React component, call `useGetWelcomeMeetingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWelcomeMeetingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWelcomeMeetingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetWelcomeMeetingsQuery(baseOptions?: Apollo.QueryHookOptions<GetWelcomeMeetingsQuery, GetWelcomeMeetingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetWelcomeMeetingsQuery, GetWelcomeMeetingsQueryVariables>(GetWelcomeMeetingsDocument, options);
      }
export function useGetWelcomeMeetingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetWelcomeMeetingsQuery, GetWelcomeMeetingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetWelcomeMeetingsQuery, GetWelcomeMeetingsQueryVariables>(GetWelcomeMeetingsDocument, options);
        }
// @ts-ignore
export function useGetWelcomeMeetingsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetWelcomeMeetingsQuery, GetWelcomeMeetingsQueryVariables>): Apollo.UseSuspenseQueryResult<GetWelcomeMeetingsQuery, GetWelcomeMeetingsQueryVariables>;
export function useGetWelcomeMeetingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetWelcomeMeetingsQuery, GetWelcomeMeetingsQueryVariables>): Apollo.UseSuspenseQueryResult<GetWelcomeMeetingsQuery | undefined, GetWelcomeMeetingsQueryVariables>;
export function useGetWelcomeMeetingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetWelcomeMeetingsQuery, GetWelcomeMeetingsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetWelcomeMeetingsQuery, GetWelcomeMeetingsQueryVariables>(GetWelcomeMeetingsDocument, options);
        }
export type GetWelcomeMeetingsQueryHookResult = ReturnType<typeof useGetWelcomeMeetingsQuery>;
export type GetWelcomeMeetingsLazyQueryHookResult = ReturnType<typeof useGetWelcomeMeetingsLazyQuery>;
export type GetWelcomeMeetingsSuspenseQueryHookResult = ReturnType<typeof useGetWelcomeMeetingsSuspenseQuery>;
export type GetWelcomeMeetingsQueryResult = Apollo.QueryResult<GetWelcomeMeetingsQuery, GetWelcomeMeetingsQueryVariables>;
export const GetLiveMeetingsDocument = gql`
    query GetLiveMeetings {
  liveMeetings: getUserMeetingsForStatus(limit: 3, computedStatus: "active") {
    meetings {
      objectId
      title
      audio_url
      endTime
      hostEmail
      startTime
      status
      userEmail
      userIsHost
      userIsParticipant
      addedBy
      url
      userProfile {
        picture
        email
      }
    }
  }
}
    `;

/**
 * __useGetLiveMeetingsQuery__
 *
 * To run a query within a React component, call `useGetLiveMeetingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetLiveMeetingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetLiveMeetingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetLiveMeetingsQuery(baseOptions?: Apollo.QueryHookOptions<GetLiveMeetingsQuery, GetLiveMeetingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetLiveMeetingsQuery, GetLiveMeetingsQueryVariables>(GetLiveMeetingsDocument, options);
      }
export function useGetLiveMeetingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetLiveMeetingsQuery, GetLiveMeetingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetLiveMeetingsQuery, GetLiveMeetingsQueryVariables>(GetLiveMeetingsDocument, options);
        }
// @ts-ignore
export function useGetLiveMeetingsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetLiveMeetingsQuery, GetLiveMeetingsQueryVariables>): Apollo.UseSuspenseQueryResult<GetLiveMeetingsQuery, GetLiveMeetingsQueryVariables>;
export function useGetLiveMeetingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetLiveMeetingsQuery, GetLiveMeetingsQueryVariables>): Apollo.UseSuspenseQueryResult<GetLiveMeetingsQuery | undefined, GetLiveMeetingsQueryVariables>;
export function useGetLiveMeetingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetLiveMeetingsQuery, GetLiveMeetingsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetLiveMeetingsQuery, GetLiveMeetingsQueryVariables>(GetLiveMeetingsDocument, options);
        }
export type GetLiveMeetingsQueryHookResult = ReturnType<typeof useGetLiveMeetingsQuery>;
export type GetLiveMeetingsLazyQueryHookResult = ReturnType<typeof useGetLiveMeetingsLazyQuery>;
export type GetLiveMeetingsSuspenseQueryHookResult = ReturnType<typeof useGetLiveMeetingsSuspenseQuery>;
export type GetLiveMeetingsQueryResult = Apollo.QueryResult<GetLiveMeetingsQuery, GetLiveMeetingsQueryVariables>;
export const ToggleUpcomingEventDocument = gql`
    mutation toggleUpcomingEvent($fredAdded: Boolean!, $meetingId: String!, $scheduleType: String, $iCalUID: String, $calendarType: String) {
  toggleUpcomingEvent(
    fredAdded: $fredAdded
    meetingId: $meetingId
    scheduleType: $scheduleType
    iCalUID: $iCalUID
    calendarType: $calendarType
  ) {
    _id
    meetingId
    fredAdded
    iCalUID
    organizerEmail
    isMeetingAdmin
    ownerProfile {
      name
      email
      picture
      preferredLanguage
    }
  }
}
    `;
export type ToggleUpcomingEventMutationFn = Apollo.MutationFunction<ToggleUpcomingEventMutation, ToggleUpcomingEventMutationVariables>;

/**
 * __useToggleUpcomingEventMutation__
 *
 * To run a mutation, you first call `useToggleUpcomingEventMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useToggleUpcomingEventMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [toggleUpcomingEventMutation, { data, loading, error }] = useToggleUpcomingEventMutation({
 *   variables: {
 *      fredAdded: // value for 'fredAdded'
 *      meetingId: // value for 'meetingId'
 *      scheduleType: // value for 'scheduleType'
 *      iCalUID: // value for 'iCalUID'
 *      calendarType: // value for 'calendarType'
 *   },
 * });
 */
export function useToggleUpcomingEventMutation(baseOptions?: Apollo.MutationHookOptions<ToggleUpcomingEventMutation, ToggleUpcomingEventMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ToggleUpcomingEventMutation, ToggleUpcomingEventMutationVariables>(ToggleUpcomingEventDocument, options);
      }
export type ToggleUpcomingEventMutationHookResult = ReturnType<typeof useToggleUpcomingEventMutation>;
export type ToggleUpcomingEventMutationResult = Apollo.MutationResult<ToggleUpcomingEventMutation>;
export type ToggleUpcomingEventMutationOptions = Apollo.BaseMutationOptions<ToggleUpcomingEventMutation, ToggleUpcomingEventMutationVariables>;
export const JoinAllUpcomingMeetingsDocument = gql`
    mutation JoinAllUpcomingMeetings($addedBy: String) {
  joinAllUpcomingMeetings(addedBy: $addedBy) {
    calId
    status
    message
    meetingId
  }
}
    `;
export type JoinAllUpcomingMeetingsMutationFn = Apollo.MutationFunction<JoinAllUpcomingMeetingsMutation, JoinAllUpcomingMeetingsMutationVariables>;

/**
 * __useJoinAllUpcomingMeetingsMutation__
 *
 * To run a mutation, you first call `useJoinAllUpcomingMeetingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useJoinAllUpcomingMeetingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [joinAllUpcomingMeetingsMutation, { data, loading, error }] = useJoinAllUpcomingMeetingsMutation({
 *   variables: {
 *      addedBy: // value for 'addedBy'
 *   },
 * });
 */
export function useJoinAllUpcomingMeetingsMutation(baseOptions?: Apollo.MutationHookOptions<JoinAllUpcomingMeetingsMutation, JoinAllUpcomingMeetingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<JoinAllUpcomingMeetingsMutation, JoinAllUpcomingMeetingsMutationVariables>(JoinAllUpcomingMeetingsDocument, options);
      }
export type JoinAllUpcomingMeetingsMutationHookResult = ReturnType<typeof useJoinAllUpcomingMeetingsMutation>;
export type JoinAllUpcomingMeetingsMutationResult = Apollo.MutationResult<JoinAllUpcomingMeetingsMutation>;
export type JoinAllUpcomingMeetingsMutationOptions = Apollo.BaseMutationOptions<JoinAllUpcomingMeetingsMutation, JoinAllUpcomingMeetingsMutationVariables>;
export const SetMeetingLanguageDocument = gql`
    mutation SetMeetingLanguage($meetingId: String!, $language: String!) {
  setMeetingLanguage(meetingId: $meetingId, customLanguage: $language) {
    _id
    meetingId
    customLanguage
  }
}
    `;
export type SetMeetingLanguageMutationFn = Apollo.MutationFunction<SetMeetingLanguageMutation, SetMeetingLanguageMutationVariables>;

/**
 * __useSetMeetingLanguageMutation__
 *
 * To run a mutation, you first call `useSetMeetingLanguageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetMeetingLanguageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setMeetingLanguageMutation, { data, loading, error }] = useSetMeetingLanguageMutation({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      language: // value for 'language'
 *   },
 * });
 */
export function useSetMeetingLanguageMutation(baseOptions?: Apollo.MutationHookOptions<SetMeetingLanguageMutation, SetMeetingLanguageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetMeetingLanguageMutation, SetMeetingLanguageMutationVariables>(SetMeetingLanguageDocument, options);
      }
export type SetMeetingLanguageMutationHookResult = ReturnType<typeof useSetMeetingLanguageMutation>;
export type SetMeetingLanguageMutationResult = Apollo.MutationResult<SetMeetingLanguageMutation>;
export type SetMeetingLanguageMutationOptions = Apollo.BaseMutationOptions<SetMeetingLanguageMutation, SetMeetingLanguageMutationVariables>;
export const FetchChannelMeetingsDocument = gql`
    query fetchChannelMeetings($from: Int!, $size: Int!, $channelId: String!, $search: String, $isPrivate: Boolean) {
  getChannelMeetings(
    from: $from
    size: $size
    channelId: $channelId
    search: $search
    isPrivate: $isPrivate
  ) {
    total
    meetings {
      parseId
      hasCaptions
      date
      owner
      title
      createdAt
      creator_email
      creatorProfile {
        picture
        name
        lastName
        firstName
        email
      }
      privacy
      id
      users
      validAttendees
      durationMins
      duration
      allEmails
      audioOnly
      processMeetingStatus
      audioServiceMetadata {
        apiSource
        silentMeeting
      }
      audio_url
      addedBy
    }
  }
}
    `;

/**
 * __useFetchChannelMeetingsQuery__
 *
 * To run a query within a React component, call `useFetchChannelMeetingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchChannelMeetingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchChannelMeetingsQuery({
 *   variables: {
 *      from: // value for 'from'
 *      size: // value for 'size'
 *      channelId: // value for 'channelId'
 *      search: // value for 'search'
 *      isPrivate: // value for 'isPrivate'
 *   },
 * });
 */
export function useFetchChannelMeetingsQuery(baseOptions: Apollo.QueryHookOptions<FetchChannelMeetingsQuery, FetchChannelMeetingsQueryVariables> & ({ variables: FetchChannelMeetingsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FetchChannelMeetingsQuery, FetchChannelMeetingsQueryVariables>(FetchChannelMeetingsDocument, options);
      }
export function useFetchChannelMeetingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FetchChannelMeetingsQuery, FetchChannelMeetingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FetchChannelMeetingsQuery, FetchChannelMeetingsQueryVariables>(FetchChannelMeetingsDocument, options);
        }
// @ts-ignore
export function useFetchChannelMeetingsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<FetchChannelMeetingsQuery, FetchChannelMeetingsQueryVariables>): Apollo.UseSuspenseQueryResult<FetchChannelMeetingsQuery, FetchChannelMeetingsQueryVariables>;
export function useFetchChannelMeetingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchChannelMeetingsQuery, FetchChannelMeetingsQueryVariables>): Apollo.UseSuspenseQueryResult<FetchChannelMeetingsQuery | undefined, FetchChannelMeetingsQueryVariables>;
export function useFetchChannelMeetingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchChannelMeetingsQuery, FetchChannelMeetingsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FetchChannelMeetingsQuery, FetchChannelMeetingsQueryVariables>(FetchChannelMeetingsDocument, options);
        }
export type FetchChannelMeetingsQueryHookResult = ReturnType<typeof useFetchChannelMeetingsQuery>;
export type FetchChannelMeetingsLazyQueryHookResult = ReturnType<typeof useFetchChannelMeetingsLazyQuery>;
export type FetchChannelMeetingsSuspenseQueryHookResult = ReturnType<typeof useFetchChannelMeetingsSuspenseQuery>;
export type FetchChannelMeetingsQueryResult = Apollo.QueryResult<FetchChannelMeetingsQuery, FetchChannelMeetingsQueryVariables>;
export const GetChannelsListDocument = gql`
    query getChannelsList {
  getChannelsList {
    _id
    title
    createdBy
    isPrivate
    members {
      picture
      name
      email
      isAdmin
      _id
    }
  }
}
    `;

/**
 * __useGetChannelsListQuery__
 *
 * To run a query within a React component, call `useGetChannelsListQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetChannelsListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetChannelsListQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetChannelsListQuery(baseOptions?: Apollo.QueryHookOptions<GetChannelsListQuery, GetChannelsListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetChannelsListQuery, GetChannelsListQueryVariables>(GetChannelsListDocument, options);
      }
export function useGetChannelsListLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetChannelsListQuery, GetChannelsListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetChannelsListQuery, GetChannelsListQueryVariables>(GetChannelsListDocument, options);
        }
// @ts-ignore
export function useGetChannelsListSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetChannelsListQuery, GetChannelsListQueryVariables>): Apollo.UseSuspenseQueryResult<GetChannelsListQuery, GetChannelsListQueryVariables>;
export function useGetChannelsListSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetChannelsListQuery, GetChannelsListQueryVariables>): Apollo.UseSuspenseQueryResult<GetChannelsListQuery | undefined, GetChannelsListQueryVariables>;
export function useGetChannelsListSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetChannelsListQuery, GetChannelsListQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetChannelsListQuery, GetChannelsListQueryVariables>(GetChannelsListDocument, options);
        }
export type GetChannelsListQueryHookResult = ReturnType<typeof useGetChannelsListQuery>;
export type GetChannelsListLazyQueryHookResult = ReturnType<typeof useGetChannelsListLazyQuery>;
export type GetChannelsListSuspenseQueryHookResult = ReturnType<typeof useGetChannelsListSuspenseQuery>;
export type GetChannelsListQueryResult = Apollo.QueryResult<GetChannelsListQuery, GetChannelsListQueryVariables>;
export const ChannelDocument = gql`
    query channel($id: String!) {
  getChannel(id: $id) {
    _id
    title
    isPrivate
    createdBy
    teamId
    members {
      picture
      name
      email
      isAdmin
      _id
    }
  }
}
    `;

/**
 * __useChannelQuery__
 *
 * To run a query within a React component, call `useChannelQuery` and pass it any options that fit your needs.
 * When your component renders, `useChannelQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useChannelQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useChannelQuery(baseOptions: Apollo.QueryHookOptions<ChannelQuery, ChannelQueryVariables> & ({ variables: ChannelQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ChannelQuery, ChannelQueryVariables>(ChannelDocument, options);
      }
export function useChannelLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ChannelQuery, ChannelQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ChannelQuery, ChannelQueryVariables>(ChannelDocument, options);
        }
// @ts-ignore
export function useChannelSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ChannelQuery, ChannelQueryVariables>): Apollo.UseSuspenseQueryResult<ChannelQuery, ChannelQueryVariables>;
export function useChannelSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ChannelQuery, ChannelQueryVariables>): Apollo.UseSuspenseQueryResult<ChannelQuery | undefined, ChannelQueryVariables>;
export function useChannelSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ChannelQuery, ChannelQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ChannelQuery, ChannelQueryVariables>(ChannelDocument, options);
        }
export type ChannelQueryHookResult = ReturnType<typeof useChannelQuery>;
export type ChannelLazyQueryHookResult = ReturnType<typeof useChannelLazyQuery>;
export type ChannelSuspenseQueryHookResult = ReturnType<typeof useChannelSuspenseQuery>;
export type ChannelQueryResult = Apollo.QueryResult<ChannelQuery, ChannelQueryVariables>;
export const GetEmailAssistantSettingsDocument = gql`
    query GetEmailAssistantSettings {
  emailSettings {
    id
    isAssistantEnabled
  }
}
    `;

/**
 * __useGetEmailAssistantSettingsQuery__
 *
 * To run a query within a React component, call `useGetEmailAssistantSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetEmailAssistantSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetEmailAssistantSettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetEmailAssistantSettingsQuery(baseOptions?: Apollo.QueryHookOptions<GetEmailAssistantSettingsQuery, GetEmailAssistantSettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetEmailAssistantSettingsQuery, GetEmailAssistantSettingsQueryVariables>(GetEmailAssistantSettingsDocument, options);
      }
export function useGetEmailAssistantSettingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetEmailAssistantSettingsQuery, GetEmailAssistantSettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetEmailAssistantSettingsQuery, GetEmailAssistantSettingsQueryVariables>(GetEmailAssistantSettingsDocument, options);
        }
// @ts-ignore
export function useGetEmailAssistantSettingsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetEmailAssistantSettingsQuery, GetEmailAssistantSettingsQueryVariables>): Apollo.UseSuspenseQueryResult<GetEmailAssistantSettingsQuery, GetEmailAssistantSettingsQueryVariables>;
export function useGetEmailAssistantSettingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetEmailAssistantSettingsQuery, GetEmailAssistantSettingsQueryVariables>): Apollo.UseSuspenseQueryResult<GetEmailAssistantSettingsQuery | undefined, GetEmailAssistantSettingsQueryVariables>;
export function useGetEmailAssistantSettingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetEmailAssistantSettingsQuery, GetEmailAssistantSettingsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetEmailAssistantSettingsQuery, GetEmailAssistantSettingsQueryVariables>(GetEmailAssistantSettingsDocument, options);
        }
export type GetEmailAssistantSettingsQueryHookResult = ReturnType<typeof useGetEmailAssistantSettingsQuery>;
export type GetEmailAssistantSettingsLazyQueryHookResult = ReturnType<typeof useGetEmailAssistantSettingsLazyQuery>;
export type GetEmailAssistantSettingsSuspenseQueryHookResult = ReturnType<typeof useGetEmailAssistantSettingsSuspenseQuery>;
export type GetEmailAssistantSettingsQueryResult = Apollo.QueryResult<GetEmailAssistantSettingsQuery, GetEmailAssistantSettingsQueryVariables>;
export const GetFeaturesDocument = gql`
    query GetFeatures {
  getFeatures {
    features
  }
}
    `;

/**
 * __useGetFeaturesQuery__
 *
 * To run a query within a React component, call `useGetFeaturesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFeaturesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFeaturesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetFeaturesQuery(baseOptions?: Apollo.QueryHookOptions<GetFeaturesQuery, GetFeaturesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetFeaturesQuery, GetFeaturesQueryVariables>(GetFeaturesDocument, options);
      }
export function useGetFeaturesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetFeaturesQuery, GetFeaturesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetFeaturesQuery, GetFeaturesQueryVariables>(GetFeaturesDocument, options);
        }
// @ts-ignore
export function useGetFeaturesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetFeaturesQuery, GetFeaturesQueryVariables>): Apollo.UseSuspenseQueryResult<GetFeaturesQuery, GetFeaturesQueryVariables>;
export function useGetFeaturesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetFeaturesQuery, GetFeaturesQueryVariables>): Apollo.UseSuspenseQueryResult<GetFeaturesQuery | undefined, GetFeaturesQueryVariables>;
export function useGetFeaturesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetFeaturesQuery, GetFeaturesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetFeaturesQuery, GetFeaturesQueryVariables>(GetFeaturesDocument, options);
        }
export type GetFeaturesQueryHookResult = ReturnType<typeof useGetFeaturesQuery>;
export type GetFeaturesLazyQueryHookResult = ReturnType<typeof useGetFeaturesLazyQuery>;
export type GetFeaturesSuspenseQueryHookResult = ReturnType<typeof useGetFeaturesSuspenseQuery>;
export type GetFeaturesQueryResult = Apollo.QueryResult<GetFeaturesQuery, GetFeaturesQueryVariables>;
export const GetFeedMeetingsDocument = gql`
    query GetFeedMeetings($limit: Int, $skip: Int) {
  getFeedMeetings(limit: $limit, skip: $skip) {
    total
    meetings {
      ...CoreFeedMeetingFields
    }
  }
}
    ${CoreFeedMeetingFieldsFragmentDoc}`;

/**
 * __useGetFeedMeetingsQuery__
 *
 * To run a query within a React component, call `useGetFeedMeetingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFeedMeetingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFeedMeetingsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      skip: // value for 'skip'
 *   },
 * });
 */
export function useGetFeedMeetingsQuery(baseOptions?: Apollo.QueryHookOptions<GetFeedMeetingsQuery, GetFeedMeetingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetFeedMeetingsQuery, GetFeedMeetingsQueryVariables>(GetFeedMeetingsDocument, options);
      }
export function useGetFeedMeetingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetFeedMeetingsQuery, GetFeedMeetingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetFeedMeetingsQuery, GetFeedMeetingsQueryVariables>(GetFeedMeetingsDocument, options);
        }
// @ts-ignore
export function useGetFeedMeetingsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetFeedMeetingsQuery, GetFeedMeetingsQueryVariables>): Apollo.UseSuspenseQueryResult<GetFeedMeetingsQuery, GetFeedMeetingsQueryVariables>;
export function useGetFeedMeetingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetFeedMeetingsQuery, GetFeedMeetingsQueryVariables>): Apollo.UseSuspenseQueryResult<GetFeedMeetingsQuery | undefined, GetFeedMeetingsQueryVariables>;
export function useGetFeedMeetingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetFeedMeetingsQuery, GetFeedMeetingsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetFeedMeetingsQuery, GetFeedMeetingsQueryVariables>(GetFeedMeetingsDocument, options);
        }
export type GetFeedMeetingsQueryHookResult = ReturnType<typeof useGetFeedMeetingsQuery>;
export type GetFeedMeetingsLazyQueryHookResult = ReturnType<typeof useGetFeedMeetingsLazyQuery>;
export type GetFeedMeetingsSuspenseQueryHookResult = ReturnType<typeof useGetFeedMeetingsSuspenseQuery>;
export type GetFeedMeetingsQueryResult = Apollo.QueryResult<GetFeedMeetingsQuery, GetFeedMeetingsQueryVariables>;
export const GetFeedMeetingByIdDocument = gql`
    query GetFeedMeetingById($meetingId: String!) {
  getFeedMeetingById(meetingId: $meetingId) {
    ...CoreFeedMeetingFields
  }
}
    ${CoreFeedMeetingFieldsFragmentDoc}`;

/**
 * __useGetFeedMeetingByIdQuery__
 *
 * To run a query within a React component, call `useGetFeedMeetingByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFeedMeetingByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFeedMeetingByIdQuery({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *   },
 * });
 */
export function useGetFeedMeetingByIdQuery(baseOptions: Apollo.QueryHookOptions<GetFeedMeetingByIdQuery, GetFeedMeetingByIdQueryVariables> & ({ variables: GetFeedMeetingByIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetFeedMeetingByIdQuery, GetFeedMeetingByIdQueryVariables>(GetFeedMeetingByIdDocument, options);
      }
export function useGetFeedMeetingByIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetFeedMeetingByIdQuery, GetFeedMeetingByIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetFeedMeetingByIdQuery, GetFeedMeetingByIdQueryVariables>(GetFeedMeetingByIdDocument, options);
        }
// @ts-ignore
export function useGetFeedMeetingByIdSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetFeedMeetingByIdQuery, GetFeedMeetingByIdQueryVariables>): Apollo.UseSuspenseQueryResult<GetFeedMeetingByIdQuery, GetFeedMeetingByIdQueryVariables>;
export function useGetFeedMeetingByIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetFeedMeetingByIdQuery, GetFeedMeetingByIdQueryVariables>): Apollo.UseSuspenseQueryResult<GetFeedMeetingByIdQuery | undefined, GetFeedMeetingByIdQueryVariables>;
export function useGetFeedMeetingByIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetFeedMeetingByIdQuery, GetFeedMeetingByIdQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetFeedMeetingByIdQuery, GetFeedMeetingByIdQueryVariables>(GetFeedMeetingByIdDocument, options);
        }
export type GetFeedMeetingByIdQueryHookResult = ReturnType<typeof useGetFeedMeetingByIdQuery>;
export type GetFeedMeetingByIdLazyQueryHookResult = ReturnType<typeof useGetFeedMeetingByIdLazyQuery>;
export type GetFeedMeetingByIdSuspenseQueryHookResult = ReturnType<typeof useGetFeedMeetingByIdSuspenseQuery>;
export type GetFeedMeetingByIdQueryResult = Apollo.QueryResult<GetFeedMeetingByIdQuery, GetFeedMeetingByIdQueryVariables>;
export const GiveFeedbackDocument = gql`
    mutation GiveFeedback($input: GiveFeedbackInput!) {
  giveFeedback(input: $input) {
    _id
    csmCalendlyLink
    __typename
  }
}
    `;
export type GiveFeedbackMutationFn = Apollo.MutationFunction<GiveFeedbackMutation, GiveFeedbackMutationVariables>;

/**
 * __useGiveFeedbackMutation__
 *
 * To run a mutation, you first call `useGiveFeedbackMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGiveFeedbackMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [giveFeedbackMutation, { data, loading, error }] = useGiveFeedbackMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGiveFeedbackMutation(baseOptions?: Apollo.MutationHookOptions<GiveFeedbackMutation, GiveFeedbackMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<GiveFeedbackMutation, GiveFeedbackMutationVariables>(GiveFeedbackDocument, options);
      }
export type GiveFeedbackMutationHookResult = ReturnType<typeof useGiveFeedbackMutation>;
export type GiveFeedbackMutationResult = Apollo.MutationResult<GiveFeedbackMutation>;
export type GiveFeedbackMutationOptions = Apollo.BaseMutationOptions<GiveFeedbackMutation, GiveFeedbackMutationVariables>;
export const FetchScheduledMaintenanceDocument = gql`
    query FetchScheduledMaintenance($target: String) {
  fetchScheduledMaintenance(target: $target) {
    endDate
    startDate
    message
    isActive
  }
}
    `;

/**
 * __useFetchScheduledMaintenanceQuery__
 *
 * To run a query within a React component, call `useFetchScheduledMaintenanceQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchScheduledMaintenanceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchScheduledMaintenanceQuery({
 *   variables: {
 *      target: // value for 'target'
 *   },
 * });
 */
export function useFetchScheduledMaintenanceQuery(baseOptions?: Apollo.QueryHookOptions<FetchScheduledMaintenanceQuery, FetchScheduledMaintenanceQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FetchScheduledMaintenanceQuery, FetchScheduledMaintenanceQueryVariables>(FetchScheduledMaintenanceDocument, options);
      }
export function useFetchScheduledMaintenanceLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FetchScheduledMaintenanceQuery, FetchScheduledMaintenanceQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FetchScheduledMaintenanceQuery, FetchScheduledMaintenanceQueryVariables>(FetchScheduledMaintenanceDocument, options);
        }
// @ts-ignore
export function useFetchScheduledMaintenanceSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<FetchScheduledMaintenanceQuery, FetchScheduledMaintenanceQueryVariables>): Apollo.UseSuspenseQueryResult<FetchScheduledMaintenanceQuery, FetchScheduledMaintenanceQueryVariables>;
export function useFetchScheduledMaintenanceSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchScheduledMaintenanceQuery, FetchScheduledMaintenanceQueryVariables>): Apollo.UseSuspenseQueryResult<FetchScheduledMaintenanceQuery | undefined, FetchScheduledMaintenanceQueryVariables>;
export function useFetchScheduledMaintenanceSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchScheduledMaintenanceQuery, FetchScheduledMaintenanceQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FetchScheduledMaintenanceQuery, FetchScheduledMaintenanceQueryVariables>(FetchScheduledMaintenanceDocument, options);
        }
export type FetchScheduledMaintenanceQueryHookResult = ReturnType<typeof useFetchScheduledMaintenanceQuery>;
export type FetchScheduledMaintenanceLazyQueryHookResult = ReturnType<typeof useFetchScheduledMaintenanceLazyQuery>;
export type FetchScheduledMaintenanceSuspenseQueryHookResult = ReturnType<typeof useFetchScheduledMaintenanceSuspenseQuery>;
export type FetchScheduledMaintenanceQueryResult = Apollo.QueryResult<FetchScheduledMaintenanceQuery, FetchScheduledMaintenanceQueryVariables>;
export const NewMeetingNoteCommentDocument = gql`
    mutation newMeetingNoteComment($meetingId: String!, $comment: String, $replyToCommentId: String, $timestamp: Int, $privacy: String!, $isBookmarked: Boolean, $source: String) {
  newMeetingNoteComment(
    meetingId: $meetingId
    comment: $comment
    replyToCommentId: $replyToCommentId
    timestamp: $timestamp
    privacy: $privacy
    isBookmarked: $isBookmarked
    source: $source
  ) {
    _id
    userId
    meetingId
    comment
    replyToCommentId
    name
    timestamp
    createdAt
    isPrivate
    privacy
    isBookmarked
    source
  }
}
    `;
export type NewMeetingNoteCommentMutationFn = Apollo.MutationFunction<NewMeetingNoteCommentMutation, NewMeetingNoteCommentMutationVariables>;

/**
 * __useNewMeetingNoteCommentMutation__
 *
 * To run a mutation, you first call `useNewMeetingNoteCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useNewMeetingNoteCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [newMeetingNoteCommentMutation, { data, loading, error }] = useNewMeetingNoteCommentMutation({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      comment: // value for 'comment'
 *      replyToCommentId: // value for 'replyToCommentId'
 *      timestamp: // value for 'timestamp'
 *      privacy: // value for 'privacy'
 *      isBookmarked: // value for 'isBookmarked'
 *      source: // value for 'source'
 *   },
 * });
 */
export function useNewMeetingNoteCommentMutation(baseOptions?: Apollo.MutationHookOptions<NewMeetingNoteCommentMutation, NewMeetingNoteCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<NewMeetingNoteCommentMutation, NewMeetingNoteCommentMutationVariables>(NewMeetingNoteCommentDocument, options);
      }
export type NewMeetingNoteCommentMutationHookResult = ReturnType<typeof useNewMeetingNoteCommentMutation>;
export type NewMeetingNoteCommentMutationResult = Apollo.MutationResult<NewMeetingNoteCommentMutation>;
export type NewMeetingNoteCommentMutationOptions = Apollo.BaseMutationOptions<NewMeetingNoteCommentMutation, NewMeetingNoteCommentMutationVariables>;
export const UpdateMeetingNoteCommentDocument = gql`
    mutation updateMeetingNoteComment($commentId: String, $comment: String, $privacy: String!) {
  updateMeetingNoteComment(
    commentId: $commentId
    comment: $comment
    privacy: $privacy
  ) {
    _id
    meetingNoteId
    meetingId
    comment
    replyToCommentId
    name
    timestamp
    isPrivate
    createdAt
    privacy
  }
}
    `;
export type UpdateMeetingNoteCommentMutationFn = Apollo.MutationFunction<UpdateMeetingNoteCommentMutation, UpdateMeetingNoteCommentMutationVariables>;

/**
 * __useUpdateMeetingNoteCommentMutation__
 *
 * To run a mutation, you first call `useUpdateMeetingNoteCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMeetingNoteCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMeetingNoteCommentMutation, { data, loading, error }] = useUpdateMeetingNoteCommentMutation({
 *   variables: {
 *      commentId: // value for 'commentId'
 *      comment: // value for 'comment'
 *      privacy: // value for 'privacy'
 *   },
 * });
 */
export function useUpdateMeetingNoteCommentMutation(baseOptions?: Apollo.MutationHookOptions<UpdateMeetingNoteCommentMutation, UpdateMeetingNoteCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateMeetingNoteCommentMutation, UpdateMeetingNoteCommentMutationVariables>(UpdateMeetingNoteCommentDocument, options);
      }
export type UpdateMeetingNoteCommentMutationHookResult = ReturnType<typeof useUpdateMeetingNoteCommentMutation>;
export type UpdateMeetingNoteCommentMutationResult = Apollo.MutationResult<UpdateMeetingNoteCommentMutation>;
export type UpdateMeetingNoteCommentMutationOptions = Apollo.BaseMutationOptions<UpdateMeetingNoteCommentMutation, UpdateMeetingNoteCommentMutationVariables>;
export const DeleteMeetingNoteCommentDocument = gql`
    mutation deleteMeetingNoteComment($commentId: String) {
  deleteMeetingNoteComment(commentId: $commentId)
}
    `;
export type DeleteMeetingNoteCommentMutationFn = Apollo.MutationFunction<DeleteMeetingNoteCommentMutation, DeleteMeetingNoteCommentMutationVariables>;

/**
 * __useDeleteMeetingNoteCommentMutation__
 *
 * To run a mutation, you first call `useDeleteMeetingNoteCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteMeetingNoteCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteMeetingNoteCommentMutation, { data, loading, error }] = useDeleteMeetingNoteCommentMutation({
 *   variables: {
 *      commentId: // value for 'commentId'
 *   },
 * });
 */
export function useDeleteMeetingNoteCommentMutation(baseOptions?: Apollo.MutationHookOptions<DeleteMeetingNoteCommentMutation, DeleteMeetingNoteCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteMeetingNoteCommentMutation, DeleteMeetingNoteCommentMutationVariables>(DeleteMeetingNoteCommentDocument, options);
      }
export type DeleteMeetingNoteCommentMutationHookResult = ReturnType<typeof useDeleteMeetingNoteCommentMutation>;
export type DeleteMeetingNoteCommentMutationResult = Apollo.MutationResult<DeleteMeetingNoteCommentMutation>;
export type DeleteMeetingNoteCommentMutationOptions = Apollo.BaseMutationOptions<DeleteMeetingNoteCommentMutation, DeleteMeetingNoteCommentMutationVariables>;
export const MeetingNoteCommentsDocument = gql`
    query meetingNoteComments($meetingId: String!) {
  meetingNoteComments(meetingId: $meetingId) {
    _id
    comment
    createdAt
    creatorProfile {
      picture
      name
      lastName
      firstName
      email
    }
    meetingId
    picture
    userId
    name
    timestamp
    replyToCommentId
    isPrivate
    privacy
    isBookmarked
    source
  }
}
    `;

/**
 * __useMeetingNoteCommentsQuery__
 *
 * To run a query within a React component, call `useMeetingNoteCommentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeetingNoteCommentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeetingNoteCommentsQuery({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *   },
 * });
 */
export function useMeetingNoteCommentsQuery(baseOptions: Apollo.QueryHookOptions<MeetingNoteCommentsQuery, MeetingNoteCommentsQueryVariables> & ({ variables: MeetingNoteCommentsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MeetingNoteCommentsQuery, MeetingNoteCommentsQueryVariables>(MeetingNoteCommentsDocument, options);
      }
export function useMeetingNoteCommentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MeetingNoteCommentsQuery, MeetingNoteCommentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MeetingNoteCommentsQuery, MeetingNoteCommentsQueryVariables>(MeetingNoteCommentsDocument, options);
        }
// @ts-ignore
export function useMeetingNoteCommentsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MeetingNoteCommentsQuery, MeetingNoteCommentsQueryVariables>): Apollo.UseSuspenseQueryResult<MeetingNoteCommentsQuery, MeetingNoteCommentsQueryVariables>;
export function useMeetingNoteCommentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeetingNoteCommentsQuery, MeetingNoteCommentsQueryVariables>): Apollo.UseSuspenseQueryResult<MeetingNoteCommentsQuery | undefined, MeetingNoteCommentsQueryVariables>;
export function useMeetingNoteCommentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeetingNoteCommentsQuery, MeetingNoteCommentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MeetingNoteCommentsQuery, MeetingNoteCommentsQueryVariables>(MeetingNoteCommentsDocument, options);
        }
export type MeetingNoteCommentsQueryHookResult = ReturnType<typeof useMeetingNoteCommentsQuery>;
export type MeetingNoteCommentsLazyQueryHookResult = ReturnType<typeof useMeetingNoteCommentsLazyQuery>;
export type MeetingNoteCommentsSuspenseQueryHookResult = ReturnType<typeof useMeetingNoteCommentsSuspenseQuery>;
export type MeetingNoteCommentsQueryResult = Apollo.QueryResult<MeetingNoteCommentsQuery, MeetingNoteCommentsQueryVariables>;
export const GetMeetingPrepOutputDocument = gql`
    query GetMeetingPrepOutput($input: GetMeetingPrepOutputInput!) {
  getMeetingPrepOutput(input: $input) {
    ...MeetingPrepOutputFields
  }
}
    ${MeetingPrepOutputFieldsFragmentDoc}`;

/**
 * __useGetMeetingPrepOutputQuery__
 *
 * To run a query within a React component, call `useGetMeetingPrepOutputQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMeetingPrepOutputQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMeetingPrepOutputQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetMeetingPrepOutputQuery(baseOptions: Apollo.QueryHookOptions<GetMeetingPrepOutputQuery, GetMeetingPrepOutputQueryVariables> & ({ variables: GetMeetingPrepOutputQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetMeetingPrepOutputQuery, GetMeetingPrepOutputQueryVariables>(GetMeetingPrepOutputDocument, options);
      }
export function useGetMeetingPrepOutputLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMeetingPrepOutputQuery, GetMeetingPrepOutputQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetMeetingPrepOutputQuery, GetMeetingPrepOutputQueryVariables>(GetMeetingPrepOutputDocument, options);
        }
// @ts-ignore
export function useGetMeetingPrepOutputSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetMeetingPrepOutputQuery, GetMeetingPrepOutputQueryVariables>): Apollo.UseSuspenseQueryResult<GetMeetingPrepOutputQuery, GetMeetingPrepOutputQueryVariables>;
export function useGetMeetingPrepOutputSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMeetingPrepOutputQuery, GetMeetingPrepOutputQueryVariables>): Apollo.UseSuspenseQueryResult<GetMeetingPrepOutputQuery | undefined, GetMeetingPrepOutputQueryVariables>;
export function useGetMeetingPrepOutputSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMeetingPrepOutputQuery, GetMeetingPrepOutputQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetMeetingPrepOutputQuery, GetMeetingPrepOutputQueryVariables>(GetMeetingPrepOutputDocument, options);
        }
export type GetMeetingPrepOutputQueryHookResult = ReturnType<typeof useGetMeetingPrepOutputQuery>;
export type GetMeetingPrepOutputLazyQueryHookResult = ReturnType<typeof useGetMeetingPrepOutputLazyQuery>;
export type GetMeetingPrepOutputSuspenseQueryHookResult = ReturnType<typeof useGetMeetingPrepOutputSuspenseQuery>;
export type GetMeetingPrepOutputQueryResult = Apollo.QueryResult<GetMeetingPrepOutputQuery, GetMeetingPrepOutputQueryVariables>;
export const ShareMeetingsDocument = gql`
    mutation shareMeetings($shareType: String, $inviteeList: [String!]!, $meetingId: ID!, $ttl: SharedMeetingTTLInput, $reason: String) {
  shareMeetings(
    shareType: $shareType
    inviteeList: $inviteeList
    meetingId: $meetingId
    ttl: $ttl
    reason: $reason
  ) {
    status
    message
    invite {
      id
      inviteeEmail
      inviterEmail
      meetingId
      ttl {
        duration
        unit
      }
      reason
    }
  }
}
    `;
export type ShareMeetingsMutationFn = Apollo.MutationFunction<ShareMeetingsMutation, ShareMeetingsMutationVariables>;

/**
 * __useShareMeetingsMutation__
 *
 * To run a mutation, you first call `useShareMeetingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useShareMeetingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [shareMeetingsMutation, { data, loading, error }] = useShareMeetingsMutation({
 *   variables: {
 *      shareType: // value for 'shareType'
 *      inviteeList: // value for 'inviteeList'
 *      meetingId: // value for 'meetingId'
 *      ttl: // value for 'ttl'
 *      reason: // value for 'reason'
 *   },
 * });
 */
export function useShareMeetingsMutation(baseOptions?: Apollo.MutationHookOptions<ShareMeetingsMutation, ShareMeetingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ShareMeetingsMutation, ShareMeetingsMutationVariables>(ShareMeetingsDocument, options);
      }
export type ShareMeetingsMutationHookResult = ReturnType<typeof useShareMeetingsMutation>;
export type ShareMeetingsMutationResult = Apollo.MutationResult<ShareMeetingsMutation>;
export type ShareMeetingsMutationOptions = Apollo.BaseMutationOptions<ShareMeetingsMutation, ShareMeetingsMutationVariables>;
export const CancelSharedMeetingAccessDocument = gql`
    mutation cancelSharedMeetingAccess($meetingId: String!, $reason: String, $sharedMeetingId: String!) {
  cancelSharedMeetingAccess(
    meetingId: $meetingId
    reason: $reason
    sharedMeetingId: $sharedMeetingId
  )
}
    `;
export type CancelSharedMeetingAccessMutationFn = Apollo.MutationFunction<CancelSharedMeetingAccessMutation, CancelSharedMeetingAccessMutationVariables>;

/**
 * __useCancelSharedMeetingAccessMutation__
 *
 * To run a mutation, you first call `useCancelSharedMeetingAccessMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelSharedMeetingAccessMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelSharedMeetingAccessMutation, { data, loading, error }] = useCancelSharedMeetingAccessMutation({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      reason: // value for 'reason'
 *      sharedMeetingId: // value for 'sharedMeetingId'
 *   },
 * });
 */
export function useCancelSharedMeetingAccessMutation(baseOptions?: Apollo.MutationHookOptions<CancelSharedMeetingAccessMutation, CancelSharedMeetingAccessMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CancelSharedMeetingAccessMutation, CancelSharedMeetingAccessMutationVariables>(CancelSharedMeetingAccessDocument, options);
      }
export type CancelSharedMeetingAccessMutationHookResult = ReturnType<typeof useCancelSharedMeetingAccessMutation>;
export type CancelSharedMeetingAccessMutationResult = Apollo.MutationResult<CancelSharedMeetingAccessMutation>;
export type CancelSharedMeetingAccessMutationOptions = Apollo.BaseMutationOptions<CancelSharedMeetingAccessMutation, CancelSharedMeetingAccessMutationVariables>;
export const FindUsersMeetingIsSharedWithDocument = gql`
    query findUsersMeetingIsSharedWith($meetingId: ID!) {
  findUsersMeetingIsSharedWith(meetingId: $meetingId) {
    teammates {
      id
      email
      name
      photoUrl
      host
      sharedMeetingId
    }
    nonTeammates {
      id
      email
      name
      photoUrl
      sharedMeetingId
    }
  }
}
    `;

/**
 * __useFindUsersMeetingIsSharedWithQuery__
 *
 * To run a query within a React component, call `useFindUsersMeetingIsSharedWithQuery` and pass it any options that fit your needs.
 * When your component renders, `useFindUsersMeetingIsSharedWithQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFindUsersMeetingIsSharedWithQuery({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *   },
 * });
 */
export function useFindUsersMeetingIsSharedWithQuery(baseOptions: Apollo.QueryHookOptions<FindUsersMeetingIsSharedWithQuery, FindUsersMeetingIsSharedWithQueryVariables> & ({ variables: FindUsersMeetingIsSharedWithQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FindUsersMeetingIsSharedWithQuery, FindUsersMeetingIsSharedWithQueryVariables>(FindUsersMeetingIsSharedWithDocument, options);
      }
export function useFindUsersMeetingIsSharedWithLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FindUsersMeetingIsSharedWithQuery, FindUsersMeetingIsSharedWithQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FindUsersMeetingIsSharedWithQuery, FindUsersMeetingIsSharedWithQueryVariables>(FindUsersMeetingIsSharedWithDocument, options);
        }
// @ts-ignore
export function useFindUsersMeetingIsSharedWithSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<FindUsersMeetingIsSharedWithQuery, FindUsersMeetingIsSharedWithQueryVariables>): Apollo.UseSuspenseQueryResult<FindUsersMeetingIsSharedWithQuery, FindUsersMeetingIsSharedWithQueryVariables>;
export function useFindUsersMeetingIsSharedWithSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FindUsersMeetingIsSharedWithQuery, FindUsersMeetingIsSharedWithQueryVariables>): Apollo.UseSuspenseQueryResult<FindUsersMeetingIsSharedWithQuery | undefined, FindUsersMeetingIsSharedWithQueryVariables>;
export function useFindUsersMeetingIsSharedWithSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FindUsersMeetingIsSharedWithQuery, FindUsersMeetingIsSharedWithQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FindUsersMeetingIsSharedWithQuery, FindUsersMeetingIsSharedWithQueryVariables>(FindUsersMeetingIsSharedWithDocument, options);
        }
export type FindUsersMeetingIsSharedWithQueryHookResult = ReturnType<typeof useFindUsersMeetingIsSharedWithQuery>;
export type FindUsersMeetingIsSharedWithLazyQueryHookResult = ReturnType<typeof useFindUsersMeetingIsSharedWithLazyQuery>;
export type FindUsersMeetingIsSharedWithSuspenseQueryHookResult = ReturnType<typeof useFindUsersMeetingIsSharedWithSuspenseQuery>;
export type FindUsersMeetingIsSharedWithQueryResult = Apollo.QueryResult<FindUsersMeetingIsSharedWithQuery, FindUsersMeetingIsSharedWithQueryVariables>;
export const GetUserMeetingsForStatusDocument = gql`
    query getUserMeetingsForStatus($start: String, $end: String, $limit: Int, $computedStatus: String, $next: String) {
  getUserMeetingsForStatus(
    start: $start
    end: $end
    limit: $limit
    computedStatus: $computedStatus
    next: $next
  ) {
    meetings {
      audio_url
      endTime
      hostEmail
      message
      objectId
      openNotebook
      reloadMeeting
      startTime
      status
      title
      userEmail
      userIsHost
      meetingSource
      addedBy
      url
      computedStatus
      processMeetingStatus
      audioIsTooSmall
      started
      __typename
    }
    next
    hasNext
    __typename
  }
}
    `;

/**
 * __useGetUserMeetingsForStatusQuery__
 *
 * To run a query within a React component, call `useGetUserMeetingsForStatusQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserMeetingsForStatusQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserMeetingsForStatusQuery({
 *   variables: {
 *      start: // value for 'start'
 *      end: // value for 'end'
 *      limit: // value for 'limit'
 *      computedStatus: // value for 'computedStatus'
 *      next: // value for 'next'
 *   },
 * });
 */
export function useGetUserMeetingsForStatusQuery(baseOptions?: Apollo.QueryHookOptions<GetUserMeetingsForStatusQuery, GetUserMeetingsForStatusQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserMeetingsForStatusQuery, GetUserMeetingsForStatusQueryVariables>(GetUserMeetingsForStatusDocument, options);
      }
export function useGetUserMeetingsForStatusLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserMeetingsForStatusQuery, GetUserMeetingsForStatusQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserMeetingsForStatusQuery, GetUserMeetingsForStatusQueryVariables>(GetUserMeetingsForStatusDocument, options);
        }
// @ts-ignore
export function useGetUserMeetingsForStatusSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetUserMeetingsForStatusQuery, GetUserMeetingsForStatusQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserMeetingsForStatusQuery, GetUserMeetingsForStatusQueryVariables>;
export function useGetUserMeetingsForStatusSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserMeetingsForStatusQuery, GetUserMeetingsForStatusQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserMeetingsForStatusQuery | undefined, GetUserMeetingsForStatusQueryVariables>;
export function useGetUserMeetingsForStatusSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserMeetingsForStatusQuery, GetUserMeetingsForStatusQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserMeetingsForStatusQuery, GetUserMeetingsForStatusQueryVariables>(GetUserMeetingsForStatusDocument, options);
        }
export type GetUserMeetingsForStatusQueryHookResult = ReturnType<typeof useGetUserMeetingsForStatusQuery>;
export type GetUserMeetingsForStatusLazyQueryHookResult = ReturnType<typeof useGetUserMeetingsForStatusLazyQuery>;
export type GetUserMeetingsForStatusSuspenseQueryHookResult = ReturnType<typeof useGetUserMeetingsForStatusSuspenseQuery>;
export type GetUserMeetingsForStatusQueryResult = Apollo.QueryResult<GetUserMeetingsForStatusQuery, GetUserMeetingsForStatusQueryVariables>;
export const EndLiveMeetingCallDocument = gql`
    mutation endLiveMeetingCall($meetingId: String!) {
  endLiveMeetingCall(meetingId: $meetingId)
}
    `;
export type EndLiveMeetingCallMutationFn = Apollo.MutationFunction<EndLiveMeetingCallMutation, EndLiveMeetingCallMutationVariables>;

/**
 * __useEndLiveMeetingCallMutation__
 *
 * To run a mutation, you first call `useEndLiveMeetingCallMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useEndLiveMeetingCallMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [endLiveMeetingCallMutation, { data, loading, error }] = useEndLiveMeetingCallMutation({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *   },
 * });
 */
export function useEndLiveMeetingCallMutation(baseOptions?: Apollo.MutationHookOptions<EndLiveMeetingCallMutation, EndLiveMeetingCallMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<EndLiveMeetingCallMutation, EndLiveMeetingCallMutationVariables>(EndLiveMeetingCallDocument, options);
      }
export type EndLiveMeetingCallMutationHookResult = ReturnType<typeof useEndLiveMeetingCallMutation>;
export type EndLiveMeetingCallMutationResult = Apollo.MutationResult<EndLiveMeetingCallMutation>;
export type EndLiveMeetingCallMutationOptions = Apollo.BaseMutationOptions<EndLiveMeetingCallMutation, EndLiveMeetingCallMutationVariables>;
export const ReloadMeetingCallDocument = gql`
    query reloadMeetingCall($meetingId: String!) {
  reloadMeetingCall(meetingId: $meetingId)
}
    `;

/**
 * __useReloadMeetingCallQuery__
 *
 * To run a query within a React component, call `useReloadMeetingCallQuery` and pass it any options that fit your needs.
 * When your component renders, `useReloadMeetingCallQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReloadMeetingCallQuery({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *   },
 * });
 */
export function useReloadMeetingCallQuery(baseOptions: Apollo.QueryHookOptions<ReloadMeetingCallQuery, ReloadMeetingCallQueryVariables> & ({ variables: ReloadMeetingCallQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ReloadMeetingCallQuery, ReloadMeetingCallQueryVariables>(ReloadMeetingCallDocument, options);
      }
export function useReloadMeetingCallLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ReloadMeetingCallQuery, ReloadMeetingCallQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ReloadMeetingCallQuery, ReloadMeetingCallQueryVariables>(ReloadMeetingCallDocument, options);
        }
// @ts-ignore
export function useReloadMeetingCallSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ReloadMeetingCallQuery, ReloadMeetingCallQueryVariables>): Apollo.UseSuspenseQueryResult<ReloadMeetingCallQuery, ReloadMeetingCallQueryVariables>;
export function useReloadMeetingCallSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ReloadMeetingCallQuery, ReloadMeetingCallQueryVariables>): Apollo.UseSuspenseQueryResult<ReloadMeetingCallQuery | undefined, ReloadMeetingCallQueryVariables>;
export function useReloadMeetingCallSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ReloadMeetingCallQuery, ReloadMeetingCallQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ReloadMeetingCallQuery, ReloadMeetingCallQueryVariables>(ReloadMeetingCallDocument, options);
        }
export type ReloadMeetingCallQueryHookResult = ReturnType<typeof useReloadMeetingCallQuery>;
export type ReloadMeetingCallLazyQueryHookResult = ReturnType<typeof useReloadMeetingCallLazyQuery>;
export type ReloadMeetingCallSuspenseQueryHookResult = ReturnType<typeof useReloadMeetingCallSuspenseQuery>;
export type ReloadMeetingCallQueryResult = Apollo.QueryResult<ReloadMeetingCallQuery, ReloadMeetingCallQueryVariables>;
export const DeleteMeetingsDocument = gql`
    mutation deleteMeetings($meetingIds: [String!]!, $source: String) {
  deleteMeetings(meetingIds: $meetingIds, source: $source)
}
    `;
export type DeleteMeetingsMutationFn = Apollo.MutationFunction<DeleteMeetingsMutation, DeleteMeetingsMutationVariables>;

/**
 * __useDeleteMeetingsMutation__
 *
 * To run a mutation, you first call `useDeleteMeetingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteMeetingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteMeetingsMutation, { data, loading, error }] = useDeleteMeetingsMutation({
 *   variables: {
 *      meetingIds: // value for 'meetingIds'
 *      source: // value for 'source'
 *   },
 * });
 */
export function useDeleteMeetingsMutation(baseOptions?: Apollo.MutationHookOptions<DeleteMeetingsMutation, DeleteMeetingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteMeetingsMutation, DeleteMeetingsMutationVariables>(DeleteMeetingsDocument, options);
      }
export type DeleteMeetingsMutationHookResult = ReturnType<typeof useDeleteMeetingsMutation>;
export type DeleteMeetingsMutationResult = Apollo.MutationResult<DeleteMeetingsMutation>;
export type DeleteMeetingsMutationOptions = Apollo.BaseMutationOptions<DeleteMeetingsMutation, DeleteMeetingsMutationVariables>;
export const TranscribeMeetingDocument = gql`
    mutation TranscribeMeeting($meetingId: ID!, $type: TranscribeType!) {
  transcribeMeeting(meetingId: $meetingId, type: $type)
}
    `;
export type TranscribeMeetingMutationFn = Apollo.MutationFunction<TranscribeMeetingMutation, TranscribeMeetingMutationVariables>;

/**
 * __useTranscribeMeetingMutation__
 *
 * To run a mutation, you first call `useTranscribeMeetingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTranscribeMeetingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [transcribeMeetingMutation, { data, loading, error }] = useTranscribeMeetingMutation({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      type: // value for 'type'
 *   },
 * });
 */
export function useTranscribeMeetingMutation(baseOptions?: Apollo.MutationHookOptions<TranscribeMeetingMutation, TranscribeMeetingMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<TranscribeMeetingMutation, TranscribeMeetingMutationVariables>(TranscribeMeetingDocument, options);
      }
export type TranscribeMeetingMutationHookResult = ReturnType<typeof useTranscribeMeetingMutation>;
export type TranscribeMeetingMutationResult = Apollo.MutationResult<TranscribeMeetingMutation>;
export type TranscribeMeetingMutationOptions = Apollo.BaseMutationOptions<TranscribeMeetingMutation, TranscribeMeetingMutationVariables>;
export const SaveNotesDocument = gql`
    mutation saveNotes($meetingId: String!, $speakerMeta: JSON, $sentenceMeta: JSON, $paragraphMeta: JSON, $labelMeta: JSON) {
  saveNotes(
    meetingId: $meetingId
    speakerMeta: $speakerMeta
    sentenceMeta: $sentenceMeta
    paragraphMeta: $paragraphMeta
    labelMeta: $labelMeta
  ) {
    speakerMeta
    sentenceMeta
    paragraphMeta
    labelMeta
  }
}
    `;
export type SaveNotesMutationFn = Apollo.MutationFunction<SaveNotesMutation, SaveNotesMutationVariables>;

/**
 * __useSaveNotesMutation__
 *
 * To run a mutation, you first call `useSaveNotesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSaveNotesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [saveNotesMutation, { data, loading, error }] = useSaveNotesMutation({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      speakerMeta: // value for 'speakerMeta'
 *      sentenceMeta: // value for 'sentenceMeta'
 *      paragraphMeta: // value for 'paragraphMeta'
 *      labelMeta: // value for 'labelMeta'
 *   },
 * });
 */
export function useSaveNotesMutation(baseOptions?: Apollo.MutationHookOptions<SaveNotesMutation, SaveNotesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SaveNotesMutation, SaveNotesMutationVariables>(SaveNotesDocument, options);
      }
export type SaveNotesMutationHookResult = ReturnType<typeof useSaveNotesMutation>;
export type SaveNotesMutationResult = Apollo.MutationResult<SaveNotesMutation>;
export type SaveNotesMutationOptions = Apollo.BaseMutationOptions<SaveNotesMutation, SaveNotesMutationVariables>;
export const UpdateMeetingTitleDocument = gql`
    mutation updateMeetingTitle($meetingId: String!, $title: String!) {
  updateMeetingTitle(meetingId: $meetingId, title: $title)
}
    `;
export type UpdateMeetingTitleMutationFn = Apollo.MutationFunction<UpdateMeetingTitleMutation, UpdateMeetingTitleMutationVariables>;

/**
 * __useUpdateMeetingTitleMutation__
 *
 * To run a mutation, you first call `useUpdateMeetingTitleMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMeetingTitleMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMeetingTitleMutation, { data, loading, error }] = useUpdateMeetingTitleMutation({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      title: // value for 'title'
 *   },
 * });
 */
export function useUpdateMeetingTitleMutation(baseOptions?: Apollo.MutationHookOptions<UpdateMeetingTitleMutation, UpdateMeetingTitleMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateMeetingTitleMutation, UpdateMeetingTitleMutationVariables>(UpdateMeetingTitleDocument, options);
      }
export type UpdateMeetingTitleMutationHookResult = ReturnType<typeof useUpdateMeetingTitleMutation>;
export type UpdateMeetingTitleMutationResult = Apollo.MutationResult<UpdateMeetingTitleMutation>;
export type UpdateMeetingTitleMutationOptions = Apollo.BaseMutationOptions<UpdateMeetingTitleMutation, UpdateMeetingTitleMutationVariables>;
export const UpdateMeetingStateDocument = gql`
    mutation updateMeetingState($meetingId: String!, $action: String!) {
  updateMeetingState(meetingId: $meetingId, action: $action)
}
    `;
export type UpdateMeetingStateMutationFn = Apollo.MutationFunction<UpdateMeetingStateMutation, UpdateMeetingStateMutationVariables>;

/**
 * __useUpdateMeetingStateMutation__
 *
 * To run a mutation, you first call `useUpdateMeetingStateMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMeetingStateMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMeetingStateMutation, { data, loading, error }] = useUpdateMeetingStateMutation({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      action: // value for 'action'
 *   },
 * });
 */
export function useUpdateMeetingStateMutation(baseOptions?: Apollo.MutationHookOptions<UpdateMeetingStateMutation, UpdateMeetingStateMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateMeetingStateMutation, UpdateMeetingStateMutationVariables>(UpdateMeetingStateDocument, options);
      }
export type UpdateMeetingStateMutationHookResult = ReturnType<typeof useUpdateMeetingStateMutation>;
export type UpdateMeetingStateMutationResult = Apollo.MutationResult<UpdateMeetingStateMutation>;
export type UpdateMeetingStateMutationOptions = Apollo.BaseMutationOptions<UpdateMeetingStateMutation, UpdateMeetingStateMutationVariables>;
export const UploadManualNotesDocument = gql`
    mutation uploadManualNotes($meetingId: String!, $notes: String!, $shouldMerge: Boolean!) {
  uploadManualNotes(
    meetingId: $meetingId
    notes: $notes
    shouldMerge: $shouldMerge
  )
}
    `;
export type UploadManualNotesMutationFn = Apollo.MutationFunction<UploadManualNotesMutation, UploadManualNotesMutationVariables>;

/**
 * __useUploadManualNotesMutation__
 *
 * To run a mutation, you first call `useUploadManualNotesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUploadManualNotesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [uploadManualNotesMutation, { data, loading, error }] = useUploadManualNotesMutation({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      notes: // value for 'notes'
 *      shouldMerge: // value for 'shouldMerge'
 *   },
 * });
 */
export function useUploadManualNotesMutation(baseOptions?: Apollo.MutationHookOptions<UploadManualNotesMutation, UploadManualNotesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UploadManualNotesMutation, UploadManualNotesMutationVariables>(UploadManualNotesDocument, options);
      }
export type UploadManualNotesMutationHookResult = ReturnType<typeof useUploadManualNotesMutation>;
export type UploadManualNotesMutationResult = Apollo.MutationResult<UploadManualNotesMutation>;
export type UploadManualNotesMutationOptions = Apollo.BaseMutationOptions<UploadManualNotesMutation, UploadManualNotesMutationVariables>;
export const FetchIsGuestAccessEnabledDocument = gql`
    query fetchIsGuestAccessEnabled($meetingNoteId: String!) {
  meetingNote(_id: $meetingNoteId) {
    _id
    isGuestAccessEnabled
  }
}
    `;

/**
 * __useFetchIsGuestAccessEnabledQuery__
 *
 * To run a query within a React component, call `useFetchIsGuestAccessEnabledQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchIsGuestAccessEnabledQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchIsGuestAccessEnabledQuery({
 *   variables: {
 *      meetingNoteId: // value for 'meetingNoteId'
 *   },
 * });
 */
export function useFetchIsGuestAccessEnabledQuery(baseOptions: Apollo.QueryHookOptions<FetchIsGuestAccessEnabledQuery, FetchIsGuestAccessEnabledQueryVariables> & ({ variables: FetchIsGuestAccessEnabledQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FetchIsGuestAccessEnabledQuery, FetchIsGuestAccessEnabledQueryVariables>(FetchIsGuestAccessEnabledDocument, options);
      }
export function useFetchIsGuestAccessEnabledLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FetchIsGuestAccessEnabledQuery, FetchIsGuestAccessEnabledQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FetchIsGuestAccessEnabledQuery, FetchIsGuestAccessEnabledQueryVariables>(FetchIsGuestAccessEnabledDocument, options);
        }
// @ts-ignore
export function useFetchIsGuestAccessEnabledSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<FetchIsGuestAccessEnabledQuery, FetchIsGuestAccessEnabledQueryVariables>): Apollo.UseSuspenseQueryResult<FetchIsGuestAccessEnabledQuery, FetchIsGuestAccessEnabledQueryVariables>;
export function useFetchIsGuestAccessEnabledSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchIsGuestAccessEnabledQuery, FetchIsGuestAccessEnabledQueryVariables>): Apollo.UseSuspenseQueryResult<FetchIsGuestAccessEnabledQuery | undefined, FetchIsGuestAccessEnabledQueryVariables>;
export function useFetchIsGuestAccessEnabledSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchIsGuestAccessEnabledQuery, FetchIsGuestAccessEnabledQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FetchIsGuestAccessEnabledQuery, FetchIsGuestAccessEnabledQueryVariables>(FetchIsGuestAccessEnabledDocument, options);
        }
export type FetchIsGuestAccessEnabledQueryHookResult = ReturnType<typeof useFetchIsGuestAccessEnabledQuery>;
export type FetchIsGuestAccessEnabledLazyQueryHookResult = ReturnType<typeof useFetchIsGuestAccessEnabledLazyQuery>;
export type FetchIsGuestAccessEnabledSuspenseQueryHookResult = ReturnType<typeof useFetchIsGuestAccessEnabledSuspenseQuery>;
export type FetchIsGuestAccessEnabledQueryResult = Apollo.QueryResult<FetchIsGuestAccessEnabledQuery, FetchIsGuestAccessEnabledQueryVariables>;
export const CreateMeetingInMediaStorageWithUrlDocument = gql`
    mutation createMeetingInMediaStorageWithURL($title: String!, $url: String!, $allEmails: [String], $customLanguage: String) {
  createMeetingInMediaStorageWithURL(
    title: $title
    customLanguage: $customLanguage
    url: $url
    allEmails: $allEmails
  ) {
    meeting
  }
}
    `;
export type CreateMeetingInMediaStorageWithUrlMutationFn = Apollo.MutationFunction<CreateMeetingInMediaStorageWithUrlMutation, CreateMeetingInMediaStorageWithUrlMutationVariables>;

/**
 * __useCreateMeetingInMediaStorageWithUrlMutation__
 *
 * To run a mutation, you first call `useCreateMeetingInMediaStorageWithUrlMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateMeetingInMediaStorageWithUrlMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createMeetingInMediaStorageWithUrlMutation, { data, loading, error }] = useCreateMeetingInMediaStorageWithUrlMutation({
 *   variables: {
 *      title: // value for 'title'
 *      url: // value for 'url'
 *      allEmails: // value for 'allEmails'
 *      customLanguage: // value for 'customLanguage'
 *   },
 * });
 */
export function useCreateMeetingInMediaStorageWithUrlMutation(baseOptions?: Apollo.MutationHookOptions<CreateMeetingInMediaStorageWithUrlMutation, CreateMeetingInMediaStorageWithUrlMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateMeetingInMediaStorageWithUrlMutation, CreateMeetingInMediaStorageWithUrlMutationVariables>(CreateMeetingInMediaStorageWithUrlDocument, options);
      }
export type CreateMeetingInMediaStorageWithUrlMutationHookResult = ReturnType<typeof useCreateMeetingInMediaStorageWithUrlMutation>;
export type CreateMeetingInMediaStorageWithUrlMutationResult = Apollo.MutationResult<CreateMeetingInMediaStorageWithUrlMutation>;
export type CreateMeetingInMediaStorageWithUrlMutationOptions = Apollo.BaseMutationOptions<CreateMeetingInMediaStorageWithUrlMutation, CreateMeetingInMediaStorageWithUrlMutationVariables>;
export const CreateMarkDocument = gql`
    mutation createMark($meetingId: String!, $time: Float, $markType: String!, $actionType: String, $markPinType: String, $source: String!, $pastOffsetSeconds: Float, $futureOffsetSeconds: Float) {
  createMark(
    meetingId: $meetingId
    time: $time
    markType: $markType
    actionType: $actionType
    markPinType: $markPinType
    source: $source
    pastOffsetSeconds: $pastOffsetSeconds
    futureOffsetSeconds: $futureOffsetSeconds
  ) {
    _id
    createdAt
    markType
    markPinType
    meetingId
    meetingOwnerId
    time
    transcriptParseId
    userFirstName
    userPicture
    source
    userId
    userPicture
    pastOffsetSeconds
    futureOffsetSeconds
  }
}
    `;
export type CreateMarkMutationFn = Apollo.MutationFunction<CreateMarkMutation, CreateMarkMutationVariables>;

/**
 * __useCreateMarkMutation__
 *
 * To run a mutation, you first call `useCreateMarkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateMarkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createMarkMutation, { data, loading, error }] = useCreateMarkMutation({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      time: // value for 'time'
 *      markType: // value for 'markType'
 *      actionType: // value for 'actionType'
 *      markPinType: // value for 'markPinType'
 *      source: // value for 'source'
 *      pastOffsetSeconds: // value for 'pastOffsetSeconds'
 *      futureOffsetSeconds: // value for 'futureOffsetSeconds'
 *   },
 * });
 */
export function useCreateMarkMutation(baseOptions?: Apollo.MutationHookOptions<CreateMarkMutation, CreateMarkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateMarkMutation, CreateMarkMutationVariables>(CreateMarkDocument, options);
      }
export type CreateMarkMutationHookResult = ReturnType<typeof useCreateMarkMutation>;
export type CreateMarkMutationResult = Apollo.MutationResult<CreateMarkMutation>;
export type CreateMarkMutationOptions = Apollo.BaseMutationOptions<CreateMarkMutation, CreateMarkMutationVariables>;
export const DeleteMarkDocument = gql`
    mutation deleteMark($markId: String!, $meetingId: String!) {
  deleteMark(markId: $markId, meetingId: $meetingId)
}
    `;
export type DeleteMarkMutationFn = Apollo.MutationFunction<DeleteMarkMutation, DeleteMarkMutationVariables>;

/**
 * __useDeleteMarkMutation__
 *
 * To run a mutation, you first call `useDeleteMarkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteMarkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteMarkMutation, { data, loading, error }] = useDeleteMarkMutation({
 *   variables: {
 *      markId: // value for 'markId'
 *      meetingId: // value for 'meetingId'
 *   },
 * });
 */
export function useDeleteMarkMutation(baseOptions?: Apollo.MutationHookOptions<DeleteMarkMutation, DeleteMarkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteMarkMutation, DeleteMarkMutationVariables>(DeleteMarkDocument, options);
      }
export type DeleteMarkMutationHookResult = ReturnType<typeof useDeleteMarkMutation>;
export type DeleteMarkMutationResult = Apollo.MutationResult<DeleteMarkMutation>;
export type DeleteMarkMutationOptions = Apollo.BaseMutationOptions<DeleteMarkMutation, DeleteMarkMutationVariables>;
export const TranscribeCustomLangDocument = gql`
    mutation transcribeCustomLang($meetingId: ID!, $customLanguage: String!) {
  transcribeCustomLang(meetingId: $meetingId, customLanguage: $customLanguage)
}
    `;
export type TranscribeCustomLangMutationFn = Apollo.MutationFunction<TranscribeCustomLangMutation, TranscribeCustomLangMutationVariables>;

/**
 * __useTranscribeCustomLangMutation__
 *
 * To run a mutation, you first call `useTranscribeCustomLangMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTranscribeCustomLangMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [transcribeCustomLangMutation, { data, loading, error }] = useTranscribeCustomLangMutation({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      customLanguage: // value for 'customLanguage'
 *   },
 * });
 */
export function useTranscribeCustomLangMutation(baseOptions?: Apollo.MutationHookOptions<TranscribeCustomLangMutation, TranscribeCustomLangMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<TranscribeCustomLangMutation, TranscribeCustomLangMutationVariables>(TranscribeCustomLangDocument, options);
      }
export type TranscribeCustomLangMutationHookResult = ReturnType<typeof useTranscribeCustomLangMutation>;
export type TranscribeCustomLangMutationResult = Apollo.MutationResult<TranscribeCustomLangMutation>;
export type TranscribeCustomLangMutationOptions = Apollo.BaseMutationOptions<TranscribeCustomLangMutation, TranscribeCustomLangMutationVariables>;
export const FetchSummaryStatusDocument = gql`
    query fetchSummaryStatus($meetingId: ID!) {
  fetchSummaryStatus(meetingId: $meetingId)
}
    `;

/**
 * __useFetchSummaryStatusQuery__
 *
 * To run a query within a React component, call `useFetchSummaryStatusQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchSummaryStatusQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchSummaryStatusQuery({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *   },
 * });
 */
export function useFetchSummaryStatusQuery(baseOptions: Apollo.QueryHookOptions<FetchSummaryStatusQuery, FetchSummaryStatusQueryVariables> & ({ variables: FetchSummaryStatusQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FetchSummaryStatusQuery, FetchSummaryStatusQueryVariables>(FetchSummaryStatusDocument, options);
      }
export function useFetchSummaryStatusLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FetchSummaryStatusQuery, FetchSummaryStatusQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FetchSummaryStatusQuery, FetchSummaryStatusQueryVariables>(FetchSummaryStatusDocument, options);
        }
// @ts-ignore
export function useFetchSummaryStatusSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<FetchSummaryStatusQuery, FetchSummaryStatusQueryVariables>): Apollo.UseSuspenseQueryResult<FetchSummaryStatusQuery, FetchSummaryStatusQueryVariables>;
export function useFetchSummaryStatusSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchSummaryStatusQuery, FetchSummaryStatusQueryVariables>): Apollo.UseSuspenseQueryResult<FetchSummaryStatusQuery | undefined, FetchSummaryStatusQueryVariables>;
export function useFetchSummaryStatusSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchSummaryStatusQuery, FetchSummaryStatusQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FetchSummaryStatusQuery, FetchSummaryStatusQueryVariables>(FetchSummaryStatusDocument, options);
        }
export type FetchSummaryStatusQueryHookResult = ReturnType<typeof useFetchSummaryStatusQuery>;
export type FetchSummaryStatusLazyQueryHookResult = ReturnType<typeof useFetchSummaryStatusLazyQuery>;
export type FetchSummaryStatusSuspenseQueryHookResult = ReturnType<typeof useFetchSummaryStatusSuspenseQuery>;
export type FetchSummaryStatusQueryResult = Apollo.QueryResult<FetchSummaryStatusQuery, FetchSummaryStatusQueryVariables>;
export const GetMeetingManualNotesDocument = gql`
    query getMeetingManualNotes($meetingId: String!) {
  meetingNote(_id: $meetingId) {
    _id
    summaryStatus
    manualNotes {
      notes
      shouldMerge
    }
    audioServiceMetadata {
      hasManualNotesMerged
    }
  }
}
    `;

/**
 * __useGetMeetingManualNotesQuery__
 *
 * To run a query within a React component, call `useGetMeetingManualNotesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMeetingManualNotesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMeetingManualNotesQuery({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *   },
 * });
 */
export function useGetMeetingManualNotesQuery(baseOptions: Apollo.QueryHookOptions<GetMeetingManualNotesQuery, GetMeetingManualNotesQueryVariables> & ({ variables: GetMeetingManualNotesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetMeetingManualNotesQuery, GetMeetingManualNotesQueryVariables>(GetMeetingManualNotesDocument, options);
      }
export function useGetMeetingManualNotesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMeetingManualNotesQuery, GetMeetingManualNotesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetMeetingManualNotesQuery, GetMeetingManualNotesQueryVariables>(GetMeetingManualNotesDocument, options);
        }
// @ts-ignore
export function useGetMeetingManualNotesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetMeetingManualNotesQuery, GetMeetingManualNotesQueryVariables>): Apollo.UseSuspenseQueryResult<GetMeetingManualNotesQuery, GetMeetingManualNotesQueryVariables>;
export function useGetMeetingManualNotesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMeetingManualNotesQuery, GetMeetingManualNotesQueryVariables>): Apollo.UseSuspenseQueryResult<GetMeetingManualNotesQuery | undefined, GetMeetingManualNotesQueryVariables>;
export function useGetMeetingManualNotesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMeetingManualNotesQuery, GetMeetingManualNotesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetMeetingManualNotesQuery, GetMeetingManualNotesQueryVariables>(GetMeetingManualNotesDocument, options);
        }
export type GetMeetingManualNotesQueryHookResult = ReturnType<typeof useGetMeetingManualNotesQuery>;
export type GetMeetingManualNotesLazyQueryHookResult = ReturnType<typeof useGetMeetingManualNotesLazyQuery>;
export type GetMeetingManualNotesSuspenseQueryHookResult = ReturnType<typeof useGetMeetingManualNotesSuspenseQuery>;
export type GetMeetingManualNotesQueryResult = Apollo.QueryResult<GetMeetingManualNotesQuery, GetMeetingManualNotesQueryVariables>;
export const UpdateMeetingNoteSummaryDocument = gql`
    mutation updateMeetingNoteSummary($meetingId: String!, $jsonComment: [SummarySectionsInput]) {
  updateMeetingNoteSummary(meetingId: $meetingId, jsonComment: $jsonComment)
}
    `;
export type UpdateMeetingNoteSummaryMutationFn = Apollo.MutationFunction<UpdateMeetingNoteSummaryMutation, UpdateMeetingNoteSummaryMutationVariables>;

/**
 * __useUpdateMeetingNoteSummaryMutation__
 *
 * To run a mutation, you first call `useUpdateMeetingNoteSummaryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMeetingNoteSummaryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMeetingNoteSummaryMutation, { data, loading, error }] = useUpdateMeetingNoteSummaryMutation({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      jsonComment: // value for 'jsonComment'
 *   },
 * });
 */
export function useUpdateMeetingNoteSummaryMutation(baseOptions?: Apollo.MutationHookOptions<UpdateMeetingNoteSummaryMutation, UpdateMeetingNoteSummaryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateMeetingNoteSummaryMutation, UpdateMeetingNoteSummaryMutationVariables>(UpdateMeetingNoteSummaryDocument, options);
      }
export type UpdateMeetingNoteSummaryMutationHookResult = ReturnType<typeof useUpdateMeetingNoteSummaryMutation>;
export type UpdateMeetingNoteSummaryMutationResult = Apollo.MutationResult<UpdateMeetingNoteSummaryMutation>;
export type UpdateMeetingNoteSummaryMutationOptions = Apollo.BaseMutationOptions<UpdateMeetingNoteSummaryMutation, UpdateMeetingNoteSummaryMutationVariables>;
export const GetTeamOnboardingSuggestionDocument = gql`
    query GetTeamOnboardingSuggestion {
  teamOnboardingSuggestion: getTeamOnboardingSuggestion {
    suggestion
    freeTrial
    teams {
      id
      name
      admin {
        id
        name
        email
        profile {
          picture
          name
          lastName
          firstName
          email
        }
      }
      teamSize
      isRequested
      teammates {
        id
        name
        email
        profile {
          picture
          name
          lastName
          firstName
          email
        }
      }
    }
  }
}
    `;

/**
 * __useGetTeamOnboardingSuggestionQuery__
 *
 * To run a query within a React component, call `useGetTeamOnboardingSuggestionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTeamOnboardingSuggestionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTeamOnboardingSuggestionQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetTeamOnboardingSuggestionQuery(baseOptions?: Apollo.QueryHookOptions<GetTeamOnboardingSuggestionQuery, GetTeamOnboardingSuggestionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetTeamOnboardingSuggestionQuery, GetTeamOnboardingSuggestionQueryVariables>(GetTeamOnboardingSuggestionDocument, options);
      }
export function useGetTeamOnboardingSuggestionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTeamOnboardingSuggestionQuery, GetTeamOnboardingSuggestionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetTeamOnboardingSuggestionQuery, GetTeamOnboardingSuggestionQueryVariables>(GetTeamOnboardingSuggestionDocument, options);
        }
// @ts-ignore
export function useGetTeamOnboardingSuggestionSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetTeamOnboardingSuggestionQuery, GetTeamOnboardingSuggestionQueryVariables>): Apollo.UseSuspenseQueryResult<GetTeamOnboardingSuggestionQuery, GetTeamOnboardingSuggestionQueryVariables>;
export function useGetTeamOnboardingSuggestionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTeamOnboardingSuggestionQuery, GetTeamOnboardingSuggestionQueryVariables>): Apollo.UseSuspenseQueryResult<GetTeamOnboardingSuggestionQuery | undefined, GetTeamOnboardingSuggestionQueryVariables>;
export function useGetTeamOnboardingSuggestionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTeamOnboardingSuggestionQuery, GetTeamOnboardingSuggestionQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetTeamOnboardingSuggestionQuery, GetTeamOnboardingSuggestionQueryVariables>(GetTeamOnboardingSuggestionDocument, options);
        }
export type GetTeamOnboardingSuggestionQueryHookResult = ReturnType<typeof useGetTeamOnboardingSuggestionQuery>;
export type GetTeamOnboardingSuggestionLazyQueryHookResult = ReturnType<typeof useGetTeamOnboardingSuggestionLazyQuery>;
export type GetTeamOnboardingSuggestionSuspenseQueryHookResult = ReturnType<typeof useGetTeamOnboardingSuggestionSuspenseQuery>;
export type GetTeamOnboardingSuggestionQueryResult = Apollo.QueryResult<GetTeamOnboardingSuggestionQuery, GetTeamOnboardingSuggestionQueryVariables>;
export const CompleteOnboardingStepDocument = gql`
    mutation completeOnboardingStep($step: EnumOnboardingStep!, $skip: Boolean, $extraInfo: CompleteOnboardingStepExtraInfoInput!) {
  completeOnboardingStep(step: $step, skip: $skip, extraInfo: $extraInfo)
}
    `;
export type CompleteOnboardingStepMutationFn = Apollo.MutationFunction<CompleteOnboardingStepMutation, CompleteOnboardingStepMutationVariables>;

/**
 * __useCompleteOnboardingStepMutation__
 *
 * To run a mutation, you first call `useCompleteOnboardingStepMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCompleteOnboardingStepMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [completeOnboardingStepMutation, { data, loading, error }] = useCompleteOnboardingStepMutation({
 *   variables: {
 *      step: // value for 'step'
 *      skip: // value for 'skip'
 *      extraInfo: // value for 'extraInfo'
 *   },
 * });
 */
export function useCompleteOnboardingStepMutation(baseOptions?: Apollo.MutationHookOptions<CompleteOnboardingStepMutation, CompleteOnboardingStepMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CompleteOnboardingStepMutation, CompleteOnboardingStepMutationVariables>(CompleteOnboardingStepDocument, options);
      }
export type CompleteOnboardingStepMutationHookResult = ReturnType<typeof useCompleteOnboardingStepMutation>;
export type CompleteOnboardingStepMutationResult = Apollo.MutationResult<CompleteOnboardingStepMutation>;
export type CompleteOnboardingStepMutationOptions = Apollo.BaseMutationOptions<CompleteOnboardingStepMutation, CompleteOnboardingStepMutationVariables>;
export const ApproveTermsDocument = gql`
    mutation approveTerms {
  approveTerms
}
    `;
export type ApproveTermsMutationFn = Apollo.MutationFunction<ApproveTermsMutation, ApproveTermsMutationVariables>;

/**
 * __useApproveTermsMutation__
 *
 * To run a mutation, you first call `useApproveTermsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useApproveTermsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [approveTermsMutation, { data, loading, error }] = useApproveTermsMutation({
 *   variables: {
 *   },
 * });
 */
export function useApproveTermsMutation(baseOptions?: Apollo.MutationHookOptions<ApproveTermsMutation, ApproveTermsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ApproveTermsMutation, ApproveTermsMutationVariables>(ApproveTermsDocument, options);
      }
export type ApproveTermsMutationHookResult = ReturnType<typeof useApproveTermsMutation>;
export type ApproveTermsMutationResult = Apollo.MutationResult<ApproveTermsMutation>;
export type ApproveTermsMutationOptions = Apollo.BaseMutationOptions<ApproveTermsMutation, ApproveTermsMutationVariables>;
export const GetPersonalAssistantDocument = gql`
    query GetPersonalAssistant {
  getPersonalAssistant {
    ...GetPersonalAssistantResponseDtoFields
  }
}
    ${GetPersonalAssistantResponseDtoFieldsFragmentDoc}`;

/**
 * __useGetPersonalAssistantQuery__
 *
 * To run a query within a React component, call `useGetPersonalAssistantQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPersonalAssistantQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPersonalAssistantQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetPersonalAssistantQuery(baseOptions?: Apollo.QueryHookOptions<GetPersonalAssistantQuery, GetPersonalAssistantQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPersonalAssistantQuery, GetPersonalAssistantQueryVariables>(GetPersonalAssistantDocument, options);
      }
export function useGetPersonalAssistantLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPersonalAssistantQuery, GetPersonalAssistantQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPersonalAssistantQuery, GetPersonalAssistantQueryVariables>(GetPersonalAssistantDocument, options);
        }
// @ts-ignore
export function useGetPersonalAssistantSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetPersonalAssistantQuery, GetPersonalAssistantQueryVariables>): Apollo.UseSuspenseQueryResult<GetPersonalAssistantQuery, GetPersonalAssistantQueryVariables>;
export function useGetPersonalAssistantSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPersonalAssistantQuery, GetPersonalAssistantQueryVariables>): Apollo.UseSuspenseQueryResult<GetPersonalAssistantQuery | undefined, GetPersonalAssistantQueryVariables>;
export function useGetPersonalAssistantSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPersonalAssistantQuery, GetPersonalAssistantQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPersonalAssistantQuery, GetPersonalAssistantQueryVariables>(GetPersonalAssistantDocument, options);
        }
export type GetPersonalAssistantQueryHookResult = ReturnType<typeof useGetPersonalAssistantQuery>;
export type GetPersonalAssistantLazyQueryHookResult = ReturnType<typeof useGetPersonalAssistantLazyQuery>;
export type GetPersonalAssistantSuspenseQueryHookResult = ReturnType<typeof useGetPersonalAssistantSuspenseQuery>;
export type GetPersonalAssistantQueryResult = Apollo.QueryResult<GetPersonalAssistantQuery, GetPersonalAssistantQueryVariables>;
export const GetPersonalAssistantForDailyBriefNotificationDocument = gql`
    query GetPersonalAssistantForDailyBriefNotification {
  getPersonalAssistant {
    dailyDigest {
      lastOutputCreatedAt
      appSettings {
        id
        title
        active
      }
    }
  }
}
    `;

/**
 * __useGetPersonalAssistantForDailyBriefNotificationQuery__
 *
 * To run a query within a React component, call `useGetPersonalAssistantForDailyBriefNotificationQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPersonalAssistantForDailyBriefNotificationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPersonalAssistantForDailyBriefNotificationQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetPersonalAssistantForDailyBriefNotificationQuery(baseOptions?: Apollo.QueryHookOptions<GetPersonalAssistantForDailyBriefNotificationQuery, GetPersonalAssistantForDailyBriefNotificationQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPersonalAssistantForDailyBriefNotificationQuery, GetPersonalAssistantForDailyBriefNotificationQueryVariables>(GetPersonalAssistantForDailyBriefNotificationDocument, options);
      }
export function useGetPersonalAssistantForDailyBriefNotificationLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPersonalAssistantForDailyBriefNotificationQuery, GetPersonalAssistantForDailyBriefNotificationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPersonalAssistantForDailyBriefNotificationQuery, GetPersonalAssistantForDailyBriefNotificationQueryVariables>(GetPersonalAssistantForDailyBriefNotificationDocument, options);
        }
// @ts-ignore
export function useGetPersonalAssistantForDailyBriefNotificationSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetPersonalAssistantForDailyBriefNotificationQuery, GetPersonalAssistantForDailyBriefNotificationQueryVariables>): Apollo.UseSuspenseQueryResult<GetPersonalAssistantForDailyBriefNotificationQuery, GetPersonalAssistantForDailyBriefNotificationQueryVariables>;
export function useGetPersonalAssistantForDailyBriefNotificationSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPersonalAssistantForDailyBriefNotificationQuery, GetPersonalAssistantForDailyBriefNotificationQueryVariables>): Apollo.UseSuspenseQueryResult<GetPersonalAssistantForDailyBriefNotificationQuery | undefined, GetPersonalAssistantForDailyBriefNotificationQueryVariables>;
export function useGetPersonalAssistantForDailyBriefNotificationSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPersonalAssistantForDailyBriefNotificationQuery, GetPersonalAssistantForDailyBriefNotificationQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPersonalAssistantForDailyBriefNotificationQuery, GetPersonalAssistantForDailyBriefNotificationQueryVariables>(GetPersonalAssistantForDailyBriefNotificationDocument, options);
        }
export type GetPersonalAssistantForDailyBriefNotificationQueryHookResult = ReturnType<typeof useGetPersonalAssistantForDailyBriefNotificationQuery>;
export type GetPersonalAssistantForDailyBriefNotificationLazyQueryHookResult = ReturnType<typeof useGetPersonalAssistantForDailyBriefNotificationLazyQuery>;
export type GetPersonalAssistantForDailyBriefNotificationSuspenseQueryHookResult = ReturnType<typeof useGetPersonalAssistantForDailyBriefNotificationSuspenseQuery>;
export type GetPersonalAssistantForDailyBriefNotificationQueryResult = Apollo.QueryResult<GetPersonalAssistantForDailyBriefNotificationQuery, GetPersonalAssistantForDailyBriefNotificationQueryVariables>;
export const GetMeetingPrepAppDocument = gql`
    query GetMeetingPrepApp {
  getMeetingPrepApp {
    ...MeetingPrepAppFields
  }
}
    ${MeetingPrepAppFieldsFragmentDoc}`;

/**
 * __useGetMeetingPrepAppQuery__
 *
 * To run a query within a React component, call `useGetMeetingPrepAppQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMeetingPrepAppQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMeetingPrepAppQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMeetingPrepAppQuery(baseOptions?: Apollo.QueryHookOptions<GetMeetingPrepAppQuery, GetMeetingPrepAppQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetMeetingPrepAppQuery, GetMeetingPrepAppQueryVariables>(GetMeetingPrepAppDocument, options);
      }
export function useGetMeetingPrepAppLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMeetingPrepAppQuery, GetMeetingPrepAppQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetMeetingPrepAppQuery, GetMeetingPrepAppQueryVariables>(GetMeetingPrepAppDocument, options);
        }
// @ts-ignore
export function useGetMeetingPrepAppSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetMeetingPrepAppQuery, GetMeetingPrepAppQueryVariables>): Apollo.UseSuspenseQueryResult<GetMeetingPrepAppQuery, GetMeetingPrepAppQueryVariables>;
export function useGetMeetingPrepAppSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMeetingPrepAppQuery, GetMeetingPrepAppQueryVariables>): Apollo.UseSuspenseQueryResult<GetMeetingPrepAppQuery | undefined, GetMeetingPrepAppQueryVariables>;
export function useGetMeetingPrepAppSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMeetingPrepAppQuery, GetMeetingPrepAppQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetMeetingPrepAppQuery, GetMeetingPrepAppQueryVariables>(GetMeetingPrepAppDocument, options);
        }
export type GetMeetingPrepAppQueryHookResult = ReturnType<typeof useGetMeetingPrepAppQuery>;
export type GetMeetingPrepAppLazyQueryHookResult = ReturnType<typeof useGetMeetingPrepAppLazyQuery>;
export type GetMeetingPrepAppSuspenseQueryHookResult = ReturnType<typeof useGetMeetingPrepAppSuspenseQuery>;
export type GetMeetingPrepAppQueryResult = Apollo.QueryResult<GetMeetingPrepAppQuery, GetMeetingPrepAppQueryVariables>;
export const GetAppOutputsByAppIdDocument = gql`
    query GetAppOutputsByAppId($appId: String!, $limit: Int, $skip: Int, $dateRange: DateRange, $endDate: String, $startDate: String) {
  getAppOutputsByAppId(
    appId: $appId
    limit: $limit
    skip: $skip
    dateRange: $dateRange
    endDate: $endDate
    startDate: $startDate
  ) {
    appOutputs {
      ...AppOutputEventFields
    }
    hasMore
  }
}
    ${AppOutputEventFieldsFragmentDoc}`;

/**
 * __useGetAppOutputsByAppIdQuery__
 *
 * To run a query within a React component, call `useGetAppOutputsByAppIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAppOutputsByAppIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAppOutputsByAppIdQuery({
 *   variables: {
 *      appId: // value for 'appId'
 *      limit: // value for 'limit'
 *      skip: // value for 'skip'
 *      dateRange: // value for 'dateRange'
 *      endDate: // value for 'endDate'
 *      startDate: // value for 'startDate'
 *   },
 * });
 */
export function useGetAppOutputsByAppIdQuery(baseOptions: Apollo.QueryHookOptions<GetAppOutputsByAppIdQuery, GetAppOutputsByAppIdQueryVariables> & ({ variables: GetAppOutputsByAppIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAppOutputsByAppIdQuery, GetAppOutputsByAppIdQueryVariables>(GetAppOutputsByAppIdDocument, options);
      }
export function useGetAppOutputsByAppIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAppOutputsByAppIdQuery, GetAppOutputsByAppIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAppOutputsByAppIdQuery, GetAppOutputsByAppIdQueryVariables>(GetAppOutputsByAppIdDocument, options);
        }
// @ts-ignore
export function useGetAppOutputsByAppIdSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetAppOutputsByAppIdQuery, GetAppOutputsByAppIdQueryVariables>): Apollo.UseSuspenseQueryResult<GetAppOutputsByAppIdQuery, GetAppOutputsByAppIdQueryVariables>;
export function useGetAppOutputsByAppIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAppOutputsByAppIdQuery, GetAppOutputsByAppIdQueryVariables>): Apollo.UseSuspenseQueryResult<GetAppOutputsByAppIdQuery | undefined, GetAppOutputsByAppIdQueryVariables>;
export function useGetAppOutputsByAppIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAppOutputsByAppIdQuery, GetAppOutputsByAppIdQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetAppOutputsByAppIdQuery, GetAppOutputsByAppIdQueryVariables>(GetAppOutputsByAppIdDocument, options);
        }
export type GetAppOutputsByAppIdQueryHookResult = ReturnType<typeof useGetAppOutputsByAppIdQuery>;
export type GetAppOutputsByAppIdLazyQueryHookResult = ReturnType<typeof useGetAppOutputsByAppIdLazyQuery>;
export type GetAppOutputsByAppIdSuspenseQueryHookResult = ReturnType<typeof useGetAppOutputsByAppIdSuspenseQuery>;
export type GetAppOutputsByAppIdQueryResult = Apollo.QueryResult<GetAppOutputsByAppIdQuery, GetAppOutputsByAppIdQueryVariables>;
export const GenerateAppOutputAudioDocument = gql`
    mutation GenerateAppOutputAudio($eventId: String!) {
  generateAppOutputAudio(eventId: $eventId)
}
    `;
export type GenerateAppOutputAudioMutationFn = Apollo.MutationFunction<GenerateAppOutputAudioMutation, GenerateAppOutputAudioMutationVariables>;

/**
 * __useGenerateAppOutputAudioMutation__
 *
 * To run a mutation, you first call `useGenerateAppOutputAudioMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGenerateAppOutputAudioMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [generateAppOutputAudioMutation, { data, loading, error }] = useGenerateAppOutputAudioMutation({
 *   variables: {
 *      eventId: // value for 'eventId'
 *   },
 * });
 */
export function useGenerateAppOutputAudioMutation(baseOptions?: Apollo.MutationHookOptions<GenerateAppOutputAudioMutation, GenerateAppOutputAudioMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<GenerateAppOutputAudioMutation, GenerateAppOutputAudioMutationVariables>(GenerateAppOutputAudioDocument, options);
      }
export type GenerateAppOutputAudioMutationHookResult = ReturnType<typeof useGenerateAppOutputAudioMutation>;
export type GenerateAppOutputAudioMutationResult = Apollo.MutationResult<GenerateAppOutputAudioMutation>;
export type GenerateAppOutputAudioMutationOptions = Apollo.BaseMutationOptions<GenerateAppOutputAudioMutation, GenerateAppOutputAudioMutationVariables>;
export const TogglePersonalAssistantDocument = gql`
    mutation TogglePersonalAssistant($input: TogglePersonalAssistantInput!) {
  togglePersonalAssistant(input: $input) {
    active
    applyForTeam
  }
}
    `;
export type TogglePersonalAssistantMutationFn = Apollo.MutationFunction<TogglePersonalAssistantMutation, TogglePersonalAssistantMutationVariables>;

/**
 * __useTogglePersonalAssistantMutation__
 *
 * To run a mutation, you first call `useTogglePersonalAssistantMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTogglePersonalAssistantMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [togglePersonalAssistantMutation, { data, loading, error }] = useTogglePersonalAssistantMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useTogglePersonalAssistantMutation(baseOptions?: Apollo.MutationHookOptions<TogglePersonalAssistantMutation, TogglePersonalAssistantMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<TogglePersonalAssistantMutation, TogglePersonalAssistantMutationVariables>(TogglePersonalAssistantDocument, options);
      }
export type TogglePersonalAssistantMutationHookResult = ReturnType<typeof useTogglePersonalAssistantMutation>;
export type TogglePersonalAssistantMutationResult = Apollo.MutationResult<TogglePersonalAssistantMutation>;
export type TogglePersonalAssistantMutationOptions = Apollo.BaseMutationOptions<TogglePersonalAssistantMutation, TogglePersonalAssistantMutationVariables>;
export const UpdatePersonalAssistantSettingsDocument = gql`
    mutation UpdatePersonalAssistantSettings($input: UpdatePersonalAssistantSettingsInput!) {
  updatePersonalAssistantSettings(input: $input) {
    _id
    personalAssistantSettings {
      autoUpgrade
    }
  }
}
    `;
export type UpdatePersonalAssistantSettingsMutationFn = Apollo.MutationFunction<UpdatePersonalAssistantSettingsMutation, UpdatePersonalAssistantSettingsMutationVariables>;

/**
 * __useUpdatePersonalAssistantSettingsMutation__
 *
 * To run a mutation, you first call `useUpdatePersonalAssistantSettingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePersonalAssistantSettingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePersonalAssistantSettingsMutation, { data, loading, error }] = useUpdatePersonalAssistantSettingsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePersonalAssistantSettingsMutation(baseOptions?: Apollo.MutationHookOptions<UpdatePersonalAssistantSettingsMutation, UpdatePersonalAssistantSettingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdatePersonalAssistantSettingsMutation, UpdatePersonalAssistantSettingsMutationVariables>(UpdatePersonalAssistantSettingsDocument, options);
      }
export type UpdatePersonalAssistantSettingsMutationHookResult = ReturnType<typeof useUpdatePersonalAssistantSettingsMutation>;
export type UpdatePersonalAssistantSettingsMutationResult = Apollo.MutationResult<UpdatePersonalAssistantSettingsMutation>;
export type UpdatePersonalAssistantSettingsMutationOptions = Apollo.BaseMutationOptions<UpdatePersonalAssistantSettingsMutation, UpdatePersonalAssistantSettingsMutationVariables>;
export const UpsertMeetingPrepAppDocument = gql`
    mutation UpsertMeetingPrepApp($input: UpsertMeetingPrepAppInput!) {
  upsertMeetingPrepApp(input: $input) {
    ...MeetingPrepAppFields
  }
}
    ${MeetingPrepAppFieldsFragmentDoc}`;
export type UpsertMeetingPrepAppMutationFn = Apollo.MutationFunction<UpsertMeetingPrepAppMutation, UpsertMeetingPrepAppMutationVariables>;

/**
 * __useUpsertMeetingPrepAppMutation__
 *
 * To run a mutation, you first call `useUpsertMeetingPrepAppMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpsertMeetingPrepAppMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [upsertMeetingPrepAppMutation, { data, loading, error }] = useUpsertMeetingPrepAppMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpsertMeetingPrepAppMutation(baseOptions?: Apollo.MutationHookOptions<UpsertMeetingPrepAppMutation, UpsertMeetingPrepAppMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpsertMeetingPrepAppMutation, UpsertMeetingPrepAppMutationVariables>(UpsertMeetingPrepAppDocument, options);
      }
export type UpsertMeetingPrepAppMutationHookResult = ReturnType<typeof useUpsertMeetingPrepAppMutation>;
export type UpsertMeetingPrepAppMutationResult = Apollo.MutationResult<UpsertMeetingPrepAppMutation>;
export type UpsertMeetingPrepAppMutationOptions = Apollo.BaseMutationOptions<UpsertMeetingPrepAppMutation, UpsertMeetingPrepAppMutationVariables>;
export const ToggleAppSettingsDocument = gql`
    mutation ToggleAppSettings($id: ID!, $active: Boolean!) {
  toggleAppSettings(id: $id, active: $active) {
    id
    active
    title
  }
}
    `;
export type ToggleAppSettingsMutationFn = Apollo.MutationFunction<ToggleAppSettingsMutation, ToggleAppSettingsMutationVariables>;

/**
 * __useToggleAppSettingsMutation__
 *
 * To run a mutation, you first call `useToggleAppSettingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useToggleAppSettingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [toggleAppSettingsMutation, { data, loading, error }] = useToggleAppSettingsMutation({
 *   variables: {
 *      id: // value for 'id'
 *      active: // value for 'active'
 *   },
 * });
 */
export function useToggleAppSettingsMutation(baseOptions?: Apollo.MutationHookOptions<ToggleAppSettingsMutation, ToggleAppSettingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ToggleAppSettingsMutation, ToggleAppSettingsMutationVariables>(ToggleAppSettingsDocument, options);
      }
export type ToggleAppSettingsMutationHookResult = ReturnType<typeof useToggleAppSettingsMutation>;
export type ToggleAppSettingsMutationResult = Apollo.MutationResult<ToggleAppSettingsMutation>;
export type ToggleAppSettingsMutationOptions = Apollo.BaseMutationOptions<ToggleAppSettingsMutation, ToggleAppSettingsMutationVariables>;
export const GetTranscriptFfAuthDocument = gql`
    query getTranscriptFFAuth($meetingId: String!, $source: String) {
  getTranscriptFFAuth(meetingId: $meetingId, source: $source)
}
    `;

/**
 * __useGetTranscriptFfAuthQuery__
 *
 * To run a query within a React component, call `useGetTranscriptFfAuthQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTranscriptFfAuthQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTranscriptFfAuthQuery({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      source: // value for 'source'
 *   },
 * });
 */
export function useGetTranscriptFfAuthQuery(baseOptions: Apollo.QueryHookOptions<GetTranscriptFfAuthQuery, GetTranscriptFfAuthQueryVariables> & ({ variables: GetTranscriptFfAuthQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetTranscriptFfAuthQuery, GetTranscriptFfAuthQueryVariables>(GetTranscriptFfAuthDocument, options);
      }
export function useGetTranscriptFfAuthLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTranscriptFfAuthQuery, GetTranscriptFfAuthQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetTranscriptFfAuthQuery, GetTranscriptFfAuthQueryVariables>(GetTranscriptFfAuthDocument, options);
        }
// @ts-ignore
export function useGetTranscriptFfAuthSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetTranscriptFfAuthQuery, GetTranscriptFfAuthQueryVariables>): Apollo.UseSuspenseQueryResult<GetTranscriptFfAuthQuery, GetTranscriptFfAuthQueryVariables>;
export function useGetTranscriptFfAuthSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTranscriptFfAuthQuery, GetTranscriptFfAuthQueryVariables>): Apollo.UseSuspenseQueryResult<GetTranscriptFfAuthQuery | undefined, GetTranscriptFfAuthQueryVariables>;
export function useGetTranscriptFfAuthSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTranscriptFfAuthQuery, GetTranscriptFfAuthQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetTranscriptFfAuthQuery, GetTranscriptFfAuthQueryVariables>(GetTranscriptFfAuthDocument, options);
        }
export type GetTranscriptFfAuthQueryHookResult = ReturnType<typeof useGetTranscriptFfAuthQuery>;
export type GetTranscriptFfAuthLazyQueryHookResult = ReturnType<typeof useGetTranscriptFfAuthLazyQuery>;
export type GetTranscriptFfAuthSuspenseQueryHookResult = ReturnType<typeof useGetTranscriptFfAuthSuspenseQuery>;
export type GetTranscriptFfAuthQueryResult = Apollo.QueryResult<GetTranscriptFfAuthQuery, GetTranscriptFfAuthQueryVariables>;
export const GetLiveMeetingInsightsDocument = gql`
    query getLiveMeetingInsights($meetingId: String!, $realtimeToken: String!) {
  getLiveMeetingInsights(meetingId: $meetingId, realtimeToken: $realtimeToken) {
    notes {
      id
      parseId
      note
      time
      endTime
      emoji
      title
    }
    chapterizedNotes
    actionItems {
      id
      parseId
      personName
      personEmail
      captionIndex
      actionItem
      actionItemTimestamp
      checked
    }
  }
}
    `;

/**
 * __useGetLiveMeetingInsightsQuery__
 *
 * To run a query within a React component, call `useGetLiveMeetingInsightsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetLiveMeetingInsightsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetLiveMeetingInsightsQuery({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      realtimeToken: // value for 'realtimeToken'
 *   },
 * });
 */
export function useGetLiveMeetingInsightsQuery(baseOptions: Apollo.QueryHookOptions<GetLiveMeetingInsightsQuery, GetLiveMeetingInsightsQueryVariables> & ({ variables: GetLiveMeetingInsightsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetLiveMeetingInsightsQuery, GetLiveMeetingInsightsQueryVariables>(GetLiveMeetingInsightsDocument, options);
      }
export function useGetLiveMeetingInsightsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetLiveMeetingInsightsQuery, GetLiveMeetingInsightsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetLiveMeetingInsightsQuery, GetLiveMeetingInsightsQueryVariables>(GetLiveMeetingInsightsDocument, options);
        }
// @ts-ignore
export function useGetLiveMeetingInsightsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetLiveMeetingInsightsQuery, GetLiveMeetingInsightsQueryVariables>): Apollo.UseSuspenseQueryResult<GetLiveMeetingInsightsQuery, GetLiveMeetingInsightsQueryVariables>;
export function useGetLiveMeetingInsightsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetLiveMeetingInsightsQuery, GetLiveMeetingInsightsQueryVariables>): Apollo.UseSuspenseQueryResult<GetLiveMeetingInsightsQuery | undefined, GetLiveMeetingInsightsQueryVariables>;
export function useGetLiveMeetingInsightsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetLiveMeetingInsightsQuery, GetLiveMeetingInsightsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetLiveMeetingInsightsQuery, GetLiveMeetingInsightsQueryVariables>(GetLiveMeetingInsightsDocument, options);
        }
export type GetLiveMeetingInsightsQueryHookResult = ReturnType<typeof useGetLiveMeetingInsightsQuery>;
export type GetLiveMeetingInsightsLazyQueryHookResult = ReturnType<typeof useGetLiveMeetingInsightsLazyQuery>;
export type GetLiveMeetingInsightsSuspenseQueryHookResult = ReturnType<typeof useGetLiveMeetingInsightsSuspenseQuery>;
export type GetLiveMeetingInsightsQueryResult = Apollo.QueryResult<GetLiveMeetingInsightsQuery, GetLiveMeetingInsightsQueryVariables>;
export const GetLiveMeetingMarksDocument = gql`
    query getLiveMeetingMarks($meetingId: String!) {
  getLiveMeetingMarks(meetingId: $meetingId) {
    createdAt
    markType
    markPinType
    meetingOwnerId
    meetingId
    time
    transcriptParseId
    userFirstName
    source
    summary
    userPicture
    _id
    userId
    pastOffsetSeconds
    futureOffsetSeconds
  }
}
    `;

/**
 * __useGetLiveMeetingMarksQuery__
 *
 * To run a query within a React component, call `useGetLiveMeetingMarksQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetLiveMeetingMarksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetLiveMeetingMarksQuery({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *   },
 * });
 */
export function useGetLiveMeetingMarksQuery(baseOptions: Apollo.QueryHookOptions<GetLiveMeetingMarksQuery, GetLiveMeetingMarksQueryVariables> & ({ variables: GetLiveMeetingMarksQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetLiveMeetingMarksQuery, GetLiveMeetingMarksQueryVariables>(GetLiveMeetingMarksDocument, options);
      }
export function useGetLiveMeetingMarksLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetLiveMeetingMarksQuery, GetLiveMeetingMarksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetLiveMeetingMarksQuery, GetLiveMeetingMarksQueryVariables>(GetLiveMeetingMarksDocument, options);
        }
// @ts-ignore
export function useGetLiveMeetingMarksSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetLiveMeetingMarksQuery, GetLiveMeetingMarksQueryVariables>): Apollo.UseSuspenseQueryResult<GetLiveMeetingMarksQuery, GetLiveMeetingMarksQueryVariables>;
export function useGetLiveMeetingMarksSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetLiveMeetingMarksQuery, GetLiveMeetingMarksQueryVariables>): Apollo.UseSuspenseQueryResult<GetLiveMeetingMarksQuery | undefined, GetLiveMeetingMarksQueryVariables>;
export function useGetLiveMeetingMarksSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetLiveMeetingMarksQuery, GetLiveMeetingMarksQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetLiveMeetingMarksQuery, GetLiveMeetingMarksQueryVariables>(GetLiveMeetingMarksDocument, options);
        }
export type GetLiveMeetingMarksQueryHookResult = ReturnType<typeof useGetLiveMeetingMarksQuery>;
export type GetLiveMeetingMarksLazyQueryHookResult = ReturnType<typeof useGetLiveMeetingMarksLazyQuery>;
export type GetLiveMeetingMarksSuspenseQueryHookResult = ReturnType<typeof useGetLiveMeetingMarksSuspenseQuery>;
export type GetLiveMeetingMarksQueryResult = Apollo.QueryResult<GetLiveMeetingMarksQuery, GetLiveMeetingMarksQueryVariables>;
export const GetLiveTranscriptDocument = gql`
    query getLiveTranscript($meetingId: String!, $realtimeToken: String!) {
  getLiveTranscript(meetingId: $meetingId, realtimeToken: $realtimeToken) {
    parseId
    transcript_id
    sentence
    speaker_id
    time
    endTime
    speaker
    speaker_name
    text
  }
}
    `;

/**
 * __useGetLiveTranscriptQuery__
 *
 * To run a query within a React component, call `useGetLiveTranscriptQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetLiveTranscriptQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetLiveTranscriptQuery({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      realtimeToken: // value for 'realtimeToken'
 *   },
 * });
 */
export function useGetLiveTranscriptQuery(baseOptions: Apollo.QueryHookOptions<GetLiveTranscriptQuery, GetLiveTranscriptQueryVariables> & ({ variables: GetLiveTranscriptQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetLiveTranscriptQuery, GetLiveTranscriptQueryVariables>(GetLiveTranscriptDocument, options);
      }
export function useGetLiveTranscriptLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetLiveTranscriptQuery, GetLiveTranscriptQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetLiveTranscriptQuery, GetLiveTranscriptQueryVariables>(GetLiveTranscriptDocument, options);
        }
// @ts-ignore
export function useGetLiveTranscriptSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetLiveTranscriptQuery, GetLiveTranscriptQueryVariables>): Apollo.UseSuspenseQueryResult<GetLiveTranscriptQuery, GetLiveTranscriptQueryVariables>;
export function useGetLiveTranscriptSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetLiveTranscriptQuery, GetLiveTranscriptQueryVariables>): Apollo.UseSuspenseQueryResult<GetLiveTranscriptQuery | undefined, GetLiveTranscriptQueryVariables>;
export function useGetLiveTranscriptSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetLiveTranscriptQuery, GetLiveTranscriptQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetLiveTranscriptQuery, GetLiveTranscriptQueryVariables>(GetLiveTranscriptDocument, options);
        }
export type GetLiveTranscriptQueryHookResult = ReturnType<typeof useGetLiveTranscriptQuery>;
export type GetLiveTranscriptLazyQueryHookResult = ReturnType<typeof useGetLiveTranscriptLazyQuery>;
export type GetLiveTranscriptSuspenseQueryHookResult = ReturnType<typeof useGetLiveTranscriptSuspenseQuery>;
export type GetLiveTranscriptQueryResult = Apollo.QueryResult<GetLiveTranscriptQuery, GetLiveTranscriptQueryVariables>;
export const EnrichDomainsDocument = gql`
    query enrichDomains($meetingId: String, $iCalUID: String) {
  enrichDomains(meetingId: $meetingId, iCalUID: $iCalUID) {
    _id
    domain
    name
    description
    recentHeadlines {
      emoji
      title
      content
      occurredAt
    }
  }
}
    `;

/**
 * __useEnrichDomainsQuery__
 *
 * To run a query within a React component, call `useEnrichDomainsQuery` and pass it any options that fit your needs.
 * When your component renders, `useEnrichDomainsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEnrichDomainsQuery({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *      iCalUID: // value for 'iCalUID'
 *   },
 * });
 */
export function useEnrichDomainsQuery(baseOptions?: Apollo.QueryHookOptions<EnrichDomainsQuery, EnrichDomainsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<EnrichDomainsQuery, EnrichDomainsQueryVariables>(EnrichDomainsDocument, options);
      }
export function useEnrichDomainsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<EnrichDomainsQuery, EnrichDomainsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<EnrichDomainsQuery, EnrichDomainsQueryVariables>(EnrichDomainsDocument, options);
        }
// @ts-ignore
export function useEnrichDomainsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<EnrichDomainsQuery, EnrichDomainsQueryVariables>): Apollo.UseSuspenseQueryResult<EnrichDomainsQuery, EnrichDomainsQueryVariables>;
export function useEnrichDomainsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EnrichDomainsQuery, EnrichDomainsQueryVariables>): Apollo.UseSuspenseQueryResult<EnrichDomainsQuery | undefined, EnrichDomainsQueryVariables>;
export function useEnrichDomainsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EnrichDomainsQuery, EnrichDomainsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<EnrichDomainsQuery, EnrichDomainsQueryVariables>(EnrichDomainsDocument, options);
        }
export type EnrichDomainsQueryHookResult = ReturnType<typeof useEnrichDomainsQuery>;
export type EnrichDomainsLazyQueryHookResult = ReturnType<typeof useEnrichDomainsLazyQuery>;
export type EnrichDomainsSuspenseQueryHookResult = ReturnType<typeof useEnrichDomainsSuspenseQuery>;
export type EnrichDomainsQueryResult = Apollo.QueryResult<EnrichDomainsQuery, EnrichDomainsQueryVariables>;
export const EnrichDomainsByICalUidDocument = gql`
    query enrichDomainsByICalUID($iCalUID: String) {
  enrichDomains(iCalUID: $iCalUID) {
    _id
    domain
    name
    description
    recentHeadlines {
      emoji
      title
      content
      occurredAt
    }
  }
}
    `;

/**
 * __useEnrichDomainsByICalUidQuery__
 *
 * To run a query within a React component, call `useEnrichDomainsByICalUidQuery` and pass it any options that fit your needs.
 * When your component renders, `useEnrichDomainsByICalUidQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEnrichDomainsByICalUidQuery({
 *   variables: {
 *      iCalUID: // value for 'iCalUID'
 *   },
 * });
 */
export function useEnrichDomainsByICalUidQuery(baseOptions?: Apollo.QueryHookOptions<EnrichDomainsByICalUidQuery, EnrichDomainsByICalUidQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<EnrichDomainsByICalUidQuery, EnrichDomainsByICalUidQueryVariables>(EnrichDomainsByICalUidDocument, options);
      }
export function useEnrichDomainsByICalUidLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<EnrichDomainsByICalUidQuery, EnrichDomainsByICalUidQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<EnrichDomainsByICalUidQuery, EnrichDomainsByICalUidQueryVariables>(EnrichDomainsByICalUidDocument, options);
        }
// @ts-ignore
export function useEnrichDomainsByICalUidSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<EnrichDomainsByICalUidQuery, EnrichDomainsByICalUidQueryVariables>): Apollo.UseSuspenseQueryResult<EnrichDomainsByICalUidQuery, EnrichDomainsByICalUidQueryVariables>;
export function useEnrichDomainsByICalUidSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EnrichDomainsByICalUidQuery, EnrichDomainsByICalUidQueryVariables>): Apollo.UseSuspenseQueryResult<EnrichDomainsByICalUidQuery | undefined, EnrichDomainsByICalUidQueryVariables>;
export function useEnrichDomainsByICalUidSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EnrichDomainsByICalUidQuery, EnrichDomainsByICalUidQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<EnrichDomainsByICalUidQuery, EnrichDomainsByICalUidQueryVariables>(EnrichDomainsByICalUidDocument, options);
        }
export type EnrichDomainsByICalUidQueryHookResult = ReturnType<typeof useEnrichDomainsByICalUidQuery>;
export type EnrichDomainsByICalUidLazyQueryHookResult = ReturnType<typeof useEnrichDomainsByICalUidLazyQuery>;
export type EnrichDomainsByICalUidSuspenseQueryHookResult = ReturnType<typeof useEnrichDomainsByICalUidSuspenseQuery>;
export type EnrichDomainsByICalUidQueryResult = Apollo.QueryResult<EnrichDomainsByICalUidQuery, EnrichDomainsByICalUidQueryVariables>;
export const EnrichDomainsByMeetingIdDocument = gql`
    query enrichDomainsByMeetingId($meetingId: String) {
  enrichDomains(meetingId: $meetingId) {
    _id
    domain
    name
    description
    recentHeadlines {
      emoji
      title
      content
      occurredAt
    }
  }
}
    `;

/**
 * __useEnrichDomainsByMeetingIdQuery__
 *
 * To run a query within a React component, call `useEnrichDomainsByMeetingIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useEnrichDomainsByMeetingIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEnrichDomainsByMeetingIdQuery({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *   },
 * });
 */
export function useEnrichDomainsByMeetingIdQuery(baseOptions?: Apollo.QueryHookOptions<EnrichDomainsByMeetingIdQuery, EnrichDomainsByMeetingIdQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<EnrichDomainsByMeetingIdQuery, EnrichDomainsByMeetingIdQueryVariables>(EnrichDomainsByMeetingIdDocument, options);
      }
export function useEnrichDomainsByMeetingIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<EnrichDomainsByMeetingIdQuery, EnrichDomainsByMeetingIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<EnrichDomainsByMeetingIdQuery, EnrichDomainsByMeetingIdQueryVariables>(EnrichDomainsByMeetingIdDocument, options);
        }
// @ts-ignore
export function useEnrichDomainsByMeetingIdSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<EnrichDomainsByMeetingIdQuery, EnrichDomainsByMeetingIdQueryVariables>): Apollo.UseSuspenseQueryResult<EnrichDomainsByMeetingIdQuery, EnrichDomainsByMeetingIdQueryVariables>;
export function useEnrichDomainsByMeetingIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EnrichDomainsByMeetingIdQuery, EnrichDomainsByMeetingIdQueryVariables>): Apollo.UseSuspenseQueryResult<EnrichDomainsByMeetingIdQuery | undefined, EnrichDomainsByMeetingIdQueryVariables>;
export function useEnrichDomainsByMeetingIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<EnrichDomainsByMeetingIdQuery, EnrichDomainsByMeetingIdQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<EnrichDomainsByMeetingIdQuery, EnrichDomainsByMeetingIdQueryVariables>(EnrichDomainsByMeetingIdDocument, options);
        }
export type EnrichDomainsByMeetingIdQueryHookResult = ReturnType<typeof useEnrichDomainsByMeetingIdQuery>;
export type EnrichDomainsByMeetingIdLazyQueryHookResult = ReturnType<typeof useEnrichDomainsByMeetingIdLazyQuery>;
export type EnrichDomainsByMeetingIdSuspenseQueryHookResult = ReturnType<typeof useEnrichDomainsByMeetingIdSuspenseQuery>;
export type EnrichDomainsByMeetingIdQueryResult = Apollo.QueryResult<EnrichDomainsByMeetingIdQuery, EnrichDomainsByMeetingIdQueryVariables>;
export const ListKnowledgeBaseDocumentsDocument = gql`
    query ListKnowledgeBaseDocuments($input: ListKnowledgeBaseDocumentsInput!) {
  listKnowledgeBaseDocuments(input: $input) {
    category
    contentType
    documentId
    fileName
    metadata {
      fileUrl
      url
      domain
      title
      subpagesCount
      subPages {
        url
        title
      }
      provider
      scrapedAt
    }
    uploadedAt
  }
}
    `;

/**
 * __useListKnowledgeBaseDocumentsQuery__
 *
 * To run a query within a React component, call `useListKnowledgeBaseDocumentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListKnowledgeBaseDocumentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListKnowledgeBaseDocumentsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListKnowledgeBaseDocumentsQuery(baseOptions: Apollo.QueryHookOptions<ListKnowledgeBaseDocumentsQuery, ListKnowledgeBaseDocumentsQueryVariables> & ({ variables: ListKnowledgeBaseDocumentsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListKnowledgeBaseDocumentsQuery, ListKnowledgeBaseDocumentsQueryVariables>(ListKnowledgeBaseDocumentsDocument, options);
      }
export function useListKnowledgeBaseDocumentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListKnowledgeBaseDocumentsQuery, ListKnowledgeBaseDocumentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListKnowledgeBaseDocumentsQuery, ListKnowledgeBaseDocumentsQueryVariables>(ListKnowledgeBaseDocumentsDocument, options);
        }
// @ts-ignore
export function useListKnowledgeBaseDocumentsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListKnowledgeBaseDocumentsQuery, ListKnowledgeBaseDocumentsQueryVariables>): Apollo.UseSuspenseQueryResult<ListKnowledgeBaseDocumentsQuery, ListKnowledgeBaseDocumentsQueryVariables>;
export function useListKnowledgeBaseDocumentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListKnowledgeBaseDocumentsQuery, ListKnowledgeBaseDocumentsQueryVariables>): Apollo.UseSuspenseQueryResult<ListKnowledgeBaseDocumentsQuery | undefined, ListKnowledgeBaseDocumentsQueryVariables>;
export function useListKnowledgeBaseDocumentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListKnowledgeBaseDocumentsQuery, ListKnowledgeBaseDocumentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListKnowledgeBaseDocumentsQuery, ListKnowledgeBaseDocumentsQueryVariables>(ListKnowledgeBaseDocumentsDocument, options);
        }
export type ListKnowledgeBaseDocumentsQueryHookResult = ReturnType<typeof useListKnowledgeBaseDocumentsQuery>;
export type ListKnowledgeBaseDocumentsLazyQueryHookResult = ReturnType<typeof useListKnowledgeBaseDocumentsLazyQuery>;
export type ListKnowledgeBaseDocumentsSuspenseQueryHookResult = ReturnType<typeof useListKnowledgeBaseDocumentsSuspenseQuery>;
export type ListKnowledgeBaseDocumentsQueryResult = Apollo.QueryResult<ListKnowledgeBaseDocumentsQuery, ListKnowledgeBaseDocumentsQueryVariables>;
export const GlobalSearchDocument = gql`
    query globalSearch($from: Int!, $size: Int!, $channelId: String!, $keywords: String, $filters: SearchFilters) {
  globalSearch(
    from: $from
    size: $size
    channelId: $channelId
    keywords: $keywords
    filters: $filters
  ) {
    total
    meetings {
      id
      title
      parseId
      owner
      date
      createdAt
      audioOnly
      addedBy
      creator_email
      durationMins
      duration
      allEmails
      processMeetingStatus
      privacy
      creatorProfile {
        name
        picture
      }
      _highlight {
        title
        creator_email
        captions {
          index
          sentence
          time
          endTime
          speaker_id
        }
      }
    }
  }
}
    `;

/**
 * __useGlobalSearchQuery__
 *
 * To run a query within a React component, call `useGlobalSearchQuery` and pass it any options that fit your needs.
 * When your component renders, `useGlobalSearchQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGlobalSearchQuery({
 *   variables: {
 *      from: // value for 'from'
 *      size: // value for 'size'
 *      channelId: // value for 'channelId'
 *      keywords: // value for 'keywords'
 *      filters: // value for 'filters'
 *   },
 * });
 */
export function useGlobalSearchQuery(baseOptions: Apollo.QueryHookOptions<GlobalSearchQuery, GlobalSearchQueryVariables> & ({ variables: GlobalSearchQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GlobalSearchQuery, GlobalSearchQueryVariables>(GlobalSearchDocument, options);
      }
export function useGlobalSearchLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GlobalSearchQuery, GlobalSearchQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GlobalSearchQuery, GlobalSearchQueryVariables>(GlobalSearchDocument, options);
        }
// @ts-ignore
export function useGlobalSearchSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GlobalSearchQuery, GlobalSearchQueryVariables>): Apollo.UseSuspenseQueryResult<GlobalSearchQuery, GlobalSearchQueryVariables>;
export function useGlobalSearchSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GlobalSearchQuery, GlobalSearchQueryVariables>): Apollo.UseSuspenseQueryResult<GlobalSearchQuery | undefined, GlobalSearchQueryVariables>;
export function useGlobalSearchSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GlobalSearchQuery, GlobalSearchQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GlobalSearchQuery, GlobalSearchQueryVariables>(GlobalSearchDocument, options);
        }
export type GlobalSearchQueryHookResult = ReturnType<typeof useGlobalSearchQuery>;
export type GlobalSearchLazyQueryHookResult = ReturnType<typeof useGlobalSearchLazyQuery>;
export type GlobalSearchSuspenseQueryHookResult = ReturnType<typeof useGlobalSearchSuspenseQuery>;
export type GlobalSearchQueryResult = Apollo.QueryResult<GlobalSearchQuery, GlobalSearchQueryVariables>;
export const SaveOptionsDocument = gql`
    mutation saveOptions($sendNotesTo: String, $announceFred: Boolean, $autoJoin: String, $preferredLanguage: String, $invitesFrom: String, $barRules: [String], $joinRules: [String], $dispatch: String, $recordingNoti: String, $customAlerts: [String], $industry: String, $privacy: String, $updateForAll: Boolean, $changedSettingsFrom: String, $shouldVideoRecordMeeting: Boolean, $meetingExpirySettings: MeetingExpirySettingsInput, $timesSeenCreditExhuast: Int, $timesSeenPromptsExhaust: Int, $seenFreeTrialModal: Boolean, $seenAIExtensionsModal: Boolean, $hasDismissedVideoPaywallBanner: Boolean, $seenAskFredAnnouncement: Boolean, $hasSeenAskFredOnboarding: Boolean, $seenLanguageAnnouncement: Boolean, $seenPrivacyModal: Boolean) {
  saveOptions(
    sendNotesTo: $sendNotesTo
    announceFred: $announceFred
    autoJoin: $autoJoin
    preferredLanguage: $preferredLanguage
    invitesFrom: $invitesFrom
    barRules: $barRules
    joinRules: $joinRules
    dispatch: $dispatch
    recordingNoti: $recordingNoti
    customAlerts: $customAlerts
    industry: $industry
    privacy: $privacy
    updatePrevPrivacy: $updateForAll
    changedSettingsFrom: $changedSettingsFrom
    shouldVideoRecordMeeting: $shouldVideoRecordMeeting
    meetingExpirySettings: $meetingExpirySettings
    timesSeenCreditExhuast: $timesSeenCreditExhuast
    timesSeenPromptsExhaust: $timesSeenPromptsExhaust
    seenFreeTrialModal: $seenFreeTrialModal
    hasDismissedVideoPaywallBanner: $hasDismissedVideoPaywallBanner
    seenAskFredAnnouncement: $seenAskFredAnnouncement
    seenAIExtensionsModal: $seenAIExtensionsModal
    hasSeenAskFredOnboarding: $hasSeenAskFredOnboarding
    seenLanguageAnnouncement: $seenLanguageAnnouncement
    seenPrivacyModal: $seenPrivacyModal
  ) {
    ...CoreUserFields
    message
  }
}
    ${CoreUserFieldsFragmentDoc}`;
export type SaveOptionsMutationFn = Apollo.MutationFunction<SaveOptionsMutation, SaveOptionsMutationVariables>;

/**
 * __useSaveOptionsMutation__
 *
 * To run a mutation, you first call `useSaveOptionsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSaveOptionsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [saveOptionsMutation, { data, loading, error }] = useSaveOptionsMutation({
 *   variables: {
 *      sendNotesTo: // value for 'sendNotesTo'
 *      announceFred: // value for 'announceFred'
 *      autoJoin: // value for 'autoJoin'
 *      preferredLanguage: // value for 'preferredLanguage'
 *      invitesFrom: // value for 'invitesFrom'
 *      barRules: // value for 'barRules'
 *      joinRules: // value for 'joinRules'
 *      dispatch: // value for 'dispatch'
 *      recordingNoti: // value for 'recordingNoti'
 *      customAlerts: // value for 'customAlerts'
 *      industry: // value for 'industry'
 *      privacy: // value for 'privacy'
 *      updateForAll: // value for 'updateForAll'
 *      changedSettingsFrom: // value for 'changedSettingsFrom'
 *      shouldVideoRecordMeeting: // value for 'shouldVideoRecordMeeting'
 *      meetingExpirySettings: // value for 'meetingExpirySettings'
 *      timesSeenCreditExhuast: // value for 'timesSeenCreditExhuast'
 *      timesSeenPromptsExhaust: // value for 'timesSeenPromptsExhaust'
 *      seenFreeTrialModal: // value for 'seenFreeTrialModal'
 *      seenAIExtensionsModal: // value for 'seenAIExtensionsModal'
 *      hasDismissedVideoPaywallBanner: // value for 'hasDismissedVideoPaywallBanner'
 *      seenAskFredAnnouncement: // value for 'seenAskFredAnnouncement'
 *      hasSeenAskFredOnboarding: // value for 'hasSeenAskFredOnboarding'
 *      seenLanguageAnnouncement: // value for 'seenLanguageAnnouncement'
 *      seenPrivacyModal: // value for 'seenPrivacyModal'
 *   },
 * });
 */
export function useSaveOptionsMutation(baseOptions?: Apollo.MutationHookOptions<SaveOptionsMutation, SaveOptionsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SaveOptionsMutation, SaveOptionsMutationVariables>(SaveOptionsDocument, options);
      }
export type SaveOptionsMutationHookResult = ReturnType<typeof useSaveOptionsMutation>;
export type SaveOptionsMutationResult = Apollo.MutationResult<SaveOptionsMutation>;
export type SaveOptionsMutationOptions = Apollo.BaseMutationOptions<SaveOptionsMutation, SaveOptionsMutationVariables>;
export const UpdateDisableFirefliesTalkDocument = gql`
    mutation updateDisableFirefliesTalk($metadata: UserMetaInput!) {
  updateUserMetadata(metadata: $metadata) {
    id
    disableFirefliesTalk
  }
}
    `;
export type UpdateDisableFirefliesTalkMutationFn = Apollo.MutationFunction<UpdateDisableFirefliesTalkMutation, UpdateDisableFirefliesTalkMutationVariables>;

/**
 * __useUpdateDisableFirefliesTalkMutation__
 *
 * To run a mutation, you first call `useUpdateDisableFirefliesTalkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateDisableFirefliesTalkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateDisableFirefliesTalkMutation, { data, loading, error }] = useUpdateDisableFirefliesTalkMutation({
 *   variables: {
 *      metadata: // value for 'metadata'
 *   },
 * });
 */
export function useUpdateDisableFirefliesTalkMutation(baseOptions?: Apollo.MutationHookOptions<UpdateDisableFirefliesTalkMutation, UpdateDisableFirefliesTalkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateDisableFirefliesTalkMutation, UpdateDisableFirefliesTalkMutationVariables>(UpdateDisableFirefliesTalkDocument, options);
      }
export type UpdateDisableFirefliesTalkMutationHookResult = ReturnType<typeof useUpdateDisableFirefliesTalkMutation>;
export type UpdateDisableFirefliesTalkMutationResult = Apollo.MutationResult<UpdateDisableFirefliesTalkMutation>;
export type UpdateDisableFirefliesTalkMutationOptions = Apollo.BaseMutationOptions<UpdateDisableFirefliesTalkMutation, UpdateDisableFirefliesTalkMutationVariables>;
export const GetSlackConnectionDocument = gql`
    query GetSlackConnection {
  getConnectorList {
    integrations {
      id
      name
    }
  }
  getConnectorListConnected
}
    `;

/**
 * __useGetSlackConnectionQuery__
 *
 * To run a query within a React component, call `useGetSlackConnectionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSlackConnectionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSlackConnectionQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetSlackConnectionQuery(baseOptions?: Apollo.QueryHookOptions<GetSlackConnectionQuery, GetSlackConnectionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSlackConnectionQuery, GetSlackConnectionQueryVariables>(GetSlackConnectionDocument, options);
      }
export function useGetSlackConnectionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSlackConnectionQuery, GetSlackConnectionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSlackConnectionQuery, GetSlackConnectionQueryVariables>(GetSlackConnectionDocument, options);
        }
// @ts-ignore
export function useGetSlackConnectionSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetSlackConnectionQuery, GetSlackConnectionQueryVariables>): Apollo.UseSuspenseQueryResult<GetSlackConnectionQuery, GetSlackConnectionQueryVariables>;
export function useGetSlackConnectionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSlackConnectionQuery, GetSlackConnectionQueryVariables>): Apollo.UseSuspenseQueryResult<GetSlackConnectionQuery | undefined, GetSlackConnectionQueryVariables>;
export function useGetSlackConnectionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSlackConnectionQuery, GetSlackConnectionQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetSlackConnectionQuery, GetSlackConnectionQueryVariables>(GetSlackConnectionDocument, options);
        }
export type GetSlackConnectionQueryHookResult = ReturnType<typeof useGetSlackConnectionQuery>;
export type GetSlackConnectionLazyQueryHookResult = ReturnType<typeof useGetSlackConnectionLazyQuery>;
export type GetSlackConnectionSuspenseQueryHookResult = ReturnType<typeof useGetSlackConnectionSuspenseQuery>;
export type GetSlackConnectionQueryResult = Apollo.QueryResult<GetSlackConnectionQuery, GetSlackConnectionQueryVariables>;
export const GetTemplatesGroupedByCategoryDocument = gql`
    query getTemplatesGroupedByCategory {
  getTemplatesGroupedByCategory {
    id
    index
    name
    templates {
      id
      title
      description
      categoryId
      default
      index
    }
  }
}
    `;

/**
 * __useGetTemplatesGroupedByCategoryQuery__
 *
 * To run a query within a React component, call `useGetTemplatesGroupedByCategoryQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTemplatesGroupedByCategoryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTemplatesGroupedByCategoryQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetTemplatesGroupedByCategoryQuery(baseOptions?: Apollo.QueryHookOptions<GetTemplatesGroupedByCategoryQuery, GetTemplatesGroupedByCategoryQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetTemplatesGroupedByCategoryQuery, GetTemplatesGroupedByCategoryQueryVariables>(GetTemplatesGroupedByCategoryDocument, options);
      }
export function useGetTemplatesGroupedByCategoryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTemplatesGroupedByCategoryQuery, GetTemplatesGroupedByCategoryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetTemplatesGroupedByCategoryQuery, GetTemplatesGroupedByCategoryQueryVariables>(GetTemplatesGroupedByCategoryDocument, options);
        }
// @ts-ignore
export function useGetTemplatesGroupedByCategorySuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetTemplatesGroupedByCategoryQuery, GetTemplatesGroupedByCategoryQueryVariables>): Apollo.UseSuspenseQueryResult<GetTemplatesGroupedByCategoryQuery, GetTemplatesGroupedByCategoryQueryVariables>;
export function useGetTemplatesGroupedByCategorySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTemplatesGroupedByCategoryQuery, GetTemplatesGroupedByCategoryQueryVariables>): Apollo.UseSuspenseQueryResult<GetTemplatesGroupedByCategoryQuery | undefined, GetTemplatesGroupedByCategoryQueryVariables>;
export function useGetTemplatesGroupedByCategorySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTemplatesGroupedByCategoryQuery, GetTemplatesGroupedByCategoryQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetTemplatesGroupedByCategoryQuery, GetTemplatesGroupedByCategoryQueryVariables>(GetTemplatesGroupedByCategoryDocument, options);
        }
export type GetTemplatesGroupedByCategoryQueryHookResult = ReturnType<typeof useGetTemplatesGroupedByCategoryQuery>;
export type GetTemplatesGroupedByCategoryLazyQueryHookResult = ReturnType<typeof useGetTemplatesGroupedByCategoryLazyQuery>;
export type GetTemplatesGroupedByCategorySuspenseQueryHookResult = ReturnType<typeof useGetTemplatesGroupedByCategorySuspenseQuery>;
export type GetTemplatesGroupedByCategoryQueryResult = Apollo.QueryResult<GetTemplatesGroupedByCategoryQuery, GetTemplatesGroupedByCategoryQueryVariables>;
export const GetMeetingSummaryTemplateDocument = gql`
    query getMeetingSummaryTemplate($meetingId: ID!) {
  getMeetingSummary(meetingId: $meetingId) {
    meetingId
    templateId
  }
}
    `;

/**
 * __useGetMeetingSummaryTemplateQuery__
 *
 * To run a query within a React component, call `useGetMeetingSummaryTemplateQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMeetingSummaryTemplateQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMeetingSummaryTemplateQuery({
 *   variables: {
 *      meetingId: // value for 'meetingId'
 *   },
 * });
 */
export function useGetMeetingSummaryTemplateQuery(baseOptions: Apollo.QueryHookOptions<GetMeetingSummaryTemplateQuery, GetMeetingSummaryTemplateQueryVariables> & ({ variables: GetMeetingSummaryTemplateQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetMeetingSummaryTemplateQuery, GetMeetingSummaryTemplateQueryVariables>(GetMeetingSummaryTemplateDocument, options);
      }
export function useGetMeetingSummaryTemplateLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMeetingSummaryTemplateQuery, GetMeetingSummaryTemplateQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetMeetingSummaryTemplateQuery, GetMeetingSummaryTemplateQueryVariables>(GetMeetingSummaryTemplateDocument, options);
        }
// @ts-ignore
export function useGetMeetingSummaryTemplateSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetMeetingSummaryTemplateQuery, GetMeetingSummaryTemplateQueryVariables>): Apollo.UseSuspenseQueryResult<GetMeetingSummaryTemplateQuery, GetMeetingSummaryTemplateQueryVariables>;
export function useGetMeetingSummaryTemplateSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMeetingSummaryTemplateQuery, GetMeetingSummaryTemplateQueryVariables>): Apollo.UseSuspenseQueryResult<GetMeetingSummaryTemplateQuery | undefined, GetMeetingSummaryTemplateQueryVariables>;
export function useGetMeetingSummaryTemplateSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMeetingSummaryTemplateQuery, GetMeetingSummaryTemplateQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetMeetingSummaryTemplateQuery, GetMeetingSummaryTemplateQueryVariables>(GetMeetingSummaryTemplateDocument, options);
        }
export type GetMeetingSummaryTemplateQueryHookResult = ReturnType<typeof useGetMeetingSummaryTemplateQuery>;
export type GetMeetingSummaryTemplateLazyQueryHookResult = ReturnType<typeof useGetMeetingSummaryTemplateLazyQuery>;
export type GetMeetingSummaryTemplateSuspenseQueryHookResult = ReturnType<typeof useGetMeetingSummaryTemplateSuspenseQuery>;
export type GetMeetingSummaryTemplateQueryResult = Apollo.QueryResult<GetMeetingSummaryTemplateQuery, GetMeetingSummaryTemplateQueryVariables>;
export const GetTeamDocument = gql`
    query getTeam {
  team: teamAccount {
    ...CoreTeamFields
  }
}
    ${CoreTeamFieldsFragmentDoc}`;

/**
 * __useGetTeamQuery__
 *
 * To run a query within a React component, call `useGetTeamQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTeamQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTeamQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetTeamQuery(baseOptions?: Apollo.QueryHookOptions<GetTeamQuery, GetTeamQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetTeamQuery, GetTeamQueryVariables>(GetTeamDocument, options);
      }
export function useGetTeamLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTeamQuery, GetTeamQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetTeamQuery, GetTeamQueryVariables>(GetTeamDocument, options);
        }
// @ts-ignore
export function useGetTeamSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetTeamQuery, GetTeamQueryVariables>): Apollo.UseSuspenseQueryResult<GetTeamQuery, GetTeamQueryVariables>;
export function useGetTeamSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTeamQuery, GetTeamQueryVariables>): Apollo.UseSuspenseQueryResult<GetTeamQuery | undefined, GetTeamQueryVariables>;
export function useGetTeamSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTeamQuery, GetTeamQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetTeamQuery, GetTeamQueryVariables>(GetTeamDocument, options);
        }
export type GetTeamQueryHookResult = ReturnType<typeof useGetTeamQuery>;
export type GetTeamLazyQueryHookResult = ReturnType<typeof useGetTeamLazyQuery>;
export type GetTeamSuspenseQueryHookResult = ReturnType<typeof useGetTeamSuspenseQuery>;
export type GetTeamQueryResult = Apollo.QueryResult<GetTeamQuery, GetTeamQueryVariables>;
export const RequestToJoinTeamDocument = gql`
    mutation RequestToJoinTeam($teamId: ID!, $source: String) {
  requestToJoinTeam(teamId: $teamId, source: $source) {
    id
  }
}
    `;
export type RequestToJoinTeamMutationFn = Apollo.MutationFunction<RequestToJoinTeamMutation, RequestToJoinTeamMutationVariables>;

/**
 * __useRequestToJoinTeamMutation__
 *
 * To run a mutation, you first call `useRequestToJoinTeamMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRequestToJoinTeamMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [requestToJoinTeamMutation, { data, loading, error }] = useRequestToJoinTeamMutation({
 *   variables: {
 *      teamId: // value for 'teamId'
 *      source: // value for 'source'
 *   },
 * });
 */
export function useRequestToJoinTeamMutation(baseOptions?: Apollo.MutationHookOptions<RequestToJoinTeamMutation, RequestToJoinTeamMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RequestToJoinTeamMutation, RequestToJoinTeamMutationVariables>(RequestToJoinTeamDocument, options);
      }
export type RequestToJoinTeamMutationHookResult = ReturnType<typeof useRequestToJoinTeamMutation>;
export type RequestToJoinTeamMutationResult = Apollo.MutationResult<RequestToJoinTeamMutation>;
export type RequestToJoinTeamMutationOptions = Apollo.BaseMutationOptions<RequestToJoinTeamMutation, RequestToJoinTeamMutationVariables>;
export const GetInviteSuggestionsDocument = gql`
    query GetInviteSuggestions($group: EnumInviteSuggestionsGroup, $isAutoAdd: Boolean) {
  inviteSuggestions: getInviteSuggestions(group: $group, isAutoAdd: $isAutoAdd) {
    totalCount
    integrations {
      name
      displayName
      category
      icon
      _id
      authType
      connectButtonLink
    }
    users {
      count
      items {
        name
        email
        picture
        group
      }
      emails
      pageInfo {
        hasNextPage
        hasPreviousPage
        currentPage
        itemCount
        pageCount
        perPage
      }
    }
    nonUsers {
      count
      items {
        name
        email
        picture
        group
      }
      emails
      pageInfo {
        hasNextPage
        hasPreviousPage
        currentPage
        itemCount
        pageCount
        perPage
      }
    }
  }
}
    `;

/**
 * __useGetInviteSuggestionsQuery__
 *
 * To run a query within a React component, call `useGetInviteSuggestionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetInviteSuggestionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetInviteSuggestionsQuery({
 *   variables: {
 *      group: // value for 'group'
 *      isAutoAdd: // value for 'isAutoAdd'
 *   },
 * });
 */
export function useGetInviteSuggestionsQuery(baseOptions?: Apollo.QueryHookOptions<GetInviteSuggestionsQuery, GetInviteSuggestionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetInviteSuggestionsQuery, GetInviteSuggestionsQueryVariables>(GetInviteSuggestionsDocument, options);
      }
export function useGetInviteSuggestionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetInviteSuggestionsQuery, GetInviteSuggestionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetInviteSuggestionsQuery, GetInviteSuggestionsQueryVariables>(GetInviteSuggestionsDocument, options);
        }
// @ts-ignore
export function useGetInviteSuggestionsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetInviteSuggestionsQuery, GetInviteSuggestionsQueryVariables>): Apollo.UseSuspenseQueryResult<GetInviteSuggestionsQuery, GetInviteSuggestionsQueryVariables>;
export function useGetInviteSuggestionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetInviteSuggestionsQuery, GetInviteSuggestionsQueryVariables>): Apollo.UseSuspenseQueryResult<GetInviteSuggestionsQuery | undefined, GetInviteSuggestionsQueryVariables>;
export function useGetInviteSuggestionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetInviteSuggestionsQuery, GetInviteSuggestionsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetInviteSuggestionsQuery, GetInviteSuggestionsQueryVariables>(GetInviteSuggestionsDocument, options);
        }
export type GetInviteSuggestionsQueryHookResult = ReturnType<typeof useGetInviteSuggestionsQuery>;
export type GetInviteSuggestionsLazyQueryHookResult = ReturnType<typeof useGetInviteSuggestionsLazyQuery>;
export type GetInviteSuggestionsSuspenseQueryHookResult = ReturnType<typeof useGetInviteSuggestionsSuspenseQuery>;
export type GetInviteSuggestionsQueryResult = Apollo.QueryResult<GetInviteSuggestionsQuery, GetInviteSuggestionsQueryVariables>;
export const InviteTeammatesDocument = gql`
    mutation InviteTeammates($teamId: String!, $teamEmails: [String!]!, $source: String!) {
  inviteTeammates(teamId: $teamId, teamEmails: $teamEmails, source: $source)
}
    `;
export type InviteTeammatesMutationFn = Apollo.MutationFunction<InviteTeammatesMutation, InviteTeammatesMutationVariables>;

/**
 * __useInviteTeammatesMutation__
 *
 * To run a mutation, you first call `useInviteTeammatesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInviteTeammatesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [inviteTeammatesMutation, { data, loading, error }] = useInviteTeammatesMutation({
 *   variables: {
 *      teamId: // value for 'teamId'
 *      teamEmails: // value for 'teamEmails'
 *      source: // value for 'source'
 *   },
 * });
 */
export function useInviteTeammatesMutation(baseOptions?: Apollo.MutationHookOptions<InviteTeammatesMutation, InviteTeammatesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<InviteTeammatesMutation, InviteTeammatesMutationVariables>(InviteTeammatesDocument, options);
      }
export type InviteTeammatesMutationHookResult = ReturnType<typeof useInviteTeammatesMutation>;
export type InviteTeammatesMutationResult = Apollo.MutationResult<InviteTeammatesMutation>;
export type InviteTeammatesMutationOptions = Apollo.BaseMutationOptions<InviteTeammatesMutation, InviteTeammatesMutationVariables>;
export const GetPublicProfileForInviteDocument = gql`
    query getPublicProfileForInvite($email: String!) {
  getPublicProfileForInvite(email: $email) {
    name
    email
    picture
    group
  }
}
    `;

/**
 * __useGetPublicProfileForInviteQuery__
 *
 * To run a query within a React component, call `useGetPublicProfileForInviteQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPublicProfileForInviteQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPublicProfileForInviteQuery({
 *   variables: {
 *      email: // value for 'email'
 *   },
 * });
 */
export function useGetPublicProfileForInviteQuery(baseOptions: Apollo.QueryHookOptions<GetPublicProfileForInviteQuery, GetPublicProfileForInviteQueryVariables> & ({ variables: GetPublicProfileForInviteQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPublicProfileForInviteQuery, GetPublicProfileForInviteQueryVariables>(GetPublicProfileForInviteDocument, options);
      }
export function useGetPublicProfileForInviteLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPublicProfileForInviteQuery, GetPublicProfileForInviteQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPublicProfileForInviteQuery, GetPublicProfileForInviteQueryVariables>(GetPublicProfileForInviteDocument, options);
        }
// @ts-ignore
export function useGetPublicProfileForInviteSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetPublicProfileForInviteQuery, GetPublicProfileForInviteQueryVariables>): Apollo.UseSuspenseQueryResult<GetPublicProfileForInviteQuery, GetPublicProfileForInviteQueryVariables>;
export function useGetPublicProfileForInviteSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPublicProfileForInviteQuery, GetPublicProfileForInviteQueryVariables>): Apollo.UseSuspenseQueryResult<GetPublicProfileForInviteQuery | undefined, GetPublicProfileForInviteQueryVariables>;
export function useGetPublicProfileForInviteSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPublicProfileForInviteQuery, GetPublicProfileForInviteQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPublicProfileForInviteQuery, GetPublicProfileForInviteQueryVariables>(GetPublicProfileForInviteDocument, options);
        }
export type GetPublicProfileForInviteQueryHookResult = ReturnType<typeof useGetPublicProfileForInviteQuery>;
export type GetPublicProfileForInviteLazyQueryHookResult = ReturnType<typeof useGetPublicProfileForInviteLazyQuery>;
export type GetPublicProfileForInviteSuspenseQueryHookResult = ReturnType<typeof useGetPublicProfileForInviteSuspenseQuery>;
export type GetPublicProfileForInviteQueryResult = Apollo.QueryResult<GetPublicProfileForInviteQuery, GetPublicProfileForInviteQueryVariables>;
export const RecordingPreferencesDocument = gql`
    query recordingPreferences {
  recordingPreferences {
    teamsConsentEnabled
  }
}
    `;

/**
 * __useRecordingPreferencesQuery__
 *
 * To run a query within a React component, call `useRecordingPreferencesQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecordingPreferencesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecordingPreferencesQuery({
 *   variables: {
 *   },
 * });
 */
export function useRecordingPreferencesQuery(baseOptions?: Apollo.QueryHookOptions<RecordingPreferencesQuery, RecordingPreferencesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<RecordingPreferencesQuery, RecordingPreferencesQueryVariables>(RecordingPreferencesDocument, options);
      }
export function useRecordingPreferencesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<RecordingPreferencesQuery, RecordingPreferencesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<RecordingPreferencesQuery, RecordingPreferencesQueryVariables>(RecordingPreferencesDocument, options);
        }
// @ts-ignore
export function useRecordingPreferencesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<RecordingPreferencesQuery, RecordingPreferencesQueryVariables>): Apollo.UseSuspenseQueryResult<RecordingPreferencesQuery, RecordingPreferencesQueryVariables>;
export function useRecordingPreferencesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RecordingPreferencesQuery, RecordingPreferencesQueryVariables>): Apollo.UseSuspenseQueryResult<RecordingPreferencesQuery | undefined, RecordingPreferencesQueryVariables>;
export function useRecordingPreferencesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RecordingPreferencesQuery, RecordingPreferencesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<RecordingPreferencesQuery, RecordingPreferencesQueryVariables>(RecordingPreferencesDocument, options);
        }
export type RecordingPreferencesQueryHookResult = ReturnType<typeof useRecordingPreferencesQuery>;
export type RecordingPreferencesLazyQueryHookResult = ReturnType<typeof useRecordingPreferencesLazyQuery>;
export type RecordingPreferencesSuspenseQueryHookResult = ReturnType<typeof useRecordingPreferencesSuspenseQuery>;
export type RecordingPreferencesQueryResult = Apollo.QueryResult<RecordingPreferencesQuery, RecordingPreferencesQueryVariables>;
export const SetTeamsConsentEnabledDocument = gql`
    mutation setTeamsConsentEnabled($enabled: Boolean!) {
  setTeamsConsentEnabled(enabled: $enabled) {
    teamsConsentEnabled
  }
}
    `;
export type SetTeamsConsentEnabledMutationFn = Apollo.MutationFunction<SetTeamsConsentEnabledMutation, SetTeamsConsentEnabledMutationVariables>;

/**
 * __useSetTeamsConsentEnabledMutation__
 *
 * To run a mutation, you first call `useSetTeamsConsentEnabledMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetTeamsConsentEnabledMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setTeamsConsentEnabledMutation, { data, loading, error }] = useSetTeamsConsentEnabledMutation({
 *   variables: {
 *      enabled: // value for 'enabled'
 *   },
 * });
 */
export function useSetTeamsConsentEnabledMutation(baseOptions?: Apollo.MutationHookOptions<SetTeamsConsentEnabledMutation, SetTeamsConsentEnabledMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetTeamsConsentEnabledMutation, SetTeamsConsentEnabledMutationVariables>(SetTeamsConsentEnabledDocument, options);
      }
export type SetTeamsConsentEnabledMutationHookResult = ReturnType<typeof useSetTeamsConsentEnabledMutation>;
export type SetTeamsConsentEnabledMutationResult = Apollo.MutationResult<SetTeamsConsentEnabledMutation>;
export type SetTeamsConsentEnabledMutationOptions = Apollo.BaseMutationOptions<SetTeamsConsentEnabledMutation, SetTeamsConsentEnabledMutationVariables>;
export const NotifyStealthRecordingStartedDocument = gql`
    mutation notifyStealthRecordingStarted($input: NotifyStealthRecordingStartedInput!) {
  notifyStealthRecordingStarted(input: $input) {
    ok
    reason
  }
}
    `;
export type NotifyStealthRecordingStartedMutationFn = Apollo.MutationFunction<NotifyStealthRecordingStartedMutation, NotifyStealthRecordingStartedMutationVariables>;

/**
 * __useNotifyStealthRecordingStartedMutation__
 *
 * To run a mutation, you first call `useNotifyStealthRecordingStartedMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useNotifyStealthRecordingStartedMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [notifyStealthRecordingStartedMutation, { data, loading, error }] = useNotifyStealthRecordingStartedMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useNotifyStealthRecordingStartedMutation(baseOptions?: Apollo.MutationHookOptions<NotifyStealthRecordingStartedMutation, NotifyStealthRecordingStartedMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<NotifyStealthRecordingStartedMutation, NotifyStealthRecordingStartedMutationVariables>(NotifyStealthRecordingStartedDocument, options);
      }
export type NotifyStealthRecordingStartedMutationHookResult = ReturnType<typeof useNotifyStealthRecordingStartedMutation>;
export type NotifyStealthRecordingStartedMutationResult = Apollo.MutationResult<NotifyStealthRecordingStartedMutation>;
export type NotifyStealthRecordingStartedMutationOptions = Apollo.BaseMutationOptions<NotifyStealthRecordingStartedMutation, NotifyStealthRecordingStartedMutationVariables>;
export const GetCategoriesDocument = gql`
    query getCategories($skip: Int, $limit: Int, $sourceIsNotepad: Boolean, $type: TopicType) {
  getCategories(
    skip: $skip
    limit: $limit
    sourceIsNotepad: $sourceIsNotepad
    type: $type
  ) {
    isEnd
    message
    nodes {
      _id
      property {
        name
        subProperties
      }
      createdAt
      owner
      teamAccess
    }
  }
}
    `;

/**
 * __useGetCategoriesQuery__
 *
 * To run a query within a React component, call `useGetCategoriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCategoriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCategoriesQuery({
 *   variables: {
 *      skip: // value for 'skip'
 *      limit: // value for 'limit'
 *      sourceIsNotepad: // value for 'sourceIsNotepad'
 *      type: // value for 'type'
 *   },
 * });
 */
export function useGetCategoriesQuery(baseOptions?: Apollo.QueryHookOptions<GetCategoriesQuery, GetCategoriesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCategoriesQuery, GetCategoriesQueryVariables>(GetCategoriesDocument, options);
      }
export function useGetCategoriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCategoriesQuery, GetCategoriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCategoriesQuery, GetCategoriesQueryVariables>(GetCategoriesDocument, options);
        }
// @ts-ignore
export function useGetCategoriesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetCategoriesQuery, GetCategoriesQueryVariables>): Apollo.UseSuspenseQueryResult<GetCategoriesQuery, GetCategoriesQueryVariables>;
export function useGetCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetCategoriesQuery, GetCategoriesQueryVariables>): Apollo.UseSuspenseQueryResult<GetCategoriesQuery | undefined, GetCategoriesQueryVariables>;
export function useGetCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetCategoriesQuery, GetCategoriesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetCategoriesQuery, GetCategoriesQueryVariables>(GetCategoriesDocument, options);
        }
export type GetCategoriesQueryHookResult = ReturnType<typeof useGetCategoriesQuery>;
export type GetCategoriesLazyQueryHookResult = ReturnType<typeof useGetCategoriesLazyQuery>;
export type GetCategoriesSuspenseQueryHookResult = ReturnType<typeof useGetCategoriesSuspenseQuery>;
export type GetCategoriesQueryResult = Apollo.QueryResult<GetCategoriesQuery, GetCategoriesQueryVariables>;
export const SuggestCategoriesDocument = gql`
    query suggestCategories($subProperties: [String]!) {
  suggestCategories(subProperties: $subProperties) {
    name
    score
  }
}
    `;

/**
 * __useSuggestCategoriesQuery__
 *
 * To run a query within a React component, call `useSuggestCategoriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSuggestCategoriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSuggestCategoriesQuery({
 *   variables: {
 *      subProperties: // value for 'subProperties'
 *   },
 * });
 */
export function useSuggestCategoriesQuery(baseOptions: Apollo.QueryHookOptions<SuggestCategoriesQuery, SuggestCategoriesQueryVariables> & ({ variables: SuggestCategoriesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SuggestCategoriesQuery, SuggestCategoriesQueryVariables>(SuggestCategoriesDocument, options);
      }
export function useSuggestCategoriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SuggestCategoriesQuery, SuggestCategoriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SuggestCategoriesQuery, SuggestCategoriesQueryVariables>(SuggestCategoriesDocument, options);
        }
// @ts-ignore
export function useSuggestCategoriesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SuggestCategoriesQuery, SuggestCategoriesQueryVariables>): Apollo.UseSuspenseQueryResult<SuggestCategoriesQuery, SuggestCategoriesQueryVariables>;
export function useSuggestCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SuggestCategoriesQuery, SuggestCategoriesQueryVariables>): Apollo.UseSuspenseQueryResult<SuggestCategoriesQuery | undefined, SuggestCategoriesQueryVariables>;
export function useSuggestCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SuggestCategoriesQuery, SuggestCategoriesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SuggestCategoriesQuery, SuggestCategoriesQueryVariables>(SuggestCategoriesDocument, options);
        }
export type SuggestCategoriesQueryHookResult = ReturnType<typeof useSuggestCategoriesQuery>;
export type SuggestCategoriesLazyQueryHookResult = ReturnType<typeof useSuggestCategoriesLazyQuery>;
export type SuggestCategoriesSuspenseQueryHookResult = ReturnType<typeof useSuggestCategoriesSuspenseQuery>;
export type SuggestCategoriesQueryResult = Apollo.QueryResult<SuggestCategoriesQuery, SuggestCategoriesQueryVariables>;
export const UpdateCategoriesDocument = gql`
    mutation updateCategories($_id: String!, $name: String!, $subProperties: [String]!, $teamAccess: Boolean) {
  updateCategories(
    _id: $_id
    name: $name
    subProperties: $subProperties
    teamAccess: $teamAccess
  ) {
    _id
    owner
    property {
      name
      subProperties
    }
    teamAccess
  }
}
    `;
export type UpdateCategoriesMutationFn = Apollo.MutationFunction<UpdateCategoriesMutation, UpdateCategoriesMutationVariables>;

/**
 * __useUpdateCategoriesMutation__
 *
 * To run a mutation, you first call `useUpdateCategoriesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateCategoriesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateCategoriesMutation, { data, loading, error }] = useUpdateCategoriesMutation({
 *   variables: {
 *      _id: // value for '_id'
 *      name: // value for 'name'
 *      subProperties: // value for 'subProperties'
 *      teamAccess: // value for 'teamAccess'
 *   },
 * });
 */
export function useUpdateCategoriesMutation(baseOptions?: Apollo.MutationHookOptions<UpdateCategoriesMutation, UpdateCategoriesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateCategoriesMutation, UpdateCategoriesMutationVariables>(UpdateCategoriesDocument, options);
      }
export type UpdateCategoriesMutationHookResult = ReturnType<typeof useUpdateCategoriesMutation>;
export type UpdateCategoriesMutationResult = Apollo.MutationResult<UpdateCategoriesMutation>;
export type UpdateCategoriesMutationOptions = Apollo.BaseMutationOptions<UpdateCategoriesMutation, UpdateCategoriesMutationVariables>;
export const InsertCategoriesDocument = gql`
    mutation insertCategories($name: String!, $subProperties: [String]!, $teamAccess: Boolean) {
  insertCategories(
    name: $name
    subProperties: $subProperties
    teamAccess: $teamAccess
  ) {
    _id
    owner
    property {
      name
      subProperties
    }
    createdAt
    teamAccess
  }
}
    `;
export type InsertCategoriesMutationFn = Apollo.MutationFunction<InsertCategoriesMutation, InsertCategoriesMutationVariables>;

/**
 * __useInsertCategoriesMutation__
 *
 * To run a mutation, you first call `useInsertCategoriesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInsertCategoriesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [insertCategoriesMutation, { data, loading, error }] = useInsertCategoriesMutation({
 *   variables: {
 *      name: // value for 'name'
 *      subProperties: // value for 'subProperties'
 *      teamAccess: // value for 'teamAccess'
 *   },
 * });
 */
export function useInsertCategoriesMutation(baseOptions?: Apollo.MutationHookOptions<InsertCategoriesMutation, InsertCategoriesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<InsertCategoriesMutation, InsertCategoriesMutationVariables>(InsertCategoriesDocument, options);
      }
export type InsertCategoriesMutationHookResult = ReturnType<typeof useInsertCategoriesMutation>;
export type InsertCategoriesMutationResult = Apollo.MutationResult<InsertCategoriesMutation>;
export type InsertCategoriesMutationOptions = Apollo.BaseMutationOptions<InsertCategoriesMutation, InsertCategoriesMutationVariables>;
export const DeleteCategoriesDocument = gql`
    mutation deleteCategories($_id: String!) {
  deleteCategories(_id: $_id)
}
    `;
export type DeleteCategoriesMutationFn = Apollo.MutationFunction<DeleteCategoriesMutation, DeleteCategoriesMutationVariables>;

/**
 * __useDeleteCategoriesMutation__
 *
 * To run a mutation, you first call `useDeleteCategoriesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteCategoriesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteCategoriesMutation, { data, loading, error }] = useDeleteCategoriesMutation({
 *   variables: {
 *      _id: // value for '_id'
 *   },
 * });
 */
export function useDeleteCategoriesMutation(baseOptions?: Apollo.MutationHookOptions<DeleteCategoriesMutation, DeleteCategoriesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteCategoriesMutation, DeleteCategoriesMutationVariables>(DeleteCategoriesDocument, options);
      }
export type DeleteCategoriesMutationHookResult = ReturnType<typeof useDeleteCategoriesMutation>;
export type DeleteCategoriesMutationResult = Apollo.MutationResult<DeleteCategoriesMutation>;
export type DeleteCategoriesMutationOptions = Apollo.BaseMutationOptions<DeleteCategoriesMutation, DeleteCategoriesMutationVariables>;
export const FetchUploadedFilesDocument = gql`
    query fetchUploadedFiles {
  fetchUploadedFiles {
    audio_url
    createdAt
    isAudio
    name
    processing
    size
    type
    userId
    _id
    meetingId
  }
}
    `;

/**
 * __useFetchUploadedFilesQuery__
 *
 * To run a query within a React component, call `useFetchUploadedFilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchUploadedFilesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchUploadedFilesQuery({
 *   variables: {
 *   },
 * });
 */
export function useFetchUploadedFilesQuery(baseOptions?: Apollo.QueryHookOptions<FetchUploadedFilesQuery, FetchUploadedFilesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FetchUploadedFilesQuery, FetchUploadedFilesQueryVariables>(FetchUploadedFilesDocument, options);
      }
export function useFetchUploadedFilesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FetchUploadedFilesQuery, FetchUploadedFilesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FetchUploadedFilesQuery, FetchUploadedFilesQueryVariables>(FetchUploadedFilesDocument, options);
        }
// @ts-ignore
export function useFetchUploadedFilesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<FetchUploadedFilesQuery, FetchUploadedFilesQueryVariables>): Apollo.UseSuspenseQueryResult<FetchUploadedFilesQuery, FetchUploadedFilesQueryVariables>;
export function useFetchUploadedFilesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchUploadedFilesQuery, FetchUploadedFilesQueryVariables>): Apollo.UseSuspenseQueryResult<FetchUploadedFilesQuery | undefined, FetchUploadedFilesQueryVariables>;
export function useFetchUploadedFilesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchUploadedFilesQuery, FetchUploadedFilesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FetchUploadedFilesQuery, FetchUploadedFilesQueryVariables>(FetchUploadedFilesDocument, options);
        }
export type FetchUploadedFilesQueryHookResult = ReturnType<typeof useFetchUploadedFilesQuery>;
export type FetchUploadedFilesLazyQueryHookResult = ReturnType<typeof useFetchUploadedFilesLazyQuery>;
export type FetchUploadedFilesSuspenseQueryHookResult = ReturnType<typeof useFetchUploadedFilesSuspenseQuery>;
export type FetchUploadedFilesQueryResult = Apollo.QueryResult<FetchUploadedFilesQuery, FetchUploadedFilesQueryVariables>;
export const CreateUserFileDocument = gql`
    mutation CreateUserFile($fileName: String!, $fileType: String!, $fileSize: Float!, $audioUrl: String!, $meetingId: String!) {
  createUserFile(
    fileName: $fileName
    fileType: $fileType
    fileSize: $fileSize
    audioUrl: $audioUrl
    meetingId: $meetingId
  )
}
    `;
export type CreateUserFileMutationFn = Apollo.MutationFunction<CreateUserFileMutation, CreateUserFileMutationVariables>;

/**
 * __useCreateUserFileMutation__
 *
 * To run a mutation, you first call `useCreateUserFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateUserFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createUserFileMutation, { data, loading, error }] = useCreateUserFileMutation({
 *   variables: {
 *      fileName: // value for 'fileName'
 *      fileType: // value for 'fileType'
 *      fileSize: // value for 'fileSize'
 *      audioUrl: // value for 'audioUrl'
 *      meetingId: // value for 'meetingId'
 *   },
 * });
 */
export function useCreateUserFileMutation(baseOptions?: Apollo.MutationHookOptions<CreateUserFileMutation, CreateUserFileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateUserFileMutation, CreateUserFileMutationVariables>(CreateUserFileDocument, options);
      }
export type CreateUserFileMutationHookResult = ReturnType<typeof useCreateUserFileMutation>;
export type CreateUserFileMutationResult = Apollo.MutationResult<CreateUserFileMutation>;
export type CreateUserFileMutationOptions = Apollo.BaseMutationOptions<CreateUserFileMutation, CreateUserFileMutationVariables>;
export const DeleteUserFileDocument = gql`
    mutation deleteUserFile($fileId: String!) {
  deleteUserFile(fileId: $fileId)
}
    `;
export type DeleteUserFileMutationFn = Apollo.MutationFunction<DeleteUserFileMutation, DeleteUserFileMutationVariables>;

/**
 * __useDeleteUserFileMutation__
 *
 * To run a mutation, you first call `useDeleteUserFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteUserFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteUserFileMutation, { data, loading, error }] = useDeleteUserFileMutation({
 *   variables: {
 *      fileId: // value for 'fileId'
 *   },
 * });
 */
export function useDeleteUserFileMutation(baseOptions?: Apollo.MutationHookOptions<DeleteUserFileMutation, DeleteUserFileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteUserFileMutation, DeleteUserFileMutationVariables>(DeleteUserFileDocument, options);
      }
export type DeleteUserFileMutationHookResult = ReturnType<typeof useDeleteUserFileMutation>;
export type DeleteUserFileMutationResult = Apollo.MutationResult<DeleteUserFileMutation>;
export type DeleteUserFileMutationOptions = Apollo.BaseMutationOptions<DeleteUserFileMutation, DeleteUserFileMutationVariables>;
export const GetCurrentUserDocument = gql`
    query getCurrentUser($timezone: String) {
  user(timezone: $timezone) {
    ...CoreUserFields
    userMetaData {
      disableFirefliesTalk
      counters {
        timesSeenTalkFeedbackNudge
        timesSeenTalkEmailAssistantNudge
        timesSeenTalkSlackAssistantNudge
      }
      timestamps {
        lastTimeSeenTalkEmailAssistantNudge
        lastTimeSeenTalkSlackAssistantNudge
      }
    }
  }
}
    ${CoreUserFieldsFragmentDoc}`;

/**
 * __useGetCurrentUserQuery__
 *
 * To run a query within a React component, call `useGetCurrentUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCurrentUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCurrentUserQuery({
 *   variables: {
 *      timezone: // value for 'timezone'
 *   },
 * });
 */
export function useGetCurrentUserQuery(baseOptions?: Apollo.QueryHookOptions<GetCurrentUserQuery, GetCurrentUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCurrentUserQuery, GetCurrentUserQueryVariables>(GetCurrentUserDocument, options);
      }
export function useGetCurrentUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCurrentUserQuery, GetCurrentUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCurrentUserQuery, GetCurrentUserQueryVariables>(GetCurrentUserDocument, options);
        }
// @ts-ignore
export function useGetCurrentUserSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetCurrentUserQuery, GetCurrentUserQueryVariables>): Apollo.UseSuspenseQueryResult<GetCurrentUserQuery, GetCurrentUserQueryVariables>;
export function useGetCurrentUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetCurrentUserQuery, GetCurrentUserQueryVariables>): Apollo.UseSuspenseQueryResult<GetCurrentUserQuery | undefined, GetCurrentUserQueryVariables>;
export function useGetCurrentUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetCurrentUserQuery, GetCurrentUserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetCurrentUserQuery, GetCurrentUserQueryVariables>(GetCurrentUserDocument, options);
        }
export type GetCurrentUserQueryHookResult = ReturnType<typeof useGetCurrentUserQuery>;
export type GetCurrentUserLazyQueryHookResult = ReturnType<typeof useGetCurrentUserLazyQuery>;
export type GetCurrentUserSuspenseQueryHookResult = ReturnType<typeof useGetCurrentUserSuspenseQuery>;
export type GetCurrentUserQueryResult = Apollo.QueryResult<GetCurrentUserQuery, GetCurrentUserQueryVariables>;
export const UpdateUserDynamicMetadataDocument = gql`
    mutation updateUserDynamicMetadata($input: UpdateUserDynamicMetadataInput!) {
  updateUserDynamicMetadata(input: $input) {
    flags {
      hasAcceptedTosUpdate2
      completedTalkFeedbackNudge
    }
    counters {
      timesSeenTalkFeedbackNudge
      timesSeenTalkEmailAssistantNudge
      timesSeenTalkSlackAssistantNudge
    }
    timestamps {
      acceptedTosUpdateAt
      acceptedTosUpdate2At
      lastTimeSeenTalkEmailAssistantNudge
      lastTimeSeenTalkSlackAssistantNudge
    }
  }
}
    `;
export type UpdateUserDynamicMetadataMutationFn = Apollo.MutationFunction<UpdateUserDynamicMetadataMutation, UpdateUserDynamicMetadataMutationVariables>;

/**
 * __useUpdateUserDynamicMetadataMutation__
 *
 * To run a mutation, you first call `useUpdateUserDynamicMetadataMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserDynamicMetadataMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserDynamicMetadataMutation, { data, loading, error }] = useUpdateUserDynamicMetadataMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateUserDynamicMetadataMutation(baseOptions?: Apollo.MutationHookOptions<UpdateUserDynamicMetadataMutation, UpdateUserDynamicMetadataMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateUserDynamicMetadataMutation, UpdateUserDynamicMetadataMutationVariables>(UpdateUserDynamicMetadataDocument, options);
      }
export type UpdateUserDynamicMetadataMutationHookResult = ReturnType<typeof useUpdateUserDynamicMetadataMutation>;
export type UpdateUserDynamicMetadataMutationResult = Apollo.MutationResult<UpdateUserDynamicMetadataMutation>;
export type UpdateUserDynamicMetadataMutationOptions = Apollo.BaseMutationOptions<UpdateUserDynamicMetadataMutation, UpdateUserDynamicMetadataMutationVariables>;
export const GetPublicProfileDocument = gql`
    query GetPublicProfile($email: String!) {
  publicProfile: getPublicProfileForInvite(email: $email) {
    name
    email
    picture
    group
  }
}
    `;

/**
 * __useGetPublicProfileQuery__
 *
 * To run a query within a React component, call `useGetPublicProfileQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPublicProfileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPublicProfileQuery({
 *   variables: {
 *      email: // value for 'email'
 *   },
 * });
 */
export function useGetPublicProfileQuery(baseOptions: Apollo.QueryHookOptions<GetPublicProfileQuery, GetPublicProfileQueryVariables> & ({ variables: GetPublicProfileQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPublicProfileQuery, GetPublicProfileQueryVariables>(GetPublicProfileDocument, options);
      }
export function useGetPublicProfileLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPublicProfileQuery, GetPublicProfileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPublicProfileQuery, GetPublicProfileQueryVariables>(GetPublicProfileDocument, options);
        }
// @ts-ignore
export function useGetPublicProfileSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetPublicProfileQuery, GetPublicProfileQueryVariables>): Apollo.UseSuspenseQueryResult<GetPublicProfileQuery, GetPublicProfileQueryVariables>;
export function useGetPublicProfileSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPublicProfileQuery, GetPublicProfileQueryVariables>): Apollo.UseSuspenseQueryResult<GetPublicProfileQuery | undefined, GetPublicProfileQueryVariables>;
export function useGetPublicProfileSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPublicProfileQuery, GetPublicProfileQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPublicProfileQuery, GetPublicProfileQueryVariables>(GetPublicProfileDocument, options);
        }
export type GetPublicProfileQueryHookResult = ReturnType<typeof useGetPublicProfileQuery>;
export type GetPublicProfileLazyQueryHookResult = ReturnType<typeof useGetPublicProfileLazyQuery>;
export type GetPublicProfileSuspenseQueryHookResult = ReturnType<typeof useGetPublicProfileSuspenseQuery>;
export type GetPublicProfileQueryResult = Apollo.QueryResult<GetPublicProfileQuery, GetPublicProfileQueryVariables>;
export const GetPublicProfilesDocument = gql`
    query GetPublicProfiles($emails: [String!]!) {
  publicProfiles: getPublicProfiles(emails: $emails) {
    name
    email
    picture
    group
  }
}
    `;

/**
 * __useGetPublicProfilesQuery__
 *
 * To run a query within a React component, call `useGetPublicProfilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPublicProfilesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPublicProfilesQuery({
 *   variables: {
 *      emails: // value for 'emails'
 *   },
 * });
 */
export function useGetPublicProfilesQuery(baseOptions: Apollo.QueryHookOptions<GetPublicProfilesQuery, GetPublicProfilesQueryVariables> & ({ variables: GetPublicProfilesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPublicProfilesQuery, GetPublicProfilesQueryVariables>(GetPublicProfilesDocument, options);
      }
export function useGetPublicProfilesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPublicProfilesQuery, GetPublicProfilesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPublicProfilesQuery, GetPublicProfilesQueryVariables>(GetPublicProfilesDocument, options);
        }
// @ts-ignore
export function useGetPublicProfilesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetPublicProfilesQuery, GetPublicProfilesQueryVariables>): Apollo.UseSuspenseQueryResult<GetPublicProfilesQuery, GetPublicProfilesQueryVariables>;
export function useGetPublicProfilesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPublicProfilesQuery, GetPublicProfilesQueryVariables>): Apollo.UseSuspenseQueryResult<GetPublicProfilesQuery | undefined, GetPublicProfilesQueryVariables>;
export function useGetPublicProfilesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPublicProfilesQuery, GetPublicProfilesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPublicProfilesQuery, GetPublicProfilesQueryVariables>(GetPublicProfilesDocument, options);
        }
export type GetPublicProfilesQueryHookResult = ReturnType<typeof useGetPublicProfilesQuery>;
export type GetPublicProfilesLazyQueryHookResult = ReturnType<typeof useGetPublicProfilesLazyQuery>;
export type GetPublicProfilesSuspenseQueryHookResult = ReturnType<typeof useGetPublicProfilesSuspenseQuery>;
export type GetPublicProfilesQueryResult = Apollo.QueryResult<GetPublicProfilesQuery, GetPublicProfilesQueryVariables>;