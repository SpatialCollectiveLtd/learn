# 📚 DPW Validation Tool - Validator Training Manual

**Digital Public Works - Settlement Digitization Project**  
**Plugin Version:** 3.0.3  
**Last Updated:** December 2, 2025

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [What is the DPW Validation Tool?](#what-is-the-dpw-validation-tool)
3. [Prerequisites & System Requirements](#prerequisites--system-requirements)
4. [Installation Guide](#installation-guide)
5. [Getting Started - First Time Setup](#getting-started---first-time-setup)
6. [Understanding the Validation Workflow](#understanding-the-validation-workflow)
7. [Step-by-Step Validation Process](#step-by-step-validation-process)
8. [Understanding Error Types](#understanding-error-types)
9. [Best Practices for Validators](#best-practices-for-validators)
10. [Troubleshooting Common Issues](#troubleshooting-common-issues)
11. [FAQ - Frequently Asked Questions](#faq---frequently-asked-questions)

---

## Introduction

Welcome to the DPW Validation Tool training manual! This guide will teach you everything you need to know to become an effective validator for the Digital Public Works Settlement Digitization project.

### Who is This Manual For?

This manual is designed for **Final Validators** who are responsible for:
- Reviewing and assessing the quality of mapper's work
- Recording validation data and error metrics
- Ensuring data quality standards are met
- Exporting validated data for project deliverables

### What You'll Learn

By the end of this manual, you will be able to:
- ✅ Install and configure the DPW Validation Tool plugin in JOSM
- ✅ Authenticate and verify your authorization
- ✅ Isolate a mapper's work for validation
- ✅ Identify and count 10 types of mapping errors
- ✅ Record validation decisions and submit data
- ✅ Export validated data with automatic cloud backup
- ✅ Troubleshoot common issues independently

---

## What is the DPW Validation Tool?

The **DPW Validation Tool** is a specialized plugin for JOSM (Java OpenStreetMap Editor) that streamlines the quality assurance workflow for the Settlement Digitization project.

### Key Features

- **🔐 Secure Authentication**: Uses your JOSM OAuth login to automatically identify you
- **📊 Work Isolation**: Automatically isolates a specific mapper's work for unbiased review
- **📝 Quality Tracking**: Records 10 types of mapping errors with simple +/- buttons
- **☁️ Cloud Backup**: Automatically backs up validated data to secure project storage
- **⚡ Fast Workflow**: Complete validation without restarting JOSM
- **✅ Guided Process**: Visual status indicators show exactly what to do next

### What Makes It Special?

Unlike manual validation, the DPW tool:
- **Saves time**: No manual file naming or folder organization
- **Prevents errors**: Won't let you skip required steps
- **Tracks everything**: All validation data is automatically logged
- **Works offline**: Download data once, validate without internet (submission requires connection)

---

## Prerequisites & System Requirements

### Before You Begin

Make sure you have:

1. **✅ A Computer Meeting These Requirements:**
   - **Operating System**: Windows 10+, Linux, or macOS
   - **Internet Connection**: Required for downloading data and submitting validations
   - **Storage Space**: At least 500MB free space for JOSM and data

2. **✅ Required Software:**
   - **JOSM**: Version 18823 or newer (June 2024 or later)
   - **Java**: Version 21.0 or higher

3. **✅ Account Access:**
   - **OpenStreetMap Account**: You must have an active OSM account
   - **Project Authorization**: Your OSM username must be registered as an authorized validator in the DPW project

4. **✅ Basic Skills:**
   - Familiarity with JOSM interface
   - Understanding of OpenStreetMap building tagging
   - Basic quality assurance knowledge

### How to Check Your JOSM Version

1. Open JOSM
2. Click **Help** → **About**
3. Look for the version number (should be 18823 or higher)
4. If your version is too old, download the latest from: https://josm.openstreetmap.de/

### How to Check Your Java Version

**Windows PowerShell:**
```powershell
java -version
```

**Expected Output:**
```
java version "21.0.x"
```

If you don't have Java 21, download it from: https://adoptium.net/

---

## Installation Guide

### Step 1: Download the Plugin

1. Go to the **GitHub Releases page**:  
   https://github.com/SpatialCollectiveLtd/DPW-Validation-JOSM-Plugin/releases

2. Find the **latest release** (currently v3.0.3)

3. Download the file: **`DPWValidationTool.jar`**

4. Save it to a location you can easily find (e.g., Downloads folder)

### Step 2: Install the Plugin in JOSM

#### Option A: Automatic Installation (Recommended)

1. **Open JOSM**

2. Go to **Edit** → **Preferences** (or press `F12`)

3. Click the **Plugins** tab on the left

4. Click the **"📂 Add..."** or **"Install from file..."** button at the bottom

5. Browse to where you saved `DPWValidationTool.jar`

6. Select the file and click **Open**

7. Click **OK** to close the Preferences window

8. **Restart JOSM** when prompted

#### Option B: Manual Installation

**For Windows:**

1. Open File Explorer

2. Copy the file path:
   ```
   %APPDATA%\JOSM\plugins\
   ```

3. Paste this path into the address bar and press Enter

4. Copy `DPWValidationTool.jar` into this folder

5. Restart JOSM

**For Linux:**

1. Open your file manager or terminal

2. Navigate to:
   ```
   ~/.config/JOSM/plugins/
   ```

3. Copy `DPWValidationTool.jar` into this folder

4. Restart JOSM

**For macOS:**

1. Open Finder

2. Navigate to:
   ```
   ~/Library/JOSM/plugins/
   ```

3. Copy `DPWValidationTool.jar` into this folder

4. Restart JOSM

### Step 3: Verify Installation

1. **Restart JOSM completely** (close and reopen)

2. Look for the plugin in the menu:
   - Click **Windows** → **DPW Validation Tool**

3. A panel should appear on the right side of JOSM

4. If you see the panel, **installation successful!** ✅

5. If the panel doesn't appear, see [Troubleshooting](#troubleshooting-common-issues)

---

## Getting Started - First Time Setup

### 1. Authenticate with OpenStreetMap

Before using the plugin, you must be logged in to JOSM with your OSM account.

**Steps:**

1. Open JOSM

2. Go to **Edit** → **Preferences** (or press `F12`)

3. Click **Connection Settings** on the left

4. In the **OSM Server** section, click **"🔓 Authenticate"**

5. Your web browser will open

6. **Log in to your OpenStreetMap account**

7. Click **"Authorize"** to grant JOSM access

8. Return to JOSM - you should see "Authenticated as: [your username]"

9. Click **OK** to save

**✅ You only need to do this once!** JOSM will remember your authentication.

### 2. Verify Project Authorization

The plugin will automatically check if you're authorized when you first try to use it.

**What Happens:**

- When you click **"Isolate"** for the first time, the plugin checks your authorization
- If you're authorized ✅, the plugin works normally
- If you're NOT authorized ❌, you'll see an error message

**If You're Not Authorized:**

1. **Contact your project administrator** (provided in the error message)

2. Provide your **OSM username** (exactly as it appears in OSM)

3. Wait for confirmation that you've been added

4. Restart JOSM and try again

### 3. Open the Plugin Panel

1. In JOSM, click **Windows** → **DPW Validation Tool**

2. The panel will appear on the right side

3. You can **drag it** to reposition or **dock it** with other panels

**Pro Tip:** Keep the panel open all the time - it doesn't slow down JOSM!

---

## Understanding the Validation Workflow

The DPW Validation Tool uses a **guided, step-by-step workflow** that prevents mistakes and ensures consistency.

### Workflow Overview

```
┌─────────────────────────────────────────────────────────┐
│  1. SELECT DATE & MAPPER                                │
│     ↓ Choose validation date + select mapper           │
├─────────────────────────────────────────────────────────┤
│  2. ISOLATE WORK                                        │
│     ↓ Click "Isolate" to load mapper's buildings       │
├─────────────────────────────────────────────────────────┤
│  3. REVIEW & VALIDATE                                   │
│     ↓ Inspect buildings, count errors, add comments    │
├─────────────────────────────────────────────────────────┤
│  4. RECORD VALIDATION                                   │
│     ↓ Click "Record Validation" to submit data         │
├─────────────────────────────────────────────────────────┤
│  5. EXPORT DATA                                         │
│     ↓ Save file + automatic cloud backup               │
├─────────────────────────────────────────────────────────┤
│  6. RESET SESSION                                       │
│     ↓ Clear layers and start next validation           │
└─────────────────────────────────────────────────────────┘
```

### Visual Status Indicator

At the top of the plugin panel, you'll see a **status bar** that tells you exactly where you are:

| Status | Meaning | What to Do |
|--------|---------|------------|
| **▶ Current Step: Select Date & Mapper** | 🟡 Yellow | Choose date and mapper, then click Isolate |
| **▶ Current Step: Validate & Submit** | 🔵 Blue | Review work, count errors, submit |
| **✓ Submitted - Exporting...** | 🟢 Green | Export is in progress |
| **✓ Complete - Ready to Restart** | 🟢 Green | Ready to reset for next validation |

**The status bar guides you through the entire process!**

---

## Step-by-Step Validation Process

### Step 1: Select Date & Mapper

**📍 Status:** "▶ Current Step: Select Date & Mapper"

#### 1.1 Select the Validation Date

1. Click the **📅 calendar icon** next to "Validation Date"

2. A date picker will appear

3. **Select the date of the work you want to validate**

   **Important:** This ensures you only see buildings mapped on that specific day

4. The selected date will appear in the field

#### 1.2 Refresh the Mapper List (First Time Only)

1. Click **"🔄 Refresh Mapper List"** button

2. Wait for the status message: "Mapper list refreshed successfully"

3. This downloads the list of authorized mappers from the project

#### 1.3 Select the Mapper

1. Click the **Mapper** dropdown

2. You'll see a list of all authorized mappers

3. **Select the mapper** whose work you want to validate

4. The **Settlement** field will **auto-fill** based on the mapper's assigned settlement

#### 1.4 Enter Task ID (Optional)

1. If you have a **Task ID** from the Tasking Manager, enter it

2. This is optional but recommended for tracking

3. Maximum 100 characters

**✅ Ready to Isolate!** All required fields are filled.

---

### Step 2: Isolate the Mapper's Work

**📍 Status:** Still "▶ Current Step: Select Date & Mapper"

#### 2.1 Click "Isolate Mapper's Work"

1. Click the **"🔍 Isolate Mapper's Work"** button

2. The plugin will:
   - Download OSM data for the selected mapper and date
   - Filter to show only that mapper's buildings
   - Create a clean, isolated validation layer

3. **Wait for the process to complete** (may take 10-60 seconds depending on data size)

#### 2.2 Verify the Isolated Layer

1. Look at the **Layers panel** in JOSM (usually on the right)

2. You should see a new layer named:  
   `Validation: [mapper] - [date]`

3. This layer contains **only the mapper's buildings** from that date

4. The **status bar changes to**: "▶ Current Step: Validate & Submit" 🔵

#### 2.3 What If Isolation Fails?

**Error: "Please select a date first"**
- Solution: Click the calendar and select a date

**Error: "No mapper selected"**
- Solution: Select a mapper from the dropdown

**Error: "User not authorized"**
- Solution: Contact your project administrator

**Error: "No buildings found"**
- Possible reasons:
  - Mapper didn't work on that date
  - Wrong date selected
  - Network connection issue
- Solution: Verify date and mapper, try again

---

### Step 3: Review & Validate the Work

**📍 Status:** "▶ Current Step: Validate & Submit" 🔵

Now comes the important part - **reviewing the mapper's work!**

#### 3.1 Visual Inspection

1. **Zoom to the isolated layer**:
   - Right-click the validation layer
   - Select "Zoom to layer"

2. **Review each building**:
   - Look at building shapes
   - Check alignment with imagery
   - Verify tags are correct

3. **Use JOSM's built-in validation**:
   - Press `Shift+V` to open JOSM Validation panel
   - Click "Validation" button
   - Review any warnings or errors

#### 3.2 Count Errors by Type

As you find errors, record them using the **+/- buttons** in the plugin panel.

**Error Types** (explained in detail in the next section):

1. **Hanging Nodes** - Building nodes not properly connected
2. **Overlapping Buildings** - Buildings that overlap each other
3. **Buildings Crossing Highway** - Buildings intersecting roads
4. **Missing Tags** - Buildings without required tags
5. **Improper Tags** - Incorrect or invalid tag values
6. **Features Misidentified** - Wrong feature type (e.g., building vs. amenity)
7. **Missing Buildings** - Buildings visible in imagery but not mapped
8. **Building Inside Building** - One building completely inside another
9. **Building Crossing Residential** - Buildings overlapping residential areas
10. **Improperly Drawn** - Poor geometry, not rectangular when it should be, etc.

**How to Count:**

- Click **"+"** to increase the count for each error type
- Click **"-"** to decrease if you made a mistake
- You can count the same error type multiple times (e.g., 5 hanging nodes)

#### 3.3 Enter Total Buildings

1. Count the **total number of buildings** in the isolated layer

   **Quick Count Method:**
   - Select all objects: `Ctrl+A`
   - Look at the status bar: "123 ways selected"
   - This is your total building count

2. Enter this number in the **"Total Buildings"** field

#### 3.4 Add Comments (Optional but Recommended)

1. Click in the **"Validator Comments"** text area

2. Add any notes about the validation:
   - "Good quality work overall, minor tag issues"
   - "Several buildings need geometry fixes"
   - "Mapper missed 3 buildings in northeast corner"

3. Maximum 1000 characters

4. Be specific and constructive!

**✅ Validation Complete!** Ready to record your findings.

---

### Step 4: Record Validation

**📍 Status:** Still "▶ Current Step: Validate & Submit" 🔵

#### 4.1 Review Your Validation Summary

Before submitting, **review the summary panel**:

1. Click to **expand** the validation preview panel (if collapsed)

2. You'll see:
   - **Mapper**: The mapper you're validating
   - **Date**: Validation date
   - **Total Buildings**: Count you entered
   - **Error Breakdown**: All error types and counts
   - **Comments**: Your validation notes

3. **Double-check everything** - you can't edit after submitting!

#### 4.2 Click "Record Validation"

1. Click the **"✅ Record Validation"** button

2. A **confirmation dialog** appears showing:
   - Complete validation summary
   - What will be submitted
   - What happens next

3. **Review carefully**

4. Click **"✅ Record Validation"** to confirm

5. Click **"Cancel"** if you need to make changes

#### 4.3 Wait for Submission

1. A progress dialog appears: "Submitting validation data..."

2. The plugin sends your validation to the DPW API

3. **Wait for the success message** (usually 2-5 seconds)

4. **Status changes to**: "✓ Submitted - Exporting..." 🟢

**What Gets Recorded:**

- ✅ Your validator username (automatic)
- ✅ Mapper username
- ✅ Validation date
- ✅ Task ID (if provided)
- ✅ Settlement
- ✅ Total buildings count
- ✅ All 10 error type counts
- ✅ Your comments
- ✅ Timestamp of submission

**⚠️ Important Notes:**

- **All work is recorded** - whether it's perfect or has errors
- **You're recording data, not rejecting work** - project managers review the data later
- **Be thorough and accurate** - this data helps improve mapper training

---

### Step 5: Export Validated Data

**📍 Status:** "✓ Submitted - Exporting..." 🟢

After successful submission, the plugin automatically prompts you to export the validated data.

#### 5.1 Export Prompt

1. A dialog appears: **"Export validated layer now?"**

2. Two options:
   - **"📤 Export Now"** - Recommended! Export immediately
   - **"Skip"** - Skip export (not recommended)

3. Click **"📤 Export Now"**

#### 5.2 Choose Save Location

1. A **file chooser** dialog opens

2. The filename is **automatically pre-filled**:
   ```
   Task_[TaskID]_[Mapper]_[Date].osm
   ```
   Example: `Task_12345_john_mapper_2025-12-02.osm`

3. **Choose where to save**:
   - Navigate to your project folder
   - Or use the default location

4. Click **"Save"**

#### 5.3 Automatic Cloud Backup

After saving locally, the plugin automatically backs up your file:

1. Progress updates to: **"Uploading to cloud storage..."**

2. The file is uploaded to secure project cloud storage

3. **Success message** appears:
   ```
   ✓ Exported to: C:\Users\...\Task_12345_john_mapper_2025-12-02.osm
   ✓ Backed up to cloud storage
   ```

4. **Status changes to**: "✓ Complete - Ready to Restart" 🟢

**Cloud Backup Benefits:**

- ☁️ **Automatic backup** - No manual uploads needed
- 🔒 **Secure storage** - Company cloud storage (internal use only)
- 📊 **Centralized data** - Project managers can access all validated data
- 🛡️ **Redundancy** - Your work is safe even if local file is lost

**What If Upload Fails?**

- Your **local file is still saved** ✅
- Error message: "⚠️ Cloud upload failed, but local file saved successfully"
- **No need to re-export** - file is safe locally
- Project managers can request manual upload if needed

---

### Step 6: Reset Session for Next Validation

**📍 Status:** "✓ Complete - Ready to Restart" 🟢

After export, you're ready to start the next validation!

#### 6.1 Reset Prompt

1. A dialog appears: **"Ready for Next Task"**

2. Shows confirmation:
   ```
   ✓ Validation submitted
   ✓ Data exported
   ☁️ Backed up to cloud
   ```

3. Two options:
   - **"🔄 Reset Session"** - Clear everything and start fresh (recommended)
   - **"📝 Continue Working"** - Keep current layers (advanced users only)

#### 6.2 Click "Reset Session" (Recommended)

1. Click **"🔄 Reset Session"**

2. The plugin automatically:
   - Removes all JOSM layers
   - Clears the validation form
   - Resets all error counts to 0
   - Clears the mapper selection
   - Resets status to "Select Date & Mapper"

3. **JOSM stays open** - no restart needed! ⚡

4. Ready to start next validation immediately

**Why Reset?**

- ✅ **Prevents data mixing** - Clean slate for each validation
- ✅ **Faster than restarting JOSM** - Save 30-60 seconds per validation
- ✅ **Reduces errors** - No confusion about which layer is current
- ✅ **Professional workflow** - Consistent process every time

#### 6.3 Alternative: Continue Working

If you click **"📝 Continue Working"**:

- Layers remain open
- Form is NOT cleared
- You can manually reset the form only
- **Use this only if you need to review previous work**

**⚠️ Warning:** Continuing without reset can lead to:
- Accidentally validating the wrong layer
- Duplicate data in submissions
- Confusion about current task

**Best Practice:** Always reset between validations!

---

## Understanding Error Types

This section explains each of the 10 error types you'll track during validation.

### 1. Hanging Nodes

**What it is:**
- Building outline has nodes that don't connect properly
- Open polygons instead of closed buildings
- Duplicate nodes in the same location

**How to identify:**
- Building appears to have a gap or opening
- JOSM validation shows "unclosed way"
- Nodes highlighted when you zoom in

**Example:**
```
WRONG:                  RIGHT:
  ┌──────┐               ┌──────┐
  │      │               │      │
  │      └──             │      │
  └─                     └──────┘
  (gap in corner)        (fully closed)
```

**When to count:**
- Each building with hanging nodes = 1 error
- If one building has multiple hanging nodes, count as 1 error

---

### 2. Overlapping Buildings

**What it is:**
- Two or more buildings share the same space
- Buildings drawn on top of each other
- Partial overlap between building footprints

**How to identify:**
- Buildings highlighted in red/pink by JOSM validation
- Multiple building outlines in the same location
- Select a building and see another underneath

**Example:**
```
WRONG:                  RIGHT:
  ┌──────┐               ┌─────┐  ┌─────┐
  │  ┌───┼──┐            │     │  │     │
  │  │XXX│  │            │     │  │     │
  └──┼───┘  │            └─────┘  └─────┘
     └──────┘            (separate)
  (overlap area XXX)
```

**When to count:**
- Each overlapping building = 1 error
- If Building A overlaps B and C, count as 2 errors

---

### 3. Buildings Crossing Highway

**What it is:**
- Building outline intersects a road/highway
- Building drawn over a road
- Shared nodes between building and road

**How to identify:**
- Building polygon crosses a highway line
- JOSM validation shows "crossing ways"
- Road appears to go through the building

**Example:**
```
WRONG:                  RIGHT:
    ║                       ║
  ┌─╫──┐                ┌────┐
  │ ║  │       →        │    │  ║
  └─╫──┘                └────┘  ║
    ║                       ║
  (road crosses building)  (separate)
```

**When to count:**
- Each building crossing a highway = 1 error
- If one building crosses multiple highways, count as 1 error

---

### 4. Missing Tags

**What it is:**
- Building drawn but missing required tags
- No `building=*` tag
- Missing name or other required attributes

**How to identify:**
- Select building and check tags panel (Alt+Shift+T)
- No `building=` tag present
- JOSM validation may show "untagged way"

**Required tags for buildings:**
```
✅ building=yes (or residential, house, etc.)
❌ No tags at all
❌ Only has source=* or other metadata
```

**When to count:**
- Each building without required tags = 1 error

---

### 5. Improper Tags

**What it is:**
- Building has tags but they're incorrect
- Wrong tag values
- Typos in tag keys or values
- Deprecated tags

**How to identify:**
- Check tags panel
- Look for unusual values
- JOSM may show "deprecated tag" warning

**Examples:**
```
WRONG:                          RIGHT:
building=house1                 building=house
building=reisdential            building=residential
bldng=yes                       building=yes
building=yes + shop=yes         building=retail (or commercial)
```

**When to count:**
- Each building with improper tags = 1 error
- If one building has multiple tag errors, count as 1 error

---

### 6. Features Misidentified

**What it is:**
- Feature mapped as wrong type
- E.g., amenity mapped as building
- Building mapped when it should be landuse
- Wall/fence mapped as building

**How to identify:**
- Compare with satellite imagery
- Check if feature matches the tag type
- Consider context and surrounding features

**Examples:**
```
WRONG:                          RIGHT:
building=yes (for a fence)      barrier=fence
building=yes (for a garden)     landuse=residential
amenity=school (on building)    building=school + amenity=school
```

**When to count:**
- Each misidentified feature = 1 error

---

### 7. Missing Buildings

**What it is:**
- Building visible in imagery but not mapped
- Mapper missed buildings in their area
- Incomplete coverage

**How to identify:**
- Compare JOSM view with satellite imagery
- Look for obvious building shapes not traced
- Check corners and edges of task area

**When to count:**
- Each building that should have been mapped = 1 error
- Be reasonable - only count clear, obvious buildings

---

### 8. Building Inside Building

**What it is:**
- One building polygon completely inside another
- Duplicate building outlines
- Building drawn as multipolygon when it shouldn't be

**How to identify:**
- One building fully enclosed by another
- JOSM validation may show "building inside building"
- Inner building with no shared nodes with outer

**Example:**
```
WRONG:                  RIGHT:
  ┌──────────┐           ┌──────────┐
  │  ┌────┐  │           │          │
  │  │    │  │     →     │          │
  │  └────┘  │           │          │
  └──────────┘           └──────────┘
  (inner building)       (single building)
```

**When to count:**
- Each building-inside-building case = 1 error

---

### 9. Building Crossing Residential

**What it is:**
- Building polygon crosses a residential area boundary
- Building extends into `landuse=residential` area improperly
- Boundary conflicts

**How to identify:**
- Building outline crosses landuse polygon
- Shared edges between building and residential area
- JOSM validation shows overlapping areas

**When to count:**
- Each building crossing residential boundary = 1 error

---

### 10. Improperly Drawn

**What it is:**
- Poor geometry quality
- Buildings that should be rectangular but aren't
- Wavy lines instead of straight edges
- Too many unnecessary nodes
- Poor alignment with imagery

**How to identify:**
- Visual inspection - building looks messy
- Corners not at right angles when they should be
- Edges not straight
- Too many nodes for a simple rectangular building

**Examples:**
```
WRONG:                  RIGHT:
  ┌──┐                  ┌──────┐
  │  └─┐                │      │
  │    └─┐              │      │
  └──────┘              └──────┘
  (wavy)                (clean rectangle)
```

**When to count:**
- Each building with poor geometry = 1 error
- Be reasonable - minor imperfections are okay

---

## Best Practices for Validators

### ✅ DO's

1. **Always select the date first**
   - Ensures you only see work from that specific day
   - Prevents mixing data from different days

2. **Use JOSM's built-in validation tools**
   - Press `Shift+V` to open validation panel
   - Click "Validation" to run checks
   - Review all warnings and errors

3. **Be thorough but fair**
   - Check every building carefully
   - Don't count minor imperfections as errors
   - Focus on significant quality issues

4. **Add detailed comments**
   - Explain what you found
   - Be constructive and specific
   - Help mappers learn from mistakes

5. **Reset session between validations**
   - Keeps JOSM clean and fast
   - Prevents data mixing
   - Professional workflow

6. **Save validated data immediately**
   - Don't skip the export step
   - Cloud backup is automatic
   - Creates project deliverables

7. **Double-check before submitting**
   - Review the validation summary
   - Verify error counts are accurate
   - Make sure comments are clear

8. **Keep the plugin panel open**
   - Saves time opening it repeatedly
   - Status indicator always visible
   - Easier to track progress

### ❌ DON'Ts

1. **Don't skip the date selection**
   - Required for accurate isolation
   - Prevents wrong data from being loaded

2. **Don't validate without isolating first**
   - You might be looking at wrong data
   - Plugin enforces this anyway

3. **Don't count the same error multiple times**
   - One building = one error per type
   - Be consistent across all validations

4. **Don't be overly critical**
   - Focus on significant issues
   - Minor imperfections are okay
   - Remember mappers are learning

5. **Don't submit without reviewing**
   - Check the validation summary
   - Verify error counts
   - Can't edit after submission

6. **Don't skip the export step**
   - Validated data needs to be saved
   - Creates project deliverables
   - Cloud backup is important

7. **Don't continue without resetting**
   - Layers will pile up
   - JOSM becomes slow
   - Risk of data mixing

8. **Don't work offline**
   - You need internet to isolate work
   - Submission requires connection
   - Cloud backup needs internet

### 🎯 Pro Tips

1. **Create a validation checklist**
   - Print out error types
   - Check off as you review
   - Ensures you don't miss anything

2. **Use keyboard shortcuts**
   - `Shift+V`: Open validation panel
   - `Ctrl+A`: Select all
   - `Alt+Shift+T`: Show tags panel
   - `Ctrl+Shift+D`: Download data

3. **Set up dual monitors**
   - Imagery on one screen
   - JOSM on another
   - Makes comparison easier

4. **Take breaks**
   - Validation requires concentration
   - Take a break every hour
   - Prevents fatigue errors

5. **Track your statistics**
   - How many validations per day
   - Average error rates
   - Your personal improvement

6. **Compare with other validators**
   - Discuss challenging cases
   - Ensure consistency
   - Learn from each other

7. **Use JOSM plugins**
   - Building Tools plugin
   - Utilsplugin2
   - Terracer (for row houses)

8. **Save your JOSM layout**
   - Arrange panels the way you like
   - JOSM remembers the layout
   - Consistent workspace every time

---

## Troubleshooting Common Issues

### Issue 1: Plugin Not Loading

**Symptoms:**
- Plugin doesn't appear in Windows menu
- No DPW Validation Tool panel

**Solutions:**

1. **Check JOSM version**
   - Help → About
   - Must be 18823 or newer
   - Update JOSM if needed

2. **Verify plugin installation**
   - Check `%APPDATA%\JOSM\plugins\` (Windows)
   - File `DPWValidationTool.jar` should be there
   - Re-install if missing

3. **Check JOSM logs**
   - Help → Show Log
   - Search for "DPWValidationTool"
   - Look for error messages

4. **Restart JOSM completely**
   - Close all JOSM windows
   - Reopen JOSM
   - Check Windows menu again

---

### Issue 2: "Not Authenticated" Error

**Symptoms:**
- Error message: "Not authenticated" or "OAuth error"
- Can't isolate work

**Solutions:**

1. **Log in to JOSM**
   - Edit → Preferences (F12)
   - Connection Settings
   - OSM Server → Authenticate
   - Log in with your OSM account

2. **Verify authentication**
   - Should see "Authenticated as: [username]"
   - If not, try authenticating again

3. **Check OAuth permissions**
   - Make sure you clicked "Authorize" in the browser
   - Return to JOSM after authorizing

4. **Restart JOSM after authenticating**
   - Close and reopen JOSM
   - Try again

---

### Issue 3: "User Not Authorized" Error

**Symptoms:**
- Error message: "User not authorized"
- Error says to contact project administrator

**Solutions:**

1. **Verify your OSM username**
   - Make sure you're logged in with correct account
   - Check your username on openstreetmap.org

2. **Contact project administrator**
   - Provide your exact OSM username
   - Request to be added as authorized validator

3. **Wait for confirmation**
   - Administrator must add you to registry
   - May take a few hours or days

4. **Try again after authorization**
   - Restart JOSM
   - Click "Refresh Mapper List"
   - Try isolating work

---

### Issue 4: "Please Select a Date First" Error

**Symptoms:**
- Can't click Isolate button
- Error message about date

**Solutions:**

1. **Click the calendar icon**
   - Next to "Validation Date" field
   - Select a date from the picker

2. **Make sure date is selected**
   - Date should appear in the field
   - Format: YYYY-MM-DD

3. **Try clicking Isolate again**
   - Date is now selected
   - Should work now

---

### Issue 5: "No Buildings Found" After Isolation

**Symptoms:**
- Isolation completes but no buildings appear
- Empty validation layer

**Possible Causes & Solutions:**

1. **Wrong date selected**
   - Mapper didn't work on that date
   - Solution: Select different date

2. **Wrong mapper selected**
   - Mapper never worked on this project
   - Solution: Select different mapper

3. **Network connection issue**
   - Couldn't download data
   - Solution: Check internet, try again

4. **No work in selected area**
   - Mapper worked elsewhere
   - Solution: Check project task boundaries

---

### Issue 6: Cannot Submit Validation

**Symptoms:**
- "Record Validation" button doesn't work
- Error during submission

**Solutions:**

1. **Check internet connection**
   - Submission requires internet
   - Test by opening a website

2. **Verify all required fields**
   - Total buildings must be filled
   - Mapper must be selected
   - Date must be selected

3. **Check for field length errors**
   - Task ID: max 100 characters
   - Comments: max 1000 characters
   - Settlement: max 255 characters

4. **Try submitting again**
   - Temporary network glitch
   - Wait 10 seconds and retry

5. **Check JOSM logs**
   - Help → Show Log
   - Look for API error messages

---

### Issue 7: Export Failed or No Export Prompt

**Symptoms:**
- No export prompt after submission
- Export fails with error

**Solutions:**

1. **Check if layer still exists**
   - Look in Layers panel
   - Validation layer should be present
   - If closed, can't export

2. **Verify write permissions**
   - Make sure you can write to target folder
   - Try saving to different location

3. **Check disk space**
   - Make sure you have free space
   - OSM files are usually 1-50 MB

4. **Try manual export**
   - Right-click validation layer
   - Save As...
   - Use project naming convention

---

### Issue 8: Cloud Backup Failed

**Symptoms:**
- Message: "Cloud upload failed"
- Local file saved but not backed up

**Solutions:**

1. **Don't worry - local file is safe**
   - File is saved on your computer
   - You haven't lost any work

2. **Check internet connection**
   - Cloud backup requires internet
   - Make sure you're online

3. **Try again later**
   - May be temporary server issue
   - Project managers can retrieve local file

4. **Contact support if persistent**
   - Mention "cloud backup failed"
   - Provide error message if any

---

### Issue 9: Plugin Becomes Unresponsive

**Symptoms:**
- Plugin panel doesn't respond to clicks
- Buttons don't work

**Solutions:**

1. **Close and reopen plugin panel**
   - Windows → DPW Validation Tool
   - Uncheck to close
   - Check again to reopen

2. **Reset session**
   - Click "Reset Session" if available
   - Clears plugin state

3. **Restart JOSM**
   - Save any work first
   - Close and reopen JOSM
   - Should fix most issues

4. **Check system resources**
   - Close other programs
   - JOSM needs memory to run
   - Restart computer if needed

---

### Issue 10: Mapper List is Empty

**Symptoms:**
- Mapper dropdown has no options
- Can't select a mapper

**Solutions:**

1. **Click "Refresh Mapper List"**
   - Downloads latest mapper list
   - Wait for "success" message

2. **Check internet connection**
   - Mapper list downloaded from API
   - Need internet to refresh

3. **Verify project authorization**
   - You must be authorized validator
   - See "User Not Authorized" section

4. **Wait and try again**
   - May be temporary API issue
   - Try again in 1-2 minutes

---

## FAQ - Frequently Asked Questions

### General Questions

**Q: How long does a typical validation take?**
A: Usually 10-30 minutes depending on:
- Number of buildings (10-100+ buildings)
- Quality of mapper's work
- Your validation speed and experience

**Q: How many validations should I do per day?**
A: This depends on your schedule and project requirements. Most validators complete 5-15 validations per day. Quality is more important than quantity!

**Q: Can I validate my own work?**
A: No, validation should be done by a different person than the mapper to ensure unbiased quality assurance.

**Q: What if I make a mistake in my validation?**
A: Contact your project administrator immediately. They can help correct the data. You cannot edit submissions after they're sent.

**Q: Can I validate offline?**
A: Partially. You can download data and review it offline, but you need internet to:
- Isolate work (downloads data)
- Submit validation (sends to API)
- Cloud backup (uploads file)

---

### Technical Questions

**Q: What happens to the data I submit?**
A: Your validation data is sent to the DPW Manager API and stored in the project database. Project managers use this data to:
- Track mapper performance
- Identify training needs
- Generate quality reports
- Improve project workflows

**Q: Is my validation data secure?**
A: Yes! All data is transmitted securely via HTTPS and stored in protected project systems. Only authorized project staff can access it.

**Q: Can I see my validation history?**
A: Currently, the plugin doesn't show history. Contact your project administrator to request your validation statistics.

**Q: What if the plugin has a bug?**
A: Report it on GitHub Issues:
https://github.com/SpatialCollectiveLtd/DPW-Validation-JOSM-Plugin/issues

Include:
- Plugin version (currently 3.0.3)
- JOSM version
- What you were doing
- Error message (if any)
- Screenshot (if helpful)

**Q: Will my validation data be shared publicly?**
A: No. Validation data is for internal project use only and is not published publicly.

---

### Workflow Questions

**Q: Do I need to reset between every validation?**
A: Yes, it's strongly recommended! Resetting:
- Prevents data mixing
- Keeps JOSM fast
- Ensures clean workflow
- Takes only 2 seconds

**Q: What if I accidentally close the isolation layer?**
A: You'll need to start over:
1. Click "Reset Session"
2. Select mapper and date again
3. Click "Isolate" again

**Q: Can I validate multiple mappers at once?**
A: No. The plugin is designed for one validation at a time. Complete one, reset, then start the next.

**Q: What if I need to pause mid-validation?**
A: You can:
- Leave JOSM open with the layer loaded
- Come back later and continue
- Just don't close the isolation layer
- Submit when you're done

**Q: Can I edit the mapper's work before submitting?**
A: You CAN edit in JOSM, but:
- Validation records the original work
- Your edits won't change the validation data
- Better to record errors and let project managers decide on fixes

**Q: What if I disagree with another validator's assessment?**
A: Discuss with your team lead or project administrator. Consistency between validators is important!

---

### Error Counting Questions

**Q: If a building has multiple errors, how do I count them?**
A: Count each error type once per building. Example:
- Building has hanging nodes + missing tags
- Count: +1 hanging nodes, +1 missing tags
- Don't count the same error type twice for one building

**Q: What if I'm not sure if something is an error?**
A: When in doubt:
1. Check JOSM's validation panel (Shift+V)
2. Compare with project guidelines
3. Ask your team lead
4. Be consistent in your decisions

**Q: Should I count very minor issues?**
A: Focus on significant quality issues. Very minor imperfections (e.g., building corner 1cm off) usually don't need to be counted.

**Q: What if there are zero errors?**
A: Great! Leave all error counts at 0 and add a positive comment like "Excellent work, no issues found."

---

### Export & Data Questions

**Q: Where should I save exported files?**
A: Save to your designated project folder. Your project administrator will specify the location. The cloud backup happens automatically.

**Q: What format are exported files?**
A: `.osm` format (OpenStreetMap XML). This is the standard format for OSM data.

**Q: Can I export in other formats?**
A: Not with this plugin. If you need other formats, use JOSM's File → Save As menu after exporting.

**Q: What if cloud backup fails?**
A: Your local file is still saved! The plugin shows:
- ✓ File saved locally
- ⚠️ Cloud backup failed
Your work is safe. Project managers can retrieve the local file if needed.

**Q: Can I re-export the same validation?**
A: No, once you submit and export, the workflow is complete. If you need to export again:
1. Don't reset the session
2. Right-click the validation layer
3. Save As... manually

---

## Conclusion

Congratulations! You've completed the DPW Validation Tool training manual.

### What You've Learned

You now know how to:
- ✅ Install and configure the plugin
- ✅ Authenticate and verify authorization
- ✅ Select dates and mappers
- ✅ Isolate work for validation
- ✅ Identify 10 types of mapping errors
- ✅ Record validation decisions
- ✅ Export data with cloud backup
- ✅ Reset sessions efficiently
- ✅ Troubleshoot common issues

### Next Steps

1. **Practice!**
   - Start with simple validations
   - Build your skills gradually
   - Ask questions when unsure

2. **Join the validator community**
   - Discuss cases with other validators
   - Share best practices
   - Learn from experienced validators

3. **Stay updated**
   - Check for plugin updates regularly
   - Read release notes
   - Attend training sessions

4. **Provide feedback**
   - Report bugs on GitHub
   - Suggest improvements
   - Help improve the tool

### Support Resources

**📧 Project Administrator**
- Contact info provided separately

**🐛 Bug Reports**
- https://github.com/SpatialCollectiveLtd/DPW-Validation-JOSM-Plugin/issues

**📖 Documentation**
- README.md in the plugin repository
- This training manual

**💬 Team Communication**
- Your project communication channels

---

### Remember

**Quality over quantity!**

Your role as a validator is crucial to the success of the Digital Public Works project. Take your time, be thorough, and maintain high standards.

**Every validation you complete helps:**
- 🎯 Improve data quality
- 📊 Track mapper performance
- 🎓 Identify training needs
- 🏆 Deliver excellent results to the project

**Thank you for being a DPW validator!** 🗺️✨

---

**Document Information**
- **Version:** 1.0
- **Plugin Version:** 3.0.3
- **Last Updated:** December 2, 2025
- **Prepared by:** Spatial Collective Ltd
- **For:** Digital Public Works - Settlement Digitization Project

---

**End of Training Manual**
