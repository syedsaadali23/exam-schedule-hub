import { useState } from "react";
import { FileSpreadsheet, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExamSheet, ExamType, EXAM_TYPE_LABELS } from "@/types/exam";
import { useSelectedCourses } from "@/hooks/use-selected-courses";
import { useSeenVersion } from "@/hooks/use-seen-versions";
import CourseSelector from "./CourseSelector";
import ChangeAlertBanner from "./ChangeAlertBanner";
import { motion, AnimatePresence } from "framer-motion";

const examColors: Record<ExamType, { icon: string; bg: string; border: string }> = {
  mid1: { icon: "text-exam-mid1", bg: "bg-exam-mid1-bg", border: "border-exam-mid1/20" },
  mid2: { icon: "text-exam-mid2", bg: "bg-exam-mid2-bg", border: "border-exam-mid2/20" },
  final: { icon: "text-exam-final", bg: "bg-exam-final-bg", border: "border-exam-final/20" },
};

interface ExamScheduleSectionProps {
  sheets: ExamSheet[];
  semesterId: string;
}

export default function ExamScheduleSection({ sheets, semesterId }: ExamScheduleSectionProps) {
  return (
    <div className="space-y-4">
      {(["mid1", "mid2", "final"] as ExamType[]).map((type) => {
        const sheet = sheets.find((s) => s.examType === type);
        return (
          <ExamTypeCard
            key={type}
            examType={type}
            sheet={sheet ?? null}
            semesterId={semesterId}
          />
        );
      })}
    </div>
  );
}

function ExamTypeCard({
  examType,
  sheet,
  semesterId,
}: {
  examType: ExamType;
  sheet: ExamSheet | null;
  semesterId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { selected, toggle, selectAll, clearAll } = useSelectedCourses(semesterId, examType);
  const { hasChange, lastSeenVersion, markAsSeen } = useSeenVersion(
    semesterId,
    examType,
    sheet?.currentVersion
  );
  const colors = examColors[examType];

  return (
    <Card className={sheet ? "" : "opacity-60"}>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}>
              <FileSpreadsheet className={`h-5 w-5 ${colors.icon}`} />
            </div>
            <div>
              <h3 className="font-semibold">{EXAM_TYPE_LABELS[examType]}</h3>
              {sheet ? (
                <p className="text-xs text-muted-foreground">
                  {sheet.courses.length} courses · {selected.size} selected
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Not released yet</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sheet && (
              <Badge variant="outline" className="text-xs">
                {sheet.currentVersion}
              </Badge>
            )}
            {hasChange && (
              <Badge variant="outline" className="border-warning/30 bg-warning-bg text-warning text-xs">
                Updated
              </Badge>
            )}
            {!sheet ? (
              <Badge variant="outline" className="text-xs text-muted-foreground">Not Released</Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>Done <ChevronUp className="h-3.5 w-3.5 ml-1" /></>
                ) : (
                  <>{selected.size > 0 ? "Edit" : "Select"} <ChevronDown className="h-3.5 w-3.5 ml-1" /></>
                )}
              </Button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {expanded && sheet && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {hasChange && (
                <div className="mb-3">
                  <ChangeAlertBanner
                    examSheetId={sheet.id}
                    lastSeenVersion={lastSeenVersion}
                    currentVersion={sheet.currentVersion}
                    selectedCodes={selected}
                    currentCourses={sheet.courses}
                    onDismiss={markAsSeen}
                  />
                </div>
              )}
              <CourseSelector
                courses={sheet.courses}
                selected={selected}
                onToggle={toggle}
                onSelectAll={selectAll}
                onClearAll={clearAll}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
