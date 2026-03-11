  
**SPATIAL COLLECTIVE**

**LEARN PLATFORM**

**Product Requirements Document**

Feature Expansion — 2026

Version 1.0  ·  March 2026  ·  Confidential

learn.spatialcollective.co.ke

**Features Covered in This Document**

| 01  Youth Personal Profile | 02  Notification Centre |
| :---: | :---: |
| **03  New QGIS Digitization Workflow** |  |

# **1\. Overview & Context**

The Spatial Collective Learn Platform currently serves 148 active youth participants across two training modules  Digitization and Mobile Mapping. This PRD defines requirements for three new features that represent a significant evolution of the platform: a richer experience for youth participants, improved admin communication tools, and a completely new digitization pipeline moving away from HOT Tasking Manager and OpenStreetMap toward a QGIS-based workflow.

**Platform:** learn.spatialcollective.co.ke

**Stack:** Next.js 16, React 19, TypeScript, PostgreSQL (Neon), Vercel

**Current Users:** 148 youth participants, 12 trainers, staff & admins

**Document Version:** 1.0 — March 2026

**Status:** Draft — Pending Engineering Review

# **2\. Feature 01 — Youth Personal Profile**

## **2.1  Problem Statement**

Youth participants currently have no personalised view of their own performance and progress. All data lives in admin dashboards, meaning youth must ask trainers for updates on their work history, days worked, and how much of their contract remains. This creates unnecessary back-and-forth and reduces participant ownership and motivation.

## **2.2  Goal**

Give every youth participant a dedicated personal profile page they can access after logging in a single view that tells them exactly where they stand, what they have achieved, and what is left to complete.

## **2.3  User Stories**

* As a youth participant, I want to see a summary of all the work I have done so I can track my own progress without asking my trainer.

* As a youth participant, I want to know how many days I have worked and how many days are remaining on my contract so I can plan accordingly.

* As a youth participant, I want to see a history of my daily submissions so I can verify my records are correct.

* As a trainer, I want youth to self-serve on their progress data so I spend less time answering individual queries.

* As an admin, I want each profile to reflect accurate, real-time data pulled from the existing database.

## **2.4  Scope**

| Item | Detail |
| :---- | :---- |
| In Scope | Personal profile page, work summary stats, days worked vs days remaining, daily work history log, module progress indicator |
| Out of Scope | Youth ability to edit their own records, peer-to-peer profile visibility, gamification/leaderboards (future consideration) |
| Affected Roles | Youth Participants (primary), Trainers & Admins (read-only view of any profile) |

## **2.5  Functional Requirements**

**Profile Summary Card**

* Full name, profile photo placeholder/avatar, module enrolled in, trainer name, cohort/group

* Contract start date, contract end date, total contracted days

* Days worked (count of days with confirmed attendance or submission)

* Days remaining (contracted days minus days worked)

* Visual progress bar showing % of contract completed

**Work Statistics Panel**

* Total buildings digitised (for Digitization module)

* Total field submissions (for Mobile Mapping module)

* Average daily output

* Best day output

* Attendance rate (% of scheduled days attended)

**Daily Work History Log**

* Paginated table: Date | Module | Output (buildings/submissions) | Status (verified / pending)

* Filterable by date range and status

* Read-only — no youth editing

**Training Progress Indicator**

* Checklist of training modules completed vs pending

* Date each module was completed

* For QGIS Digitization module: shows QGIS training completion status (see Feature 03\)

## **2.6  Non-Functional Requirements**

* Profile page must load within 2 seconds on a 3G connection

* Data must be pulled live from the existing PostgreSQL database — no separate data store

* Mobile responsive — many youth access the platform on phones

* Only the individual youth (and admins/trainers) can view a profile — no public access

## **2.7  Data Sources (Existing Tables)**

| The profile will aggregate data already present in the platform database: |
| :---- |
| • Attendance records → days worked count |
| • Work performance metrics → output stats (buildings, submissions) |
| • Contract table → contracted days, start/end dates |
| • Training completion table → module progress |
| • User/youth table → name, trainer assignment, cohort |
| *Note: No new data collection is required for this feature — only new UI.* |

## **2.8  Acceptance Criteria**

* Youth can log in and navigate to their profile in one click from the dashboard

* All stats reflect the current state of the database with no manual refresh needed

* Days remaining never displays a negative number — floors at 0

* History log loads correctly for youth with 0 days worked (empty state handled)

* Admins can view any youth profile by searching from the admin panel

# 

# 

# 

# **3\. Feature 02 — Notification Centre**

## **3.1  Problem Statement**

There is currently no structured channel for admins to communicate with youth participants or trainers at scale within the platform. Surveys, announcements, and important updates are distributed ad hoc through WhatsApp or in person, making it difficult to track who has seen or responded to communications.

## **3.2  Goal**

Build an in-platform Notification Centre where admins can send targeted announcements and survey links to youth participants and trainers. Youth receive notifications in-app and are clearly shown which require action (e.g. completing a survey).

## **3.3  User Stories**

* As an admin, I want to send a survey link to all youth in a specific module so I can collect feedback without using WhatsApp.

* As an admin, I want to see which youth have opened/acknowledged a notification so I can follow up with those who have not.

* As a youth participant, I want a clear, simple notification inbox so I know when there is something I need to do.

* As a youth participant, I want notifications to be visible when I log in so I do not miss important communications.

* As a trainer, I want to receive relevant admin notifications so I am always aligned with the programme team.

## **3.4  Scope**

| Item | Detail |
| :---- | :---- |
| In Scope | Admin notification composer, audience targeting (all youth / by module / by trainer group), survey link distribution, read/acknowledged status tracking, youth notification inbox |
| Out of Scope | In-platform survey builder (surveys remain external e.g. Google Forms, ODK), push notifications to mobile devices (Phase 2), two-way messaging between youth and admin |
| Affected Roles | Admins & Superadmins (send), Youth Participants & Trainers (receive) |

## 

## 

## 

## **3.5  Functional Requirements**

**Admin — Notification Composer**

* Title field (required, max 100 characters)

* Message body (required, max 500 characters, plain text)

* Optional: attach a URL link (survey link, document, etc.) with custom link label

* Audience selector: All Youth | All Trainers | By Module (Digitization / Mobile Mapping) | By Trainer Group | Individual

* Schedule: Send now OR schedule for a future date/time

* Preview notification before sending

* Sent notifications log with timestamp, audience size, and read rate

**Youth & Trainer — Notification Inbox**

* Bell icon in the main navigation with unread count badge

* Inbox list: title, short preview, date, read/unread indicator

* Clicking a notification marks it as read and expands full message

* Survey/link notifications show a clear action button: 'Open Survey'

* Empty state message when inbox is clear

* Notifications older than 60 days are archived (not deleted)

**Read & Acknowledgement Tracking**

* System records when each recipient opens a notification (timestamp)

* Admin dashboard shows per-notification: Total Sent | Opened | Not Yet Opened

* Admin can export the list of youth who have not opened a critical notification

## **3.6  Non-Functional Requirements**

* Notification delivery within the platform must be instant (no email or SMS required in Phase 1\)

* System must support sending to up to 500 recipients in a single notification

* Notification data stored in PostgreSQL alongside existing platform data

* All notifications logged for audit purposes and never permanently deleted

## 

## 

## 

## 

## 

## **3.7  Database Requirements**

| New tables required: |
| :---- |
| • notifications — id, title, body, link\_url, link\_label, sender\_id, audience\_type, scheduled\_at, sent\_at, created\_at |
| • notification\_recipients — id, notification\_id, user\_id, delivered\_at, read\_at |
|  |
| These integrate with the existing users table for audience resolution. |

## **3.8  Acceptance Criteria**

* Admin can compose and send a notification in under 2 minutes

* All targeted youth see the notification in their inbox on next login

* Unread badge count updates in real time after login

* Admin read-rate report is accurate to within 1 minute of a youth opening a notification

* Scheduled notifications fire within 5 minutes of the scheduled time

* Survey link opens correctly on mobile browsers

# **4\. Feature 03 — New QGIS Digitization Workflow**

## **4.1  Problem Statement & Strategic Context**

The current digitization workflow relies on HOT Tasking Manager and OpenStreetMap (OSM). The programme is moving away from this stack entirely and adopting QGIS as the primary digitization tool. This is a fundamental change in how mappers work — the tools, the file formats, the submission process, and the quality validation process all change.

| Why QGIS over HOT Tasking Manager / OSM: |
| :---- |
| • Greater control over data quality and project-specific schemas |
| • Ability to work with proprietary or sensitive datasets not suitable for OSM |
| • Richer attribute capture beyond basic OSM tags |
| • Offline-capable workflow suitable for field conditions |
| • Scalable to new project types beyond building footprints |

## **4.2  New Workflow Overview**

The new end-to-end digitization workflow operates as follows:

| Step | Owner | Description |
| :---- | :---- | :---- |
| 1\. Task Distribution | Trainer (on ground) | Trainer assigns digitization area/task to each mapper verbally or via a printed/shared area reference. No digital task management tool. |
| 2\. QGIS Training | Platform (Learn) | Mapper completes QGIS training modules on the Learn platform before being permitted to begin live digitization work. |
| 3\. Digitization Work | Mapper | Mapper opens QGIS on their laptop/device, digitises their assigned area using project-specific layers and schema provided by the trainer. |
| 4\. Local Save | Mapper | Mapper saves their completed QGIS project file (.qgz) and output layers locally on their device at end of each day. |
| 5\. Daily Collection | Trainer | Trainer physically collects output files from each mapper (USB / direct transfer) at the end of the working day. |
| 6\. Google Drive Upload | Trainer | Trainer uploads all collected files into the designated project Google Drive folder. Folder structure: /Project/Date/TrainerGroup/MapperName/ |
| 7\. Validation | Platform (Learn) | Platform displays validation results for submitted files — completeness check, schema compliance, geometry validity. |
| 8\. Review | Admin / QC Team | Admin reviews validation results on the platform and flags any files requiring rework by the mapper. |

## **4.3  Platform Responsibilities**

The Learn platform does not manage task assignment or file transfer — those happen offline. The platform is responsible for two things in this new workflow:

**4.3.1  QGIS Training Modules**

* Dedicated training section on the platform specifically for the new QGIS digitization workflow

* Structured, step-by-step training content covering:

  * Introduction to QGIS interface — panels, toolbars, project setup

  * Loading and understanding provided base layers and satellite imagery

  * Digitizing building footprints — polygon creation, snapping, reshaping

  * Attribute entry — filling in required fields per the project schema

  * Saving and exporting — correct file formats and naming conventions

  * Common errors and how to fix them

  * Daily save checklist before handing over to trainer

* Training content format: step-by-step written guides with annotated screenshots

* Each training section has a short knowledge check (multiple choice) before the mapper can proceed to the next section

* Training completion is recorded per youth and visible on their Personal Profile (Feature 01\)

* Trainers and admins can see which youth have and have not completed QGIS training

* Training content is managed by admins — ability to update text and images without code deployment

**4.3.2  Validation Results Display**

* After trainer uploads files to the designated Google Drive folder, a validation process runs and results are surfaced in the platform

* Validation checks performed:

  * File naming convention compliance (correct mapper name, date format)

  * Required attribute fields populated (no empty mandatory fields)

  * Geometry validity (no self-intersecting polygons, no null geometries)

  * Projection/CRS matches project requirement

  * Feature count within expected daily range (e.g. not suspiciously low or high)

* Validation results displayed per file, per mapper, per day

* Each result shows: PASS / FAIL / WARNING with a specific reason for any failure

* Admin can mark a failed submission as 'Requires Rework' — this triggers a notification to the youth (via Feature 02 Notification Centre)

* Rework submissions are tracked — mapper name, original submission date, rework date, resolution status

## **4.4  Scalability Considerations**

This workflow is designed to scale beyond the current 53 digitization participants. The following principles must guide implementation:

* No hard-coded participant limits — the platform must handle 500+ active digitization mappers

* Google Drive integration should use a service account with folder-level permissions, not personal accounts

* Validation pipeline must be asynchronous — large batches of files should not block the UI

* Training content system must support multiple projects with different QGIS workflows (e.g. roads project, buildings project, land use project)

* All validation logic should be configurable per project — different schema rules for different projects

## **4.5  Google Drive Integration**

| Folder structure convention (enforced by platform validation): |
| :---- |
|   /DPW-Digitization / \[Project Name\] / \[YYYY-MM-DD\] / \[Trainer Group\] / \[Mapper Full Name\] / |
|  |
| Files expected per mapper per day: |
|   • \[MapperName\]\_\[Date\]\_buildings.gpkg  (GeoPackage output layer) |
|   • \[MapperName\]\_\[Date\]\_project.qgz     (QGIS project file — optional but encouraged) |
|  |
| Platform will monitor the Drive folder for new uploads and trigger validation automatically. |
| *Note: Google Drive API (service account) integration required — credentials managed via environment variables.* |

## **4.6  Non-Functional Requirements**

* Validation results available within 10 minutes of a file being uploaded to Drive

* Training module system supports images and formatted text  no video hosting required in Phase 1

* Platform must remain functional even if Google Drive API is temporarily unavailable (graceful degradation  show last known validation state)

* All file validation events logged with timestamp for audit trail

## **4.7  Acceptance Criteria**

* A new mapper can complete the full QGIS training module sequence on the platform before starting field work

* Training completion status is correctly reflected on the Youth Personal Profile

* Admin can update training content (text, images) without a code deployment

* After a trainer uploads files to the correct Drive folder, validation results appear on the platform within 10 minutes

* Failed validations clearly state the reason (e.g. 'Missing attribute: building\_type')

* Admin can filter validation results by date, trainer group, and mapper

* Rework requests trigger a notification to the relevant youth via the Notification Centre

# **5\. Dependencies & Risks**

| Item | Detail |
| :---- | :---- |
| Google Drive API | Feature 03 requires a Google Drive service account and API access. Must be set up before validation pipeline development begins. |
| QGIS Project Schema | Training content and validation rules depend on the project schema being finalised first by the GIS team. |
| Existing Database | Features 01 and 02 read from existing tables. Schema changes (if any) must not break existing admin dashboards. |
| File Naming Convention | Validation logic is tightly coupled to the agreed folder/file naming convention. Changes after launch will require re-engineering. |
| Trainer Device Access | Daily file collection by trainers via USB assumes mappers have devices. Platform cannot compensate for hardware gaps. |
| Internet Connectivity | Validation results require trainers to have internet access when uploading to Drive. Offline fallback not in scope. |

# **6\. Priority & Suggested Phasing**

| Phase | Features |
| :---- | :---- |
| Phase 1 (Immediate) | Youth Personal Profile — highest youth-facing impact, uses existing data, no new integrations required. |
| Phase 2 (Following) | Notification Centre — moderate complexity, new database tables required, high operational value for admin team. |
| Phase 3 (Parallel track) | QGIS Training Modules — can begin content creation and UI in parallel with Phase 2\. Drive integration is the long lead item. |
| Phase 4 (Complete) | QGIS Validation Pipeline — depends on Drive API setup, schema finalisation, and training modules being live first. |

## **6.1  Open Questions**

* Will the Google Drive folder be managed by Spatial Collective or the client / DPW programme?

* Who is responsible for creating and maintaining the QGIS training content  GIS team or programme team?

* Should QGIS training completion be a hard gate before a mapper's attendance is counted, or just informational?

* Will the validation pipeline need to support GeoJSON in addition to GeoPackage (.gpkg)?

* Are there plans to expand to a third module in 2026 that this PRD should account for?

# **7\. Success Metrics**

| Feature | Success Metric |
| :---- | :---- |
| Youth Personal Profile | 80%+ of active youth visit their profile at least once per week within 4 weeks of launch |
| Youth Personal Profile | Trainer queries about individual progress data reduce by 50% within 6 weeks of launch |
| Notification Centre | 90%+ open rate for notifications within 48 hours of sending, measured across all recipients |
| Notification Centre | 100% of survey distributions moved from WhatsApp to in-platform within 8 weeks of launch |
| QGIS Training | 100% of active digitization mappers complete QGIS training before beginning live work |
| QGIS Validation | Average validation turnaround under 10 minutes for batches of up to 100 files |
| QGIS Validation | Rework rate decreases by 30% within 2 months as mappers learn from validation feedback |

