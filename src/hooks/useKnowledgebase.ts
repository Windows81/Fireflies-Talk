import { useMemo } from "react";
import type { KnowledgeBaseDocument, Profile } from "@/graphql";
import { useListKnowledgeBaseDocumentsQuery, NamespaceType } from "@/graphql";
import { useTeam } from "@/features/team";
import type { ErrorPolicy, FetchPolicy } from "@apollo/client";

interface UseKnowledgeBaseOptions {
  preLoadKnowledgeBaseList?: boolean;
  limit?: number;
  fetchPolicy?: FetchPolicy;
  errorPolicy?: ErrorPolicy;
}

interface UseKnowledgeBaseResult {
  data: IKnowledgeBaseItem[] | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

export enum KbModalTabs {
  FILES = "files",
  WEBSITES = "websites",
  TEXT_SNIPPETS = "textSnippets",
}

interface IBaseSource {
  id?: string;
  name?: string;
  createdAt?: number;
  updatedAt?: number;

  addedBy?: Profile;

  toDelete?: boolean;
  isDeleting?: boolean;
  isDeleted?: boolean;
  isSaving?: boolean;
  isUploading?: boolean;
  error?: string;
}

interface IFile extends IBaseSource {
  size?: number;
  fileToUpload?: File;
  fileUrl?: string;
  ingestedFileUrl?: string;
  content?: string;
}

interface IWebsite extends IBaseSource {
  urlToCrawl?: string;
  subpagesCount?: number;
  includedPaths?: Array<string>;
  isIngested?: boolean;
  excludedPaths?: Array<string>;
  subPages?: Array<{
    title?: string | null;
    url?: string | null;
  }>;
}

interface ITextSnippet extends IBaseSource {
  content?: string;
}

export interface ISource {
  [KbModalTabs.FILES]: Array<IFile>;
  [KbModalTabs.WEBSITES]: Array<IWebsite>;
  [KbModalTabs.TEXT_SNIPPETS]: Array<ITextSnippet>;
}

const KNOWLEDGE_BASE_TEMPLATES = ["Sales"];

export interface IKnowledgeBaseItem {
  id?: string;
  isTemplate?: boolean;
  name: string;

  createdAt?: number;
  updatedAt?: number;
  sources: ISource;

  accessSettings: {
    askFred?: boolean;
    aiTeammates?: {
      enabled: boolean;
      agentIds: Array<string>;
    };
    liveAssist?: {
      enabled: boolean;
    };
  };

  iconColor?: string;
  errors?: Partial<Record<keyof IKnowledgeBaseItem, string>>;
}

export const KbAccessSettingsColors: string[] = [
  "rainbowStaticGreenSolid",
  "rainbowStaticYellowSolid",
  "rainbowStaticOrangeSolid",
  "rainbowStaticRedSolid",
  "rainbowStaticPurpleSolid",
  "rainbowStaticPinkSolid",
  "rainbowStaticIndigoSolid",
  "rainbowStaticCyanSolid",
  "rainbowStaticTealSolid",
];

export const getIconColor = (index: number) =>
  KbAccessSettingsColors[index % KbAccessSettingsColors.length];

const getEmptyKnowledgeBase = (index: number) => ({
  name: "",
  iconColor: getIconColor(index),
  sources: {
    files: [],
    websites: [],
    textSnippets: [],
  },
  accessSettings: {},
});

const getCommonPayload = (kb: KnowledgeBaseDocument) => ({
  id: kb.documentId,
  createdAt: new Date(kb.uploadedAt).getTime(),
  updatedAt: new Date(kb.uploadedAt).getTime(),
});

const getFilePayload = (kb: KnowledgeBaseDocument): IFile => ({
  ...getCommonPayload(kb),
  name: kb.fileName,
  ingestedFileUrl: kb.metadata?.fileUrl ?? "",
});

const getWebsitePayload = (kb: KnowledgeBaseDocument): IWebsite => ({
  ...getCommonPayload(kb),
  name: kb.metadata?.url ?? "",
  subpagesCount: kb.metadata?.subpagesCount || 0,
  isIngested: true,
  subPages: kb.metadata?.subPages || [],
});

const getKbTimeStamps = (kb: IKnowledgeBaseItem) => {
  const createdAts = [...kb.sources.files, ...kb.sources.websites]
    .map((source) => source.createdAt)
    .filter((date): date is number => date !== undefined);

  const updatedAts = [...kb.sources.files, ...kb.sources.websites]
    .map((source) => source.updatedAt)
    .filter((date): date is number => date !== undefined);

  return {
    createdAt: createdAts.length > 0 ? Math.min(...createdAts) : undefined,
    updatedAt: updatedAts.length > 0 ? Math.max(...updatedAts) : undefined,
  };
};

export const formatKbList = (
  kbList: Array<KnowledgeBaseDocument>,
  shouldAddTemplates: boolean = true,
): Array<IKnowledgeBaseItem> => {
  const sortedList = Array.from(kbList).sort(
    (a, b) =>
      new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
  );

  const formattedList: Array<IKnowledgeBaseItem> = [];

  if (shouldAddTemplates) {
    KNOWLEDGE_BASE_TEMPLATES.forEach((template, index) => {
      formattedList.push({
        ...getEmptyKnowledgeBase(index),
        name: template,
        id: template,
        isTemplate: true,
      });
    });
  }

  for (const kb of sortedList) {
    const kbIndex = formattedList.findIndex((item) => item.id === kb.category);
    if (kbIndex !== -1) {
      if (kb.metadata?.fileUrl)
        formattedList[kbIndex].sources.files.push(getFilePayload(kb));
      else if (kb.metadata?.url)
        formattedList[kbIndex].sources.websites.push(getWebsitePayload(kb));
    } else {
      formattedList.push({
        ...getEmptyKnowledgeBase(formattedList.length),
        id: kb.category,
        name: kb.category,
        sources: {
          files: kb.metadata?.fileUrl ? [getFilePayload(kb)] : [],
          websites: kb.metadata?.url ? [getWebsitePayload(kb)] : [],
          textSnippets: [],
        },
      });
    }
  }

  return formattedList.map((kb) => ({ ...kb, ...getKbTimeStamps(kb) }));
};

/**
 * Hook to fetch knowledge base documents list
 *
 * @param options - Configuration options for the hook
 * @returns Knowledge base documents data, loading state, error information, and refetch function
 */
export const useKnowledgebase = (
  options: UseKnowledgeBaseOptions = {},
): UseKnowledgeBaseResult => {
  const {
    preLoadKnowledgeBaseList = true,
    limit = 100,
    fetchPolicy = "cache-and-network",
    errorPolicy = "none",
  } = options;

  const { team } = useTeam();

  const { data, loading, error, refetch } = useListKnowledgeBaseDocumentsQuery({
    variables: {
      input: {
        id: team?._id ?? "",
        limit,
        type: NamespaceType.Team,
      },
    },
    skip: !team?._id || !preLoadKnowledgeBaseList,
    fetchPolicy,
    errorPolicy,
  });

  const knowledgeBaseList = useMemo(() => {
    if (!data?.listKnowledgeBaseDocuments) return [];
    return formatKbList(data.listKnowledgeBaseDocuments, false);
  }, [data?.listKnowledgeBaseDocuments]);

  return {
    data: knowledgeBaseList,
    loading,
    error,
    refetch,
  };
};
