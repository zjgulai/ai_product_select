import { useMemo, useRef } from "react";
import { trpc } from "@/providers/trpc";

export function useBatchDynamicData(
  requests: { dataKey: string; mockData?: unknown[] }[]
) {
  const utils = trpc.useUtils();

  const requestsRef = useRef(requests);
  requestsRef.current = requests;

  const queryResults = trpc.useQueries((t) =>
    requests.map((req) =>
      t.dataManager.dynamic.queryByKey(
        { dataKey: req.dataKey },
        { staleTime: 5 * 60 * 1000 }
      )
    )
  );

  const results = useMemo(() => {
    const map: Record<
      string,
      { records: unknown[]; isLoading: boolean; hasRealData: boolean; dataKey: string }
    > = {};

    requestsRef.current.forEach((req, i) => {
      const q = queryResults[i];
      const data = q.data as unknown[] | undefined;
      const hasRealData = !!(data && data.length > 0);
      map[req.dataKey] = {
        records: hasRealData ? data! : req.mockData ?? [],
        isLoading: q.isLoading,
        hasRealData,
        dataKey: req.dataKey,
      };
    });

    return map;
  }, [queryResults]);

  const anyLoading = queryResults.some((q) => q.isLoading);
  const anyRealData = Object.values(results).some((r) => r.hasRealData);

  return { results, anyLoading, anyRealData, invalidateAll: () => utils.dataManager.dynamic.queryByKey.invalidate() };
}
