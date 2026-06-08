# MongoDB NoSQL Data Schema
## Beit Hoffman Website – Information, Activities and Registration for Senior Citizens

**Version:** 1.3  
**Date:** June 2026  
**Database:** MongoDB  
**Status:** Approved for Submission

---

## Table of Contents

1. [QA Review Summary](#qa-review-summary)
2. [Collections Overview](#collections-overview)
3. [Collection Schemas](#collection-schemas)
   - [activities](#1-activities)
   - [registrations](#2-registrations)
   - [user_profiles](#3-user_profiles)
   - [announcements](#4-announcements)
   - [gallery](#5-gallery)
   - [contacts](#6-contacts)
   - [administrators](#7-administrators)
   - [center_info](#8-center_info)
4. [Indexes](#indexes)
5. [Relationships Between Collections](#relationships-between-collections)
6. [Example Documents](#example-documents)

---

## QA Review Summary

**Reviewed against:** `02_requirements.md` (SRS), `04_use_cases.md`  
**Review date:** June 2026  
**Final quality score: 91 / 100**  
**Submission status: ✅ Approved for Submission**

---

### Issues Found and Corrections Applied (v1.2)

| # | Severity | Location | Issue | Resolution |
|---|---|---|---|---|
| QA-01 | 🔴 High | `gallery` – `altText` | Marked as `Required: No`, but NFR-05 mandates descriptive alt text for all non-decorative images | Changed to `Required: Yes` |
| QA-02 | 🔴 High | `activities` – capacity fields | `availableSpots` was absent; UC-05 AF-05C and FR-11 require the system to evaluate spot availability atomically to prevent race conditions on concurrent registrations | Added `availableSpots` as a **stored, derived field** (see recommendation below) |
| QA-03 | 🟡 Medium | `activities` – indexes | Missing compound index `{ isActive: 1, category: 1, dayOfWeek: 1 }` — the most common real-world query (catalog filtered by category + day, active only) was not covered by a single index | Added `idx_activities_active_cat_day` |
| QA-04 | 🟡 Medium | `announcements` | Missing `createdAt` field — `publishedAt` represents the public date but there is no record of when the document was first inserted; the two can differ if a draft system is added later | Added `createdAt` field |
| QA-05 | 🟡 Medium | `administrators` – Collections Overview | Description says "session data" but sessions are not stored in this collection (noted in body text). Misleading overview description | Corrected Overview description |
| QA-06 | 🟢 Low | `registrations` example 2 | `"email": null` — in NoSQL, optional absent fields should simply be omitted rather than stored as `null` | Removed `email` field from example 2 |
| QA-07 | 🟢 Low | `gallery` example | Only one example document provided — insufficient to illustrate the collection meaningfully | Added a second example document |
| QA-08 | 🟢 Low | `center_info` – `openingHours[].open/close` | When `closed: true`, storing `"open": null` and `"close": null` is valid but should be documented explicitly | Added note to field descriptions |
| QA-09 | 🔴 High | `activities` – `activityDate` | Field was absent; FR-36 requires the system to filter only future activities for the personal calendar, which requires a concrete date per activity | Added `activityDate` as a required `Date` field |
| QA-10 | 🔴 High | `registrations` – personal area lookup | No index existed to support the personal area query (FR-35) by `fullName` + `phone` | Added compound index `idx_registrations_personal_area` on `{ fullName: 1, phone: 1 }` |
| QA-11 | 🟡 Medium | `activities` – indexes | Missing index on `activityDate` — needed for efficient filtering of future activities in the personal calendar (FR-36) and upcoming events on the home page (FR-01) | Added `idx_activities_activityDate` |

### Changes in v1.3 (New Requirement – Returning User Profile and Quick Registration)

| # | Severity | Location | Change | Reason |
|---|---|---|---|---|
| QA-12 | 🔴 High | `registrations` | Added `identityNumber` field (required) | FR-08 now requires identity number at first registration; FR-23/FR-25 require it to be included in admin views and CSV export |
| QA-13 | 🔴 High | New collection `user_profiles` | Added new collection | FR-39 requires the system to store personal details upon first registration for reuse in quick registrations (FR-41); the profile is the source of truth for returning user data |
| QA-14 | 🟡 Medium | `registrations` – `source` field | Added optional `source` field (`"form"` or `"personal_area"`) | Enables admin reporting to distinguish first-time registrations (full form) from quick registrations (personal area) |
| QA-15 | 🟡 Medium | Indexes – `user_profiles` | Added unique index on `phone` and compound index on `fullName` + `phone` | Supports fast profile lookup during personal area access (FR-40) and prevents duplicate profiles per phone number (FR-39) |
| QA-16 | 🟢 Low | Collections Overview | Updated to include `user_profiles` | Reflects new collection |

---

### `availableSpots` – Recommendation and Decision

**Option A – Calculate dynamically (virtual field):**
`availableSpots = maxParticipants - currentParticipants` computed at query time.

- ✅ No redundancy; single source of truth
- ❌ Cannot be indexed; cannot enforce the limit atomically under concurrent writes
- ❌ Requires application logic on every read

**Option B – Store as a derived field (recommended for this project):**
`availableSpots` is stored in the document and kept in sync with `currentParticipants` using a MongoDB atomic update:
```js
// On registration: decrement both atomically
db.activities.updateOne(
  { _id: activityId, availableSpots: { $gt: 0 } },
  { $inc: { currentParticipants: 1, availableSpots: -1 } }
)
```

- ✅ Atomic — prevents race conditions when two users register simultaneously (FR-10, FR-11)
- ✅ Indexable — can filter `{ isActive: 1, availableSpots: { $gt: 0 } }` efficiently
- ✅ Consistent with `currentParticipants` so long as all writes use `$inc`
- ⚠️ Must be kept in sync; direct edits to `maxParticipants` must also recalculate `availableSpots`

**Decision: Option B adopted.** `availableSpots` is added as a required stored field.

---



## Collections Overview

| # | Collection Name | Description | Related Use Cases |
|---|---|---|---|
| 1 | `activities` | Stores all activity definitions including schedule, capacity, category, and optional payment link | UC-02, UC-03, UC-04, UC-05, UC-09, UC-11, UC-12, UC-13, UC-24, UC-25 |
| 2 | `registrations` | Stores participant registrations for activities; serves as the data source for personal area lookup by full name and phone number | UC-05, UC-14, UC-15, UC-16, UC-23, UC-24, UC-25 |
| 3 | `user_profiles` | Stores the personal details of registrants (identity number, full name, phone number, email) created upon first registration; used to enable quick registration from the personal area without re-entering personal details | UC-05, UC-23, UC-25 |
| 4 | `announcements` | Stores published announcements displayed on the home page and announcements page | UC-06, UC-17, UC-18, UC-19 |
| 5 | `gallery` | Stores metadata for images uploaded to the photo gallery | UC-20, UC-21 |
| 6 | `contacts` | Stores contact form submissions submitted by visitors | UC-08 |
| 7 | `administrators` | Stores administrator credentials; session management is handled separately at the application layer | UC-10 |
| 8 | `center_info` | Single-document collection storing the center's public information | UC-07, UC-22 |

---

## Collection Schemas

---

### 1. `activities`

Stores all activities available in the catalog. Supports filtering by category and day, keyword search, and registration management.

| Field | Data Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Yes (auto) | Unique document identifier generated by MongoDB |
| `title` | String | Yes | Name of the activity (e.g., "Yoga for Seniors") |
| `description` | String | No | Detailed description of the activity; used in keyword search (FR-13) |
| `category` | String | Yes | Activity category for filtering (e.g., "Sport", "Culture", "Art") |
| `dayOfWeek` | String | Yes | Day of the week the activity takes place (e.g., "Sunday", "Monday") |
| `activityDate` | Date | Yes | Specific calendar date of the activity; used for upcoming events on the home page (FR-01) and for filtering future activities in the personal calendar (FR-36) |
| `time` | String | Yes | Scheduled time of the activity (e.g., "10:00") |
| `maxParticipants` | Number | Yes | Maximum number of participants allowed (FR-11) |
| `currentParticipants` | Number | Yes | Current number of registered participants; defaults to `0`; incremented atomically on each registration |
| `availableSpots` | Number | Yes | Remaining spots available; defaults to `maxParticipants`; decremented atomically with `currentParticipants` on each registration (FR-11). Stored to enable atomic capacity enforcement and efficient indexing. When `maxParticipants` is edited by an admin, this field must be recalculated as `maxParticipants - currentParticipants` |
| `isActive` | Boolean | Yes | Whether the activity is visible in the public catalog (FR-04); defaults to `true` |
| `requiresPayment` | Boolean | Yes | Whether the activity requires payment (FR-12); defaults to `false` |
| `paymentLink` | String | No | URL to the external payment system; only present when `requiresPayment` is `true` (FR-12). The website redirects to this link only; no payment data is stored internally. |
| `createdBy` | ObjectId | Yes | Reference to the `administrators._id` who created the activity (FR-20) |
| `createdAt` | Date | Yes | Timestamp of when the activity was created |
| `updatedAt` | Date | Yes | Timestamp of the last update |

---

### 2. `registrations`

Stores each participant registration for an activity. The compound unique index on `phone` + `activityId` enforces duplicate registration prevention (FR-10). The compound index on `fullName` + `phone` supports personal area lookup (FR-35).

| Field | Data Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Yes (auto) | Unique document identifier generated by MongoDB |
| `activityId` | ObjectId | Yes | Reference to the registered `activities._id` |
| `activityTitle` | String | Yes | Snapshot of the activity title at time of registration (for display and CSV export) |
| `identityNumber` | String | Yes | Identity number of the registering participant (FR-08); stored as a snapshot from the user profile at time of registration; included in admin views and CSV export (FR-23, FR-25) |
| `fullName` | String | Yes | Full name of the registering participant (FR-08); used together with `phone` for personal area lookup (FR-35) |
| `phone` | String | Yes | Phone number of the participant; used for duplicate prevention and personal area lookup (FR-08, FR-10, FR-35) |
| `email` | String | Yes | Email address of the participant; required (FR-08) |
| `source` | String | No | Origin of the registration: `"form"` for a first-time registration via the public form, `"personal_area"` for a quick registration via the personal area (UC-05, UC-25). Useful for admin reporting. |
| `registeredAt` | Date | Yes | Timestamp of when the registration was submitted |

---

### 3. `user_profiles`

Stores the personal details of each registrant, created upon their first successful registration (FR-39). This collection is the single source of truth for returning user data used in quick registration from the personal area (FR-41). One document exists per unique phone number.

| Field | Data Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Yes (auto) | Unique document identifier generated by MongoDB |
| `phone` | String | Yes | Phone number of the registrant; unique identifier for the profile; used for personal area access and quick registration lookup (FR-39, FR-40) |
| `identityNumber` | String | Yes | Identity number of the registrant (FR-08, FR-39) |
| `fullName` | String | Yes | Full name of the registrant (FR-08, FR-39); used together with `phone` for personal area lookup (FR-35, FR-40) |
| `email` | String | Yes | Email address of the registrant; required (FR-08, FR-39) |
| `createdAt` | Date | Yes | Timestamp of when the profile was first created (i.e., the moment of first registration) |
| `updatedAt` | Date | Yes | Timestamp of the most recent update to the profile |

> **Note:** The `user_profiles` collection is never used for authentication. It does not create a login account or persistent session. It is only used to pre-fill registration data when a returning user is identified by the personal area access form (FR-40, NFR-22).

---

### 4. `announcements`

Stores all published announcements. Sorted by `publishedAt` descending for display on the home page (FR-02) and announcements page (FR-14).

| Field | Data Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Yes (auto) | Unique document identifier generated by MongoDB |
| `title` | String | Yes | Title of the announcement |
| `body` | String | Yes | Full text content of the announcement |
| `publishedAt` | Date | Yes | Publication timestamp; used for sorting (FR-14). Set at creation and not changed on edits |
| `createdAt` | Date | Yes | Timestamp of when the document was first inserted; distinct from `publishedAt` |
| `createdBy` | ObjectId | Yes | Reference to `administrators._id` who published the announcement (FR-26) |
| `updatedAt` | Date | Yes | Timestamp of the last edit |

---

### 5. `gallery`

Stores metadata for each image uploaded to the photo gallery. The actual image files are stored on the server filesystem or a cloud storage service; this collection stores references.

| Field | Data Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Yes (auto) | Unique document identifier generated by MongoDB |
| `filename` | String | Yes | Stored filename on disk or cloud storage |
| `originalName` | String | Yes | Original filename as uploaded by the administrator |
| `url` | String | Yes | Public URL to access the image (FR-03) |
| `altText` | String | **Yes** | Descriptive alt text for accessibility compliance (NFR-05). Required for all non-decorative images. Must be provided by the administrator at upload time |
| `uploadedBy` | ObjectId | Yes | Reference to `administrators._id` who uploaded the image (FR-29) |
| `uploadedAt` | Date | Yes | Timestamp of when the image was uploaded |

---

### 6. `contacts`

Stores contact form submissions. Only accessible to authenticated administrators (FR-17).

| Field | Data Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Yes (auto) | Unique document identifier generated by MongoDB |
| `name` | String | Yes | Name of the person submitting the form (FR-16) |
| `email` | String | Yes | Email address of the submitter (FR-16) |
| `subject` | String | Yes | Subject line of the contact request (FR-16) |
| `message` | String | Yes | Full message body (FR-16) |
| `submittedAt` | Date | Yes | Timestamp of when the form was submitted |
| `isRead` | Boolean | Yes | Whether an administrator has reviewed the submission; defaults to `false` |

---

### 7. `administrators`

Stores administrator accounts. Passwords are stored as bcrypt hashes (NFR-14). This collection is never exposed to the public API.

| Field | Data Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Yes (auto) | Unique document identifier generated by MongoDB |
| `username` | String | Yes | Unique login username (FR-32) |
| `passwordHash` | String | Yes | bcrypt-hashed password (NFR-14) |
| `displayName` | String | No | Human-readable name shown in the admin panel |
| `createdAt` | Date | Yes | Timestamp of when the account was created |
| `lastLoginAt` | Date | No | Timestamp of the most recent successful login |

> **Note:** Session management (FR-33 – 60-minute inactivity expiry) is handled via server-side sessions (e.g., express-session with a MongoDB session store), not stored directly in this collection.

---

### 8. `center_info`

A single-document collection containing the Beit Hoffman center's public information. Only one document exists in this collection at any time. Administrators update this document in place (FR-31).

| Field | Data Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Yes (auto) | Unique document identifier generated by MongoDB |
| `centerName` | String | Yes | Official name of the center (FR-31) |
| `address` | String | Yes | Physical address of the center (FR-15, FR-31) |
| `phone` | String | Yes | Public phone number (FR-15, FR-31) |
| `email` | String | Yes | Public email address (FR-15, FR-31) |
| `openingHours` | Array of Objects | Yes | Weekly opening hours schedule; see structure below (FR-15, FR-31) |
| `openingHours[].day` | String | Yes | Day name (e.g., "Sunday") |
| `openingHours[].open` | String | Yes | Opening time (e.g., "08:00"); set to `null` when `closed` is `true` |
| `openingHours[].close` | String | Yes | Closing time (e.g., "18:00"); set to `null` when `closed` is `true` |
| `openingHours[].closed` | Boolean | Yes | Whether the center is closed on this day; defaults to `false` |
| `aboutContent` | String | No | Free-text "About" page content (FR-31) |
| `googleMapsEmbedUrl` | String | No | Embed URL for the Google Maps iframe (FR-15) |
| `updatedAt` | Date | Yes | Timestamp of the last update |
| `updatedBy` | ObjectId | Yes | Reference to `administrators._id` who last updated the information |

---

## Indexes

The following indexes are recommended to optimize query performance and enforce data integrity constraints.

### `activities` Collection

| Index | Fields | Type | Purpose |
|---|---|---|---|
| `idx_activities_category` | `{ category: 1 }` | Single field | Supports filtering activities by category (FR-05, UC-03) |
| `idx_activities_day` | `{ dayOfWeek: 1 }` | Single field | Supports filtering activities by day of the week (FR-06, UC-03) |
| `idx_activities_category_day` | `{ category: 1, dayOfWeek: 1 }` | Compound | Supports combined category + day filter queries |
| `idx_activities_active_cat_day` | `{ isActive: 1, category: 1, dayOfWeek: 1 }` | Compound | **Primary catalog query index** — covers the most common public query: active activities filtered by category and day in a single index scan (FR-04, FR-05, FR-06) |
| `idx_activities_isActive` | `{ isActive: 1 }` | Single field | Efficiently retrieves only active activities for the public catalog (FR-04) |
| `idx_activities_availableSpots` | `{ isActive: 1, availableSpots: 1 }` | Compound | Supports checking available capacity and disabling full activities (FR-11) |
| `idx_activities_text_search` | `{ title: "text", description: "text" }` | Text | Enables full-text keyword search across title and description (FR-13, UC-04) |
| `idx_activities_createdAt` | `{ createdAt: -1 }` | Single field | Supports admin listing sorted by creation date |
| `idx_activities_activityDate` | `{ activityDate: 1 }` | Single field | Supports chronological display of upcoming events (FR-01) and filtering future activities for the personal calendar (FR-36) |

### `registrations` Collection

| Index | Fields | Type | Purpose |
|---|---|---|---|
| `idx_registrations_unique` | `{ phone: 1, activityId: 1 }` | Compound **Unique** | Prevents duplicate registrations for the same phone number and activity (FR-10); applies to both first-time and quick registrations |
| `idx_registrations_activityId` | `{ activityId: 1 }` | Single field | Retrieves all registrations for a specific activity (UC-14) |
| `idx_registrations_registeredAt` | `{ registeredAt: -1 }` | Single field | Supports admin listing sorted by registration date |
| `idx_registrations_personal_area` | `{ fullName: 1, phone: 1 }` | Compound | Supports personal area lookup — retrieves all registrations matching a given full name and phone number combination (FR-35, UC-23) |

### `user_profiles` Collection

| Index | Fields | Type | Purpose |
|---|---|---|---|
| `idx_user_profiles_phone` | `{ phone: 1 }` | Single field **Unique** | Enforces one profile per phone number; enables fast profile lookup by phone during quick registration (FR-39, FR-41) |
| `idx_user_profiles_fullName_phone` | `{ fullName: 1, phone: 1 }` | Compound | Supports profile lookup during personal area access using the full name and phone number combination (FR-40) |

### `announcements` Collection

| Index | Fields | Type | Purpose |
|---|---|---|---|
| `idx_announcements_publishedAt` | `{ publishedAt: -1 }` | Single field | Sorts announcements by newest first for the public page and home page (FR-02, FR-14) |

### `gallery` Collection

| Index | Fields | Type | Purpose |
|---|---|---|---|
| `idx_gallery_uploadedAt` | `{ uploadedAt: -1 }` | Single field | Retrieves images in upload order for the gallery display |

### `contacts` Collection

| Index | Fields | Type | Purpose |
|---|---|---|---|
| `idx_contacts_submittedAt` | `{ submittedAt: -1 }` | Single field | Lists contact submissions in reverse chronological order for administrators |
| `idx_contacts_isRead` | `{ isRead: 1 }` | Single field | Allows admins to quickly filter unread submissions |

### `administrators` Collection

| Index | Fields | Type | Purpose |
|---|---|---|---|
| `idx_administrators_username` | `{ username: 1 }` | Single field **Unique** | Enforces unique usernames and enables fast credential lookup at login (FR-32) |

---

## Relationships Between Collections

MongoDB is a document-oriented database with no enforced foreign keys. Relationships are maintained through `ObjectId` references and application-level logic.

```
activities  ──────────────────────────────────────────────────────────────────┐
   │                                                                           │
   │  One activity can have many registrations                                 │
   │  registrations.activityId → activities._id                               │
   ▼                                                                           │
registrations                                                                  │
   ▲                                                                           │
   │  Personal area lookup: registrations are retrieved by matching            │
   │  fullName + phone (no foreign key; application-level query)               │
   │                                                                           │
   │  Quick registration: registration is created using data from              │
   │  user_profiles, looked up by phone number (FR-41)                        │
Visitor (provides fullName + phone at personal area access form)               │
   │                                                                           │
   ▼                                                                           │
user_profiles                                                                  │
   │  Created at first registration (UC-05); keyed by phone number            │
   │  Stores identityNumber, fullName, phone, email                           │
   │  Used for quick registration without re-entering details (UC-25)         │
                                                                               │
activities.createdBy → administrators._id                                      │
   One administrator can create many activities                                │
                                                                               │
announcements.createdBy → administrators._id                                   │
   One administrator can publish many announcements                            │
                                                                               │
gallery.uploadedBy → administrators._id                                        │
   One administrator can upload many gallery images                            │
                                                                               │
center_info.updatedBy → administrators._id  ───────────────────────────────────┘
   One administrator is responsible for the last update of center information

activities (requiresPayment: true)
   │
   │  One activity may include one external payment link
   │  activities.paymentLink → External Payment System URL (string, no collection)
   ▼
External Payment System (third-party, outside this database)
The website stores only the URL; no payment data is retained internally (NFR-24)
```

### Summary Table

| Relationship | Type | How Implemented |
|---|---|---|
| Activity → Registrations | One-to-Many | `registrations.activityId` references `activities._id` |
| Visitor → Personal Registrations | Lookup (no FK) | Application queries `registrations` by `{ fullName, phone }` match; no user collection or session required (FR-35) |
| Visitor → User Profile | One-to-One | Application queries `user_profiles` by `{ fullName, phone }` during personal area access; profile created at first registration (FR-39, FR-40) |
| User Profile → Quick Registration | Profile reuse | Quick registration reads `user_profiles` by `phone` to populate `registrations` fields without user re-entry (FR-41) |
| Administrator → Activities | One-to-Many | `activities.createdBy` references `administrators._id` |
| Administrator → Announcements | One-to-Many | `announcements.createdBy` references `administrators._id` |
| Administrator → Gallery Images | One-to-Many | `gallery.uploadedBy` references `administrators._id` |
| Administrator → Center Info | One-to-One (last editor) | `center_info.updatedBy` references `administrators._id` |
| Activity → Payment Link | One-to-One (optional) | `activities.paymentLink` stores the external URL as a string |

---

## Example Documents

---

### `activities` – Example Document

```json
{
  "_id": { "$oid": "664a1f2e3c4b5d6e7f8a9b0c" },
  "title": "יוגה לגיל הזהב",
  "description": "שיעור יוגה מותאם לבני הגיל השלישי. מחזק את הגוף ומשפר את הגמישות בסביבה נעימה ותומכת.",
  "category": "ספורט",
  "dayOfWeek": "ראשון",
  "activityDate": { "$date": "2026-06-14T00:00:00Z" },
  "time": "10:00",
  "maxParticipants": 20,
  "currentParticipants": 14,
  "availableSpots": 6,
  "isActive": true,
  "requiresPayment": false,
  "paymentLink": null,
  "createdBy": { "$oid": "664a0000000000000000001a" },
  "createdAt": { "$date": "2026-05-01T08:00:00Z" },
  "updatedAt": { "$date": "2026-06-01T10:30:00Z" }
}
```

```json
{
  "_id": { "$oid": "664a1f2e3c4b5d6e7f8a9b0d" },
  "title": "סיור תרבותי במוזיאון",
  "description": "סיור מודרך בתערוכות המוזיאון עם מדריך מוסמך. כולל כיבוד קל.",
  "category": "תרבות",
  "dayOfWeek": "שלישי",
  "activityDate": { "$date": "2026-06-16T00:00:00Z" },
  "time": "14:00",
  "maxParticipants": 15,
  "currentParticipants": 15,
  "availableSpots": 0,
  "isActive": true,
  "requiresPayment": true,
  "paymentLink": "https://pay.example-payment.co.il/beit-hoffman/museum-tour",
  "createdBy": { "$oid": "664a0000000000000000001a" },
  "createdAt": { "$date": "2026-05-10T09:00:00Z" },
  "updatedAt": { "$date": "2026-05-10T09:00:00Z" }
}
```

---

### `registrations` – Example Document

```json
{
  "_id": { "$oid": "664a2a3b4c5d6e7f8a9b1c2d" },
  "activityId": { "$oid": "664a1f2e3c4b5d6e7f8a9b0c" },
  "activityTitle": "יוגה לגיל הזהב",
  "identityNumber": "012345678",
  "fullName": "שרה כהן",
  "phone": "050-1234567",
  "email": "sarah.cohen@example.com",
  "source": "form",
  "registeredAt": { "$date": "2026-06-01T11:15:00Z" }
}
```

```json
{
  "_id": { "$oid": "664a2a3b4c5d6e7f8a9b1c2e" },
  "activityId": { "$oid": "664a1f2e3c4b5d6e7f8a9b0c" },
  "activityTitle": "יוגה לגיל הזהב",
  "identityNumber": "098765432",
  "fullName": "אסתר לוי",
  "phone": "052-9876543",
  "email": "ester.levi@example.com",
  "source": "form",
  "registeredAt": { "$date": "2026-06-02T09:00:00Z" }
}
```

```json
{
  "_id": { "$oid": "664a2a3b4c5d6e7f8a9b1c30" },
  "activityId": { "$oid": "664a1f2e3c4b5d6e7f8a9b0e" },
  "activityTitle": "קבוצת ציור",
  "identityNumber": "012345678",
  "fullName": "שרה כהן",
  "phone": "050-1234567",
  "email": "sarah.cohen@example.com",
  "source": "personal_area",
  "registeredAt": { "$date": "2026-06-05T14:30:00Z" }
}
```

> The third example shows a quick registration created from the personal area (`"source": "personal_area"`). Personal details were copied from the stored user profile; the user did not re-enter them.

---

### `user_profiles` – Example Document

```json
{
  "_id": { "$oid": "664a9f2e3c4b5d6e7f8a9b01" },
  "phone": "050-1234567",
  "identityNumber": "012345678",
  "fullName": "שרה כהן",
  "email": "sarah.cohen@example.com",
  "createdAt": { "$date": "2026-06-01T11:15:00Z" },
  "updatedAt": { "$date": "2026-06-01T11:15:00Z" }
}
```

```json
{
  "_id": { "$oid": "664a9f2e3c4b5d6e7f8a9b02" },
  "phone": "052-9876543",
  "identityNumber": "098765432",
  "fullName": "אסתר לוי",
  "email": "ester.levi@example.com",
  "createdAt": { "$date": "2026-06-02T09:00:00Z" },
  "updatedAt": { "$date": "2026-06-02T09:00:00Z" }
}
```



---

### `announcements` – Example Document

```json
{
  "_id": { "$oid": "664a3b4c5d6e7f8a9b0c1d2e" },
  "title": "חג שבועות שמח!",
  "body": "המרכז יהיה סגור ב-2 ביוני לרגל חג השבועות. פעילויות יתחדשו כרגיל ב-3 ביוני. מאחלים לכולם חג שמח ומשמח!",
  "publishedAt": { "$date": "2026-05-28T08:00:00Z" },
  "createdAt": { "$date": "2026-05-28T08:00:00Z" },
  "createdBy": { "$oid": "664a0000000000000000001a" },
  "updatedAt": { "$date": "2026-05-28T08:00:00Z" }
}
```

```json
{
  "_id": { "$oid": "664a3b4c5d6e7f8a9b0c1d2f" },
  "title": "קבוצת ציור חדשה נפתחת",
  "body": "אנו שמחים להודיע על פתיחת קבוצת ציור חדשה בימי רביעי בשעה 16:00. ההרשמה פתוחה לכלל המשתתפים.",
  "publishedAt": { "$date": "2026-06-03T10:00:00Z" },
  "createdAt": { "$date": "2026-06-03T10:00:00Z" },
  "createdBy": { "$oid": "664a0000000000000000001a" },
  "updatedAt": { "$date": "2026-06-03T10:00:00Z" }
}
```

---

### `gallery` – Example Document

```json
{
  "_id": { "$oid": "664a4c5d6e7f8a9b0c1d2e3f" },
  "filename": "event_yoga_june2026.jpg",
  "originalName": "yoga_class_photo.jpg",
  "url": "/uploads/gallery/event_yoga_june2026.jpg",
  "altText": "משתתפים בשיעור יוגה במרכז בית הופמן",
  "uploadedBy": { "$oid": "664a0000000000000000001a" },
  "uploadedAt": { "$date": "2026-06-01T12:00:00Z" }
}
```

```json
{
  "_id": { "$oid": "664a4c5d6e7f8a9b0c1d2e40" },
  "filename": "cultural_tour_may2026.jpg",
  "originalName": "museum_tour_group.jpg",
  "url": "/uploads/gallery/cultural_tour_may2026.jpg",
  "altText": "קבוצת משתתפים בסיור תרבותי במוזיאון ישראל",
  "uploadedBy": { "$oid": "664a0000000000000000001a" },
  "uploadedAt": { "$date": "2026-05-20T14:30:00Z" }
}
```

---

### `contacts` – Example Document

```json
{
  "_id": { "$oid": "664a5d6e7f8a9b0c1d2e3f4a" },
  "name": "דוד לוי",
  "email": "david.levi@example.com",
  "subject": "שאלה לגבי הסעות",
  "message": "שלום, האם קיימת אפשרות של הסעות למרכז עבור קשישים שאינם יכולים להגיע בכוחות עצמם? תודה רבה.",
  "submittedAt": { "$date": "2026-06-04T14:30:00Z" },
  "isRead": false
}
```

---

### `administrators` – Example Document

```json
{
  "_id": { "$oid": "664a0000000000000000001a" },
  "username": "miriam_admin",
  "passwordHash": "$2b$12$eImiTXuWVxfM37uY4JANjQe5PqfQbLMVFzAGe7mV9fAq2yqMhV1OG",
  "displayName": "מרים בן-דוד",
  "createdAt": { "$date": "2026-01-15T09:00:00Z" },
  "lastLoginAt": { "$date": "2026-06-07T08:45:00Z" }
}
```

---

### `center_info` – Example Document

```json
{
  "_id": { "$oid": "664a6e7f8a9b0c1d2e3f4a5b" },
  "centerName": "מרכז בית הופמן",
  "address": "רחוב הרצל 45, ירושלים, 9410201",
  "phone": "02-5551234",
  "email": "info@beit-hoffman.org.il",
  "openingHours": [
    { "day": "ראשון",  "open": "08:00", "close": "18:00", "closed": false },
    { "day": "שני",   "open": "08:00", "close": "18:00", "closed": false },
    { "day": "שלישי", "open": "08:00", "close": "18:00", "closed": false },
    { "day": "רביעי", "open": "08:00", "close": "18:00", "closed": false },
    { "day": "חמישי", "open": "08:00", "close": "16:00", "closed": false },
    { "day": "שישי",  "open": "08:00", "close": "13:00", "closed": false },
    { "day": "שבת",   "open": null,    "close": null,    "closed": true  }
  ],
  "aboutContent": "מרכז בית הופמן הוא מרכז פעילות ותרבות לבני הגיל השלישי בירושלים. אנו מציעים מגוון רחב של פעילויות גופניות, תרבותיות וחברתיות במטרה לשפר את איכות החיים של הקשישים בקהילה.",
  "googleMapsEmbedUrl": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d....",
  "updatedAt": { "$date": "2026-06-05T10:00:00Z" },
  "updatedBy": { "$oid": "664a0000000000000000001a" }
}
```

---

*End of Data Schema Document*
