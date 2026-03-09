# Phase 2 Build Log — RoomScan Integration

Date: 2026-03-02
Status: COMPLETE
Typecheck: 0 errors

---

## Files Created

| File | Lines | Notes |
|------|-------|-------|
| `src/lib/types/roomScan.types.ts` | 82 | RoomScan, Room, RoomPolygon, Point2D, RoomOpening, enums |
| `src/lib/parsers/roomscan/types.ts` | 52 | ParsedScanData, ParsedRoom, ParsedOpening, ParseResult discriminated union |
| `src/lib/parsers/roomscan/parser.ts` | 110 | `parseRoomScanXML()` — browser DOMParser, handles parsererror |
| `src/lib/parsers/roomscan/converter.ts` | 70 | `convertParsedToRooms()` — metres→mm via metersToMm(), Shoelace area |
| `src/lib/parsers/roomscan/index.ts` | 3 | Barrel export |
| `src/lib/repositories/roomScan.repository.ts` | 68 | RoomScanRepository — ROOM_SCANS store |
| `src/lib/repositories/room.repository.ts` | 80 | RoomRepository — ROOMS store, saveMany, deleteByScan |
| `src/lib/services/roomScan.service.ts` | 130 | RoomScanService — importFromXML, scan CRUD, room CRUD, activity logging |
| `src/lib/hooks/useRoomScans.ts` | 155 | useRoomScans, useRoomScan, useRooms, useRoomsByScan, useRoom, useImportRoomScan, useDeleteRoomScan, useUpdateRoom |
| `src/components/floorplan/FloorPlanCanvas.tsx` | 240 | SVG canvas, pan/zoom (mouse drag + scroll wheel), click-to-select, scale bar |
| `src/components/floorplan/index.ts` | 1 | Barrel export |
| `src/app/production/jobs/[id]/rooms/page.tsx` | 215 | Room list page — XML upload, canvas, room list with status badges |
| `src/app/production/jobs/[id]/rooms/[roomId]/page.tsx` | 280 | Room detail — polygon canvas, stats, status toggle, casing sides, openings, notes |

## Files Modified

| File | Change |
|------|--------|
| `src/lib/services/index.ts` | +RoomScanRepository, RoomRepository, RoomScanService imports; +`roomScan` to Services interface + initializeServices(); +RoomScanService to re-exports |
| `src/lib/services/ServicesContext.tsx` | +`useRoomScanService()` hook |
| `src/lib/hooks/useLocalData.ts` | +`roomScans` and `rooms` query key namespaces to LOCAL_QUERY_KEYS |

## Routes Created

| Route | File |
|-------|------|
| `/production/jobs/[id]/rooms` | Room list — floor plan canvas + XML import |
| `/production/jobs/[id]/rooms/[roomId]` | Room detail — dimensions, openings, status, notes |

## Architecture Notes

### Parser Flow
```
XML string → parseRoomScanXML() → ParseResult (discriminated union)
  └── ok: true  → data: ParsedScanData (metres)
  └── ok: false → error: string

ParsedScanData → convertParsedToRooms(data, scanId, jobId) → ConvertedRooms (mm)
```

### Service Import Flow
```
importFromXML(jobId, filename, xml)
  1. parseRoomScanXML(xml)          → parse XML
  2. convertParsedToRooms(...)      → convert metres→mm, compute areas
  3. scanRepo.create(...)           → save RoomScan (status: processing)
  4. roomRepo.saveMany(rooms)       → save all rooms
  5. scanRepo.update(id, {ready})   → mark scan ready
  6. activity.create(scan.uploaded) → log to spine
```

### Activity Events Used
| Event | When |
|-------|------|
| `scan.uploaded` | `importFromXML()` succeeds |
| `scan.deleted`  | `deleteScan()` — also deletes rooms first |
| `room.updated`  | `updateRoom()` |

All events use `activity.create()` (generic method) since no `logScanEvent` exists.

## Naming Decisions (Deviations from Spec)

| Spec name | Actual name | Reason |
|-----------|-------------|--------|
| `BaseRepository<T>` pattern | Standalone repos | Existing `BaseRepository` is abstract with ApiResponse wrapping — incompatible |
| `BaseService` pattern | Plain class | No `BaseService` exists in codebase |
| `@/hooks/useRoom` | `@/lib/hooks/useRoomScans` | Hooks live in `src/lib/hooks/` not `src/hooks/` |
| `@/contexts/ServicesContext` | `@/lib/services/ServicesContext` | Correct import path |
| `useState/useCallback` hooks | React Query `useQuery/useMutation` | Matches all existing hooks in codebase |
| `generateId()` from `@/lib/utils/ids` | Inline generation | No `ids` utility exists |
| `CardContent/CardHeader` sub-components | Inline styles | `Card.tsx` has no sub-components; dashboard pattern = inline styles |
| Converter metres→inches | Converter metres→mm | Types and store use mm throughout; inches only in display layer |

## Typecheck

```
npx tsc --noEmit → 0 errors
```

## Fixes Applied During Build

- `OPENING_ICONS` map typed as `Record<OpeningType, LucideIcon>` (not `React.FC<{...}>`) — LucideIcon is the correct type
- `jobId` unused in `useDeleteRoomScan` mutationFn — destructured but only needed in `onSuccess`; removed from destructure
- `ts` variable in `converter.ts` was unused (timestamp moved to service layer) — removed

## Ready for Phase 3

Phase 3: Material Selection + Flooring Layout
Decision required: Material selection data model — selections stored per-room or per-job?
Suggested: Per-room (most flexible), with job-level aggregate view.
