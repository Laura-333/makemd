# Make.md AI Coding Instructions

## Project Overview
Make.md is an Obsidian plugin providing organization and visualization tools with databases, formulas, bidirectional relationships, and customizable workspaces. It's a TypeScript/React application using esbuild for bundling and targeting Obsidian's plugin API.

## Architecture

### Core Layers (Critical Data Flow)
```
Plugin (main.ts) → Superstate → SpaceManager → SpaceAdapters → Filesystem
                        ↓
                    PathState Index
                        ↓
                    React Components (via Context)
```

**Key architectural pattern**: The app uses a **three-tier abstraction**:
1. **Superstate** (`src/core/superstate/superstate.ts`): Central state manager holding all indexes (pathsIndex, spacesIndex, contextsIndex). Dispatches SuperstateEvents for any changes.
2. **SpaceManager** (`src/core/spaceManager/spaceManager.ts`): Manages spaces/items abstraction with pluggable adapters (filesystem, web, obsidian). Delegates to adapters via `adapterForPath()`.
3. **SpaceAdapters** (`FilesystemSpaceAdapter`, `WebSpaceAdapter`): Platform-specific implementations providing CRUD operations.

### Critical Components

**Superstate** - The heartbeat:
- Maintains `pathsIndex: Map<string, PathState>` (all file/folder metadata)
- Maintains `spacesIndex: Map<string, SpaceState>` (organized spaces)
- Maintains `contextsIndex: Map<string, ContextState>` (MDB tables + schemas)
- Dispatches `SuperstateEvent` on any change (`pathCreated`, `contextStateUpdated`, `frameStateUpdated`)
- Initializes asynchronously: `initialize()` → loads paths → loads spaces → loads contexts → loads templates

**SpaceManager** - The abstraction layer:
- Routes operations through adapters based on URI scheme (`uri.scheme` → find matching adapter)
- Responds to filesystem changes via `onSpaceUpdated()`, `onPathCreated()`, `onPathChanged()`
- Example: `saveTemplate()` saves to appropriate adapter, then calls `superstate.reloadSpace()`

**React Context Tree** (in `src/core/react/context/`):
- `SpaceManagerContext`: Provides all CRUD operations (readTable, saveFrame, createSpace, etc.) with fallback to spaceManager
- `PathContext`, `SpaceContext`, `FramesMDBContext`: Specialized contexts for current view state
- Pattern: Contexts wrap UI providers and memoize callbacks with `useCallback()`

### Data Models

**PathState** - Everything about a file/folder:
- `path`, `type` ("file"/"folder"/"space"), `hidden`, `metadata`, `tags`, `spaces`, `outlinks`
- Type determines behavior (space items load from context DB, files load from cache)

**SpaceState** - Organized collections:
- `path`, `type` ("folder"/"tag"/"dataview"/"inline"/"database")
- Contains `metadata` (SpaceDefinition) with custom properties, sort, filters
- May have `space.notePath` for folder notes

**ContextState** - MDB (Make.md Database) layer:
- `schemas`: SpaceTableSchema[] (table definitions with ID, name, type)
- `contextTable`: The actual data (cols, rows as DBRow[])
- `mdb`: Full SpaceTables record for all tables in space
- Accessed via `superstate.contextsIndex.get(spacePath)`

**SpaceTable** - A table:
- `schema`: Metadata (ID, name, type, predicate for views)
- `cols`: SpaceProperty[] (name, type, value, attrs for styling)
- `rows`: DBRow[] (Record<string, string> - all values are serialized strings)

### Middleware Layer
- **FilesystemMiddleware** (`src/core/middleware/filesystem.ts`): Abstraction over filesystem operations with event dispatch (`onCreate`, `onModified`, `onDelete`, `onSpaceUpdated`)
- **FileTypeAdapter**: Handles parsing specific file types (markdown, MDB, MKit). Cache stored in `FileCache`
- **Filesystem events trigger**: `SpaceManager.onPathCreated/Deleted/Changed()` → `Superstate.reloadSpace()/reloadContext()`

### React Integration Points

**SpaceManagerProvider** (`src/core/react/context/SpaceManagerContext.tsx`):
- Creates context value with 100+ methods (readTable, saveFrame, createSpace, etc.)
- Aware of MKit context (preview mode) - some operations route to MKit instead
- Pattern: Methods are memoized `useCallback()` with dependency arrays including `superstate`

**Context composition** (example from SpaceView.tsx):
```tsx
<SpaceManagerProvider>  // Provides all CRUD
  <PathProvider>        // Provides current file/folder
    <SpaceProvider>     // Provides current space
      <FrameSelectionProvider>  // Provides active frame
```

Heavy memoization prevents re-renders - each context is separate concern.

## Critical Workflows

### Loading a Space
1. User navigates to path → PathProvider updates with `pathState`
2. SpaceProvider calls `superstate.reloadSpace(spaceInfo)`
3. This calls SpaceManager's context operations → loads ContextState
4. ContextState triggers `dispatchEvent("contextStateUpdated")`
5. Subscribers (FramesMDBContext) update table data

### Saving MDB Data
1. Call `spaceManagerContext.saveTable(path, table)`
2. Routes through `spaceManager.saveTable()` → FilesystemSpaceAdapter
3. Adapter serializes table to `.mdb` file on disk
4. Filesystem triggers `onSpaceUpdated` event
5. SpaceManager calls `superstate.reloadContext()` to refresh index
6. `contextStateUpdated` event broadcasts to listeners

### Formula Evaluation
- Formulas use `mathjs` instance stored in `superstate.formulaContext`
- Parser in `src/core/utils/formula/parser.ts` builds AST
- Runner in `src/core/utils/formula/runner.ts` executes with context
- Context values come from PathState properties and formula functions in `src/core/utils/formula/formulas.ts`

## Project-Specific Conventions

### Path Handling
- Paths use forward slashes universally (`/folder/note`)
- Root is `/` not empty string
- URIs have scheme: `{ scheme: 'vault', path: '/folder/file' }`
- Resolve relative paths with `superstate.spaceManager.resolvePath(path, source)`

### Property/Metadata Serialization
- All MDB values serialized as strings in rows
- Deserialize with `parseMDBStringValue(value, type)`
- Serialize with `serializeOptionValue(value)`
- Settings stored in `.space` folder file

### File Extensions
- `.mdb` = MDB tables file (YAML frontmatter + YAML tables)
- `.space` = Space metadata (YAML only)
- `.mkit` = MKit format (preview-only format)

### Type Safety
- SpaceProperty.type values: "text", "number", "checkbox", "link", "select", "date", "formula"
- SpaceDefinition.type values: "folder", "tag", "dataview", "inline", "database"
- ContextSchemaType enum: SpaceType(0), ContextType(1), FrameType(2), etc.

### State Mutation Pattern
- **Never directly mutate** superstate indexes
- Always call appropriate spaceManager method
- Method triggers filesystem operation → event dispatch → spaceManager processes → superstate updates
- Example: Don't set `superstate.pathsIndex.set(path, state)` - call methods that trigger reloads

## Build & Development

### Commands
- `pnpm dev` - Watch mode with esbuild
- `pnpm build` - Production build (TypeScript check + esbuild)
- `pnpm preview` - Preview build
- `pnpm test` - Run Jest tests
- Output: `main.js` + `manifest.json` loaded by Obsidian

### Build Configuration
- esbuild.config.mjs handles:
  - Worker inlining (indexer.worker.ts, runner.worker.ts, search.worker.ts)
  - CSS bundling into main.js
  - Output to `main.js` (esbuild) + `styles.css`
  - Obsidian plugin format requires explicit manifest.json

### TypeScript Setup
- baseUrl: `src` (paths are relative to src/)
- JSX: "react" (React 18)
- No path aliases (commented out in tsconfig.json)

## Common Patterns

### Creating New Space Operations
1. Add method to SpaceManager interface in `src/shared/types/spaceManager.ts`
2. Implement in SpaceManager class - route to `adapterForPath(path)`
3. Add to SpaceAdapter abstract class
4. Implement in FilesystemSpaceAdapter (primary) + others as needed
5. Add corresponding SpaceManagerContext method wrapping with `useCallback()`

### Responding to Changes
- Listen to `superstate.eventsDispatcher.on(eventName, callback)`
- Pattern: Subscribe in effect, filter by path if needed
- Example: `spaceStateUpdated` fires when space metadata changes

### Accessing Current Data
- Use React contexts, NOT direct superstate access
- PathContext → current file/folder state
- SpaceContext → current space state + space manager
- FramesMDBContext → table data for current frame

### Adding New Property Type
1. Update `SpaceProperty.type` enum/union in `src/shared/types/mdb.ts`
2. Add parsing logic to `parseMDBStringValue()` in `src/utils/properties.ts`
3. Add serialization to `serializeOptionValue()` in `src/utils/serializers.ts`
4. Add UI component in `src/core/react/components/UI/Properties/`
5. Add formula function support in `src/core/utils/formula/formulas.ts` if needed

## Key Files by Purpose

| Purpose | Key Files |
|---------|-----------|
| Plugin entry & Obsidian integration | `src/main.ts`, `src/adapters/obsidian/` |
| Core state management | `src/core/superstate/superstate.ts`, `src/core/middleware/` |
| Space abstraction | `src/core/spaceManager/`, `src/core/spaceManager/*/filesystemAdapter.ts` |
| React integration | `src/core/react/context/SpaceManagerContext.tsx`, `PathContext.tsx` |
| MDB operations | `src/core/utils/contexts/`, `src/core/react/components/MDBView/` |
| Flow/markdown editor | `src/basics/flow/`, `src/basics/codemirror/` |
| Formula engine | `src/core/utils/formula/parser.ts`, `runner.ts` |
| Visualization | `src/core/react/components/SpaceView/`, `Visualization/` |

## Debugging Tips

- Enable spaceManager debug logs: Add logging to `adapterForPath()` calls
- Check event dispatch: `superstate.eventsDispatcher.on()` catches all state changes
- Verify path resolution: Use `resolvePath()` with source path for relative links
- Test MDB operations: Load context via `superstate.contextsIndex.get(path)` in console
- Memory profiling: Heavy memoization means check `useCallback` dependency arrays
