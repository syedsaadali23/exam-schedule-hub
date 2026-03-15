import { useState, useCallback, useEffect } from "react";
import { ExamType } from "@/types/exam";
import { subscribe, notify as storeNotify } from "@/lib/store";

function storageKey(semesterId: string, examType: ExamType) {
  return `examdesk_courses_${semesterId}_${examType}`;
}

const SELECTIONS_KEY = "examdesk_selections";

export function useSelectedCourses(semesterId: string | undefined, examType: ExamType) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Load from localStorage on mount and when notified of changes
  const loadFromStorage = useCallback(() => {
    if (!semesterId) return;
    try {
      const raw = localStorage.getItem(storageKey(semesterId, examType));
      if (raw) setSelected(new Set(JSON.parse(raw)));
      else setSelected(new Set());
    } catch {
      setSelected(new Set());
    }
  }, [semesterId, examType]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Subscribe to selection changes from other hook instances
  useEffect(() => {
    return subscribe(SELECTIONS_KEY, loadFromStorage);
  }, [loadFromStorage]);

  const persist = useCallback(
    (next: Set<string>) => {
      if (!semesterId) return;
      localStorage.setItem(storageKey(semesterId, examType), JSON.stringify([...next]));
      setSelected(next);
      storeNotify(SELECTIONS_KEY);
    },
    [semesterId, examType]
  );

  const toggle = useCallback(
    (code: string) => {
      const next = new Set(selected);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      persist(next);
    },
    [selected, persist]
  );

  const selectAll = useCallback(
    (codes: string[]) => persist(new Set(codes)),
    [persist]
  );

  const clearAll = useCallback(() => {
    if (semesterId) localStorage.removeItem(storageKey(semesterId, examType));
    setSelected(new Set());
    storeNotify(SELECTIONS_KEY);
  }, [semesterId, examType]);

  return { selected, toggle, selectAll, clearAll };
}
