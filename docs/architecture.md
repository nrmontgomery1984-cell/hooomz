# Hooomz Profile™ Architecture

## Philosophy

**The home is the identity anchor.** Data stays with the property, not just the owner.

## Core Principles

1. **Home-centric data model** - All data revolves around the home entity
2. **Multi-user ecosystem** - Homeowners, contractors, and realtors all interact with the platform
3. **Privacy-first** - No data selling, user data ownership
4. **Hybrid data model** - Static home data + dynamic owner data
5. **Modular architecture** - Easy to refactor and extend

## System Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │────────▶│   Backend   │────────▶│  Supabase   │
│ (React/Vite)│         │  (Express)  │         │  (Postgres) │
└─────────────┘         └─────────────┘         └─────────────┘
                                │
                                ▼
                        ┌─────────────┐
                        │  Storage    │
                        │ (Supabase)  │
                        └─────────────┘
```

## Data Model

### Core Tables

#### users
- `id` (uuid, PK)
- `email` (text, unique)
- `name` (text)
- `role` (enum: homeowner, contractor, realtor, admin)
- `created_at` (timestamp)

#### homes
- `id` (uuid, PK)
- `owner_id` (uuid, FK → users.id)
- `address` (text)
- `year_built` (int)
- `sqft` (int)
- `meta` (jsonb) - flexible additional data
- `created_at` (timestamp)

#### rooms
- `id` (uuid, PK)
- `home_id` (uuid, FK → homes.id)
- `name` (text) - e.g., "Master Bedroom"
- `floor` (int)
- `notes` (text)
- `photos` (text[])
- `created_at` (timestamp)

#### materials
- `id` (uuid, PK)
- `home_id` (uuid, FK → homes.id)
- `room_id` (uuid, FK → rooms.id, nullable)
- `category` (enum: flooring, paint, countertop, etc.)
- `brand` (text)
- `model` (text)
- `color` (text)
- `photos` (text[])
- `created_at` (timestamp)

#### systems
- `id` (uuid, PK)
- `home_id` (uuid, FK → homes.id)
- `type` (enum: hvac, electrical, plumbing, etc.)
- `brand` (text)
- `model` (text)
- `serial` (text)
- `install_date` (date)
- `warranty_until` (date)
- `notes` (text)
- `created_at` (timestamp)

#### documents
- `id` (uuid, PK)
- `home_id` (uuid, FK → homes.id)
- `category` (enum: warranty, manual, receipt, etc.)
- `file_url` (text)
- `file_name` (text)
- `file_size` (int)
- `created_at` (timestamp)

#### maintenance
- `id` (uuid, PK)
- `home_id` (uuid, FK → homes.id)
- `name` (text) - e.g., "Change HVAC filters"
- `frequency` (enum: weekly, monthly, quarterly, annually)
- `next_due` (date)
- `last_completed` (date)
- `notes` (text)
- `created_at` (timestamp)

#### contractor_work
- `id` (uuid, PK)
- `home_id` (uuid, FK → homes.id)
- `contractor_id` (uuid, FK → users.id)
- `type` (text) - renovation, repair, installation, etc.
- `details` (text)
- `materials_used` (text)
- `photos` (text[])
- `completed_at` (timestamp)
- `created_at` (timestamp)

#### realtor_intake
- `id` (uuid, PK)
- `home_id` (uuid, FK → homes.id)
- `realtor_id` (uuid, FK → users.id)
- `listing_data` (jsonb)
- `created_at` (timestamp)

## User Roles

### Homeowner
- Owns and manages home profiles
- Tracks materials, systems, maintenance
- Uploads documents
- Grants access to contractors/realtors

### Contractor (Hooomz Pro™)
- Inputs work performed on homes
- Uploads before/after photos
- Documents materials used
- Pro tier: marketplace presence, verified badge

### Realtor (Hooomz Agent™)
- Creates listing reports from home profiles
- Intake forms for new listings
- Access to home data with owner permission

## Technology Stack

### Frontend
- **React 18** with Vite
- **TailwindCSS** for styling
- **React Router** for routing
- **Supabase JS Client** for auth and storage
- **Axios** for API calls
- **Lucide React** for icons
- **date-fns** for date handling

### Backend
- **Node.js 18+** with Express
- **Supabase** (PostgreSQL + Auth + Storage)
- **Helmet** for security headers
- **CORS** for cross-origin requests
- **Joi** for validation
- **Express Rate Limit** for rate limiting

### Infrastructure
- **Frontend**: Vercel
- **Backend**: Railway or Render
- **Database**: Supabase (hosted Postgres)
- **Storage**: Supabase Storage (S3-compatible)

## Security

- JWT-based authentication via Supabase
- Row-level security (RLS) policies on all tables
- API rate limiting
- Input validation on all endpoints
- Secure file uploads with type/size restrictions
- HTTPS-only in production

## Scalability Considerations

1. **Database**: Postgres with proper indexing on foreign keys
2. **File Storage**: CDN-backed object storage via Supabase
3. **API**: Stateless design, horizontal scaling ready
4. **Caching**: Redis layer for future implementation
5. **Search**: Postgres full-text search initially, Elasticsearch later

## Future Enhancements (Phase 2+)

- **AR Integration**: Point phone at fixture, see material info
- **AI Analysis**: Home health scoring, maintenance predictions
- **Marketplace**: Contractor/vendor discovery
- **Mobile Apps**: Native iOS/Android
- **API Platform**: Third-party integrations
