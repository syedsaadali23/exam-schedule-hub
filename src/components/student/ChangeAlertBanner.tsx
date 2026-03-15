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
  return (
    <div className="rounded-lg border border-warning/30 bg-warning-bg p-4 space-y-3">
      <div className="flex items-center gap-2 text-warning">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">
          Schedule updated{lastSeenVersion ? ` ${lastSeenVersion} → ${currentVersion}` : ""}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">Please review your selected courses for any changes.</p>
      <Button size="sm" variant="outline" onClick={onDismiss}>Got it</Button>
    </div>
  );
}
