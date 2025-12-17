import React from "react";
import { flexRender } from "@tanstack/react-table";
import { DBRow, SpaceTableColumn, SpaceTables } from "shared/types/mdb";
import { Superstate } from "makemd-core";
import { defaultContextSchemaID } from "shared/schemas/context";
import { PathPropertyName } from "shared/types/context";
import { fieldTypeForType } from "schemas/mdb";
import { DataTypeView, DataTypeViewProps } from "../DataTypeView/DataTypeView";
import { CellEditMode } from "./TableView";
import { isTouchScreen } from "core/utils/ui/screen";

interface TableBodyProps {
  superstate: Superstate;
  cols: SpaceTableColumn[];
  colsSize: Record<string, number>;
  data: DBRow[];
  contextTable: SpaceTables;
  readMode: boolean;
  selectedRows: string[];
  selectedColumn: string | null;
  currentEdit: [string, string] | null;
  table: Record<string, unknown>; // TanStack table instance
  onSelectCell: (e: React.MouseEvent, index: number, column: string) => void;
  onContextMenu: (e: React.MouseEvent, rowIndex: number) => void;
  updateValue: (field: string, value: string, table: string, rowIndex: number) => void;
  updateFieldValue: (field: string, fieldValue: string, value: string, table: string, rowIndex: number) => void;
  setCurrentEdit: (edit: [string, string] | null) => void;
  setSelectedColumn: (column: string | null) => void;
}

/**
 * TableBody component renders the data rows using div grid layout
 * Replaces <tbody> section from table
 */
export const TableBody: React.FC<TableBodyProps> = ({
  superstate,
  cols,
  colsSize,
  data,
  contextTable,
  readMode,
  selectedRows,
  selectedColumn,
  currentEdit,
  table,
  onSelectCell,
  onContextMenu,
  updateValue,
  updateFieldValue,
  setCurrentEdit,
  setSelectedColumn,
}) => {
  const rows = (table as Record<string, any>).getRowModel().rows;

  return (
    <div className="mk-body">
      {rows.map((row: any) => {
        const rowData = data[row.index] as DBRow;
        const rowIndex = parseInt(rowData["_index"]);
        const isSelected = selectedRows?.some((f) => f === rowData["_index"]);

        return (
          <div
            key={row.id}
            className={`mk-row ${isSelected ? "mk-active" : ""}`}
            onContextMenu={(e) => {
              e.preventDefault();
              onContextMenu(e, rowIndex);
            }}
          >
            <div className="mk-row-spacer" />

            {row.getVisibleCells().map((cell: any, cellIdx: number) => {
              const cellData = cell.getContext();
              const initialValue = cellData.getValue() as string;
              const columnDef = cell.column.columnDef as Record<string, any>;
              const isGrouped = cell.getIsGrouped();
              const isAggregated = cell.getIsAggregated();
              const isPlaceholder = cell.getIsPlaceholder();
              const colKey = columnDef.accessorKey as string;
              const colInfo = cols.find(
                (c) => `${c.name}${c.table}` === colKey
              );

              // Handle grouped cells
              if (isGrouped) {
                return (
                  <div
                    key={cellIdx}
                    className="mk-cell mk-cell-group"
                    style={{
                      gridColumn: `span ${cols.length + (readMode ? 1 : 2)}`,
                      cursor: "pointer",
                    }}
                    onClick={row.getToggleExpandedHandler()}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {flexRender(columnDef.cell, cellData)} ({row.subRows.length})
                    </div>
                  </div>
                );
              }

              // Handle aggregated cells
              if (isAggregated) {
                return (
                  <div
                    key={cellIdx}
                    className="mk-cell mk-cell-aggregated"
                    style={{
                      minWidth: colsSize[colKey] ?? "50px",
                      maxWidth: colsSize[colKey] ?? "unset",
                      flex: 0,
                    }}
                  >
                    {flexRender(
                      columnDef.aggregatedCell ?? columnDef.cell,
                      cellData
                    )}
                  </div>
                );
              }

              // Handle regular cells
              const saveValue = (value: string) => {
                setCurrentEdit(null);
                setSelectedColumn(null);
                if (initialValue !== value && colInfo) {
                  updateValue(colInfo.name, value, colInfo.table, rowIndex);
                }
              };

              const saveFieldValue = (fieldValue: string, value: string) => {
                if (colInfo) {
                  updateFieldValue(
                    colInfo.name,
                    fieldValue,
                    value,
                    colInfo.table,
                    rowIndex
                  );
                }
              };

              const editMode = readMode
                ? CellEditMode.EditModeReadOnly
                : !isGrouped
                ? isTouchScreen(superstate.ui)
                  ? CellEditMode.EditModeAlways
                  : currentEdit &&
                    currentEdit[0] === colKey &&
                    currentEdit[1] === rowIndex.toString()
                  ? CellEditMode.EditModeActive
                  : CellEditMode.EditModeView
                : CellEditMode.EditModeReadOnly;

              const fieldType = colInfo
                ? fieldTypeForType(colInfo.type, colInfo.name)
                : null;

              if (!fieldType) {
                return (
                  <div
                    key={cellIdx}
                    className={`mk-cell ${
                      colKey === selectedColumn ? "mk-selected-cell" : ""
                    } ${isPlaceholder ? "mk-cell-empty" : ""}`}
                    style={{
                      minWidth: isPlaceholder ? "0px" : colsSize[colKey] ?? "50px",
                      maxWidth: isPlaceholder ? "0px" : colsSize[colKey] ?? "unset",
                      flex: 0,
                    }}
                    onClick={(e) => onSelectCell(e, row.index, colKey)}
                  >
                    {isPlaceholder ? null : initialValue}
                  </div>
                );
              }

              const cellProps: DataTypeViewProps = {
                compactMode: false,
                initialValue: initialValue,
                updateValue: saveValue,
                updateFieldValue: saveFieldValue,
                superstate: superstate,
                setEditMode: setCurrentEdit,
                column: colInfo,
                editMode,
                row: rowData,
                contextTable: contextTable,
                source:
                  colInfo.schemaId === defaultContextSchemaID &&
                  rowData[PathPropertyName],
                columns: cols,
                contextPath: undefined,
              };

              return (
                <div
                  key={cellIdx}
                  className={`mk-cell ${
                    colKey === selectedColumn ? "mk-selected-cell" : ""
                  } ${isPlaceholder ? "mk-cell-empty" : ""}`}
                  style={{
                    minWidth: isPlaceholder ? "0px" : colsSize[colKey] ?? "50px",
                    maxWidth: isPlaceholder ? "0px" : colsSize[colKey] ?? "unset",
                    flex: 0,
                  }}
                  onClick={(e) => onSelectCell(e, row.index, colKey)}
                >
                  {isPlaceholder ? null : <DataTypeView {...cellProps} />}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
