# Hooomz Web Application

Construction project management platform with real-time floor plan tracking.

## Overview

Hooomz is a mobile-first web application for residential contractors. Key features:

- **Looops Visual Language** - Projects displayed as 3D spheres with health scores (0-100)
- **Interactive Floor Plans** - Tap elements to update status, add notes/photos
- **Real-time Updates** - Supabase realtime subscriptions for live collaboration
- **Client Portal** - Read-only view for homeowners with comment capability
- **Revit Integration** - Import projects directly from Autodesk Revit exports

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase account (or use demo mode)

### Setup

1. Clone the repository:
```bash
cd apps/web
npm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Add Supabase credentials to `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Demo Mode

Without Supabase credentials, the app runs in demo mode with mock data. This is sufficient for UI testing and development.

## Project Structure

```
src/
├── components/
│   ├── sphere/          # Looops sphere visualization
│   ├── floor-plan/      # Interactive floor plan viewer
│   ├── activity/        # Activity feed components
│   ├── client/          # Client portal components
│   └── ui/              # Shared UI components
├── pages/
│   ├── dashboard/       # Main dashboard with project spheres
│   ├── project/         # Project detail view
│   ├── import/          # Revit JSON/SVG import
│   ├── client/          # Client portal
│   ├── activity/        # Activity feed
│   └── demo/            # Demo page with all states
├── hooks/               # React hooks
├── services/
│   ├── api/             # Supabase API functions
│   └── import/          # Import pipeline
├── stores/              # Zustand state stores
└── types/               # TypeScript definitions
```

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Check TypeScript types |

## Technology Stack

- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** for styling
- **Supabase** for backend (auth, database, realtime, storage)
- **Zustand** for state management
- **React Router** for navigation
- **react-zoom-pan-pinch** for floor plan pan/zoom

## Routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard with all projects |
| `/project/:id` | Project view with floor plan/tasks/activity |
| `/import` | Import Revit JSON + SVG |
| `/client/:projectId` | Client portal (read-only) |
| `/activity` | Full activity feed |
| `/demo` | Component demo page |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |

## Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Manual

```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

## Architecture Notes

### Core Patterns

1. **Floor plan elements don't store status** - They link to loops. Status comes FROM the loop.
2. **Activity log is append-only** - Events are never deleted, only superseded.
3. **Health score rolls up** - Parent loop health is calculated from children.

### Status Colors

```typescript
const statusColors = {
  not_started: '#9CA3AF',  // Grey
  in_progress: '#3B82F6',  // Blue
  blocked: '#EF4444',      // Red
  complete: '#10B981',     // Green
};
```

### Score Colors

| Score | Color |
|-------|-------|
| 90-100 | Green (#10B981) |
| 70-89 | Teal (#14B8A6) |
| 50-69 | Amber (#F59E0B) |
| 30-49 | Orange (#F97316) |
| 0-29 | Red (#EF4444) |

## License

Proprietary - Brisso Construction / Hooomz
