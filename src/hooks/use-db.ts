// React Query hooks for database operations
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as db from "@/lib/db";
import { ExamType, SemesterType } from "@/types/exam";

export function useSemesters() {
  return useQuery({
    queryKey: ["semesters"],
    queryFn: db.getSemesters,
  });
}

export function useActiveSemester() {
  return useQuery({
    queryKey: ["activeSemester"],
    queryFn: db.getActiveSemester,
  });
}

export function useExamSheets(semesterId: string | undefined) {
  return useQuery({
    queryKey: ["examSheets", semesterId],
    queryFn: () => db.getExamSheetsBySemester(semesterId!),
    enabled: !!semesterId,
  });
}

export function useExamSheetByType(semesterId: string | undefined, examType: ExamType) {
  return useQuery({
    queryKey: ["examSheet", semesterId, examType],
    queryFn: () => db.getExamSheetByType(semesterId!, examType),
    enabled: !!semesterId,
  });
}

export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["semesters"] });
    qc.invalidateQueries({ queryKey: ["activeSemester"] });
    qc.invalidateQueries({ queryKey: ["examSheets"] });
    qc.invalidateQueries({ queryKey: ["examSheet"] });
  };
}

export function useCreateSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ semesterType, year }: { semesterType: SemesterType; year: number }) =>
      db.createSemester(semesterType, year),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
}

export function useSetActiveSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.setActiveSemester(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["semesters"] });
      qc.invalidateQueries({ queryKey: ["activeSemester"] });
    },
  });
}

export function useDeactivateSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deactivateSemester(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["semesters"] });
      qc.invalidateQueries({ queryKey: ["activeSemester"] });
    },
  });
}

export function useRemoveSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.removeSemester(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["semesters"] });
      qc.invalidateQueries({ queryKey: ["activeSemester"] });
    },
  });
}

export function useUpsertExamSheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      semesterId,
      examType,
      courses,
      versionString,
    }: {
      semesterId: string;
      examType: ExamType;
      courses: any[];
      versionString: string;
    }) => db.upsertExamSheet(semesterId, examType, courses, versionString),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["examSheets"] });
      qc.invalidateQueries({ queryKey: ["examSheet"] });
    },
  });
}

export function useRemoveExamSheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ semesterId, examType }: { semesterId: string; examType: ExamType }) =>
      db.removeExamSheet(semesterId, examType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["examSheets"] });
      qc.invalidateQueries({ queryKey: ["examSheet"] });
    },
  });
}
