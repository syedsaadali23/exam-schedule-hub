// Database layer using Supabase for persistent storage
import { supabase } from "@/integrations/supabase/client";
import { Semester, ExamSheet, ExamSheetVersion, ExamType, SemesterType, Course } from "@/types/exam";

// ---- Semesters ----

export async function getSemesters(): Promise<Semester[]> {
  const { data, error } = await supabase
    .from("semesters")
    .select("*")
    .order("year", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    semesterType: row.semester_type as SemesterType,
    year: row.year,
    isActive: row.is_active,
  }));
}

export async function getActiveSemester(): Promise<Semester | null> {
  const { data, error } = await supabase
    .from("semesters")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    semesterType: data.semester_type as SemesterType,
    year: data.year,
    isActive: data.is_active,
  };
}

export async function createSemester(semesterType: SemesterType, year: number): Promise<Semester> {
  const name = `${semesterType} ${year}`;
  const { data, error } = await supabase
    .from("semesters")
    .insert({ name, semester_type: semesterType, year, is_active: false })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") throw new Error(`${semesterType} ${year} already exists`);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    semesterType: data.semester_type as SemesterType,
    year: data.year,
    isActive: data.is_active,
  };
}

export async function setActiveSemester(id: string): Promise<void> {
  // Deactivate all first
  await supabase.from("semesters").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  // Activate the selected one
  const { error } = await supabase.from("semesters").update({ is_active: true }).eq("id", id);
  if (error) throw error;
}

export async function deactivateSemester(id: string): Promise<void> {
  const { error } = await supabase.from("semesters").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

export async function removeSemester(id: string): Promise<void> {
  // Check if active
  const { data: sem } = await supabase.from("semesters").select("is_active").eq("id", id).single();
  if (sem?.is_active) throw new Error("Cannot delete active semester. Deactivate first.");

  const { error } = await supabase.from("semesters").delete().eq("id", id);
  if (error) throw error;
}

// ---- Exam Sheets ----

export async function getExamSheetsBySemester(semesterId: string): Promise<ExamSheet[]> {
  const { data, error } = await supabase
    .from("exam_sheets")
    .select("*")
    .eq("semester_id", semesterId);

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    semesterId: row.semester_id,
    examType: row.exam_type as ExamType,
    currentVersion: row.current_version,
    uploadedAt: row.uploaded_at,
    courses: (row.courses as unknown as Course[]) || [],
  }));
}

export async function getExamSheetByType(semesterId: string, examType: ExamType): Promise<ExamSheet | null> {
  const { data, error } = await supabase
    .from("exam_sheets")
    .select("*")
    .eq("semester_id", semesterId)
    .eq("exam_type", examType)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    semesterId: data.semester_id,
    examType: data.exam_type as ExamType,
    currentVersion: data.current_version,
    uploadedAt: data.uploaded_at,
    courses: (data.courses as unknown as Course[]) || [],
  };
}

export async function getVersionHistory(examSheetId: string): Promise<ExamSheetVersion[]> {
  const { data, error } = await supabase
    .from("exam_sheet_versions")
    .select("*")
    .eq("exam_sheet_id", examSheetId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    examSheetId: row.exam_sheet_id,
    semesterId: row.semester_id,
    examType: row.exam_type as ExamType,
    currentVersion: row.current_version,
    uploadedAt: row.uploaded_at,
    courses: (row.courses as unknown as Course[]) || [],
  }));
}

export async function upsertExamSheet(
  semesterId: string,
  examType: ExamType,
  courses: Course[],
  versionString: string
): Promise<ExamSheet> {
  // Check if exists
  const existing = await getExamSheetByType(semesterId, examType);

  if (existing) {
    // Archive old version
    await supabase.from("exam_sheet_versions").insert({
      exam_sheet_id: existing.id,
      semester_id: existing.semesterId,
      exam_type: existing.examType,
      current_version: existing.currentVersion,
      uploaded_at: existing.uploadedAt,
      courses: existing.courses as unknown as Record<string, unknown>[],
    });

    // Update
    const { data, error } = await supabase
      .from("exam_sheets")
      .update({
        courses: courses as unknown as Record<string, unknown>[],
        current_version: versionString,
        uploaded_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      semesterId: data.semester_id,
      examType: data.exam_type as ExamType,
      currentVersion: data.current_version,
      uploadedAt: data.uploaded_at,
      courses: (data.courses as unknown as Course[]) || [],
    };
  }

  // Create new
  const { data, error } = await supabase
    .from("exam_sheets")
    .insert({
      semester_id: semesterId,
      exam_type: examType,
      current_version: versionString,
      courses: courses as unknown as Record<string, unknown>[],
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    semesterId: data.semester_id,
    examType: data.exam_type as ExamType,
    currentVersion: data.current_version,
    uploadedAt: data.uploaded_at,
    courses: (data.courses as unknown as Course[]) || [],
  };
}

export async function removeExamSheet(semesterId: string, examType: ExamType): Promise<void> {
  const { error } = await supabase
    .from("exam_sheets")
    .delete()
    .eq("semester_id", semesterId)
    .eq("exam_type", examType);

  if (error) throw error;
}

// ---- Admin ----

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("verify_admin_password", {
    input_password: password,
  });
  if (error) throw error;
  return data === true;
}

export async function updateAdminPassword(currentPassword: string, newPassword: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("update_admin_password", {
    current_pw: currentPassword,
    new_pw: newPassword,
  });
  if (error) throw error;
  return data === true;
}
