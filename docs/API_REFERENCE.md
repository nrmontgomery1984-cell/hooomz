# API Reference

Base URL: `http://localhost:3001/api` (development)

All API endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Homes

### GET /homes
Get all homes for authenticated user

**Response**: `200 OK`
```json
[
  {
    "id": "uuid",
    "owner_id": "uuid",
    "address": "123 Main St",
    "year_built": 1985,
    "sqft": 2000,
    "meta": {},
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### POST /homes
Create a new home

**Request Body**:
```json
{
  "address": "123 Main St",
  "year_built": 1985,
  "sqft": 2000,
  "meta": {}
}
```

**Response**: `201 Created`

### PUT /homes/:homeId
Update a home

### DELETE /homes/:homeId
Delete a home

**Response**: `204 No Content`

---

## Rooms

### GET /homes/:homeId/rooms
Get all rooms for a home

### POST /homes/:homeId/rooms
Create a new room

**Request Body**:
```json
{
  "name": "Master Bedroom",
  "floor": 2,
  "notes": "Recently painted",
  "photos": ["https://..."]
}
```

### PUT /rooms/:roomId
Update a room

### DELETE /rooms/:roomId
Delete a room

---

## Materials

### GET /homes/:homeId/materials
Get all materials for a home

### POST /homes/:homeId/materials
Create a new material

**Request Body**:
```json
{
  "room_id": "uuid",
  "category": "flooring",
  "brand": "Armstrong",
  "model": "Luxe Plank",
  "color": "Silver Chalice",
  "photos": ["https://..."]
}
```

### PUT /materials/:materialId
Update a material

### DELETE /materials/:materialId
Delete a material

---

## Systems

### GET /homes/:homeId/systems
Get all systems for a home

### POST /homes/:homeId/systems
Create a new system

**Request Body**:
```json
{
  "type": "hvac",
  "brand": "Carrier",
  "model": "Infinity 21",
  "serial": "ABC123",
  "install_date": "2020-05-15",
  "warranty_until": "2030-05-15"
}
```

### PUT /systems/:systemId
Update a system

### DELETE /systems/:systemId
Delete a system

---

## Documents

### GET /homes/:homeId/documents
Get all documents for a home

### POST /homes/:homeId/documents
Create a new document

**Request Body**:
```json
{
  "category": "warranty",
  "file_url": "https://storage.../warranty.pdf",
  "file_name": "HVAC Warranty.pdf",
  "file_size": 1024000
}
```

### DELETE /documents/:documentId
Delete a document

---

## Maintenance

### GET /homes/:homeId/maintenance
Get all maintenance tasks for a home

### POST /homes/:homeId/maintenance
Create a new maintenance task

**Request Body**:
```json
{
  "name": "Change HVAC filters",
  "frequency": "monthly",
  "next_due": "2024-02-01",
  "notes": "Use 16x25x1 MERV 11"
}
```

### POST /maintenance/:taskId/complete
Mark a maintenance task as complete

### PUT /maintenance/:taskId
Update a maintenance task

### DELETE /maintenance/:taskId
Delete a maintenance task

---

## Contractor Work

### GET /homes/:homeId/contractor-work
Get all contractor work for a home

### POST /homes/:homeId/contractor-work
Create a new work record

**Request Body**:
```json
{
  "type": "renovation",
  "details": "Kitchen remodel - cabinets and countertops",
  "materials_used": "Quartz countertops, custom maple cabinets",
  "photos": ["https://..."]
}
```

### PUT /contractor-work/:workId
Update a work record

### DELETE /contractor-work/:workId
Delete a work record

---

## Realtor Intake

### GET /homes/:homeId/realtor-intake
Get all realtor intake records for a home

### POST /homes/:homeId/realtor-intake
Create a new intake record

**Request Body**:
```json
{
  "listing_data": {
    "price": 450000,
    "property_type": "single_family",
    "features": "Recently updated kitchen, new roof 2021",
    "known_issues": "Minor foundation crack (repaired)"
  }
}
```

### PUT /realtor-intake/:intakeId
Update an intake record

### DELETE /realtor-intake/:intakeId
Delete an intake record

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "address",
      "message": "address is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Home not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```
