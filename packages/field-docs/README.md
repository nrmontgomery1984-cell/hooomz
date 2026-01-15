# @hooomz/field-docs

Field documentation module for residential construction - inspections, photos, and site documentation designed for mobile/offline use.

## Features

### 📋 Inspection Management
- Schedule inspections for NB residential construction
- Record inspection results (pass/fail/notes)
- Track upcoming inspections and overdue items
- Reinspection scheduling for failed inspections
- Inspection history and statistics

### 📸 Photo Documentation
- Add photos with metadata (caption, tags, location, timestamp)
- Organize photos by project, inspection, or date
- Tag-based search and filtering
- Timeline view for progress documentation
- Offline-first with sync tracking

### ✅ Inspection Checklists
- Pre-defined NB inspection checklists
- Track item status (pass/fail/n/a)
- Progress tracking and completion percentage
- Photo attachment to checklist items
- Reusable templates

## NB Inspection Types

The module includes predefined checklists for all NB residential construction inspection types:

1. **Footing/Foundation** - Excavation, formwork, reinforcement, concrete
2. **Framing** - Wall framing, floor systems, roof systems, fire blocking
3. **Insulation/Vapor Barrier** - R-values, installation, air sealing
4. **Electrical Rough-in** - Service panel, wiring, GFCI/AFCI, grounding
5. **Plumbing Rough-in** - Water supply, drainage, venting, testing
6. **HVAC** - Equipment sizing, ductwork, ventilation
7. **Final Inspection** - Safety devices, fixtures, grading, cleanup

## Installation

```bash
npm install @hooomz/field-docs
```

## Quick Start

```typescript
import {
  InspectionService,
  PhotoService,
  ChecklistService,
  InMemoryInspectionRepository,
  InMemoryPhotoRepository,
} from '@hooomz/field-docs';

// Initialize repositories
const inspectionRepo = new InMemoryInspectionRepository();
const photoRepo = new InMemoryPhotoRepository();

// Initialize services
const inspectionService = new InspectionService({
  inspectionRepository: inspectionRepo,
});

const photoService = new PhotoService({
  photoRepository: photoRepo,
});

const checklistService = new ChecklistService();

// Schedule an inspection
const inspection = await inspectionService.scheduleInspection(
  'proj_123',
  'framing',
  '2024-03-15T10:00:00Z',
  {
    name: 'John Smith',
    contact: '506-555-1234',
  }
);

// Add a photo
const photo = await photoService.addPhoto(
  'proj_123',
  '/storage/photos/IMG_001.jpg',
  {
    caption: 'Framing completed - north wall',
    tags: ['framing', 'progress'],
    timestamp: new Date().toISOString(),
    takenBy: 'john@example.com',
  },
  {
    size: 2048000,
    mimeType: 'image/jpeg',
    width: 1920,
    height: 1080,
  }
);

// Create checklist for inspection
const checklist = await checklistService.createChecklistInstance({
  projectId: 'proj_123',
  inspectionId: inspection.data!.id,
  type: 'framing',
});
```

## API Reference

### InspectionService

#### CRUD Operations
- `list(params?)` - List inspections with filtering and pagination
- `getById(id)` - Get inspection by ID
- `create(data)` - Create new inspection
- `update(id, data)` - Update inspection
- `delete(id)` - Delete inspection

#### Inspection Management
- `getInspectionsByProject(projectId)` - Get all inspections for a project
- `scheduleInspection(projectId, type, date, inspector?)` - Schedule new inspection
- `recordInspectionResult(inspectionId, result)` - Record inspection result
- `getUpcomingInspections(days?)` - Get inspections within N days
- `getFailedInspections()` - Get inspections that failed
- `scheduleReinspection(originalId, date)` - Schedule reinspection for failed inspection

#### Status Management
- `startInspection(inspectionId)` - Mark inspection as in-progress
- `cancelInspection(inspectionId, reason?)` - Cancel inspection

#### Statistics
- `getProjectInspectionStats(projectId)` - Get inspection statistics
- `getInspectionHistory(projectId)` - Get inspection history sorted by date

### PhotoService

#### Photo Management
- `addPhoto(projectId, filePath, metadata, fileInfo?, inspectionId?)` - Add photo
- `getById(id)` - Get photo by ID
- `update(id, data)` - Update photo metadata
- `delete(id)` - Delete photo

#### Query Operations
- `getPhotosByProject(projectId)` - Get all photos for project
- `getPhotosByInspection(inspectionId)` - Get photos for inspection
- `getPhotosByTag(projectId, tag)` - Get photos with specific tag
- `getPhotosByTags(projectId, tags[])` - Get photos with any of the tags
- `getPhotosByDateRange(startDate, endDate)` - Get photos in date range
- `searchPhotos(filters)` - Search photos with filters

#### Organization
- `organizeByDate(photos)` - Organize photos by date for timeline
- `getProjectTimeline(projectId)` - Get timeline view of project photos

#### Tagging
- `addTag(photoId, tag)` - Add tag to photo
- `removeTag(photoId, tag)` - Remove tag from photo
- `updateCaption(photoId, caption)` - Update photo caption

#### Offline Sync
- `getUnsyncedPhotos()` - Get photos not uploaded to cloud
- `markAsUploaded(photoId)` - Mark photo as synced

#### Statistics
- `getProjectPhotoStats(projectId)` - Get photo statistics

### ChecklistService

#### Template Management
- `getChecklist(type)` - Get checklist template by inspection type
- `getAllChecklists()` - Get all checklist templates

#### Instance Management
- `createChecklistInstance(data)` - Create checklist from template
- `getChecklistInstance(instanceId)` - Get checklist instance
- `updateChecklistItem(instanceId, itemId, update)` - Update checklist item
- `getChecklistProgress(instanceId)` - Get completion progress
- `getProjectChecklists(projectId)` - Get all checklists for project
- `getInspectionChecklist(inspectionId)` - Get checklist for inspection
- `completeChecklist(instanceId, completedBy)` - Mark checklist as complete

## Data Types

### Inspection

```typescript
interface Inspection {
  id: string;
  projectId: string;
  type: InspectionType;
  status: InspectionStatus;
  scheduledDate: string;
  completedDate?: string;
  inspectorName?: string;
  inspectorContact?: string;
  notes?: string;
  failedItems?: string[];
  photoIds?: string[];
  checklistInstanceId?: string;
  requiresReinspection: boolean;
  reinspectionOf?: string;
  metadata: Metadata;
}

type InspectionType =
  | 'footing-foundation'
  | 'framing'
  | 'insulation-vapor-barrier'
  | 'electrical-rough-in'
  | 'plumbing-rough-in'
  | 'hvac'
  | 'final';

type InspectionStatus =
  | 'scheduled'
  | 'in-progress'
  | 'passed'
  | 'failed'
  | 'cancelled';
```

### Photo

```typescript
interface Photo {
  id: string;
  projectId: string;
  inspectionId?: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  thumbnailPath?: string;
  caption?: string;
  tags: string[];
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  timestamp: string;
  takenBy?: string;
  deviceInfo?: string;
  uploadedToCloud: boolean;
  metadata: Metadata;
}
```

### Checklist

```typescript
interface ChecklistInstance {
  id: string;
  projectId: string;
  inspectionId?: string;
  templateId: string;
  type: InspectionType;
  name: string;
  items: ChecklistInstanceItem[];
  createdDate: string;
  completedDate?: string;
  completedBy?: string;
  metadata: Metadata;
}

interface ChecklistInstanceItem {
  itemId: string;
  description: string;
  category?: string;
  required: boolean;
  status: ChecklistItemStatus; // 'pending' | 'pass' | 'fail' | 'n/a'
  notes?: string;
  photos?: string[];
}
```

## Usage Examples

### Schedule and Complete Inspection

```typescript
// Schedule framing inspection
const inspection = await inspectionService.scheduleInspection(
  'proj_123',
  'framing',
  '2024-03-15T10:00:00Z',
  {
    name: 'Inspector John',
    contact: '506-555-1234',
  }
);

// Start inspection
await inspectionService.startInspection(inspection.data!.id);

// Create checklist
const checklist = await checklistService.createChecklistInstance({
  projectId: 'proj_123',
  inspectionId: inspection.data!.id,
  type: 'framing',
});

// Update checklist items
await checklistService.updateChecklistItem(
  checklist.data!.id,
  'fr_1', // Wall plates anchored
  {
    status: 'pass',
    notes: 'All plates properly anchored with 1/2" anchor bolts @ 6\' o.c.',
  }
);

// Take photo
const photo = await photoService.addPhoto(
  'proj_123',
  '/storage/photos/framing_001.jpg',
  {
    caption: 'Wall plates anchored to foundation',
    tags: ['framing', 'inspection', 'foundation-connection'],
    timestamp: new Date().toISOString(),
    takenBy: 'inspector@example.com',
  },
  undefined,
  inspection.data!.id
);

// Record inspection result
await inspectionService.recordInspectionResult(inspection.data!.id, {
  status: 'passed',
  completedDate: new Date().toISOString(),
  notes: 'All items inspected and approved. Ready for insulation.',
  photoIds: [photo.data!.id],
  requiresReinspection: false,
});
```

### Photo Timeline View

```typescript
// Get all project photos
const photos = await photoService.getPhotosByProject('proj_123');

// Organize by date for timeline
const timeline = await photoService.organizeByDate(photos.data!);

// Display timeline
timeline.data!.forEach((day) => {
  console.log(`\n${day.date}:`);
  day.photos.forEach((photo) => {
    console.log(`  - ${photo.caption || 'No caption'}`);
    console.log(`    Tags: ${photo.tags.join(', ')}`);
  });
});
```

### Failed Inspection Workflow

```typescript
// Record failed inspection
await inspectionService.recordInspectionResult('insp_123', {
  status: 'failed',
  completedDate: new Date().toISOString(),
  notes: 'Floor joists not properly supported at beam.',
  failedItems: [
    'Floor joists properly supported (beams, bearing walls)',
  ],
  requiresReinspection: true,
});

// Get all failed inspections
const failed = await inspectionService.getFailedInspections();

// Schedule reinspection
await inspectionService.scheduleReinspection(
  'insp_123',
  '2024-03-20T10:00:00Z'
);
```

### Photo Search and Filtering

```typescript
// Get photos by tag
const framingPhotos = await photoService.getPhotosByTag(
  'proj_123',
  'framing'
);

// Get photos with multiple tags
const progressPhotos = await photoService.getPhotosByTags('proj_123', [
  'progress',
  'before',
  'after',
]);

// Get photos by date range
const weekPhotos = await photoService.getPhotosByDateRange(
  '2024-03-01',
  '2024-03-07'
);

// Search with filters
const searchResult = await photoService.searchPhotos({
  projectId: 'proj_123',
  tags: ['inspection'],
  takenBy: 'john@example.com',
  uploadedToCloud: false,
});
```

### Offline Sync

```typescript
// Get photos that need to be uploaded
const unsynced = await photoService.getUnsyncedPhotos();

console.log(`${unsynced.data!.length} photos pending upload`);

// Upload photos (external logic)
for (const photo of unsynced.data!) {
  // ... upload to cloud storage ...

  // Mark as uploaded
  await photoService.markAsUploaded(photo.id);
}
```

## Offline-First Design

The module is designed for offline operation:

1. **Local Storage**: All data stored locally first
2. **Sync Tracking**: `uploadedToCloud` flag tracks sync status
3. **Photo Management**: Store file paths for local access
4. **Metadata Preservation**: All metadata captured offline
5. **Queue Operations**: Operations can be queued and synced later

## Best Practices

1. **Always capture metadata**: Include timestamps, tags, and location when adding photos
2. **Use checklists**: Leverage pre-defined checklists for consistency
3. **Tag photos**: Use descriptive tags for easy searching
4. **Record inspection results**: Always record results even if inspection passed
5. **Track sync status**: Monitor `uploadedToCloud` for offline photos
6. **Use reinspection workflow**: Use `scheduleReinspection()` for failed inspections

## Dependencies

- **@hooomz/shared-contracts**: Base types and utilities

## License

Private - Internal use only
