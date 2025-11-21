-- Mapper Training Content for Digitization Module
-- This populates the training_sections table with structured content

-- Get the mapper role ID
SET @mapper_role_id = (
  SELECT r.id 
  FROM roles r 
  INNER JOIN modules m ON r.module_id = m.id 
  WHERE m.slug = 'digitization' AND r.slug = 'mapper'
  LIMIT 1
);

-- ============================================
-- SECTION 1: Overview and Requirements
-- ============================================
INSERT INTO training_sections (role_id, title, content_type, content, display_order, estimated_time) VALUES
(@mapper_role_id, 'Overview and Requirements', 'text', 
'## What you''ll learn

- Digital mapping
- Satellite image interpretation
- Using mapping tools (JOSM, HOT Tasking Manager)
- Working with global mapping communities

## Requirements Before they Start

- A laptop or desktop (not a phone)
- Mouse (a trackpad is difficult to use)
- Gmail account

## Why Are We Doing This?

Your work helps real-world change by supporting:
- Humanitarian organizations
- Health planners
- Disaster response teams
- Local development and infrastructure projects

## How the Work Is Structured

- You map as an individual but as part of a larger team
- Each task is a section (grid square) of a larger project
- A validator will check your work
- You''ll be paid based on volume, accuracy, and quality', 1, 5);

-- ============================================
-- SECTION 2: Account Setup
-- ============================================
INSERT INTO training_sections (role_id, title, content_type, content, display_order, estimated_time) VALUES
(@mapper_role_id, 'Account Setup Steps', 'steps', 
'[
  {
    "step": 1,
    "title": "Create Email Account",
    "description": "Create a Gmail account if you don''t have one",
    "action": "Visit gmail.com and sign up"
  },
  {
    "step": 2,
    "title": "Create OSM Account",
    "description": "OpenStreetMap (OSM) is the platform where all mapping data is stored",
    "action": "Visit openstreetmap.org and sign up with your email"
  },
  {
    "step": 3,
    "title": "Setup HOT Tasking Manager",
    "description": "The Humanitarian OpenStreetMap Team (HOT) Tasking Manager coordinates mapping projects",
    "action": "Visit tasks.hotosm.org, log in using your OSM account, and authorize the connection"
  }
]', 2, 10);

-- ============================================
-- SECTION 3: JOSM Installation
-- ============================================
INSERT INTO training_sections (role_id, title, content_type, content, display_order, estimated_time) VALUES
(@mapper_role_id, 'Installing and Setting Up JOSM', 'steps', 
'[
  {
    "step": 1,
    "title": "Install JOSM",
    "description": "Java OpenStreetMap Editor (JOSM) is the primary tool for mapping",
    "action": "Run the installer provided to you and open the program"
  },
  {
    "step": 2,
    "title": "Enable Remote Control",
    "description": "Remote Control allows the Tasking Manager to communicate with JOSM",
    "action": "Go to Preferences → Enable Remote Control → Make sure all boxes are checked"
  },
  {
    "step": 3,
    "title": "Configure OSM Server",
    "description": "Connect JOSM to your OpenStreetMap account",
    "action": "Go to Preferences → OSM Server → Select Basic Auth → Enter your OSM Username and Password"
  }
]', 3, 15);

-- ============================================
-- SECTION 4: Drawing Buildings
-- ============================================
INSERT INTO training_sections (role_id, title, content_type, content, display_order, estimated_time) VALUES
(@mapper_role_id, 'Understanding Aerial Imagery', 'text', 
'## What to Look For

You''ll use satellite images to identify buildings. Look for:
- **Roof outlines** - Clear building shapes from above
- **Regular shapes** - Rectangular, square, or L-shaped structures
- **Shadows** - Can help identify building height and orientation

## What to Avoid

- ❌ Cars
- ❌ Trees
- ❌ Shadows (don''t map the shadow itself)
- ❌ Incomplete or unclear structures

## Imagery Sources

Use **Bing** or **Maxar** imagery layers in JOSM for the best quality satellite images.', 4, 10);

INSERT INTO training_sections (role_id, title, content_type, content, display_order, estimated_time) VALUES
(@mapper_role_id, 'How to Draw Buildings in JOSM', 'steps', 
'[
  {
    "step": 1,
    "title": "Select Building Tool",
    "description": "Activate the building drawing tool",
    "action": "Press B on your keyboard or click the building tool icon"
  },
  {
    "step": 2,
    "title": "Trace Building Outline",
    "description": "Click around the edges of the building following its outline",
    "action": "Click at each corner of the building to create nodes"
  },
  {
    "step": 3,
    "title": "Close the Shape",
    "description": "Complete the building outline",
    "action": "Double-click to close the shape, or click on the first node"
  },
  {
    "step": 4,
    "title": "Add Building Tag",
    "description": "Tag the shape as a building",
    "action": "The tag building=yes should be automatically applied"
  }
]', 5, 20);

-- ============================================
-- SECTION 5: Building Types and Tagging
-- ============================================
INSERT INTO training_sections (role_id, title, content_type, content, display_order, estimated_time) VALUES
(@mapper_role_id, 'Types of Buildings and Tagging', 'text', 
'## Common Building Tags

- `building=yes` - General building (most common)
- `building=construction` - Building under construction
- `building=foundation` - Only foundation visible

## Common Mistakes to Avoid

- ❌ Overlapping buildings
- ❌ Buildings with less than 3 nodes
- ❌ Freehand shapes (always use straight edges)
- ❌ Missing building tags

## Quality Tips

✓ Square buildings properly (use Q key in JOSM)
✓ Align parallel edges
✓ Match the actual building footprint
✓ Check for overlaps before uploading', 6, 10);

-- ============================================
-- SECTION 6: Validation
-- ============================================
INSERT INTO training_sections (role_id, title, content_type, content, display_order, estimated_time) VALUES
(@mapper_role_id, 'Self Validation', 'warning', 
'## Always Validate Before Uploading!

Before uploading your work, you must validate it to catch errors:

**How to Validate:**
- Press `Shift + V` in JOSM, OR
- Click the ✓ icon in the left panel

## Common Errors to Fix

1. **Building inside building** - Two buildings overlapping
2. **Overlapping shapes** - Buildings sharing the same space
3. **Improper tags** - Missing or wrong building tags
4. **Hanging nodes** - Nodes not connected properly
5. **Duplicate nodes** - Multiple nodes at the same location

**Remember:** Good validation = Faster approval = Better pay', 7, 15);

INSERT INTO training_sections (role_id, title, content_type, content, display_order, estimated_time) VALUES
(@mapper_role_id, 'Validation Checklist', 'checklist', 
'[
  "All buildings are digitized",
  "No buildings are overlapping each other",
  "Building outlines are correctly shaped",
  "All buildings have proper tags (building=yes)",
  "No hanging or duplicate nodes",
  "Buildings are aligned and squared properly",
  "Validation shows no errors (Shift+V)"
]', 8, 5);

-- ============================================
-- SECTION 7: Task Workflow
-- ============================================
INSERT INTO training_sections (role_id, title, content_type, content, display_order, estimated_time) VALUES
(@mapper_role_id, 'Accessing the Tasking Manager', 'steps', 
'[
  {
    "step": 1,
    "title": "Open Tasking Manager",
    "description": "Navigate to the HOT Tasking Manager",
    "action": "Go to tasks.hotosm.org"
  },
  {
    "step": 2,
    "title": "Find Your Project",
    "description": "Search for the specific project assigned to you",
    "action": "Click Explore Projects → Search by project number"
  },
  {
    "step": 3,
    "title": "Select a Task",
    "description": "Choose an available task (grid square) to work on",
    "action": "Click Contribute → Pick a white/available square → Click Map selected task"
  }
]', 9, 10);

INSERT INTO training_sections (role_id, title, content_type, content, display_order, estimated_time) VALUES
(@mapper_role_id, 'Locking and Opening a Task in JOSM', 'steps', 
'[
  {
    "step": 1,
    "title": "Ensure JOSM is Running",
    "description": "JOSM must be open before locking a task",
    "action": "Open JOSM on your computer"
  },
  {
    "step": 2,
    "title": "Verify Remote Control",
    "description": "Remote Control must be enabled in JOSM settings",
    "action": "Check Preferences → Remote Control is enabled"
  },
  {
    "step": 3,
    "title": "Load Task in JOSM",
    "description": "Click the button to load your task",
    "action": "In Tasking Manager, click Map selected task → JOSM will ask to approve → Click OK"
  },
  {
    "step": 4,
    "title": "Start Mapping",
    "description": "The task area and imagery will load automatically",
    "action": "Begin digitizing buildings in the highlighted area"
  }
]', 10, 5);

INSERT INTO training_sections (role_id, title, content_type, content, display_order, estimated_time) VALUES
(@mapper_role_id, 'Marking Your Task as Complete', 'steps', 
'[
  {
    "step": 1,
    "title": "Validate Your Work",
    "description": "Check for errors before uploading",
    "action": "Press Shift+V and fix any validation errors"
  },
  {
    "step": 2,
    "title": "Upload Changes",
    "description": "Send your work to OpenStreetMap",
    "action": "Click the upload button (up arrow icon) in JOSM"
  },
  {
    "step": 3,
    "title": "Add a Comment",
    "description": "Describe what you did",
    "action": "Type a comment like Mapped buildings or Added 25 buildings"
  },
  {
    "step": 4,
    "title": "Submit Upload",
    "description": "Finalize the upload to OSM",
    "action": "Click Upload Changes"
  },
  {
    "step": 5,
    "title": "Mark Task Complete",
    "description": "Return to Tasking Manager and update task status",
    "action": "Under Task Status, select Yes → Submit task"
  }
]', 11, 10);

INSERT INTO training_sections (role_id, title, content_type, content, display_order, estimated_time) VALUES
(@mapper_role_id, 'What to Do If You Can''t Finish a Task', 'tip', 
'## Can''t Complete Your Task?

Sometimes you may need to stop work before finishing a task. Here''s what to do:

### Steps:
1. **Save your progress** - Upload what you''ve completed to the server
2. **Return to Tasking Manager** - Go back to your task page
3. **Mark as Incomplete** - Under Task Status, select **No**
4. **Submit the task** - Click Submit
5. **Note your task number** - Write it down so you can reopen it later

### Important:
- Always upload your partial work before marking incomplete
- Add a comment explaining why (e.g., "Need more time" or "Unclear imagery")
- You or another mapper can pick up where you left off', 12, 5);
