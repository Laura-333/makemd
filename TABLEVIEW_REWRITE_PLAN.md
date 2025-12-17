# TableView.tsx Rewrite Plan: Table → Div Grid

## Current Structure Analysis

### HTML Structure (Current)
```html
<DndContext>
  <div class="mk-table">
    <table>
      <thead>
        <!-- Headers with resize handles -->
      </thead>
      <tbody>
        <!-- Data rows with cells -->
      </tbody>
      <tfoot>
        <!-- Pagination, new row input, aggregates -->
      </tfoot>
    </table>
    <DragOverlay>
      <!-- Dragging header column -->
    </DragOverlay>
  </div>
</DndContext>
```

### Target Structure (New)
```html
<DndContext>
  <div class="mk-table">
    <div class="mk-grid">
      <div class="mk-header">
        <!-- Header row cells -->
      </div>
      <div class="mk-body">
        <!-- Data rows -->
        <div class="mk-row">
          <!-- Cells -->
        </div>
      </div>
      <div class="mk-footer">
        <!-- Pagination, new row, aggregates -->
      </div>
    </div>
    <DragOverlay>
      <!-- Dragging header column -->
    </DragOverlay>
  </div>
</DndContext>
```

## Key Components to Extract

### 1. Header Section (`mk-header`)
**Current:** `<thead>` with header groups
**New:** Horizontal div container with cell divs
**Complexity:** 
- Column headers with resize handles
- Draggable columns (active when dragging)
- Grouped column hiding logic
- Resizing state and sizing calculations
- Column visibility based on predicate

**Lines affected:** 492-530 (thead map)

### 2. Body Section (`mk-body`)
**Current:** `<tbody>` with rows and cells
**New:** Container with row divs, each containing cell divs
**Complexity:**
- Row grouping (getGroupedRowModel)
- Row expansion toggle
- Aggregated cells
- Cell selection highlighting
- Cell click handling for edit mode
- Read-only vs edit mode rendering
- Touch screen behavior
- Keyboard navigation

**Lines affected:** 532-611 (tbody map)

### 3. Footer Section (`mk-footer`)
**Current:** `<tfoot>` with pagination, new row, and aggregates
**New:** Three separate sections as footer divs
**Complexity:**
- Load more pagination button
- New row contentEditable input
- Aggregate calculations row with dropdown menu
- GroupBy filtering logic

**Lines affected:** 612-696 (tfoot section)

## CSS Grid Requirements

### Layout Strategy
Use CSS Grid for:
- **Column sizing:** `colsSize` state should map to grid-template-columns
- **Row height:** Consistent row height for all mk-row divs
- **Drag overlay:** Position absolute over grid

### Required CSS Classes
```css
.mk-grid {
  display: grid;
  grid-template-columns: [auto-sizing based on colsSize];
  gap: 0;
}

.mk-header {
  display: grid;
  grid-template-columns: inherit;
  position: sticky;
  top: 0;
  z-index: 10;
}

.mk-body {
  display: flex;
  flex-direction: column;
  /* Or use grid for better performance */
}

.mk-row {
  display: grid;
  grid-template-columns: inherit;
  min-height: 40px;
}

.mk-cell {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  padding: 8px;
}

.mk-th {
  /* Header cell styling */
  display: flex;
  align-items: center;
  font-weight: bold;
  border-bottom: 2px solid var(--accent-color);
}

.mk-resizer {
  /* Resize handle positioning */
  position: absolute;
  right: 0;
  height: 100%;
  cursor: col-resize;
}
```

## State Management Implications

### What Stays the Same
- `colsSize: ColumnSizingState` - maps to CSS grid columns
- `selectedRows`, `lastSelectedIndex`, `selectedColumn` - cell selection
- `currentEdit: [string, string]` - edit mode tracking
- `pagination` - page management
- `activeId`, `overId` - drag-drop state
- Keyboard navigation logic

### What Changes
- Table header grouping logic may need adjustment
- Cell width calculations (fixed to grid columns)
- Scroll behavior (table was handling internally, div needs explicit scroll container)
- Cell placeholder rendering ("empty" cells)

## Component Extraction Strategy

### Option A: Single Refactored Component
Keep TableView.tsx as-is but replace table JSX with grid JSX.
- Pros: Minimal structural changes, easier to review
- Cons: Larger component, harder to maintain

### Option B: Extract Subcomponents
Create separate components:
- `<TableHeader />` - mk-header section
- `<TableBody />` - mk-body section  
- `<TableFooter />` - mk-footer section
- `<TableRow />` - Individual row
- `<TableCell />` - Individual cell

- Pros: Reusable, easier to test
- Cons: More props drilling, potential performance overhead

### Recommended: Hybrid Approach
Keep TableView as container but extract:
- `<TableHeader />` - Self-contained, doesn't change often
- `<TableFooter />` - Self-contained, distinct logic
- Keep body rows inline but organized into logical blocks

## Breaking Changes & Considerations

### 1. Scroll Behavior
- Current: Table handles internal scrolling
- New: Need explicit scroll container around mk-body with `overflow-y: auto`

### 2. Sticky Header
- Current: Native browser behavior (not guaranteed in table)
- New: Use `position: sticky; top: 0;` on mk-header

### 3. Cell Selection Highlighting
- Current: `mk-selected-cell` class on `<td>`
- New: Same class on `<div class="mk-cell">` (should work)

### 4. Resizing Logic
- Current: TanStack table manages resize via `getResizeHandler()`
- New: Handler still works but needs proper positioning on grid cells

### 5. GroupBy Rendering
- Current: `colSpan` attribute for grouped cells
- New: Need to use `grid-column: span X` or calculate proper width

### 6. Empty Cell Placeholders
- Current: `mk-td-empty` class with `minWidth: 0px`
- New: `mk-cell-empty` class with `grid-column: span 0` or display: none

## Performance Considerations

1. **Virtualization:** Table doesn't virtualize rows currently, div grid won't either (same)
2. **Rendering:** Div rendering is generally faster than table rendering
3. **Reflows:** Grid layout may cause more reflows on resize - consider debouncing
4. **Sticky Headers:** CSS sticky is more performant than JS scroll listeners

## Testing Checklist

- [ ] Column resizing works
- [ ] Column drag-drop reordering works
- [ ] Row selection (single, multi, range) works
- [ ] Cell editing (single/double click, keyboard)
- [ ] Keyboard navigation (arrows, enter, escape, backspace)
- [ ] Copy/paste operations
- [ ] Row context menu
- [ ] Grouped rows and expansion
- [ ] Aggregates calculation and menu
- [ ] Pagination and load more
- [ ] New row creation and input
- [ ] Read-only mode
- [ ] Touch screen mode
- [ ] Empty state cells with proper sizing
