# Database Migration Report
Generated: 2026-02-03T14:14:34.310Z

## Executive Summary

This report provides a comprehensive overview of the current Learn Platform database
to facilitate migration/integration with DPW Manager (app.spatialcollective.com).

### Database Statistics

- **Total Tables**: 18
- **Total Records**: 18,733
- **Foreign Key Relationships**: 16
- **Backup Location**: C:\Users\primo\OneDrive\Desktop\learn\backups\full-database-backup\backup-2026-02-03T14-14-13

## Table Overview


### attendance_records
- **Row Count**: 1,438
- **Columns**: 6
  - id (integer) NOT NULL
  - youth_id (character varying(20)) NOT NULL
  - attendance_date (date) NOT NULL
  - submitted_at (timestamp with time zone) NULL
  - submitted_by (character varying(50)) NOT NULL
  - notes (text) NULL


### audit_log
- **Row Count**: 12,597
- **Columns**: 10
  - audit_id (uuid) NOT NULL
  - table_name (character varying(100)) NOT NULL
  - record_id (character varying(100)) NOT NULL
  - operation (character varying(10)) NOT NULL
  - old_data (jsonb) NULL
  - new_data (jsonb) NULL
  - changed_by (character varying(50)) NULL
  - changed_at (timestamp with time zone) NULL
  - ip_address (inet) NULL
  - session_id (character varying(100)) NULL


### auth_logs
- **Row Count**: 2,292
- **Columns**: 9
  - log_id (uuid) NOT NULL
  - user_id (character varying(50)) NOT NULL
  - user_type (character varying(20)) NOT NULL
  - action (character varying(50)) NOT NULL
  - success (boolean) NOT NULL
  - ip_address (character varying(100)) NULL
  - user_agent (text) NULL
  - error_message (text) NULL
  - created_at (timestamp with time zone) NULL


### contract_templates
- **Row Count**: 3
- **Columns**: 10
  - template_id (uuid) NOT NULL
  - program_type (character varying(50)) NOT NULL
  - version (character varying(50)) NOT NULL
  - title (character varying(500)) NOT NULL
  - content (text) NOT NULL
  - pdf_url (text) NULL
  - is_active (boolean) NULL
  - created_by (character varying(50)) NULL
  - created_at (timestamp with time zone) NULL
  - updated_at (timestamp with time zone) NULL


### modules
- **Row Count**: 4
- **Columns**: 9
  - id (integer) NOT NULL
  - name (character varying(255)) NOT NULL
  - slug (character varying(255)) NOT NULL
  - description (text) NULL
  - icon (character varying(100)) NULL
  - display_order (integer) NOT NULL
  - is_active (boolean) NULL
  - created_at (timestamp with time zone) NULL
  - updated_at (timestamp with time zone) NULL


### roles
- **Row Count**: 2
- **Columns**: 9
  - id (integer) NOT NULL
  - module_id (integer) NOT NULL
  - name (character varying(255)) NOT NULL
  - slug (character varying(255)) NOT NULL
  - description (text) NULL
  - display_order (integer) NOT NULL
  - is_active (boolean) NULL
  - created_at (timestamp with time zone) NULL
  - updated_at (timestamp with time zone) NULL


### settlement_work_config
- **Row Count**: 4
- **Columns**: 12
  - config_id (uuid) NOT NULL
  - settlement (character varying(100)) NOT NULL
  - program_type (character varying(50)) NOT NULL
  - start_date (date) NOT NULL
  - end_date (date) NULL
  - total_work_days (integer) NULL
  - daily_target (integer) NULL
  - project_hashtag (character varying(100)) NULL
  - timezone (character varying(50)) NULL
  - is_active (boolean) NULL
  - created_at (timestamp with time zone) NULL
  - updated_at (timestamp with time zone) NULL


### settlements
- **Row Count**: 3
- **Columns**: 9
  - settlement_id (integer) NOT NULL
  - settlement_name (character varying(100)) NOT NULL
  - settlement_code (character varying(10)) NULL
  - region (character varying(100)) NULL
  - county (character varying(100)) NULL
  - timezone (character varying(50)) NULL
  - is_active (boolean) NULL
  - created_at (timestamp with time zone) NULL
  - updated_at (timestamp with time zone) NULL


### signed_contracts
- **Row Count**: 2
- **Columns**: 12
  - contract_id (uuid) NOT NULL
  - youth_id (character varying(50)) NOT NULL
  - template_id (uuid) NOT NULL
  - signature_data (text) NOT NULL
  - ip_address (character varying(100)) NULL
  - user_agent (text) NULL
  - signed_at (timestamp with time zone) NULL
  - pdf_url (text) NULL
  - is_valid (boolean) NULL
  - invalidated_at (timestamp with time zone) NULL
  - invalidated_by (character varying(50)) NULL
  - invalidation_reason (text) NULL


### staff_members
- **Row Count**: 14
- **Columns**: 10
  - staff_id (character varying(50)) NOT NULL
  - full_name (character varying(255)) NOT NULL
  - email (character varying(255)) NULL
  - role (character varying(20)) NOT NULL
  - is_active (boolean) NULL
  - created_at (timestamp with time zone) NULL
  - updated_at (timestamp with time zone) NULL
  - last_login (timestamp with time zone) NULL
  - phone_number (character varying(50)) NULL
  - created_by (character varying(50)) NULL


### training_sections
- **Row Count**: 0
- **Columns**: 11
  - id (integer) NOT NULL
  - role_id (integer) NOT NULL
  - title (character varying(500)) NOT NULL
  - content_type (USER-DEFINED) NULL
  - content (text) NOT NULL
  - display_order (integer) NOT NULL
  - parent_section_id (integer) NULL
  - is_required (boolean) NULL
  - estimated_time (integer) NULL
  - created_at (timestamp with time zone) NULL
  - updated_at (timestamp with time zone) NULL


### user_progress
- **Row Count**: 0
- **Columns**: 8
  - id (integer) NOT NULL
  - user_id (integer) NOT NULL
  - section_id (integer) NOT NULL
  - completed_at (timestamp with time zone) NULL
  - notes (text) NULL
  - time_spent (integer) NULL
  - created_at (timestamp with time zone) NULL
  - updated_at (timestamp with time zone) NULL


### users
- **Row Count**: 0
- **Columns**: 7
  - id (integer) NOT NULL
  - email (character varying(255)) NOT NULL
  - name (character varying(255)) NOT NULL
  - role (USER-DEFINED) NULL
  - is_active (boolean) NULL
  - created_at (timestamp with time zone) NULL
  - updated_at (timestamp with time zone) NULL


### youth_notifications
- **Row Count**: 1
- **Columns**: 10
  - notification_id (uuid) NOT NULL
  - youth_id (character varying(50)) NOT NULL
  - title (character varying(255)) NOT NULL
  - message (text) NOT NULL
  - type (character varying(50)) NULL
  - is_read (boolean) NULL
  - is_hidden (boolean) NULL
  - auto_expire_at (timestamp with time zone) NULL
  - created_at (timestamp with time zone) NULL
  - updated_at (timestamp with time zone) NULL


### youth_osm_stats
- **Row Count**: 489
- **Columns**: 10
  - stats_id (uuid) NOT NULL
  - youth_id (character varying(50)) NOT NULL
  - osm_username (character varying(255)) NOT NULL
  - date (date) NOT NULL
  - buildings_mapped (integer) NULL
  - changesets_analyzed (integer) NULL
  - last_changeset_id (bigint) NULL
  - last_upload_time (timestamp with time zone) NULL
  - created_at (timestamp with time zone) NULL
  - updated_at (timestamp with time zone) NULL


### youth_participants
- **Row Count**: 206
- **Columns**: 17
  - youth_id (character varying(50)) NOT NULL
  - full_name (character varying(255)) NOT NULL
  - email (character varying(255)) NULL
  - phone_number (character varying(50)) NULL
  - program_type (character varying(50)) NOT NULL
  - is_active (boolean) NULL
  - created_at (timestamp with time zone) NULL
  - updated_at (timestamp with time zone) NULL
  - last_login (timestamp with time zone) NULL
  - osm_username (character varying(255)) NULL
  - settlement (character varying(100)) NULL
  - module_assignment (character varying(20)) NULL
  - exception_hashtags (ARRAY) NULL
  - work_email (character varying(255)) NULL
  - odk_token (text) NULL
  - odk_actor_id (integer) NULL
  - odk_configured_at (timestamp with time zone) NULL


### youth_training_progress
- **Row Count**: 746
- **Columns**: 6
  - progress_id (uuid) NOT NULL
  - youth_id (character varying(50)) NOT NULL
  - module_type (character varying(20)) NOT NULL
  - step_id (integer) NOT NULL
  - completed_at (timestamp with time zone) NULL
  - updated_at (timestamp with time zone) NULL


### youth_work_days
- **Row Count**: 932
- **Columns**: 14
  - work_day_id (uuid) NOT NULL
  - youth_id (character varying(50)) NOT NULL
  - work_date (date) NOT NULL
  - buildings_count (integer) NULL
  - hours_worked (numeric) NULL
  - daily_target (integer) NULL
  - target_met (boolean) NULL
  - status (character varying(20)) NULL
  - notes (text) NULL
  - approved_by (character varying(50)) NULL
  - approved_at (timestamp with time zone) NULL
  - rejection_reason (text) NULL
  - created_at (timestamp with time zone) NULL
  - updated_at (timestamp with time zone) NULL


## Foreign Key Relationships

- `attendance_records.youth_id` → `youth_participants.youth_id` (ON DELETE: NO ACTION, ON UPDATE: NO ACTION)
- `contract_templates.created_by` → `staff_members.staff_id` (ON DELETE: SET NULL, ON UPDATE: NO ACTION)
- `roles.module_id` → `modules.id` (ON DELETE: CASCADE, ON UPDATE: NO ACTION)
- `signed_contracts.invalidated_by` → `staff_members.staff_id` (ON DELETE: SET NULL, ON UPDATE: NO ACTION)
- `signed_contracts.template_id` → `contract_templates.template_id` (ON DELETE: CASCADE, ON UPDATE: NO ACTION)
- `signed_contracts.youth_id` → `youth_participants.youth_id` (ON DELETE: CASCADE, ON UPDATE: NO ACTION)
- `staff_members.created_by` → `staff_members.staff_id` (ON DELETE: SET NULL, ON UPDATE: NO ACTION)
- `training_sections.parent_section_id` → `training_sections.id` (ON DELETE: CASCADE, ON UPDATE: NO ACTION)
- `training_sections.role_id` → `roles.id` (ON DELETE: CASCADE, ON UPDATE: NO ACTION)
- `user_progress.section_id` → `training_sections.id` (ON DELETE: CASCADE, ON UPDATE: NO ACTION)
- `user_progress.user_id` → `users.id` (ON DELETE: CASCADE, ON UPDATE: NO ACTION)
- `youth_notifications.youth_id` → `youth_participants.youth_id` (ON DELETE: CASCADE, ON UPDATE: NO ACTION)
- `youth_osm_stats.youth_id` → `youth_participants.youth_id` (ON DELETE: CASCADE, ON UPDATE: NO ACTION)
- `youth_training_progress.youth_id` → `youth_participants.youth_id` (ON DELETE: CASCADE, ON UPDATE: NO ACTION)
- `youth_work_days.approved_by` → `staff_members.staff_id` (ON DELETE: SET NULL, ON UPDATE: NO ACTION)
- `youth_work_days.youth_id` → `youth_participants.youth_id` (ON DELETE: CASCADE, ON UPDATE: NO ACTION)

## Critical Tables for Migration

### 1. User Authentication
- **staff_members**: 14 staff accounts
- **youth_participants**: 206 youth accounts
- **auth_logs**: 2292 authentication events

### 2. Training & Progress
- **youth_training_progress**: 746 progress records
- **contract_templates**: 3 templates
- **signed_contracts**: 2 signed contracts

### 3. Work Tracking
- **youth_work_days**: 932 work day records
- **youth_osm_stats**: 489 OSM statistics
- **youth_work_summary**: 206 work summaries
- **settlement_work_config**: 4 configurations

### 4. Attendance
- **attendance_records**: 1438 attendance records

## Integration Considerations

### Shared User Base
Both platforms share the same group of users. Key considerations:
1. **User ID Format**: Learn uses `KAY123`, `KAR456`, etc.
2. **Authentication**: Currently separate JWT systems
3. **User Profile Data**: Needs to be synchronized

### Data Synchronization
Current sync mechanism:
- DPW Sync API (`/api/external/dpw-sync`) provides read-only access
- API Key authentication
- Query by youth_id or module

### Recommended Migration Path
1. **Phase 1**: Centralize authentication
2. **Phase 2**: Merge user databases
3. **Phase 3**: Sync work tracking data
4. **Phase 4**: Unified contract management
5. **Phase 5**: Real-time data synchronization

## Next Steps

1. Review this backup with DPW Manager team
2. Identify schema conflicts/overlaps
3. Design unified authentication flow
4. Create data migration scripts
5. Test in staging environment

---

**Backup Files:**
- Metadata: `metadata.json`
- Table Data: `json/*.json`
- SQL Dump: `sql/full-backup.sql`
- Relationships: `relationships.json`
