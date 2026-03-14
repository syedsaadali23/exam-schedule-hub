import { useMemo } from "react";
import {
  Calendar,
  Download,
  Printer,
  AlertTriangle,
  Zap,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ExamType,
  ExamSheet,
  TimetableEntry,
  ClashPair,
  EXAM_TYPES,
  EXAM_TYPE_LABELS,
  EXAM_TYPE_SHORT,
} from "@/types/exam";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const examBadgeColors: Record<ExamType, string> = {
  mid1: "bg-exam-mid1-bg text-exam-mid1 border-exam-mid1/20",
  mid2: "bg-exam-mid2-bg text-exam-mid2 border-exam-mid2/20",
  final: "bg-exam-final-bg text-exam-final border-exam-final/20",
};

function computeClashes(entries: TimetableEntry[]): ClashPair[] {
  const clashes: ClashPair[] = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (entries[i].date === entries[j].date && entries[i].timeSlot === entries[j].timeSlot) {
        clashes.push({ a: entries[i], b: entries[j] });
      }
    }
  }
  return clashes;
}

function entryKey(e: TimetableEntry) {
  return `${e.examType}|${e.courseCode}`;
}

interface TimetableViewProps {
  sheets: ExamSheet[];
  selections: Record<ExamType, Set<string>>;
  semesterName: string;
}

export default function TimetableView({
  sheets,
  selections,
  semesterName,
}: TimetableViewProps) {
  const allEntries = useMemo(() => {
    const entries: TimetableEntry[] = [];
    sheets.forEach((sheet) => {
      const sel = selections[sheet.examType];
      if (!sel) return;
      sheet.courses.forEach((c) => {
        if (sel.has(c.courseCode)) {
          entries.push({ ...c, examType: sheet.examType });
        }
      });
    });
    return entries;
  }, [sheets, selections]);

  const clashes = useMemo(() => computeClashes(allEntries), [allEntries]);
  const clashKeys = useMemo(() => {
    const set = new Set<string>();
    clashes.forEach(({ a, b }) => {
      set.add(entryKey(a));
      set.add(entryKey(b));
    });
    return set;
  }, [clashes]);

  if (allEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Calendar className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm">No courses selected yet</p>
        <p className="text-xs mt-1">Select courses from the Exam Schedules tab</p>
      </div>
    );
  }

  const entriesByType: Record<ExamType, TimetableEntry[]> = {
    mid1: allEntries.filter((e) => e.examType === "mid1"),
    mid2: allEntries.filter((e) => e.examType === "mid2"),
    final: allEntries.filter((e) => e.examType === "final"),
  };

  return (
    <div className="space-y-4">
      {clashes.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-semibold">{clashes.length} Time Clash{clashes.length > 1 ? "es" : ""} Detected</span>
          </div>
          <div className="space-y-1">
            {clashes.map(({ a, b }, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                <span className="font-mono font-medium">{a.courseCode}</span> vs{" "}
                <span className="font-mono font-medium">{b.courseCode}</span> · {a.day}, {a.date} · {a.timeSlot}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5 mr-1" />
          Print All
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({allEntries.length})</TabsTrigger>
          {EXAM_TYPES.map((t) => (
            <TabsTrigger key={t} value={t}>
              {EXAM_TYPE_SHORT[t]} ({entriesByType[t].length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <EntriesList entries={allEntries} clashKeys={clashKeys} />
        </TabsContent>
        {EXAM_TYPES.map((t) => (
          <TabsContent key={t} value={t} className="mt-4">
            <div className="flex justify-end mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPDF(entriesByType[t], t, semesterName)}
                disabled={entriesByType[t].length === 0}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download PDF
              </Button>
            </div>
            <EntriesList entries={entriesByType[t]} clashKeys={clashKeys} />
          </TabsContent>
        ))}
      </Tabs>

      {/* Print-only content */}
      <div className="hidden print-visible">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">ExamDesk — Personal Timetable</h2>
          <p className="text-sm text-muted-foreground">{semesterName} · {allEntries.length} courses</p>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Course selections are saved locally in your browser
        </p>
      </div>
    </div>
  );
}

function EntriesList({
  entries,
  clashKeys,
}: {
  entries: TimetableEntry[];
  clashKeys: Set<string>;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, TimetableEntry[]>();
    entries.forEach((e) => {
      const group = map.get(e.date) ?? [];
      group.push(e);
      map.set(e.date, group);
    });
    // Sort groups by date (simple string comparison works for most date formats)
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [entries]);

  if (entries.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No courses in this section</p>;
  }

  return (
    <div className="space-y-4">
      {grouped.map(([date, groupEntries]) => {
        const hasClash = groupEntries.some((e) => clashKeys.has(entryKey(e)));
        const sorted = [...groupEntries].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
        return (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className={`h-4 w-4 ${hasClash ? "text-destructive" : "text-muted-foreground"}`} />
              <span className="text-sm font-medium">{date}</span>
              {sorted[0]?.day && (
                <span className="text-xs text-muted-foreground">({sorted[0].day})</span>
              )}
            </div>
            <div className="space-y-1.5 ml-6">
              {sorted.map((entry) => {
                const isClash = clashKeys.has(entryKey(entry));
                return (
                  <div
                    key={entryKey(entry)}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                      isClash
                        ? "border-destructive/30 bg-destructive/5 text-destructive"
                        : "border-border"
                    }`}
                  >
                    <Badge variant="outline" className={`text-xs shrink-0 ${examBadgeColors[entry.examType]}`}>
                      {EXAM_TYPE_SHORT[entry.examType]}
                    </Badge>
                    <span className="font-mono text-xs font-medium shrink-0">{entry.courseCode}</span>
                    <span className="truncate text-muted-foreground">{entry.courseName}</span>
                    <div className="ml-auto flex items-center gap-2 shrink-0">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{entry.timeSlot}</span>
                      {isClash && (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">Clash</Badge>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function downloadPDF(entries: TimetableEntry[], examType: ExamType, semesterName: string) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(30, 41, 55);
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("ExamDesk", 14, 15);
  doc.setFontSize(10);
  doc.text(`${semesterName} — ${EXAM_TYPE_LABELS[examType]}`, 14, 23);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 42,
    head: [["#", "Course Code", "Subject Name", "Date", "Day", "Time"]],
    body: entries.map((e, i) => [i + 1, e.courseCode, e.courseName, e.date, e.day, e.timeSlot]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 41, 55] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${data.pageNumber} of ${pageCount}`, 105, 290, { align: "center" });
    },
  });

  const fileName = `${semesterName}-${EXAM_TYPE_LABELS[examType]}`.replace(/\s+/g, "-");
  doc.save(`${fileName}.pdf`);
}
