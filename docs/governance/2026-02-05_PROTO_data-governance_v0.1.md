# Hooomz Data Governance Protocol
**Document:** 2026-02-05_PROTO_data-governance_v0.1.md
**Status:** Draft v0.1
**Owner:** Nathan Montgomery
**Applies to:** All Hooomz development (Claude.ai, Claude Code, codebase, documentation)

---

## 1. Core Principle

Data trust is the foundation. Labs only works if test results are trusted. Maintenance only works if sensor data is reliable. Operators only input data if they see good output.

**Bootstrap rule:** Even 1 input must produce 1 obviously useful output. If an operator logs a single floor measurement, the system immediately returns a material estimate, waste factor, or time prediction. If the answer to "What does the operator get back within 60 seconds of entering this data?" is "nothing yet, it feeds a future feature" — redesign for immediate return.

---

## 2. Naming Conventions

### 2.1 Canonical Division Names

| Division | Abbreviation | Brand | Notes |
|----------|-------------|-------|-------|
| Hooomz Interiors | HI | Hooomz | Active build. Flooring, paint, trim, fixtures, cabinets, countertops, tile. |
| Hooomz Exteriors | HE | Brisso | Roofing, siding, decks, fences, windows, EV chargers. |
| Hooomz Maintenance | HM | Hooomz | Subscription-based ongoing home care. |
| Hooomz Vision | HV | Hooomz | AR/VR, parametric design, Revit/Dynamo. |
| Hooomz DIY | HDIY | Hooomz | Kit products, retail (Ritchies), jigs. |
| Hooomz Labs | HL | Hooomz Labs | ATK-style independent materials testing. Trust engine. |
| Hooomz OS | HOS | Hooomz | Unified platform connecting all divisions. |

**Never use:** "Henderson Contracting", "Buildz", "interior stuff", or any other informal name. The canonical names above are the only acceptable references in code, docs, and conversation.

### 2.2 Code Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Division enum values | SCREAMING_SNAKE | `INTERIORS`, `EXTERIORS`, `MAINTENANCE`, `VISION`, `DIY`, `LABS` |
| Database tables | snake_case, plural | `projects`, `customers`, `activity_events` |
| TypeScript types | PascalCase | `ActivityEvent`, `InteriorsBundle`, `HooomzTheme` |
| React components | PascalCase | `QuickAddMenu`, `ContractorIntakeWizard` |
| Component files | kebab-case | `quick-add-menu.tsx`, `activity-feed.tsx` |
| Service files | dot-notation | `intake.service.ts`, `estimate.service.ts` |
| Config constants | SCREAMING_SNAKE | `WORK_CATEGORY_DIVISION_MAP`, `SCOPE_ITEM_COSTS` |
| Work category codes | 2-letter uppercase | `FL`, `FC`, `PT`, `TL`, `DW`, `OH` |
| Stage codes | ST- prefix + 2-letter | `ST-DM`, `ST-PR`, `ST-FN`, `ST-PL`, `ST-CL` |
| Entity IDs | prefix + ID | `proj_123`, `task_456`, `evt_001` |
| Event types | dot-separated | `task.completed`, `photo.uploaded`, `estimate.approved` |

### 2.3 Document Naming

**Format:** `YYYY-MM-DD_[TYPE]_[subject-in-kebab-case]_[VERSION].md`

| Type | Purpose | Example |
|------|---------|---------|
| SPEC | Technical specification | `2026-02-05_SPEC_supabase-schema_v1.md` |
| BRIEF | State summary, situation report | `2026-02-05_BRIEF_codebase-state-summary_v1.md` |
| GUIDE | Training material, field guide | `2026-02-05_GUIDE_lvp-installation_v1.md` |
| PROTO | Protocol, governance, process | `2026-02-05_PROTO_data-governance_v0.1.md` |
| CHECK | Alignment check, verification | `2026-02-05_CHECK_ecosystem-alignment_v1.md` |
| MODEL | Financial model, projections | `2026-02-05_MODEL_year1-revenue_v1.md` |
| TEST | Lab test report | `2026-02-05_TEST_lvp-adhesive-cold_v1.md` |
| SOP | Standard operating procedure | `2026-02-05_SOP_flooring-install_v1.md` |
| MARKET | Marketing material | `2026-02-05_MARKET_home-show-infographic_v1.md` |
| PLAN | Implementation plan | `2026-02-05_PLAN_prompt3-add-page_v1.md` |

**Agent suffix** (when document is agent-specific):
- `_CC_` = Claude Code
- `_CA_` = Claude.ai
- No suffix = shared/universal

**Version convention:**
- `v0.x` = draft
- `v1` = first approved version
- Increment minor for small updates, major for structural changes

### 2.4 Project/Job Naming (For Operators)

**Format:** `[DIVISION]-[YEAR][MONTH]-[SEQUENCE]-[CLIENT-LAST]`

**Example:** `HI-2603-001-SMITH` (Hooomz Interiors, March 2026, first job, client Smith)

---

## 3. Sync Protocol — Claude.ai ↔ Claude Code

### 3.1 Session Summary Requirement

After every CC work session, CC generates a session summary:

```
## Session Summary — YYYY-MM-DD

### What changed
- [files modified, features added, bugs fixed]

### What broke
- [new errors, regressions, things that stopped working]

### What's next
- [immediate next steps for next session]

### Decisions made
- [any architecture, naming, or design decisions]
```

Nathan uploads session summaries to Claude.ai to maintain sync.

### 3.2 Sync Flow

1. CC works on codebase → generates session summary
2. Nathan uploads summary to Claude.ai
3. Claude.ai updates its context, flags concerns
4. Claude.ai's outputs (plans, specs, briefings) get handed to CC via Nathan
5. CC acknowledges and integrates

### 3.3 Alignment Checks

- Periodic blind comparison exercises to detect drift
- Both agents fill out the same template independently
- Nathan compares for discrepancies
- Discrepancies get resolved and documented
- Target cadence: after every major refactor or direction change

### 3.4 Conflict Resolution

- **Codebase** = ground truth for what EXISTS
- **Claude.ai specs** = ground truth for what SHOULD exist
- Discrepancies get flagged, never silently resolved
- Nathan is the final authority on all conflicts

---

## 4. Storage & Backup

### 4.1 Three-Copy Minimum

| Data | Copy 1 | Copy 2 | Copy 3 |
|------|--------|--------|--------|
| Source code | Git (local) | GitHub (remote) | C: drive archive |
| Documents | Google Drive | C: drive | D: drive |
| Alignment checkpoints | In repo `/docs/checkpoints/` | GitHub | C: and D: drives |

### 4.2 Backup Schedule

| What | When |
|------|------|
| Code | Every work session ends with Git commit + push |
| Documents | Weekly sync to C: and D: drives (target: daily when automated) |
| Alignment checkpoints | After every major refactor or direction change |

### 4.3 Folder Structure — Local

```
C:\Hooomz\
├── code\
├── docs\
│   ├── checkpoints\
│   ├── specs\
│   ├── business\
│   ├── marketing\
│   ├── sops\
│   ├── field-guides\
│   ├── lab-reports\
│   └── mockups\
├── backups\
└── assets\
    ├── brand\
    ├── photos\
    └── videos\

D:\Hooomz\  (mirror of C:\Hooomz\)
```

### 4.4 Folder Structure — In Repo

```
C:\Users\Nathan\hooomz\docs\
├── checkpoints\
├── governance\
├── architecture\
└── onboarding\
```

### 4.5 Staleness Policy

| Document type | Stale after |
|---------------|-------------|
| BRIEF | Next work session |
| CHECK | Next major architectural change |
| PROTO | Monthly review |
| SPEC | When implementation diverges |
| SOP | When affected Lab test publishes new data |

---

## 5. Data Quality — Bootstrap Strategy

### Level 0: Single data point → instant output
- Enter room dimensions → material estimate + waste factor + time estimate
- Log photo → timestamped before/after documentation
- Record product used → Lab data on that product (if tested) or flag for future testing

### Level 1: One project → project-level intelligence
- Completed project → auto-generated Home Care Sheet
- All photos from job → marketing-ready before/after gallery
- Time logs from job → improved estimates for next similar job

### Level 2: Multiple projects → pattern recognition
- 10 flooring jobs → average waste factor by room type
- 20 jobs → seasonal patterns
- 50 jobs → reliable cost benchmarks by category

### Level 3: Cross-division → ecosystem intelligence
- Interiors install + Maintenance sensor data → predictive failure models
- Lab test data + field performance → verified vs claimed specs
- Vision parametric models + actual install data → calibrated estimates

---

## 6. Data Integrity

### 6.1 Immutability Principles

- Activity log entries are **append-only** (never edit, never delete)
- Lab test raw data never modified (published reports can be versioned)
- Photos timestamped and geotagged at capture
- Sensor readings stored as raw + processed separately

### 6.2 Audit Trail

Every significant action generates an activity event with: who, when, what changed, why.

### 6.3 Validation at Input

- Required fields enforced at UI
- Range checks on measurements
- Photo metadata verification
- Duplicate detection

---

## 7. Agent-Specific Rules

### 7.1 Claude Code

- Follow all naming conventions above — no exceptions
- Generate session summaries after every work session
- Participate honestly in alignment checks (no referencing the other agent's answers)
- Flag uncertainties rather than guessing silently
- Treat Nathan's corrections as authoritative
- Update auto-memory when corrections are made
- CC auto-memory (`MEMORY.md`) is CC-internal; decisions and corrections surface in session summaries

### 7.2 Claude.ai

- Maintain strategic context (business model, divisions, partnerships, revenue)
- Generate specs, briefings, and plans for CC to implement
- Run alignment comparisons when checkpoints are submitted
- Flag drift between strategy and implementation
- Own the design language and mockup specifications

### 7.3 Both Agents

- Never use "Henderson Contracting" — the business is Hooomz
- Nathan's full name is Nathan Montgomery
- Use canonical division names at all times
- When in doubt, ask Nathan rather than assume

---

*Protocol v0.1 — February 5, 2026*
*Review date: March 5, 2026*
