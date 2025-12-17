# TableView Refactoring - Integration Guide

## Quick Start

The TableView component has been deconstructed into three reusable sub-components:

### Components Created
- **TableHeader.tsx** (52 lines) - Renders header row with column headers and resize handles
- **TableBody.tsx** (214 lines) - Renders data rows with cells, grouping, and editing
- **TableFooter.tsx** (212 lines) - Renders footer with pagination, new row input, and aggregates

## Integration Steps

### 1. Import the Components
```tsx
import { TableHeader } from "./TableHeader";
import { TableBody } from "./TableBody";
import { TableFooter } from "./TableFooter";
```

### 2. Replace Table JSX
Replace:
```tsx
<table>
  <thead>...</thead>
  <tbody>...</tbody>
  <tfoot>...</tfoot>
</table>
```

With:
```tsx
<div className="mk-grid">
  <TableHeader
    superstate={props.superstate}
    cols={cols}
    colsSize={colsSize}
    dbSchema={dbSchema}
    readMode={readMode}
    activeId={activeId}
    onResizeHandler={(headerId) => table.getColumn(headerId)?.getResizeHandler()}
  />
  
  <TableBody
    superstate={props.superstate}
    cols={cols}
    colsSize={colsSize}
    data={data}
    contextTable={contextTable}
    readMode={readMode}
    selectedRows={selectedRows}
    selectedColumn={selectedColumn}
    currentEdit={currentEdit}
    table={table}
    onSelectCell={selectCell}
    onContextMenu={(e, rowIndex) => showRowContextMenu(...)}
    updateValue={updateValue}
    updateFieldValue={updateFieldValue}
    setCurrentEdit={setCurrentEdit}
    setSelectedColumn={setSelectedColumn}
  />
  
  <TableFooter
    superstate={props.superstate}
    cols={cols}
    colsSize={colsSize}
    data={data}
    groupBy={groupBy}
    readMode={readMode}
    predicate={predicate}
    pageSize={pageSize}
    onLoadMore={() => table.setPageSize(pagination.pageSize + pageSize)}
    onNewRow={(name) => newRow(name)}
    onSaveAggregate={(col, fn) => saveAggregate(col, fn)}
  />
</div>
```

### 3. Update CSS Classes

Add or update in TableView CSS file:

```css
/* Grid Container */
.mk-grid {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0;
}

/* Header */
.mk-header {
  display: grid;
  grid-template-columns: inherit;
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--background-primary);
  border-bottom: 2px solid var(--accent-color);
}

.mk-header-cell {
  display: flex;
  align-items: center;
  font-weight: bold;
  padding: 8px;
  border-right: 1px solid var(--border-color);
  position: relative;
}

.mk-header-spacer {
  width: 0;
  flex: 0;
}

/* Resizer */
.mk-resizer {
  position: absolute;
  right: 0;
  height: 100%;
  width: 4px;
  cursor: col-resize;
  user-select: none;
  touch-action: none;
}

.mk-resizer:hover {
  background: var(--accent-color);
}

/* Body */
.mk-body {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.mk-row {
  display: grid;
  grid-template-columns: inherit;
  min-height: 40px;
  border-bottom: 1px solid var(--border-color);
}

.mk-row.mk-active {
  background: var(--background-secondary);
}

.mk-row-spacer {
  width: 0;
  flex: 0;
}

/* Cell */
.mk-cell {
  display: flex;
  align-items: center;
  padding: 8px;
  border-right: 1px solid var(--border-color);
  word-break: break-word;
  overflow: hidden;
}

.mk-cell.mk-selected-cell {
  background: var(--background-tertiary);
  outline: 2px solid var(--accent-color);
  outline-offset: -1px;
}

.mk-cell.mk-cell-empty {
  display: none;
}

.mk-cell.mk-cell-group {
  background: var(--background-secondary);
  font-weight: bold;
  cursor: pointer;
}

.mk-cell.mk-cell-aggregated {
  background: var(--background-tertiary);
  font-weight: 600;
}

/* Footer */
.mk-footer {
  display: flex;
  flex-direction: column;
}

.mk-footer-row {
  display: grid;
  grid-template-columns: inherit;
  min-height: 40px;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.mk-footer-row.mk-footer-load-more {
  cursor: pointer;
  background: var(--interactive-hover);
  text-align: center;
  padding: 12px;
}

.mk-footer-row.mk-footer-new-row {
  background: var(--background-secondary);
}

.mk-footer-input {
  padding: 8px;
  outline: none;
  min-height: 40px;
}

.mk-footer-input[data-placeholder]:empty:before {
  content: attr(data-placeholder);
  color: var(--text-muted);
}

.mk-footer-cell {
  display: flex;
  align-items: center;
  padding: 8px;
  border-right: 1px solid var(--border-color);
}

.mk-footer-cell.mk-footer-cell-empty {
  background: var(--background-tertiary);
  cursor: pointer;
}

.mk-footer-cell.mk-footer-cell-empty:hover {
  background: var(--interactive-hover);
}

.mk-footer-cell.mk-footer-cell-grouped {
  display: none;
}

.mk-footer-aggregate-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.mk-footer-aggregate-label {
  font-size: 0.75em;
  font-weight: 600;
  color: var(--text-muted);
}

.mk-footer-aggregate-value {
  font-size: 1.1em;
  font-weight: bold;
}

.mk-footer-aggregate-placeholder {
  font-size: 0.85em;
  color: var(--text-muted);
}

.mk-footer-spacer {
  width: 0;
  flex: 0;
}
```

### 4. Remove Old Table Styles
Remove or comment out CSS for:
- `.mk-table table { ... }`
- `table thead`
- `table tbody`
- `table tfoot`
- `table tr`
- `table td`
- `table th`

Keep what still applies to `.mk-table` wrapper and cell content.

## Component Props Reference

### TableHeader Props
```tsx
interface TableHeaderProps {
  superstate: Superstate;
  cols: SpaceTableColumn[];
  colsSize: Record<string, number>;
  dbSchema: SpaceTableSchema;
  readMode: boolean;
  activeId: string | null;
  onResizeHandler: (headerId: string) => (e: React.MouseEvent | React.TouchEvent) => void;
}
```

### TableBody Props
```tsx
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
  table: Record<string, any>; // TanStack table instance
  onSelectCell: (e: React.MouseEvent, index: number, column: string) => void;
  onContextMenu: (e: React.MouseEvent, rowIndex: number) => void;
  updateValue: (field: string, value: string, table: string, rowIndex: number) => void;
  updateFieldValue: (field: string, fieldValue: string, value: string, table: string, rowIndex: number) => void;
  setCurrentEdit: (edit: [string, string] | null) => void;
  setSelectedColumn: (column: string | null) => void;
}
```

### TableFooter Props
```tsx
interface PredicateType {
  colsCalc?: Record<string, string>;
  [key: string]: unknown;
}

interface TableFooterProps {
  superstate: Superstate;
  cols: SpaceTableColumn[];
  colsSize: Record<string, number>;
  data: DBRow[];
  groupBy: string[];
  readMode: boolean;
  predicate: PredicateType;
  pageSize: number;
  onLoadMore: () => void;
  onNewRow: (name: string) => void;
  onSaveAggregate: (column: string, fn: string) => void;
}
```

## Testing Checklist

After integration, verify:

- [ ] Table renders with grid layout (no horizontal scroll for columns)
- [ ] Column headers display with proper sizing
- [ ] Column resize handles work (mouse drag)
- [ ] Column drag-drop reordering works
- [ ] Rows render with proper height and alignment
- [ ] Row selection works (click, Ctrl+click, Shift+click)
- [ ] Row appears highlighted when selected
- [ ] Cell selection works with mouse click
- [ ] Cell edit mode works (double-click or Enter key)
- [ ] Keyboard navigation: arrow keys move between cells
- [ ] Keyboard: Escape clears selection
- [ ] Keyboard: Backspace/Delete clears cell value
- [ ] Copy/paste works (Cmd/Ctrl + C/V/X)
- [ ] Right-click context menu appears on rows
- [ ] Row grouping displays and expansion works
- [ ] Aggregate functions calculate correctly
- [ ] Aggregate dropdown menu works (column footer)
- [ ] Pagination "Load More" button works
- [ ] New row input works (contentEditable input)
- [ ] Read-only mode disables editing
- [ ] Touch screen mode (on mobile)
- [ ] Sticky header stays at top when scrolling
- [ ] Scroll performance is acceptable
- [ ] No console errors

## Performance Notes

- Grid layout rendering is generally faster than table rendering
- Div-based layout has better browser optimization
- Column resizing may trigger reflows - consider debouncing if issues
- No virtualization is implemented yet (same as original table)
- Can add virtual scrolling in future for large datasets

## Backward Compatibility

- All existing functionality is preserved
- Event handlers remain unchanged
- State management in TableView.tsx is unchanged
- Just the rendering layer is refactored

---

**Status**: Refactoring preparation complete and ready for integration
**Last Updated**: December 16, 2025
