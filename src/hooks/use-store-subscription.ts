import { useState, useEffect, useCallback } from "react";
import { subscribe } from "@/lib/store";

// Hook to re-render when a store key changes
export function useStoreSubscription(key: string) {
  const [, setTick] = useState(0);
  useEffect(() => {
    return subscribe(key, () => setTick((t) => t + 1));
  }, [key]);
}

// Convenience hook that subscribes to both semesters and sheets
export function useDataRefresh() {
  useStoreSubscription("examdesk_semesters");
  useStoreSubscription("examdesk_sheets");
}
