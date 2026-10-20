import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { formatDateShort } from "@/lib/timezone";
import { useDeleteEntry } from "../hooks/use-entries";
import { calcHours } from "@/lib/calculations";
import type { TimeEntry, EmploymentType } from "@/types";
import { EntryEditDialog } from "./entry-edit-dialog";

interface Props {
  entry: TimeEntry;
  profileType?: EmploymentType;
  slotCount?: number;
}

export function DayRow({ entry, profileType = "fulltime", slotCount }: Props) {
  const [open, setOpen] = useState(false);
  const deleteEntry = useDeleteEntry();

  const hours = calcHours(entry.start_time, entry.end_time);

  const handleDelete = async () => {
    if (confirm("¿Eliminar esta entrada?")) {
      await deleteEntry.mutateAsync(entry.id);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <span>{formatDateShort(entry.date)}</span>
          {slotCount && slotCount > 1 && (
            <Badge variant="outline" className="text-[10px] h-4 px-1">
              #{entry.slot_index != null ? entry.slot_index + 1 : slotCount}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="font-mono">
        {entry.start_time.substring(0, 5)}
      </TableCell>
      <TableCell className="font-mono">
        {entry.end_time.substring(0, 5)}
      </TableCell>
      <TableCell className="font-heading font-medium">
        {hours.toFixed(2)}h
      </TableCell>
      <TableCell className="max-w-[120px] truncate">{entry.concept}</TableCell>
      <TableCell>
        <Badge variant={hours >= 7 ? "default" : "secondary"}>
          {hours >= 7 ? "C$180" : "—"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setOpen(true)}
            title="Editar entrada"
            aria-label="Editar entrada"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <EntryEditDialog
          entry={entry}
          profileType={profileType}
          open={open}
          onOpenChange={setOpen}
        />
      </TableCell>
    </TableRow>
  );
}
