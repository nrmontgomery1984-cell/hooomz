# HOOOMZ OS: ARCHITECTURE SPECIFICATION

## Core Principle: Activity Log as Spine

The Activity Log is not a feature or module — it's the **foundation** of the entire system. Every action writes an event. Modules are specialized interfaces for creating, viewing, and acting on specific event types.

### Why This Matters

If you remove a module (say, Estimation), you lose the estimation *interface*, but:
- The underlying ability to attach a price to work remains
- Historical data is preserved in the activity log
- Other modules can still reference that data

This enables modularity without data loss.

---

## Activity Log Specification

### Event Schema
```typescript
interface ActivityEvent {
  id: string;                    // uuid
  event_type: string;            // e.g., "task.status_changed"
  timestamp: string;             // ISO 8601

  // Actor
  actor_id: string;              // user who performed action
  actor_type: 'team_member' | 'system' | 'client';

  // Context
  organization_id: string;       // for multi-tenancy
  project_id: string;

  // Three-Axis Metadata (nullable)
  work_category_code: string | null;   // e.g., "EL" for Electrical
  stage_code: string | null;           // e.g., "ST-DW" for Drywall Stage
  location_id: string | null;          // e.g., "loc-kitchen"

  // Entity Reference
  entity_type: string;           // e.g., "task_instance", "change_order"
  entity_id: string;

  // Visibility
  homeowner_visible: boolean;    // Show in client portal?

  // Event-Specific Payload
  event_data: Record<string, any>;
}
```

### Event Types

**Project Events:**
- `project.created`
- `project.status_changed`
- `project.completed`

**Task Events:**
- `task.template_created`
- `task.instance_created`
- `task.status_changed`
- `task.completed`
- `task.blocked`

**Time Events:**
- `time.clock_in`
- `time.clock_out`
- `time.entry_approved`

**Financial Events:**
- `estimate.created`
- `estimate.sent`
- `estimate.approved`
- `change_order.created`
- `invoice.created`
- `payment.received`

**Field Events:**
- `photo.uploaded`
- `photo.shared`
- `inspection.passed`
- `inspection.failed`
- `field_note.created`

### Rules

1. Events are NEVER edited or deleted (append-only)
2. Every user action must create an event
3. Events must be queryable by: project_id, event_type, actor_id, timestamp range
4. Events feed dashboards, reports, and audit trails

---

## Division Scoping System

Hooomz is an **ecosystem** supporting multiple business divisions. Each division has its own subset of work categories, stages, and project types.

### Divisions
```typescript
enum Division {
  INTERIORS = 'interiors',   // Current web app
  EXTERIORS = 'exteriors',   // Future
  DIY = 'diy',               // Future
  MAINTENANCE = 'maintenance' // Future
}
```

### Interiors Division (Current App)

**Work Categories:**
| Code | Name | Description |
|------|------|-------------|
| FL | Flooring | LVP, hardwood, carpet, tile |
| PT | Paint | Interior walls, ceilings, trim |
| FC | Finish Carpentry | Baseboard, casing, crown, doors |
| TL | Tile | Floor tile, wall tile, backsplash |
| DW | Drywall | Hanging, taping, mudding, repair |
| OH | Overhead | Project management, cleanup |

**Stages:**
| Code | Name | Order |
|------|------|-------|
| ST-DM | Demolition | 1 |
| ST-PR | Prime & Prep | 2 |
| ST-FN | Finish | 3 |
| ST-PL | Punch List | 4 |
| ST-CL | Closeout | 5 |

**Bundles (Project Types):**
| Type | Trades | Estimated Price |
|------|--------|-----------------|
| floor_refresh | FL, FC | ~$5,400 |
| room_refresh | FL, PT, FC | ~$8,200 |
| full_interior | FL, PT, FC, DW | ~$11,800 |
| accent_package | FC, PT | Variable |
| custom | User-defined | Variable |

---

## Nested Loop Architecture

Everything is a loop containing smaller loops. The same pattern at every level.

### Hierarchy
```
Organization (largest loop)
└── Project
    └── Work Category (e.g., FL, PT, FC for Interiors)
        └── Location (e.g., Living Room, Kitchen)
            └── Task Instance
                └── Checklist Item
```

### Loop Properties

Every loop has:
- `id`: Unique identifier
- `name`: Display name
- `parent_id`: Reference to parent loop (null for root)
- `status`: Current state
- `health_score`: 0-100, calculated from children
- `is_leaf`: Boolean, true if can contain tasks directly

### Status Bubbling

Parent status reflects worst child status:
- If any child is "blocked", parent shows "blocked"
- If any child is "behind", parent shows "behind"
- Parent only shows "on_track" if ALL children are on track

---

## Smart Estimating (Learning System)

This is THE differentiator. The system gets smarter with every completed project.

### Three Learning Flows

#### 1. Price Learning (Receipt → Intelligence)
```
Receipt uploaded
  → Extract line items
  → Match to cost catalog
  → Update price history
  → Calculate rolling averages
```

#### 2. Labor Learning (Time Entry → Intelligence)
```
Time entry completed
  → Link to task type + conditions
  → Build duration baselines
  → Track by role (journeyman vs apprentice)
```

#### 3. Quantity Learning (Project Completion → Intelligence)
```
Project completed
  → Compare estimated vs actual materials
  → Analyze waste factors
  → Refine assembly quantities
```

### Confidence Indicators

Every estimate line shows data confidence:

| Level | Criteria | Display |
|-------|----------|---------|
| ✓ Verified | 3+ data points from your projects | Green |
| ~ Limited | 1-2 data points | Amber |
| ? Estimate | No field data, using defaults | Coral |

---

## Data Model Overview

### Core Tables

| Table | Purpose |
|-------|---------|
| organizations | Multi-tenant root |
| users | Auth + profile |
| projects | Construction projects |
| customers | Homeowner/client info |
| properties | Physical addresses |
| loop_iterations | Nested loop hierarchy |
| task_templates | Reusable task definitions |
| task_instances | Specific task occurrences |
| activity_events | Immutable event log |

### Smart Estimating Tables

| Table | Purpose |
|-------|---------|
| cost_catalog | Master list of materials/labor types |
| price_history | Price records over time |
| material_baselines | Quantity baselines by assembly |
| labor_history | Individual time entries |
| labor_baselines | Duration baselines by task type |
| estimate_accuracy | Estimated vs actual tracking |

---

## Multi-Tenancy

### Row-Level Security

Every table has `organization_id`. RLS policies ensure:
- Users only see their organization's data
- JWT claims include org_id for fast lookup
- No cross-org data leakage

---

## Offline Architecture

### Requirements
- All critical views work offline
- Actions queue when offline
- Sync when connection restored
- Conflict resolution favors most recent

### What Works Offline
- View projects, tasks, loops
- Update task status
- Add time entries
- Take photos (queue upload)
- Add notes

### What Requires Connection
- Initial data sync
- User authentication
- Photo upload (queued)
