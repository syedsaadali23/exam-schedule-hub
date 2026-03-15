import { useState, useCallback, useRef, memo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Save } from "lucide-react";
import { ExamType, Course, EXAM_TYPE_LABELS } from "@/types/exam";
import { useUpsertExamSheet, useExamSheetByType } from "@/hooks/use-db";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import * as XLSX from "xlsx";

const ROWS = 200;
const COLS = 5;
const COL_HEADERS = ["Course Code", "Day", "Date", "Time", "Subject Name"];

type GridData = string[][];

function createEmptyGrid(): GridData {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(""));
}

interface UploadSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterId: string;
  examType: ExamType;
}

const GridRow = memo(function GridRow({
  rowIdx,
  row,
  onChange,
}: {
  rowIdx: number;
  row: string[];
  onChange: (r: number, c: number, val: string) => void;
}) {
  return (
    <tr>
      <td className="w-10 border-r border-border bg-muted px-2 py-0.5 text-center text-xs text-muted-foreground">
        {rowIdx + 1}
      </td>
      {row.map((cell, colIdx) => (
        <td key={colIdx} className="border-r border-b border-border p-0">
          <input
            data-r={rowIdx}
            data-c={colIdx}
            className="w-full border-0 bg-transparent px-2 py-1.5 text-sm outline-none focus:bg-primary/5 font-sans"
            style={{ fontFamily: colIdx === 0 ? "'JetBrains Mono', monospace" : undefined }}
            value={cell}
            onChange={(e) => onChange(rowIdx, colIdx, e.target.value)}
          />
        </td>
      ))}
    </tr>
  );
});

export default function UploadSheetDialog({
  open,
  onOpenChange,
  semesterId,
  examType,
}: UploadSheetDialogProps) {
  const [grid, setGrid] = useState<GridData>(createEmptyGrid);
  const loadedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const upsertSheet = useUpsertExamSheet();
  const { data: existingSheet } = useExamSheetByType(semesterId, examType);

  // Pre-fill existing data
  useEffect(() => {
    if (!open) {
      loadedRef.current = false;
      return;
    }
    if (loadedRef.current) return;
    loadedRef.current = true;
    if (existingSheet && existingSheet.courses.length > 0) {
      const g = createEmptyGrid();
      existingSheet.courses.forEach((c, i) => {
        if (i >= ROWS) return;
        g[i][0] = c.courseCode;
        g[i][1] = c.day;
        g[i][2] = c.date;
        g[i][3] = c.timeSlot;
        g[i][4] = c.courseName;
      });
      setGrid(g);
    } else {
      setGrid(createEmptyGrid());
    }
  }, [open, existingSheet]);

  const handleCellChange = useCallback((r: number, c: number, val: string) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = val;
      return next;
    });
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const target = e.target as HTMLInputElement;
      const r = parseInt(target.dataset.r || "0");
      const c = parseInt(target.dataset.c || "0");
      const text = e.clipboardData.getData("text/plain");
      if (!text.includes("\t") && !text.includes("\n")) return;

      e.preventDefault();
      const rows = text.split(/\r?\n/).filter((line) => line.trim());
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        rows.forEach((rowStr, ri) => {
          const cells = rowStr.split("\t");
          cells.forEach((cell, ci) => {
            if (r + ri < ROWS && c + ci < COLS) {
              next[r + ri][c + ci] = cell.trim();
            }
          });
        });
        return next;
      });
      toast({ title: "Pasted", description: `${rows.length} rows pasted from clipboard` });
    },
    [toast]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const target = e.target as HTMLInputElement;
    const r = parseInt(target.dataset.r || "0");
    const c = parseInt(target.dataset.c || "0");

    const focusCell = (nr: number, nc: number) => {
      const cell = document.querySelector(
        `input[data-r="${nr}"][data-c="${nc}"]`
      ) as HTMLInputElement;
      cell?.focus();
    };

    if (e.key === "Enter") {
      e.preventDefault();
      if (r < ROWS - 1) focusCell(r + 1, c);
    } else if (e.key === "ArrowDown" && !target.value) {
      e.preventDefault();
      if (r < ROWS - 1) focusCell(r + 1, c);
    } else if (e.key === "ArrowUp" && !target.value) {
      e.preventDefault();
      if (r > 0) focusCell(r - 1, c);
    }
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

          const headerIdx = json.findIndex((row) => row.some((c) => c && String(c).trim()));
          if (headerIdx < 0) {
            toast({ title: "Error", description: "Empty file", variant: "destructive" });
            return;
          }

          const headers = json[headerIdx].map((h) => String(h || "").toLowerCase().trim());
          const colMap: Record<string, number> = {};
          const patterns: [string[], string][] = [
            [["course code", "code", "subject code"], "courseCode"],
            [["subject name", "course name", "name", "title"], "courseName"],
            [["exam date", "date"], "date"],
            [["day"], "day"],
            [["time slot", "timing", "time", "slot"], "timeSlot"],
          ];

          patterns.forEach(([keys, field]) => {
            const idx = headers.findIndex((h) => keys.some((k) => h.includes(k)));
            if (idx >= 0) colMap[field] = idx;
          });

          const fields = ["courseCode", "day", "date", "timeSlot", "courseName"];
          if (Object.keys(colMap).length === 0) {
            fields.forEach((f, i) => {
              if (i < headers.length) colMap[f] = i;
            });
          }

          const g = createEmptyGrid();
          const dataRows = json.slice(headerIdx + 1);
          let count = 0;
          const gridColOrder = ["courseCode", "day", "date", "timeSlot", "courseName"];

          dataRows.forEach((row, i) => {
            if (i >= ROWS) return;
            if (!row.some((c) => c && String(c).trim())) return;
            gridColOrder.forEach((field, ci) => {
              const srcIdx = colMap[field];
              if (srcIdx !== undefined && row[srcIdx]) {
                g[count][ci] = String(row[srcIdx]).trim();
              }
            });
            count++;
          });

          setGrid(g);
          toast({ title: "File loaded", description: `${count} rows imported` });
        } catch {
          toast({ title: "Error", description: "Failed to parse file", variant: "destructive" });
        }
      };
      reader.readAsArrayBuffer(file);
      e.target.value = "";
    },
    [toast]
  );

  const handleSave = useCallback(async () => {
    const courses: Course[] = [];
    grid.forEach((row) => {
      if (row.every((c) => !c.trim())) return;
      courses.push({
        courseCode: row[0].trim(),
        day: row[1].trim(),
        date: row[2].trim(),
        timeSlot: row[3].trim(),
        courseName: row[4].trim(),
      });
    });

    if (courses.length === 0) {
      toast({ title: "Error", description: "Add at least one course", variant: "destructive" });
      return;
    }

    try {
      const version = format(new Date(), "MMM d, yyyy h:mm a");
      await upsertSheet.mutateAsync({ semesterId, examType, courses, versionString: version });
      toast({ title: "Saved", description: `${courses.length} courses uploaded — version ${version}` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }, [grid, semesterId, examType, toast, onOpenChange, upsertSheet]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload {EXAM_TYPE_LABELS[examType]} Schedule
          </DialogTitle>
          <DialogDescription>
            Paste from Excel, upload a file, or type manually. 200 rows available.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1.5" />
            Upload File
          </Button>
          <span className="text-xs text-muted-foreground">.xlsx, .xls, .csv</span>
        </div>

        <div
          className="flex-1 overflow-auto border border-border rounded-md"
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="w-10 border-r border-b border-border px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  #
                </th>
                {COL_HEADERS.map((h) => (
                  <th key={h} className="border-r border-b border-border px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, i) => (
                <GridRow key={i} rowIdx={i} row={row} onChange={handleCellChange} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={upsertSheet.isPending}>
            <Save className="h-4 w-4 mr-1.5" />
            {upsertSheet.isPending ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
