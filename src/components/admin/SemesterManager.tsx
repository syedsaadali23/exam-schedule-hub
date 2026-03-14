import { useState } from "react";
import { Plus, Check, Circle, Trash2, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
import { SemesterType, Semester } from "@/types/exam";
import {
  getSemesters,
  createSemester,
  setActiveSemester,
  deactivateSemester,
  removeSemester,
} from "@/lib/store";
import { useDataRefresh } from "@/hooks/use-store-subscription";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function SemesterManager() {
  useDataRefresh();
  const semesters = getSemesters();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [semType, setSemType] = useState<SemesterType>("Fall");
  const [year, setYear] = useState(new Date().getFullYear());

  const [activateTarget, setActivateTarget] = useState<Semester | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Semester | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Semester | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  const handleCreate = () => {
    try {
      createSemester(semType, year);
      toast({ title: "Created", description: `${semType} ${year} semester created` });
      setCreateOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleActivate = () => {
    if (!activateTarget) return;
    setActiveSemester(activateTarget.id);
    toast({ title: "Activated", description: `${activateTarget.name} is now active` });
    setActivateTarget(null);
  };

  const handleDeactivate = () => {
    if (!deactivateTarget) return;
    deactivateSemester(deactivateTarget.id);
    toast({ title: "Deactivated", description: `${deactivateTarget.name} deactivated` });
    setDeactivateTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    try {
      removeSemester(deleteTarget.id);
      toast({ title: "Deleted", description: `${deleteTarget.name} removed` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Semesters</CardTitle>
            <CardDescription>Manage academic semesters</CardDescription>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </CardHeader>
        <CardContent>
          {semesters.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No semesters yet. Create one to get started.</p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {semesters.map((sem) => (
                  <motion.div
                    key={sem.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                      sem.isActive ? "border-success/30 bg-success-bg" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {sem.isActive ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{sem.name}</span>
                      {sem.isActive && (
                        <Badge variant="outline" className="border-success/30 bg-success-bg text-success text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {sem.isActive ? (
                        <Button variant="ghost" size="sm" onClick={() => setDeactivateTarget(sem)}>
                          <PowerOff className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setActivateTarget(sem)}>
                          <Power className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={sem.isActive}
                        onClick={() => setDeleteTarget(sem)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Semester</DialogTitle>
            <DialogDescription>Add a new academic semester</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={semType} onValueChange={(v) => setSemType(v as SemesterType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Fall">Fall</SelectItem>
                <SelectItem value="Spring">Spring</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Will create: <strong>{semType} {year}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Confirm */}
      <AlertDialog open={!!activateTarget} onOpenChange={() => setActivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate {activateTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current active semester. Students will see this semester's data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate}>Activate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirm */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={() => setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {deactivateTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Students will see no active semester until you activate another one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This is permanent and cannot be undone. All exam sheets and version history for this semester will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
