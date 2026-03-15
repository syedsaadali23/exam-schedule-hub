// LocalStorage-based data store for ExamDesk
// This simulates a backend database using localStorage

import { Semester, ExamSheet, ExamSheetVersion, AdminSettings, SemesterType, ExamType, Course } from "@/types/exam";

const KEYS = {
  semesters: "examdesk_semesters",
  examSheets: "examdesk_sheets",
  examSheetVersions: "examdesk_versions",
  adminSettings: "examdesk_admin_settings",
  adminAuth: "examdesk_admin_auth",
};

function generateId(): string {
  return crypto.randomUUID();
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Event system for reactivity
type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

export function subscribe(key: string, listener: Listener): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(listener);
  return () => listeners.get(key)?.delete(listener);
}

export function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

// ---- Admin ----

export function verifyAdminPassword(password: string): boolean {
  const settings = load<AdminSettings | null>(KEYS.adminSettings, null);
  const storedPassword = settings?.password ?? "examdesk2025";
  return password === storedPassword;
}

export function updateAdminPassword(currentPassword: string, newPassword: string): boolean {
  if (!verifyAdminPassword(currentPassword)) return false;
  if (newPassword.length < 6) return false;
  save(KEYS.adminSettings, { password: newPassword });
  return true;
}

export function isAdminLoggedIn(): boolean {
  return localStorage.getItem(KEYS.adminAuth) === "true";
}

export function setAdminLoggedIn(value: boolean): void {
  if (value) {
    localStorage.setItem(KEYS.adminAuth, "true");
  } else {
    localStorage.removeItem(KEYS.adminAuth);
  }
}

// ---- Semesters ----

export function getSemesters(): Semester[] {
  return load<Semester[]>(KEYS.semesters, []).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return a.semesterType === "Fall" ? -1 : 1;
  });
}

export function getActiveSemester(): Semester | null {
  return getSemesters().find((s) => s.isActive) ?? null;
}

export function createSemester(semesterType: SemesterType, year: number): Semester {
  const semesters = getSemesters();
  const exists = semesters.some((s) => s.semesterType === semesterType && s.year === year);
  if (exists) throw new Error(`${semesterType} ${year} already exists`);

  const semester: Semester = {
    id: generateId(),
    name: `${semesterType} ${year}`,
    semesterType,
    year,
    isActive: false,
  };
  semesters.push(semester);
  save(KEYS.semesters, semesters);
  notify(KEYS.semesters);
  return semester;
}

export function setActiveSemester(id: string): void {
  const semesters = getSemesters();
  semesters.forEach((s) => (s.isActive = s.id === id));
  save(KEYS.semesters, semesters);
  notify(KEYS.semesters);
}

export function deactivateSemester(id: string): void {
  const semesters = getSemesters();
  const sem = semesters.find((s) => s.id === id);
  if (sem) sem.isActive = false;
  save(KEYS.semesters, semesters);
  notify(KEYS.semesters);
}

export function removeSemester(id: string): void {
  const semesters = getSemesters();
  const sem = semesters.find((s) => s.id === id);
  if (!sem) throw new Error("Semester not found");
  if (sem.isActive) throw new Error("Cannot delete active semester. Deactivate first.");

  // Cascade delete sheets and versions
  const sheets = getExamSheetsBySemester(id);
  const versions = load<ExamSheetVersion[]>(KEYS.examSheetVersions, []);
  const sheetIds = new Set(sheets.map((s) => s.id));
  const remainingVersions = versions.filter((v) => !sheetIds.has(v.examSheetId));
  save(KEYS.examSheetVersions, remainingVersions);

  const allSheets = load<ExamSheet[]>(KEYS.examSheets, []);
  save(KEYS.examSheets, allSheets.filter((s) => s.semesterId !== id));

  save(KEYS.semesters, semesters.filter((s) => s.id !== id));
  notify(KEYS.semesters);
  notify(KEYS.examSheets);
}

// ---- Exam Sheets ----

export function getExamSheetsBySemester(semesterId: string): ExamSheet[] {
  return load<ExamSheet[]>(KEYS.examSheets, []).filter((s) => s.semesterId === semesterId);
}

export function getExamSheetByType(semesterId: string, examType: ExamType): ExamSheet | null {
  return load<ExamSheet[]>(KEYS.examSheets, []).find(
    (s) => s.semesterId === semesterId && s.examType === examType
  ) ?? null;
}

export function getVersionHistory(examSheetId: string): ExamSheetVersion[] {
  return load<ExamSheetVersion[]>(KEYS.examSheetVersions, [])
    .filter((v) => v.examSheetId === examSheetId)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

export function upsertExamSheet(
  semesterId: string,
  examType: ExamType,
  courses: Course[],
  versionString: string
): ExamSheet {
  const allSheets = load<ExamSheet[]>(KEYS.examSheets, []);
  const existingIdx = allSheets.findIndex(
    (s) => s.semesterId === semesterId && s.examType === examType
  );

  if (existingIdx >= 0) {
    // Archive old version
    const old = allSheets[existingIdx];
    const versions = load<ExamSheetVersion[]>(KEYS.examSheetVersions, []);
    versions.push({
      ...old,
      examSheetId: old.id,
    });
    save(KEYS.examSheetVersions, versions);

    // Update
    allSheets[existingIdx] = {
      ...old,
      courses,
      currentVersion: versionString,
      uploadedAt: new Date().toISOString(),
    };
    save(KEYS.examSheets, allSheets);
    notify(KEYS.examSheets);
    return allSheets[existingIdx];
  }

  // Create new
  const sheet: ExamSheet = {
    id: generateId(),
    semesterId,
    examType,
    currentVersion: versionString,
    uploadedAt: new Date().toISOString(),
    courses,
  };
  allSheets.push(sheet);
  save(KEYS.examSheets, allSheets);
  notify(KEYS.examSheets);
  return sheet;
}

export function removeExamSheet(semesterId: string, examType: ExamType): void {
  const allSheets = load<ExamSheet[]>(KEYS.examSheets, []);
  const sheet = allSheets.find((s) => s.semesterId === semesterId && s.examType === examType);
  if (!sheet) return;

  // Remove versions
  const versions = load<ExamSheetVersion[]>(KEYS.examSheetVersions, []);
  save(KEYS.examSheetVersions, versions.filter((v) => v.examSheetId !== sheet.id));

  save(KEYS.examSheets, allSheets.filter((s) => s.id !== sheet.id));
  notify(KEYS.examSheets);
}
