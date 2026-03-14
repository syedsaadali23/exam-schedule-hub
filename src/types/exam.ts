// Types for ExamDesk application

export type ExamType = "mid1" | "mid2" | "final";
export type SemesterType = "Fall" | "Spring";

export interface Course {
  courseCode: string;
  courseName: string;
  date: string;
  day: string;
  timeSlot: string;
}

export interface ExamSheet {
  id: string;
  semesterId: string;
  examType: ExamType;
  currentVersion: string;
  uploadedAt: string;
  courses: Course[];
  parsedSemesterName?: string;
}

export interface ExamSheetVersion extends ExamSheet {
  examSheetId: string;
}

export interface Semester {
  id: string;
  name: string;
  semesterType: SemesterType;
  year: number;
  isActive: boolean;
}

export interface AdminSettings {
  password: string;
}

export interface TimetableEntry extends Course {
  examType: ExamType;
}

export interface ClashPair {
  a: TimetableEntry;
  b: TimetableEntry;
}

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  mid1: "Midterm 1",
  mid2: "Midterm 2",
  final: "Final",
};

export const EXAM_TYPE_SHORT: Record<ExamType, string> = {
  mid1: "Mid 1",
  mid2: "Mid 2",
  final: "Final",
};

export const EXAM_TYPES: ExamType[] = ["mid1", "mid2", "final"];
