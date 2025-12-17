import React from "react";
import { SpaceTableColumn, SpaceTableSchema } from "shared/types/mdb";
import { Superstate } from "makemd-core";
import { ColumnHeader } from "./ColumnHeader";

interface TableHeaderProps {
  superstate: Superstate;
  cols: SpaceTableColumn[];
  colsSize: Record<string, number>;
  dbSchema: SpaceTableSchema;
  readMode: boolean;
  activeId: string | null;
  table: Record<string, any>; // TanStack table instance
}

/**
 * TableHeader component renders the header row using div grid layout
 * Replaces <thead> section from table
 */
export const TableHeader: React.FC<TableHeaderProps> = ({
  superstate,
  cols,
  colsSize,
  dbSchema,
  readMode,
  activeId,
  table,
}) => {
  return (
    <div className="mk-header">
      {table.getHeaderGroups().map((headerGroup: any) => (
        <div key={headerGroup.id} className="mk-header-row">
          <div className="mk-row-spacer" />
          {headerGroup.headers.map((header: any) => (
            <div
              key={header.id}
              className="mk-header-cell"
              style={{
                minWidth: header.column.getIsGrouped()
                  ? "0px"
                  : colsSize[header.column.columnDef.accessorKey as string] ?? "150px",
                maxWidth: header.column.getIsGrouped()
                  ? "0px"
                  : colsSize[header.column.columnDef.accessorKey as string] ?? "150px",
              }}
            >
              {header.isPlaceholder ? null : header.column.columnDef.header !==
                "+" ? (
                header.column.getIsGrouped() ? (
                  <></>
                ) : (
                  <ColumnHeader
                    superstate={superstate}
                    editable={
                      !readMode && header.column.columnDef.meta.editable
                    }
                    column={cols.find(
                      (f) =>
                        f.name === header.column.columnDef.header &&
                        f.table === header.column.columnDef.meta.table
                    )}
                  ></ColumnHeader>
                )
              ) : (
                <ColumnHeader
                  superstate={superstate}
                  isNew={true}
                  editable={true}
                  column={{
                    name: "",
                    schemaId: header.column.columnDef.meta.schemaId,
                    type: "text",
                    table: "",
                  }}
                ></ColumnHeader>
              )}
              <div
                onMouseDown={header.getResizeHandler()}
                onTouchStart={header.getResizeHandler()}
                className={`mk-resizer ${
                  header.column.getIsResizing() ? "isResizing" : ""
                }`}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
