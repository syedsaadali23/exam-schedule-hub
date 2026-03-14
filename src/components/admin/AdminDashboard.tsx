import { useState } from "react";
import { FileSpreadsheet, Upload, Trash2, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExamType, EXAM_TYPES, EXAM_TYPE_LABELS, Semester } from "@/types/exam";
import { getActiveSemester, getExamSheetsBySemester, removeExamSheet } from "@/lib/store";
import { useDataRefresh } from "@/hooks/use-store-subscription";
import { useToast } from "@/hooks/use-toast";
import UploadSheetDialog from "./UploadSheetDialog";
import SemesterManager from "./SemesterManager";
import SettingsPanel from "./SettingsPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const examColors: Record<ExamType, { icon: string; bg: string }> = {
  mid1: { icon: "text-exam-mid1", bg: "bg-exam-mid1-bg" },
  mid2: { icon: "text-exam-mid2", bg: "bg-exam-mid2-bg" },
  final: { icon: "text-exam-final", bg: "bg-exam-final-bg" },
};

export default function AdminDashboard() {
  useDataRefresh();
  const activeSemester = getActiveSemester();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="semesters">Semesters</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <ActiveSemesterBanner semester={activeSemester} />
          {activeSemester && <SheetCards semester={activeSemester} />}
        </TabsContent>

        <TabsContent value="semesters" className="mt-4">
          <SemesterManager />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActiveSemesterBanner({ semester }: { semester: Semester | null }) {
  if (semester) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success-bg px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse-dot" />
        <span className="text-sm font-medium">Active: {semester.name}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-bg px-4 py-3">
      <span className="text-sm font-medium text-warning">No active semester — students will see nothing</span>
    </div>
  );
}

function SheetCards({ semester }: { semester: Semester }) {
  const sheets = getExamSheetsBySemester(semester.id);
  const [uploadType, setUploadType] = useState<ExamType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamType | null>(null);
  const { toast } = useToast();

  const handleDelete = () => {
    if (!deleteTarget) return;
    removeExamSheet(semester.id, deleteTarget);
    toast({ title: "Deleted", description: `${EXAM_TYPE_LABELS[deleteTarget]} schedule removed` });
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {EXAM_TYPES.map((type) => {
          const sheet = sheets.find((s) => s.examType === type);
          const colors = examColors[type];

          return (
            <Card key={type}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}>
                    <FileSpreadsheet className={`h-5 w-5 ${colors.icon}`} />
                  </div>
                  {sheet ? (
                    <Badge variant="outline" className="border-success/30 bg-success-bg text-success text-xs">
                      v{getExamSheetsBySemester(semester.id).filter((s) => s.examType === type).length > 0 ? "1" : "0"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-xs">Not Uploaded</Badge>
                  )}
                </div>
                <h3 className="font-semibold mb-1">{EXAM_TYPE_LABELS[type]}</h3>
                {sheet ? (
                  <div className="text-xs text-muted-foreground space-y-1 mb-3">
                    <p className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {sheet.courses.length} courses
                    </p>
                    <p className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {sheet.currentVersion}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mb-3">No schedule uploaded yet</p>
                )}
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setUploadType(type)}>
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    {sheet ? "Update" : "Upload"}
                  </Button>
                  {sheet && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(type)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {uploadType && (
        <UploadSheetDialog
          open={!!uploadType}
          onOpenChange={() => setUploadType(null)}
          semesterId={semester.id}
          examType={uploadType}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget ? EXAM_TYPE_LABELS[deleteTarget] : ""} schedule?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the schedule and all its version history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
