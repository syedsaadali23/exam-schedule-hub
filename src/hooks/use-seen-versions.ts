import { useState, useEffect, useCallback } from "react";
import { ExamType } from "@/types/exam";

function storageKey(semesterId: string, examType: ExamType) {
  return `examdesk_seen_${semesterId}_${examType}`;
}

export function useSeenVersion(
  semesterId: string | undefined,
  examType: ExamType,
  currentVersion: string | undefined
) {
  const [lastSeenVersion, setLastSeenVersion] = useState<string | null>(null);
  const [hasChange, setHasChange] = useState(false);

  useEffect(() => {
    if (!semesterId || !currentVersion) {
      setHasChange(false);
      return;
    }
    const key = storageKey(semesterId, examType);
    const seen = localStorage.getItem(key);
    if (!seen) {
      // First visit — record silently
      localStorage.setItem(key, currentVersion);
      setLastSeenVersion(currentVersion);
      setHasChange(false);
    } else if (seen !== currentVersion) {
      setLastSeenVersion(seen);
      setHasChange(true);
    } else {
      setLastSeenVersion(seen);
      setHasChange(false);
    }
  }, [semesterId, examType, currentVersion]);

  const markAsSeen = useCallback(() => {
    if (!semesterId || !currentVersion) return;
    localStorage.setItem(storageKey(semesterId, examType), currentVersion);
    setLastSeenVersion(currentVersion);
    setHasChange(false);
  }, [semesterId, examType, currentVersion]);

  return { hasChange, lastSeenVersion, markAsSeen };
}
