import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Course } from "@/types/exam";

interface ChangeAlertBannerProps {
  examSheetId: string;
  lastSeenVersion: string | null;
  currentVersion: string;
  selectedCodes: Set<string>;
  currentCourses: Course[];
  onDismiss: () => void;
}

interface ChangeItem {
  courseCode: string;
  type: "removed" | "date_changed" | "time_changed" | "both_changed";
  oldDate?: string;
  newDate?: string;
  oldTime?: string;
  newTime?: string;
}

export default function ChangeAlertBanner({
  examSheetId,
  lastSeenVersion,
  currentVersion,
  selectedCodes,
  currentCourses,
  onDismiss,
}: ChangeAlertBannerProps) {
  // Version history is loaded async - for now show simple banner
  // TODO: Could use a React Query hook for version history
  const versions: any[] = [];

  if (!lastSeenVersion || selectedCodes.size === 0) {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning-bg p-4 space-y-3">
        <div className="flex items-center gap-2 text-warning">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Schedule updated</span>
        </div>
        <p className="text-xs text-muted-foreground">Please review your selected courses.</p>
        <Button size="sm" variant="outline" onClick={onDismiss}>Got it</Button>
      </div>
    );
  }

  const oldVersion = versions.find((v) => v.currentVersion === lastSeenVersion);

  if (!oldVersion) {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning-bg p-4 space-y-3">
        <div className="flex items-center gap-2 text-warning">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Schedule updated {lastSeenVersion} → {currentVersion}</span>
        </div>
        <p className="text-xs text-muted-foreground">Review your courses for any changes.</p>
        <Button size="sm" variant="outline" onClick={onDismiss}>Got it</Button>
      </div>
    );
  }

  // Compare selected courses
  const oldCourseMap = new Map(oldVersion.courses.map((c) => [c.courseCode, c]));
  const newCourseMap = new Map(currentCourses.map((c) => [c.courseCode, c]));

  const changes: ChangeItem[] = [];
  selectedCodes.forEach((code) => {
    const oldC = oldCourseMap.get(code);
    const newC = newCourseMap.get(code);

    if (oldC && !newC) {
      changes.push({ courseCode: code, type: "removed" });
    } else if (oldC && newC) {
      const dateChanged = oldC.date !== newC.date;
      const timeChanged = oldC.timeSlot !== newC.timeSlot;
      if (dateChanged && timeChanged) {
        changes.push({ courseCode: code, type: "both_changed", oldDate: oldC.date, newDate: newC.date, oldTime: oldC.timeSlot, newTime: newC.timeSlot });
      } else if (dateChanged) {
        changes.push({ courseCode: code, type: "date_changed", oldDate: oldC.date, newDate: newC.date });
      } else if (timeChanged) {
        changes.push({ courseCode: code, type: "time_changed", oldTime: oldC.timeSlot, newTime: newC.timeSlot });
      }
    }
  });

  return (
    <div className="rounded-lg border border-warning/30 bg-warning-bg p-4 space-y-3">
      <div className="flex items-center gap-2 text-warning">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">Schedule updated {lastSeenVersion} → {currentVersion}</span>
      </div>

      {changes.length === 0 ? (
        <p className="text-xs text-muted-foreground">None of your selected courses were affected.</p>
      ) : (
        <div className="space-y-2">
          {changes.map((ch) => (
            <div key={ch.courseCode} className="text-xs">
              <span className="font-mono font-medium">{ch.courseCode}</span>
              {ch.type === "removed" && (
                <span className="ml-2 text-destructive">Removed from this schedule</span>
              )}
              {ch.type === "date_changed" && (
                <span className="ml-2">
                  <s className="text-muted-foreground">{ch.oldDate}</s> → <span className="font-medium">{ch.newDate}</span>
                </span>
              )}
              {ch.type === "time_changed" && (
                <span className="ml-2">
                  <s className="text-muted-foreground">{ch.oldTime}</s> → <span className="font-medium">{ch.newTime}</span>
                </span>
              )}
              {ch.type === "both_changed" && (
                <span className="ml-2">
                  <s className="text-muted-foreground">{ch.oldDate} {ch.oldTime}</s> → <span className="font-medium">{ch.newDate} {ch.newTime}</span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <Button size="sm" variant="outline" onClick={onDismiss}>Got it</Button>
    </div>
  );
}
