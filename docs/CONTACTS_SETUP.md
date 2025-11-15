# Contacts Feature Setup Guide

## Overview
This guide walks through setting up the Contacts module with your preloaded contact data.

## Features Implemented
- ✅ Database schema for contacts (contractors & vendors)
- ✅ Backend API routes (CRUD operations)
- ✅ Frontend React components
- ✅ Custom React hook for data management
- ✅ Preloaded with Nate's contact list
- ✅ Star/favorite functionality
- ✅ Filter by type (contractor/vendor)
- ✅ Click-to-call and email functionality

## Setup Steps

### 1. Run Database Migrations

```bash
# Connect to your Supabase project and run these migrations in order:

# Step 1: Create the contacts table
psql -f server/migrations/create_contacts.sql

# Step 2: Seed with your contact data (optional but recommended)
psql -f server/migrations/seed_nate_contacts.sql
```

**Via Supabase Dashboard:**
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy and paste the contents of `create_contacts.sql`
4. Click "Run"
5. Repeat for `seed_nate_contacts.sql`

### 2. Backend is Already Configured

The backend routes are already wired up in `server/src/index.js`:
- ✅ Route imported
- ✅ Mounted at `/api/contacts`

No additional backend setup needed!

### 3. Frontend is Already Configured

The frontend is ready to go:
- ✅ Contacts page created at `/contacts`
- ✅ Route added to App.jsx
- ✅ Custom hook created

### 4. Add Navigation Link (Optional)

If you want to add Contacts to your navigation, edit your navigation component:

```jsx
// Example: Add to your ModernLayout navigation
<NavLink to="/contacts">
  <Users size={20} />
  Contacts
</NavLink>
```

## API Endpoints

All endpoints require authentication (Bearer token in Authorization header).

### GET /api/contacts
Get all contacts for the authenticated user
- Query params:
  - `type` - Filter by contractor|vendor
  - `trade` - Filter by trade specialty
  - `favorite` - Filter favorites only (true/false)

### GET /api/contacts/:id
Get a single contact by ID

### POST /api/contacts
Create a new contact
```json
{
  "name": "Contact Name",
  "company": "Company Name",
  "phone": "555-1234",
  "email": "email@example.com",
  "trade_specialty": "Electrical",
  "contact_type": "contractor",
  "notes": "Optional notes",
  "is_favorite": false
}
```

### PUT /api/contacts/:id
Update a contact (same body as POST)

### DELETE /api/contacts/:id
Soft delete a contact

### GET /api/contacts/trades/list
Get unique list of trade specialties (for filters/dropdowns)

## Database Schema

### contacts table
```sql
id                UUID PRIMARY KEY
created_by        UUID REFERENCES auth.users(id)
name              TEXT NOT NULL
company           TEXT
phone             TEXT
email             TEXT
trade_specialty   TEXT
contact_type      TEXT (contractor|vendor)
notes             TEXT
is_favorite       BOOLEAN DEFAULT FALSE
created_at        TIMESTAMP WITH TIME ZONE
updated_at        TIMESTAMP WITH TIME ZONE
deleted_at        TIMESTAMP WITH TIME ZONE (soft delete)
```

## Preloaded Contacts

The seed file includes 31 contacts from your list:

**Contractors (16):**
- MatKen (General Contractor) ⭐
- Shawn's Electric (Electrical) ⭐
- Hub City Plumbing (Plumbing) ⭐
- Forward Electric (Electrical)
- Moncton Electrical Services (Electrical)
- East Coast Waterproofing (Waterproofing)
- Bellvieu Roofing (Roofing) ⭐
- East Coast Siding (Siding)
- Cassie Painting (Painting) ⭐
- City Drywall (Drywall) ⭐
- Economy Glass (Glass & Windows)
- Mikes Insulation (Insulation)
- Advantage Insulation (Insulation)
- InfoExcavation (Excavation)
- T&W (General)
- Ryan Mercer (General)

**Vendors/Suppliers (15):**
- Ritchies (Lumber & Building Supplies) ⭐
- Clover Dale (Building Supplies)
- RPM (Building Supplies)
- Technopost (Foundation Posts)
- Artisan (Building Supplies)
- PLG (Building Supplies)
- Jailet (Building Supplies)
- Greenfoot (Building Supplies)
- Vintage (Building Supplies)
- Atlas Systems (Building Systems)
- Cap Pele Saw Mill (Lumber)
- Eastern Gutter Workx (Gutters)
- Home Hardware (Hardware & Tools) ⭐
- Fransyl (Building Supplies)
- Boucher (Building Supplies)

⭐ = Marked as favorite

## User Experience Features

### System Contacts vs User Contacts
- Contacts seeded from the migration (created_by = NULL) are "system" contacts
- All users can see system contacts
- System contacts can only be favorited (not edited/deleted)
- Users can create their own private contacts
- Users can only edit/delete their own contacts

### Click-to-Call
Phone numbers are automatically linked for mobile devices:
```jsx
<a href="tel:555-1234">Call</a>
```

### Favorites
Star icon allows quick favoriting. Favorites appear first and can be filtered.

## Customization

### Adding Trade Categories
Edit `seed_nate_contacts.sql` to add more trade specialties:
```sql
INSERT INTO contacts (name, trade_specialty, contact_type) VALUES
  ('New Contact', 'HVAC', 'contractor');
```

### Changing Favorites
Update the `is_favorite` flag in the seed file:
```sql
('Contact Name', 'Trade', 'contractor', true)  -- favorited
```

## Testing

### Test the API
```bash
# Get all contacts
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/contacts

# Filter contractors only
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/contacts?type=contractor

# Filter favorites
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/contacts?favorite=true
```

### Test the Frontend
1. Start the dev server: `npm run dev`
2. Navigate to http://localhost:5173/contacts
3. You should see your preloaded contacts

## Next Steps

### Optional Enhancements (Not Included)
- [ ] Add contact form modal (create/edit)
- [ ] Search functionality
- [ ] Export contacts to CSV
- [ ] Import contacts from file
- [ ] Link contacts to projects/tasks
- [ ] Add avatar/logo upload
- [ ] Contact history (which projects they worked on)

## Troubleshooting

### Contacts not appearing?
1. Check that migrations ran successfully
2. Verify authentication token is valid
3. Check browser console for errors
4. Verify API endpoint is reachable

### Can't delete system contacts?
This is by design. System contacts (from seed) are read-only except for favoriting.

### Want to make all contacts user-specific?
Modify the seed file to include a `created_by` user ID instead of NULL.

## Files Created

### Database
- `server/migrations/create_contacts.sql` - Table schema
- `server/migrations/seed_nate_contacts.sql` - Your contact data

### Backend
- `server/src/routes/contacts.js` - API routes
- Updated: `server/src/index.js` - Route registration

### Frontend
- `client/src/hooks/useContacts.js` - React hook
- `client/src/pages/Contacts.jsx` - Main page component
- Updated: `client/src/App.jsx` - Route configuration

### Documentation
- `docs/CONTACTS_SETUP.md` - This file

---

**Ready to use!** Just run the migrations and navigate to `/contacts` in your app.
