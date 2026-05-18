// frontend/src/components/shared/DataTable.tsx
"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { Inbox } from "lucide-react";

interface DataTableProps<T> {
  columns: {
    header: string;
    accessorKey?: keyof T | string;
    cell?: (item: T) => React.ReactNode;
  }[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({ columns, data, onRowClick, emptyTitle = "No data available", emptyDescription = "There are no records to display." }: DataTableProps<T>) {
  return (
    <div className="bg-card backdrop-blur-xl border border-border rounded-xl overflow-hidden shadow-card">
      <Table>
        <TableHeader className="bg-muted/50 border-b border-border">
          <TableRow className="border-0">
            {columns.map((column, idx) => (
              <TableHead key={idx} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider h-12">
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((item, rowIdx) => (
              <TableRow
                key={rowIdx}
                className={`border-b border-border transition-colors hover:bg-muted ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column, colIdx) => (
                  <TableCell key={colIdx} className="py-4 text-sm text-foreground/80">
                    {column.cell
                      ? column.cell(item)
                      : (item[column.accessorKey as keyof T] as any)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent border-0">
              <TableCell colSpan={columns.length} className="h-48 text-center p-0 align-middle">
                <div className="p-8">
                  <EmptyState 
                    title={emptyTitle} 
                    description={emptyDescription} 
                    icon={<Inbox className="w-8 h-8" />} 
                  />
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
