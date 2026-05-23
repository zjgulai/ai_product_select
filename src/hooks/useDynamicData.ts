import { useMemo } from "react";
import { trpc } from "@/providers/trpc";

/**
 * Universal data hook: fetch dynamic data by key from the database.
 * Falls back to mock data if no data is uploaded yet.
 */
export function useDynamicData(dataKey: string, mockData?: any[]) {
  const { data, isLoading, error } = trpc.dataManager.dynamic.queryByKey.useQuery(
    { dataKey },
    { staleTime: 5 * 60 * 1000 } // 5min cache
  );

  // Use DB data if available, otherwise fallback to mock
  const records = useMemo(() => {
    if (data && data.length > 0) return data;
    return mockData ?? [];
  }, [data, mockData]);

  const hasRealData = !!(data && data.length > 0);

  return { records, isLoading, error, hasRealData, dataKey };
}

/**
 * Check which data keys have real data uploaded
 */
export function useActiveDataKeys() {
  return trpc.dataManager.dynamic.getActiveKeys.useQuery(
    undefined,
    { staleTime: 30 * 1000 }
  );
}
