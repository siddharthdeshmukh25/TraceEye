# TraceEye Database Schema & ER Diagram

## MongoDB Collections & Relationships

### 1. **users** Collection
Authentication user accounts
```javascript
{
  _id: ObjectId,
  email: string,
  password: string, // Note: Should be hashed in production
  name: string,
  full_name: string,
  auth_provider: "email" | "google",
  created_at: Date,
  updated_at: Date
}
```

### 2. **organizations** Collection
Producer/organization profiles
```javascript
{
  _id: ObjectId,
  name: string,
  contact_email: string,
  location_name: string,
  user_id: ObjectId, // References users._id
  created_at: Date
}
```

### 3. **batches** Collection
Food batch records
```javascript
{
  _id: ObjectId,
  public_id: string, // Unique public identifier
  product_name: string,
  producer_id: ObjectId, // References organizations._id
  origin_name: string,
  latitude: number | null,
  longitude: number | null,
  initial_quantity_kg: number,
  quality_grade: string,
  storage_min_c: number,
  storage_max_c: number,
  ingredient_batch_ids: ObjectId[], // References batches._id (for composite products)
  current_status: "safe" | "at_risk" | "critical",
  user_id: ObjectId, // References users._id (creator)
  created_at: Date
}
```

### 4. **handovers** Collection
Supply chain transfers
```javascript
{
  _id: ObjectId,
  batch_id: ObjectId, // References batches._id
  receiver: string,
  location: string,
  weight_kg: number,
  status: "verified" | "pending",
  integrity_hash: string | null,
  created_at: Date
}
```

### 5. **sensor_readings** Collection
Temperature and humidity readings
```javascript
{
  _id: ObjectId,
  batch_id: ObjectId, // References batches._id
  temperature_c: number,
  humidity_pct: number,
  marker_status: "intact" | "tampered",
  recorded_at: Date
}
```

### 6. **visual_verifications** Collection
Tamper-evident seal and visual marker verification
```javascript
{
  _id: ObjectId,
  batch_id: ObjectId, // References batches._id
  batch_public_id: string, // Public ID of the batch
  image_url: string, // URL of uploaded seal/marker image
  verification_status: "pending" | "verified_intact" | "verified_tampered" | "flagged_review",
  ai_confidence: number, // AI verification confidence score (0-1)
  verification_method: "manual" | "ai_opencv" | "ai_advanced",
  verified_by: ObjectId | null, // References users._id if manual verification
  verification_notes: string,
  created_at: Date,
  verified_at: Date | null
}
```

### 7. **card_visits** Collection
Card visit tracking with GPS location
```javascript
{
  _id: ObjectId,
  batch_id: ObjectId, // References batches._id
  batch_public_id: string, // Public ID of the batch/card
  visitor_ip: string,
  latitude: number,
  longitude: number,
  location_name: string, // Reverse geocoded location name
  device_info: string, // User agent/device info
  visited_at: Date
}
```

### 8. **alerts** Collection
Safety alerts and recalls
```javascript
{
  _id: ObjectId,
  batch_id: ObjectId, // References batches._id
  user_id: ObjectId, // References users._id
  severity: "low" | "medium" | "high" | "critical",
  title: string,
  message: string,
  affected_locations: string[],
  resolved_at: Date | null,
  created_at: Date
}
```

---

## ER Diagram (Entity Relationship)

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ _id (PK)        │
│ email           │
│ password        │
│ name            │
│ full_name       │
│ auth_provider   │
│ created_at      │
└────────┬────────┘
         │ 1
         │
         │ N
┌────────▼────────┐         ┌─────────────────┐
│ organizations   │         │    batches      │
├─────────────────┤         ├─────────────────┤
│ _id (PK)        │◄────────│ _id (PK)        │
│ name            │  1      │ public_id       │
│ contact_email   │         │ product_name    │
│ location_name   │         │ producer_id (FK)│
│ user_id (FK)    │         │ origin_name     │
│ created_at      │         │ latitude        │
└─────────────────┘         │ longitude       │
                            │ initial_quantity│
                            │ quality_grade   │
                            │ storage_min_c   │
                            │ storage_max_c   │
                            │ current_status  │
                            │ user_id (FK)    │
                            │ created_at      │
                            └────────┬────────┘
                                     │ 1
                                     │
                                     │ N
                    ┌────────────────┼────────────────┐
                    │                │                │
           ┌────────▼────────┐     │     ┌──────────▼──────────┐
           │   handovers     │     │     │  sensor_readings    │
           ├─────────────────┤     │     ├────────────────────┤
           │ _id (PK)        │     │     │ _id (PK)            │
           │ batch_id (FK)   │     │     │ batch_id (FK)       │
           │ receiver        │     │     │ temperature_c       │
           │ location        │     │     │ humidity_pct        │
           │ weight_kg       │     │     │ marker_status       │
           │ status          │     │     │ recorded_at         │
           │ integrity_hash  │     │     └────────────────────┘
           │ created_at      │     │
           └─────────────────┘     │
                                     │ N
                            ┌────────▼────────┐
                            │  card_visits   │
                            ├─────────────────┤
                            │ _id (PK)        │
                            │ batch_id (FK)   │
                            │ batch_public_id │
                            │ visitor_ip      │
                            │ latitude        │
                            │ longitude       │
                            │ location_name   │
                            │ device_info     │
                            │ visited_at      │
                            └─────────────────┘
                                     │ N
                            ┌────────▼────────┐
                            │     alerts      │
                            ├─────────────────┤
                            │ _id (PK)        │
                            │ batch_id (FK)   │
                            │ user_id (FK)    │
                            │ severity        │
                            │ title           │
                            │ message         │
                            │ affected_locations│
                            │ resolved_at     │
                            │ created_at      │
                            └─────────────────┘

Legend:
PK  = Primary Key
FK  = Foreign Key
1   = One
N   = Many
```

---

## Relationship Summary

### Primary Relationships:
1. **users → organizations** (1:N)
   - One user can create multiple organizations
   
2. **organizations → batches** (1:N)
   - One organization can have multiple batches
   - Each batch belongs to one producer

3. **users → batches** (1:N)
   - One user can create multiple batches
   - Each batch has one creator

4. **batches → handovers** (1:N)
   - One batch can have multiple handovers
   - Each handover belongs to one batch

5. **batches → sensor_readings** (1:N)
   - One batch can have multiple sensor readings
   - Each reading belongs to one batch

6. **batches → alerts** (1:N)
   - One batch can have multiple alerts
   - Each alert belongs to one batch

7. **users → alerts** (1:N)
   - One user can have multiple alerts
   - Each alert is associated with one user

8. **batches → card_visits** (1:N)
   - One batch can have multiple card visits
   - Each card visit belongs to one batch

9. **batches → visual_verifications** (1:N)
   - One batch can have multiple visual verifications
   - Each visual verification belongs to one batch

### Self-Referencing Relationship:
10. **batches → batches** (N:N via ingredient_batch_ids)
   - A batch can be composed of multiple ingredient batches
   - Used for composite products

---

## Data Flow Example

```
User Signup → Create User Account
    ↓
Create Organization → Link to User
    ↓
Create Batch → Link to Organization + User
    ↓
Add Sensor Readings → Link to Batch
    ↓
Create Handovers → Link to Batch
    ↓
Risk Evaluation → Create Alerts if needed
```

---

## Index Recommendations

```javascript
// users collection
db.users.createIndex({ email: 1 }, { unique: true })

// organizations collection
db.organizations.createIndex({ user_id: 1 })

// batches collection
db.batches.createIndex({ public_id: 1 }, { unique: true })
db.batches.createIndex({ user_id: 1 })
db.batches.createIndex({ producer_id: 1 })
db.batches.createIndex({ current_status: 1 })

// handovers collection
db.handovers.createIndex({ batch_id: 1 })

// sensor_readings collection
db.sensor_readings.createIndex({ batch_id: 1 })
db.sensor_readings.createIndex({ recorded_at: -1 })

// alerts collection
db.alerts.createIndex({ user_id: 1 })
db.alerts.createIndex({ batch_id: 1 })
db.alerts.createIndex({ resolved_at: 1 })

// card_visits collection
db.card_visits.createIndex({ batch_id: 1 })
db.card_visits.createIndex({ batch_public_id: 1 })
db.card_visits.createIndex({ visited_at: -1 })

// visual_verifications collection
db.visual_verifications.createIndex({ batch_id: 1 })
db.visual_verifications.createIndex({ batch_public_id: 1 })
db.visual_verifications.createIndex({ verification_status: 1 })
db.visual_verifications.createIndex({ created_at: -1 })
```
