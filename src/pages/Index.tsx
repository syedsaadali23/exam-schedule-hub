import { GraduationCap, Calendar, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamType } from "@/types/exam";
import { useActiveSemester, useExamSheets } from "@/hooks/use-db";
import { useSelectedCourses } from "@/hooks/use-selected-courses";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ExamScheduleSection from "@/components/student/ExamScheduleSection";
import TimetableView from "@/components/student/TimetableView";
import { motion } from "framer-motion";

export default function Index() {
  const { data: activeSemester, isLoading } = useActiveSemester();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary text-primary-foreground py-12 sm:py-16 print-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-5xl px-4 text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-sm mb-4">
              <GraduationCap className="h-4 w-4" />
              ExamDesk
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Your Personal Exam Timetable
            </h1>
            <p className="text-primary-foreground/70 max-w-lg mx-auto">
              Select your courses, view your personalized schedule, detect time clashes, and download PDFs.
            </p>
          </motion.div>
        </section>

        {/* Content */}
        <div className="mx-auto max-w-5xl px-4 py-8">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : !activeSemester ? (
            <NoActiveSemester />
          ) : (
            <ActiveSemesterContent semesterId={activeSemester.id} semesterName={activeSemester.name} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function NoActiveSemester() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Calendar className="h-16 w-16 mb-4 opacity-30" />
      <h2 className="text-xl font-semibold text-foreground mb-2">No Active Semester</h2>
      <p className="text-sm">The admin hasn't activated a semester yet. Check back later.</p>
    </div>
  );
}

function ActiveSemesterContent({
  semesterId,
  semesterName,
}: {
  semesterId: string;
  semesterName: string;
}) {
  const { data: sheets = [], isLoading } = useExamSheets(semesterId);

  const mid1Sel = useSelectedCourses(semesterId, "mid1");
  const mid2Sel = useSelectedCourses(semesterId, "mid2");
  const finalSel = useSelectedCourses(semesterId, "final");

  const selections: Record<ExamType, Set<string>> = {
    mid1: mid1Sel.selected,
    mid2: mid2Sel.selected,
    final: finalSel.selected,
  };

  const totalSelected = mid1Sel.selected.size + mid2Sel.selected.size + finalSel.selected.size;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold">{semesterName}</h2>
        <Badge variant="outline" className="border-success/30 bg-success-bg text-success text-xs">
          Active Semester
        </Badge>
      </div>

      <Tabs defaultValue="schedules">
        <TabsList>
          <TabsTrigger value="schedules">
            <BookOpen className="h-4 w-4 mr-1.5" />
            Exam Schedules
          </TabsTrigger>
          <TabsTrigger value="timetable">
            <Calendar className="h-4 w-4 mr-1.5" />
            My Timetable
            {totalSelected > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                {totalSelected}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="mt-4">
          <ExamScheduleSection sheets={sheets} semesterId={semesterId} />
        </TabsContent>

        <TabsContent value="timetable" className="mt-4">
          <TimetableView
            sheets={sheets}
            selections={selections}
            semesterName={semesterName}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
