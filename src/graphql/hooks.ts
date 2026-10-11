import type {
  ApolloQueryResult,
  FetchMoreQueryOptions,
  OperationVariables,
} from "@apollo/client";
import { getProperty } from "dot-prop";
import { useCallback, useState } from "react";

export interface FetchMoreState {
  loading: boolean;
  ended: boolean;
}

export function useFetchMore<
  TFetchData,
  TFetchVars extends OperationVariables,
>({
  fetchMore,
  skipVariable = "skip",
  pageSizeVariable,
  path,
  data,
  limit,
}: {
  fetchMore: (
    fetchMoreOptions: FetchMoreQueryOptions<TFetchVars, TFetchData>,
  ) => Promise<ApolloQueryResult<TFetchData>>;
  skipVariable?: keyof TFetchVars;
  pageSizeVariable?: keyof TFetchVars;
  limit: number;
  path: keyof TFetchData | string;
  data: TFetchData | undefined;
}) {
  const [fetchMoreState, setFetchMoreState] = useState<FetchMoreState>({
    loading: false,
    ended: false,
  });

  const fetchNext = useCallback(async () => {
    if (!data || fetchMoreState.loading || fetchMoreState.ended) return;
    setFetchMoreState({ loading: true, ended: false });
    const prevArr = getProperty(data, path as string) as unknown[] | undefined;
    if (!prevArr?.length) {
      setFetchMoreState({ loading: false, ended: true });
      return;
    }
    const res = await fetchMore({
      variables: {
        [skipVariable]: prevArr.length,
        ...(pageSizeVariable ? { [pageSizeVariable]: limit } : {}),
      } as Partial<TFetchVars>,
    });
    const arr = getProperty(res.data, path as string);
    if (!Array.isArray(arr) || !(arr as unknown[]).length) {
      setFetchMoreState({ loading: false, ended: true });
    } else {
      setFetchMoreState({ loading: false, ended: false });
    }
  }, [
    data,
    fetchMoreState,
    path,
    skipVariable,
    pageSizeVariable,
    limit,
    fetchMore,
  ]);

  const reset = useCallback(() => {
    setFetchMoreState({ loading: false, ended: false });
  }, []);

  return [
    fetchNext,
    {
      loading: fetchMoreState.loading,
      ended: fetchMoreState.ended,
    } as FetchMoreState,
    reset,
  ] as const;
}
