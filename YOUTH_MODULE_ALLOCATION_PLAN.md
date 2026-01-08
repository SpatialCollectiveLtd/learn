# Youth Module Allocation - Implementation Plan

**Date:** January 7, 2026  
**Total Youth:** 300  
**Allocated:** 291  
**Missing IDs:** 9

## Executive Summary

Analysis of 300 registered youth for allocation to 4 program modules:
- **Digitization** (existing): 45 youth already trained and active
- **Microtasking** (new): 63 youth with disabilities  
- **Mobile Mapping** (new): 91 youth
- **Household Survey** (new): 92 youth

### Key Findings

1. **Current Digitization Status**
   - 61 youth registered in digitization module
   - 59 of those are in the new 300-youth list
   - **Only 2 dropouts** (not 20 as expected)
     - KAR405DM - Denis Musau (likely duplicate ID issue)
     - KAYTEST001ES - Test Youth (testing account)

2. **Settlement Distribution**
   - Kayole Soweto: 169 youth (56%)
   - Kariobangi: 66 youth (22%)
   - Mji wa Huruma: 56 youth (19%)
   - Missing settlement: 9 youth (3% - missing IDs)

3. **Youth with Disabilities:** 63 total
   - Vision impairments: 25
   - Mobility challenges: 20
   - Cognitive difficulties: 18
   - Hearing impairments: 8
   - Communication challenges: 15
   - Self-care needs: 12
   - Cannot perform activities: 8
   - (Some have multiple disabilities)

4. **Missing Unique IDs:** 9 youth
   - All from Kariobangi and Mji wa Huruma
   - Need manual ID assignment before database registration

---

## Module Allocation Breakdown

### 1. Digitization Module (45 youth)
**Criteria:** Already registered and completed training  
**Settlement Breakdown:**
- Kayole Soweto: 19 youth
- Kariobangi: 20 youth  
- Mji wa Huruma: 6 youth

**Status:** Already in system with OSM usernames  
**Action Required:** None - keep existing assignments

---

### 2. Microtasking Module (63 youth)
**Criteria:** All youth with disabilities  
**Settlement Breakdown:**
- Kayole Soweto: 42 youth
- Kariobangi: 13 youth
- Mji wa Huruma: 8 youth

**Disability Categories:**
- Severe disabilities (cannot do at all): 8 youth → Priority for microtasking
- Moderate disabilities (a lot of difficulty): 18 youth
- Mild disabilities (some difficulty): 37 youth

**Rationale:** Microtasking offers flexible, accessible work suitable for various abilities. Tasks can be completed remotely, with adaptive tools, and at individual pace.

**Examples of Microtasking Work:**
- Image classification and tagging
- Data verification and quality control
- Text transcription
- Audio labeling
- Digital surveys and assessments

---

### 3. Mobile Mapping Module (91 youth)
**Criteria:** 50% of remaining youth after digitization and microtasking allocation  
**Settlement Breakdown:**
- Kayole Soweto: 51 youth
- Kariobangi: 23 youth
- Mji wa Huruma: 17 youth

**Requirements:**
- Smartphone ownership/access
- GPS capability
- Mobile data/WiFi access
- Physical mobility to survey areas
- Basic digital literacy

**Module Description:**
- Field-based data collection using mobile apps
- GPS point collection (buildings, amenities, infrastructure)
- Photo documentation
- Street-level mapping
- Ground truth verification

---

### 4. Household Survey Module (92 youth)
**Criteria:** Remaining 50% after other allocations  
**Settlement Breakdown:**
- Kayole Soweto: 52 youth
- Kariobangi: 23 youth
- Mji wa Huruma: 17 youth

**Requirements:**
- Strong interpersonal/communication skills
- Fluency in local languages (Swahili, English)
- Reliability and punctuality
- Professional demeanor
- Basic literacy and numeracy

**Module Description:**
- Door-to-door household surveys
- Community data collection
- Demographic and socioeconomic data gathering
- Paper or digital survey forms
- Data quality assurance

---

## Database Schema Plan

### Current Schema
```sql
youth_participants table:
- youth_id VARCHAR (Primary Key)
- full_name VARCHAR
- email VARCHAR
- phone_number VARCHAR
- program_type VARCHAR  -- Currently 'digitization'
- is_active BOOLEAN
- created_at TIMESTAMP
- updated_at TIMESTAMP
- last_login TIMESTAMP
- osm_username VARCHAR
- settlement VARCHAR
- module_assignment VARCHAR  -- EXISTING but unused
```

### Schema Updates Required

#### 1. Add New Tables

**A. Youth Personal Info (Extended)**
```sql
CREATE TABLE youth_personal_info (
  youth_id VARCHAR PRIMARY KEY REFERENCES youth_participants(youth_id),
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  id_number VARCHAR UNIQUE,
  date_of_birth DATE,
  age INTEGER,
  gender VARCHAR(10),
  ward VARCHAR(100),
  has_disability BOOLEAN DEFAULT FALSE,
  disability_details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**B. Module Definitions**
```sql
CREATE TABLE program_modules (
  module_id SERIAL PRIMARY KEY,
  module_name VARCHAR(50) UNIQUE NOT NULL,
  module_description TEXT,
  settlement VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  daily_target INTEGER,
  payment_rate_per_unit DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO program_modules (module_name, module_description, daily_target, payment_rate_per_unit) VALUES
('digitization', 'Building digitization using JOSM and OSM', 200, 1.00),
('microtasking', 'Remote micro-tasks (image tagging, data verification, etc.)', 500, 0.50),
('mobile_mapping', 'Field data collection using mobile apps and GPS', 100, 2.00),
('household_survey', 'Door-to-door household surveys and data collection', 50, 3.00);
```

**C. Youth Module Assignments (Track History)**
```sql
CREATE TABLE youth_module_history (
  assignment_id SERIAL PRIMARY KEY,
  youth_id VARCHAR REFERENCES youth_participants(youth_id),
  module_name VARCHAR NOT NULL,
  settlement VARCHAR(100),
  assigned_date DATE DEFAULT CURRENT_DATE,
  start_date DATE,
  end_date DATE,
  assignment_reason TEXT,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**D. Module Work Stats (Generic for all modules)**
```sql
CREATE TABLE youth_module_stats (
  stat_id SERIAL PRIMARY KEY,
  youth_id VARCHAR REFERENCES youth_participants(youth_id),
  module_name VARCHAR NOT NULL,
  date DATE NOT NULL,
  units_completed INTEGER DEFAULT 0,
  daily_target INTEGER,
  percentage_complete DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  payment_amount DECIMAL(10,2),
  verified BOOLEAN DEFAULT FALSE,
  verified_by VARCHAR,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(youth_id, module_name, date)
);
```

#### 2. Update Existing Table

```sql
-- Rename program_type to module_assignment for clarity
ALTER TABLE youth_participants 
  RENAME COLUMN program_type TO module_name;

-- Add constraint for valid modules
ALTER TABLE youth_participants
  ADD CONSTRAINT valid_module_name 
  CHECK (module_name IN ('digitization', 'microtasking', 'mobile_mapping', 'household_survey'));

-- Add disability flag
ALTER TABLE youth_participants
  ADD COLUMN has_disability BOOLEAN DEFAULT FALSE;

-- Add ward/area
ALTER TABLE youth_participants
  ADD COLUMN ward VARCHAR(100);
```

---

## Implementation Steps

### Phase 1: Database Preparation (Day 1)

1. **Create backup of current database**
   ```bash
   pg_dump DATABASE_URL > backup_pre_module_expansion.sql
   ```

2. **Execute schema updates**
   - Create new tables (youth_personal_info, program_modules, youth_module_history, youth_module_stats)
   - Alter youth_participants table
   - Create indexes for performance

3. **Migrate existing digitization data**
   - Populate youth_personal_info from existing data
   - Create module_history records for current digitization youth
   - Migrate youth_osm_stats to youth_module_stats

### Phase 2: Manual Data Cleanup (Day 1-2)

1. **Handle Missing IDs (9 youth)**
   - Contact youth or check physical records
   - Assign temporary IDs if needed
   - Format: `KAR###XX` or `HUR###XX` based on settlement

2. **Verify Dropout Analysis**
   - Investigate Denis Musau duplicate
   - Deactivate or remove test accounts

3. **Validate Disability Classifications**
   - Review with program leads
   - Confirm appropriateness for microtasking

### Phase 3: Bulk Youth Registration (Day 2-3)

1. **Create registration script**
   - Parse 300-youth data
   - Validate all fields
   - Handle duplicates

2. **Register youth in batches**
   - Batch 1: Kayole Soweto (169 youth)
   - Batch 2: Kariobangi (66 youth)
   - Batch 3: Mji wa Huruma (56 youth)

3. **Assign modules**
   - Digitization: Keep existing 45
   - Microtasking: Assign 63 with disabilities
   - Mobile Mapping: Assign 91
   - Household Survey: Assign 92

### Phase 4: Generate Credentials (Day 3)

1. **Create login credentials**
   - Generate passwords (default: `DPW2025` + youth_id)
   - Send via SMS to phone numbers

2. **Create orientation materials**
   - Module-specific guides
   - Payment structures
   - Daily targets

### Phase 5: Testing & Validation (Day 4)

1. **Test module dashboards**
   - Verify each module displays correctly
   - Test stat tracking for each module
   - Validate payment calculations

2. **Pilot with small groups**
   - 5 youth from each module
   - Test workflow end-to-end
   - Collect feedback

### Phase 6: Deployment (Day 5)

1. **Deploy to production**
   - Run migration scripts
   - Register all 300 youth
   - Activate new modules

2. **Communicate to youth**
   - SMS with credentials
   - Settlement-level orientations
   - Module-specific training dates

---

## Module-Specific Implementation Details

### Microtasking Module

**Platform Requirements:**
- Web-based task interface
- Mobile-friendly design
- Accessibility features (screen reader compatible, keyboard navigation, high contrast mode)
- Offline capability for poor connectivity

**Sample Tasks:**
- **Image Tagging:** Label photos for building types, road conditions
- **Data Verification:** Verify OSM building data, check addresses
- **Transcription:** Transcribe audio interviews, field notes
- **Quality Control:** Review digitized buildings for errors
- **Surveys:** Complete digital questionnaires

**Payment Structure:**
- Rate: KES 0.50 per task
- Daily target: 500 tasks = KES 250/day
- Quality threshold: 95% accuracy required
- Payment frequency: Weekly

### Mobile Mapping Module

**Equipment Needed:**
- Android smartphone (v8.0+)
- GPS accuracy <10m
- Camera (minimum 8MP)
- Minimum 2GB storage

**Apps Required:**
- OpenMapKit
- ODK Collect  
- KoBoCollect
- Maps.me (offline maps)

**Daily Workflow:**
1. Download assigned area/tasks
2. Collect GPS points for buildings/features
3. Take geo-tagged photos
4. Add attributes (building type, material, stories)
5. Upload data at end of day

**Payment Structure:**
- Rate: KES 2.00 per building/POI mapped
- Daily target: 100 points = KES 200/day
- Quality check: GPS accuracy + photo quality
- Payment frequency: Weekly

### Household Survey Module

**Materials Needed:**
- Survey forms (paper or tablets)
- ID badge
- Consent forms
- Pens, clipboard

**Training Topics:**
- Interview techniques
- Data privacy and consent
- Handling difficult situations
- Data accuracy and completeness

**Daily Workflow:**
1. Receive assigned households
2. Conduct surveys (avg 10-15 min each)
3. Verify data completeness
4. Submit forms daily

**Payment Structure:**
- Rate: KES 3.00 per completed survey
- Daily target: 50 surveys = KES 150/day
- Quality check: Completeness + supervisor spot-checks
- Payment frequency: Weekly

---

## Files Generated

### Analysis Outputs (JSON)
1. `youth-analysis-missing-ids.json` - 9 youth without IDs
2. `youth-analysis-dropouts.json` - 2 dropouts from digitization
3. `youth-analysis-digitization.json` - 45 youth for digitization
4. `youth-analysis-microtasking.json` - 63 youth for microtasking
5. `youth-analysis-mobile-mapping.json` - 91 youth for mobile mapping
6. `youth-analysis-household-survey.json` - 92 youth for household survey

---

## Risk Analysis & Mitigation

### Risks

1. **Missing IDs (9 youth)**
   - Risk: Cannot register without valid IDs
   - Mitigation: Manual follow-up, temporary ID assignment

2. **Smartphone Access (Mobile Mapping)**
   - Risk: Not all youth may have suitable phones
   - Mitigation: Equipment loan program, partner with youth who have phones

3. **Disability Accommodations (Microtasking)**
   - Risk: Tasks may not be suitable for all disability types
   - Mitigation: Variety of task types, adaptive interfaces, flexible targets

4. **Data Quality (All Modules)**
   - Risk: Inconsistent quality across modules
   - Mitigation: Strong QA processes, spot checks, retraining

5. **Payment Sustainability**
   - Risk: Different payment rates may cause dissatisfaction
   - Mitigation: Transparent communication about effort/skill requirements

---

## Next Steps

1. **Review this plan** with program stakeholders
2. **Validate disability classifications** with social workers
3. **Finalize missing ID assignments** with field coordinators
4. **Approve database schema changes** with tech team
5. **Set implementation timeline** (recommended: 5-day sprint)
6. **Prepare training materials** for each module
7. **Coordinate with field staff** for orientation sessions

---

## Questions for Stakeholders

1. Should the 2 "dropouts" (Denis Musau, Test account) be contacted for re-engagement?
2. What is the deadline for registering all 300 youth?
3. Are there existing microtasking platforms, or should we build one?
4. Mobile mapping: Will Spatial Collective provide smartphones, or must youth have their own?
5. Household survey: Who designs the survey instruments and questions?
6. Payment approval: Who verifies and approves payments for each module?
7. Training schedule: When should orientation sessions be held?

---

**Prepared by:** AI Analysis System  
**Contact:** Spatial Collective Technical Team  
**Status:** Draft - Awaiting Stakeholder Review
