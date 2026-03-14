import { useState, useMemo } from "react";
import { Search, X, CheckSquare, Square, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Course } from "@/types/exam";

interface CourseSelectorProps {
  courses: Course[];
  selected: Set<string>;
  onToggle: (code: string) => void;
  onSelectAll: (codes: string[]) => void;
  onClearAll: () => void;
}

export default function CourseSelector({
  courses,
  selected,
  onToggle,
  onSelectAll,
  onClearAll,
}: CourseSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return courses;
    const q = search.toLowerCase();
    return courses.filter(
      (c) =>
        c.courseCode.toLowerCase().includes(q) ||
        c.courseName.toLowerCase().includes(q)
    );
  }, [courses, search]);

  const allCodes = courses.map((c) => c.courseCode);
  const allSelected = allCodes.length > 0 && allCodes.every((c) => selected.has(c));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (allSelected ? onClearAll() : onSelectAll(allCodes))}
        >
          {allSelected ? "Clear all" : "Select all"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {selected.size > 0
          ? `${selected.size} of ${courses.length} selected`
          : `${courses.length} courses — click to select yours`}
      </p>

      <div className="max-h-60 overflow-y-auto space-y-0.5 rounded-md border border-border">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No courses found</p>
        ) : (
          filtered.map((course) => {
            const isSelected = selected.has(course.courseCode);
            return (
              <button
                key={course.courseCode}
                onClick={() => onToggle(course.courseCode)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 ${
                  isSelected ? "bg-primary/5" : ""
                }`}
              >
                {isSelected ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Square className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="font-mono text-xs font-medium shrink-0 w-20">{course.courseCode}</span>
                <span className="truncate text-muted-foreground">{course.courseName}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
