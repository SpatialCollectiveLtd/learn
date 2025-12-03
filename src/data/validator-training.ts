// Validator Training Content for Digitization Module
// Based on DPW Validation Tool v3.0.3
// RESTRICTED: Spatial Collective Staff Only - Requires Staff ID Authentication

export interface TrainingStep {
  id: string;
  title: string;
  shortTitle: string;
  estimatedTime: number; // in minutes
  content: {
    introduction: string;
    mainContent: ContentBlock[];
    keyTakeaways: string[];
  };
}

export interface ContentBlock {
  type: 'text' | 'list' | 'warning' | 'tip' | 'code' | 'image' | 'steps';
  content: string;
  items?: string[];
  imagePath?: string;
}

// Staff Authentication Interfaces
export interface StaffCredentials {
  staffId: string;
  name?: string;
  role?: 'validator' | 'admin';
  registeredAt?: Date;
}

export interface AuthenticationResult {
  success: boolean;
  staffId?: string;
  message: string;
  credentials?: StaffCredentials;
}

export const validatorTrainingSteps: TrainingStep[] = [
  {
    id: 'validator-1',
    title: 'Welcome to Digital Validation',
    shortTitle: 'Introduction',
    estimatedTime: 10,
    content: {
      introduction: 'Welcome to the Spatial Collective validator training program. As a validator, you play a crucial role in ensuring the quality and accuracy of mapping data.',
      mainContent: [
        {
          type: 'text',
          content: '## Your Role as a Validator\n\nValidators are responsible for reviewing and assessing the quality of mapper\'s work. Unlike mappers who create the initial data, validators ensure that the data meets our quality standards and is ready for delivery to clients.'
        },
        {
          type: 'text',
          content: '## What You\'ll Be Doing\n\nAs a validator, you will:\n- Review mapper\'s digitized buildings for accuracy\n- Identify and count 10 specific types of mapping errors\n- Record validation results using the DPW Validation Tool plugin\n- Submit validation data to the central system\n- Export validated work for project deliverables'
        },
        {
          type: 'list',
          content: '## Key Responsibilities:',
          items: [
            'Reviewing and assessing the quality of mapper\'s work',
            'Recording validation data and error metrics accurately',
            'Ensuring data quality standards are met',
            'Exporting validated data for project deliverables',
            'Providing constructive feedback to help mappers improve'
          ]
        },
        {
          type: 'warning',
          content: '## Important Note\n\n**You are recording data, not rejecting work.** All validation results—whether perfect or with errors—are recorded. Project managers use this data to track performance, identify training needs, and improve workflows. Your job is to be thorough and accurate, not to judge the mapper.'
        },
        {
          type: 'text',
          content: '## The Validation Tool\n\nYou will use the **DPW Validation Tool**, a specialized plugin for JOSM that:\n- Automatically isolates a mapper\'s work for unbiased review\n- Provides simple +/- buttons to count errors\n- Submits data automatically to the central system\n- Backs up validated data to secure cloud storage\n- Guides you through each step with visual indicators'
        }
      ],
      keyTakeaways: [
        'Validators ensure data quality and accuracy',
        'You record all work—perfect or imperfect',
        'The DPW Validation Tool automates most of the workflow',
        'Your feedback helps mappers improve their skills',
        'Quality over quantity—be thorough and fair'
      ]
    }
  },
  {
    id: 'validator-2',
    title: 'System Requirements & Plugin Installation',
    shortTitle: 'Installation',
    estimatedTime: 20,
    content: {
      introduction: 'Before you can begin validating, you need to set up your computer with the required software and install the DPW Validation Tool plugin.',
      mainContent: [
        {
          type: 'text',
          content: '## System Requirements\n\nYour computer must meet these minimum requirements:'
        },
        {
          type: 'list',
          content: '### Hardware & Software:',
          items: [
            'Operating System: Windows 10+, Linux, or macOS',
            'Internet Connection: Required for downloading data and submitting validations',
            'Storage Space: At least 500MB free space for JOSM and data',
            'JOSM: Version 18823 or newer (June 2024 or later)',
            'Java: Version 21.0 or higher'
          ]
        },
        {
          type: 'steps',
          content: 'How to Check Your JOSM Version',
          items: [
            'Open JOSM',
            'Click Help → About',
            'Look for the version number (should be 18823 or higher)',
            'If your version is too old, download the latest from https://josm.openstreetmap.de/'
          ]
        },
        {
          type: 'code',
          content: '```powershell\n# Check Java version in PowerShell\njava -version\n\n# Expected output:\n# java version "21.0.x"\n```\n\nIf you don\'t have Java 21, download it from: https://adoptium.net/'
        },
        {
          type: 'text',
          content: '## Account Requirements'
        },
        {
          type: 'list',
          content: 'You must have:',
          items: [
            'An active OpenStreetMap (OSM) account',
            'Your OSM username registered as an authorized validator in the project',
            'Basic familiarity with JOSM interface',
            'Understanding of OpenStreetMap building tagging'
          ]
        },
        {
          type: 'text',
          content: '## Installing the DPW Validation Tool Plugin\n\n### Step 1: Download the Plugin'
        },
        {
          type: 'steps',
          content: 'Download Process:',
          items: [
            'Go to: https://github.com/SpatialCollectiveLtd/DPW-Validation-JOSM-Plugin/releases',
            'Find the latest release (currently v3.0.3)',
            'Download the file: DPWValidationTool.jar',
            'Save it to a location you can easily find (e.g., Downloads folder)'
          ]
        },
        {
          type: 'text',
          content: '### Step 2: Install in JOSM (Automatic Method - Recommended)'
        },
        {
          type: 'steps',
          content: 'Installation Steps:',
          items: [
            'Open JOSM',
            'Go to Edit → Preferences (or press F12)',
            'Click the Plugins tab on the left',
            'Click "📂 Add..." or "Install from file..." button at the bottom',
            'Browse to where you saved DPWValidationTool.jar',
            'Select the file and click Open',
            'Click OK to close the Preferences window',
            'Restart JOSM when prompted'
          ]
        },
        {
          type: 'text',
          content: '### Step 3: Verify Installation'
        },
        {
          type: 'steps',
          content: 'Verification:',
          items: [
            'Restart JOSM completely (close and reopen)',
            'Click Windows → DPW Validation Tool',
            'A panel should appear on the right side of JOSM',
            'If you see the panel, installation successful! ✅'
          ]
        },
        {
          type: 'tip',
          content: '## Pro Tip\n\nKeep the DPW Validation Tool panel open all the time—it doesn\'t slow down JOSM and saves you time opening it repeatedly. You can drag it to reposition or dock it with other panels.'
        }
      ],
      keyTakeaways: [
        'You need JOSM 18823+ and Java 21+',
        'Download DPWValidationTool.jar from GitHub releases',
        'Install through JOSM Preferences → Plugins',
        'Verify by checking Windows → DPW Validation Tool',
        'Keep the plugin panel open for faster workflow'
      ]
    }
  },
  {
    id: 'validator-3',
    title: 'First-Time Setup & Authentication',
    shortTitle: 'Setup',
    estimatedTime: 15,
    content: {
      introduction: 'Before you can validate, you need to authenticate with OpenStreetMap and verify that you\'re authorized as a validator in the project.',
      mainContent: [
        {
          type: 'text',
          content: '## Step 1: Authenticate with OpenStreetMap\n\nThe plugin uses your JOSM OAuth login to identify you automatically.'
        },
        {
          type: 'steps',
          content: 'Authentication Process:',
          items: [
            'Open JOSM',
            'Go to Edit → Preferences (or press F12)',
            'Click Connection Settings on the left',
            'In the OSM Server section, click "🔓 Authenticate"',
            'Your web browser will open',
            'Log in to your OpenStreetMap account',
            'Click "Authorize" to grant JOSM access',
            'Return to JOSM - you should see "Authenticated as: [your username]"',
            'Click OK to save'
          ]
        },
        {
          type: 'tip',
          content: '## One-Time Setup\n\nYou only need to authenticate once! JOSM will remember your authentication for future sessions.'
        },
        {
          type: 'text',
          content: '## Step 2: Verify Project Authorization\n\nThe plugin automatically checks if you\'re authorized when you first try to use it.'
        },
        {
          type: 'text',
          content: '### What Happens During Authorization Check:\n\n- When you click **"Isolate"** for the first time, the plugin checks your authorization\n- If you\'re authorized ✅, the plugin works normally\n- If you\'re NOT authorized ❌, you\'ll see an error message'
        },
        {
          type: 'warning',
          content: '## If You\'re Not Authorized\n\nIf you receive a "User not authorized" error:\n\n1. Contact your project administrator (contact info provided in the error message)\n2. Provide your **OSM username** (exactly as it appears in OpenStreetMap)\n3. Wait for confirmation that you\'ve been added to the authorized validators list\n4. Restart JOSM and try again'
        },
        {
          type: 'text',
          content: '## Step 3: Open the Plugin Panel'
        },
        {
          type: 'steps',
          content: 'Opening the Panel:',
          items: [
            'In JOSM, click Windows → DPW Validation Tool',
            'The panel will appear on the right side',
            'You can drag it to reposition or dock it with other panels',
            'The panel shows a status indicator at the top',
            'Keep it open during your validation sessions'
          ]
        },
        {
          type: 'text',
          content: '## Understanding the Plugin Interface\n\nThe plugin panel has several key sections:\n\n- **Status Bar**: Shows your current step in the workflow (yellow/blue/green)\n- **Date Selector**: Calendar to choose validation date\n- **Mapper Dropdown**: List of authorized mappers to validate\n- **Error Counters**: +/- buttons for 10 error types\n- **Comments Field**: Space for your validation notes\n- **Action Buttons**: Isolate, Record Validation, Reset Session'
        }
      ],
      keyTakeaways: [
        'Authenticate with OSM through JOSM (one-time setup)',
        'Plugin automatically checks your validator authorization',
        'Contact admin if you\'re not authorized',
        'Keep the plugin panel open during sessions',
        'Status bar guides you through each step'
      ]
    }
  },
  {
    id: 'validator-4',
    title: 'Understanding the Validation Workflow',
    shortTitle: 'Workflow',
    estimatedTime: 15,
    content: {
      introduction: 'The DPW Validation Tool uses a guided, step-by-step workflow that prevents mistakes and ensures consistency across all validations.',
      mainContent: [
        {
          type: 'text',
          content: '## The 6-Step Validation Process\n\nEvery validation follows this exact sequence:'
        },
        {
          type: 'code',
          content: '```\n┌─────────────────────────────────────────────────────────┐\n│  1. SELECT DATE & MAPPER                                │\n│     ↓ Choose validation date + select mapper           │\n├─────────────────────────────────────────────────────────┤\n│  2. ISOLATE WORK                                        │\n│     ↓ Click "Isolate" to load mapper\'s buildings       │\n├─────────────────────────────────────────────────────────┤\n│  3. REVIEW & VALIDATE                                   │\n│     ↓ Inspect buildings, count errors, add comments    │\n├─────────────────────────────────────────────────────────┤\n│  4. RECORD VALIDATION                                   │\n│     ↓ Click "Record Validation" to submit data         │\n├─────────────────────────────────────────────────────────┤\n│  5. EXPORT DATA                                         │\n│     ↓ Save file + automatic cloud backup               │\n├─────────────────────────────────────────────────────────┤\n│  6. RESET SESSION                                       │\n│     ↓ Clear layers and start next validation           │\n└─────────────────────────────────────────────────────────┘\n```'
        },
        {
          type: 'text',
          content: '## Visual Status Indicators\n\nThe status bar at the top of the plugin panel shows exactly where you are:'
        },
        {
          type: 'list',
          content: 'Status Colors & Meanings:',
          items: [
            '🟡 Yellow: "▶ Current Step: Select Date & Mapper" - Choose date and mapper, then click Isolate',
            '🔵 Blue: "▶ Current Step: Validate & Submit" - Review work, count errors, submit',
            '🟢 Green: "✓ Submitted - Exporting..." - Export is in progress',
            '🟢 Green: "✓ Complete - Ready to Restart" - Ready to reset for next validation'
          ]
        },
        {
          type: 'text',
          content: '## Step 1: Select Date & Mapper (Yellow Status)\n\nThis is where you choose what work to validate.'
        },
        {
          type: 'steps',
          content: 'Selection Process:',
          items: [
            'Click the 📅 calendar icon to select the validation date',
            'Click "🔄 Refresh Mapper List" (first time only)',
            'Select the mapper from the dropdown',
            'Settlement auto-fills based on mapper\'s assignment',
            'Optionally enter Task ID from Tasking Manager',
            'Click "🔍 Isolate Mapper\'s Work" button'
          ]
        },
        {
          type: 'warning',
          content: '## Important: Date Selection\n\nAlways select the date first! The date determines which buildings are loaded. Selecting the wrong date means you\'ll be looking at work from a different day, which invalidates your validation.'
        },
        {
          type: 'text',
          content: '## Step 2: Isolate Work (Blue Status)\n\nThe plugin downloads and filters the mapper\'s buildings.'
        },
        {
          type: 'text',
          content: 'What happens during isolation:\n- Downloads OSM data for the selected mapper and date\n- Filters to show only that mapper\'s buildings\n- Creates a new layer: "Validation: [mapper] - [date]"\n- Status changes to blue: "▶ Current Step: Validate & Submit"'
        },
        {
          type: 'text',
          content: '## Step 3: Review & Validate (Blue Status)\n\nThis is where you do the actual validation work.'
        },
        {
          type: 'steps',
          content: 'Review Process:',
          items: [
            'Zoom to the isolated layer (right-click → Zoom to layer)',
            'Inspect each building for quality issues',
            'Use JOSM validation (Shift+V) to find errors',
            'Count errors using +/- buttons in the plugin',
            'Enter total buildings count',
            'Add comments about your findings'
          ]
        },
        {
          type: 'text',
          content: '## Step 4: Record Validation (Submit)\n\nSubmit your validation data to the central system.'
        },
        {
          type: 'steps',
          content: 'Submission Process:',
          items: [
            'Review the validation summary',
            'Click "✅ Record Validation" button',
            'Confirm in the dialog that appears',
            'Wait for "Submitted successfully" message',
            'Status changes to green: "✓ Submitted - Exporting..."'
          ]
        },
        {
          type: 'text',
          content: '## Step 5: Export Data (Green Status)\n\nSave the validated work to your computer and cloud.'
        },
        {
          type: 'text',
          content: 'Export process:\n- Dialog prompts: "Export validated layer now?"\n- Click "📤 Export Now"\n- Choose save location\n- File is automatically named: Task_[ID]_[Mapper]_[Date].osm\n- Local file saves first\n- Then automatic cloud backup\n- Status changes to: "✓ Complete - Ready to Restart"'
        },
        {
          type: 'text',
          content: '## Step 6: Reset Session (Green Status)\n\nClear everything and prepare for the next validation.'
        },
        {
          type: 'steps',
          content: 'Reset Process:',
          items: [
            'Dialog prompts: "Ready for Next Task"',
            'Click "🔄 Reset Session" (recommended)',
            'All layers are removed',
            'Form fields are cleared',
            'Error counts reset to 0',
            'Status returns to yellow: "Select Date & Mapper"',
            'JOSM stays open—no restart needed!'
          ]
        },
        {
          type: 'tip',
          content: '## Workflow Best Practice\n\nAlways reset between validations! It prevents:\n- Data mixing between validations\n- JOSM becoming slow with too many layers\n- Confusion about which layer is current\n- Accidental duplicate submissions\n\nResetting takes only 2 seconds and ensures a clean, professional workflow.'
        }
      ],
      keyTakeaways: [
        'Follow the 6-step workflow every time',
        'Status bar (yellow/blue/green) guides you',
        'Always select date before mapper',
        'Isolate creates a clean validation layer',
        'Submit sends data to central system',
        'Reset between validations (recommended)'
      ]
    }
  },
  {
    id: 'validator-5',
    title: 'The 10 Error Types Explained',
    shortTitle: 'Error Types',
    estimatedTime: 30,
    content: {
      introduction: 'As a validator, you will identify and count 10 specific types of mapping errors. Understanding each error type is crucial for accurate validation.',
      mainContent: [
        {
          type: 'text',
          content: '## Error Type 1: Hanging Nodes\n\n**What it is:**\n- Building outline has nodes that don\'t connect properly\n- Open polygons instead of closed buildings\n- Duplicate nodes in the same location'
        },
        {
          type: 'text',
          content: '**How to identify:**\n- Building appears to have a gap or opening\n- JOSM validation shows "unclosed way"\n- Nodes are highlighted when you zoom in'
        },
        {
          type: 'code',
          content: '```\nWRONG:                  RIGHT:\n  ┌──────┐               ┌──────┐\n  │      │               │      │\n  │      └──             │      │\n  └─                     └──────┘\n  (gap in corner)        (fully closed)\n```'
        },
        {
          type: 'warning',
          content: '**When to count:**\n- Each building with hanging nodes = 1 error\n- If one building has multiple hanging nodes, count as 1 error (not multiple)'
        },
        {
          type: 'text',
          content: '## Error Type 2: Overlapping Buildings\n\n**What it is:**\n- Two or more buildings share the same space\n- Buildings drawn on top of each other\n- Partial overlap between building footprints'
        },
        {
          type: 'text',
          content: '**How to identify:**\n- Buildings highlighted in red/pink by JOSM validation\n- Multiple building outlines in the same location\n- Select a building and see another underneath'
        },
        {
          type: 'code',
          content: '```\nWRONG:                  RIGHT:\n  ┌──────┐               ┌─────┐  ┌─────┐\n  │  ┌───┼──┐            │     │  │     │\n  │  │XXX│  │            │     │  │     │\n  └──┼───┘  │            └─────┘  └─────┘\n     └──────┘            (separate)\n  (overlap area XXX)\n```'
        },
        {
          type: 'warning',
          content: '**When to count:**\n- Each overlapping building = 1 error\n- If Building A overlaps B and C, count as 2 errors'
        },
        {
          type: 'text',
          content: '## Error Type 3: Buildings Crossing Highway\n\n**What it is:**\n- Building outline intersects a road/highway\n- Building drawn over a road\n- Shared nodes between building and road'
        },
        {
          type: 'text',
          content: '**How to identify:**\n- Building polygon crosses a highway line\n- JOSM validation shows "crossing ways"\n- Road appears to go through the building'
        },
        {
          type: 'code',
          content: '```\nWRONG:                  RIGHT:\n    ║                       ║\n  ┌─╫──┐                ┌────┐\n  │ ║  │       →        │    │  ║\n  └─╫──┘                └────┘  ║\n    ║                       ║\n  (road crosses)         (separate)\n```'
        },
        {
          type: 'text',
          content: '## Error Type 4: Missing Tags\n\n**What it is:**\n- Building drawn but missing required tags\n- No `building=*` tag\n- Missing name or other required attributes'
        },
        {
          type: 'text',
          content: '**How to identify:**\n- Select building and check tags panel (Alt+Shift+T)\n- No `building=` tag present\n- JOSM validation may show "untagged way"'
        },
        {
          type: 'list',
          content: 'Required tags for buildings:',
          items: [
            '✅ building=yes (or residential, house, etc.)',
            '❌ No tags at all',
            '❌ Only has source=* or other metadata'
          ]
        },
        {
          type: 'text',
          content: '## Error Type 5: Improper Tags\n\n**What it is:**\n- Building has tags but they\'re incorrect\n- Wrong tag values\n- Typos in tag keys or values\n- Deprecated tags'
        },
        {
          type: 'list',
          content: 'Examples of improper tags:',
          items: [
            'building=house1 (should be building=house)',
            'building=reisdential (typo, should be residential)',
            'bldng=yes (wrong key, should be building=yes)',
            'building=yes + shop=yes (should be building=retail)'
          ]
        },
        {
          type: 'text',
          content: '## Error Type 6: Features Misidentified\n\n**What it is:**\n- Feature mapped as wrong type\n- E.g., amenity mapped as building\n- Building mapped when it should be landuse\n- Wall/fence mapped as building'
        },
        {
          type: 'list',
          content: 'Common misidentifications:',
          items: [
            'building=yes for a fence (should be barrier=fence)',
            'building=yes for a garden (should be landuse=residential)',
            'amenity=school on a building polygon (should be building=school + amenity=school)'
          ]
        },
        {
          type: 'text',
          content: '## Error Type 7: Missing Buildings\n\n**What it is:**\n- Building visible in imagery but not mapped\n- Mapper missed buildings in their area\n- Incomplete coverage'
        },
        {
          type: 'text',
          content: '**How to identify:**\n- Compare JOSM view with satellite imagery\n- Look for obvious building shapes not traced\n- Check corners and edges of task area'
        },
        {
          type: 'tip',
          content: '**Be reasonable:** Only count clear, obvious buildings. Don\'t count structures that are unclear in the imagery or partially obscured.'
        },
        {
          type: 'text',
          content: '## Error Type 8: Building Inside Building\n\n**What it is:**\n- One building polygon completely inside another\n- Duplicate building outlines\n- Building drawn as multipolygon when it shouldn\'t be'
        },
        {
          type: 'code',
          content: '```\nWRONG:                  RIGHT:\n  ┌──────────┐           ┌──────────┐\n  │  ┌────┐  │           │          │\n  │  │    │  │     →     │          │\n  │  └────┘  │           │          │\n  └──────────┘           └──────────┘\n  (inner building)       (single building)\n```'
        },
        {
          type: 'text',
          content: '## Error Type 9: Building Crossing Residential\n\n**What it is:**\n- Building polygon crosses a residential area boundary\n- Building extends into `landuse=residential` area improperly\n- Boundary conflicts'
        },
        {
          type: 'text',
          content: '**How to identify:**\n- Building outline crosses landuse polygon\n- Shared edges between building and residential area\n- JOSM validation shows overlapping areas'
        },
        {
          type: 'text',
          content: '## Error Type 10: Improperly Drawn\n\n**What it is:**\n- Poor geometry quality\n- Buildings that should be rectangular but aren\'t\n- Wavy lines instead of straight edges\n- Too many unnecessary nodes\n- Poor alignment with imagery'
        },
        {
          type: 'code',
          content: '```\nWRONG:                  RIGHT:\n  ┌──┐                  ┌──────┐\n  │  └─┐                │      │\n  │    └─┐              │      │\n  └──────┘              └──────┘\n  (wavy edges)          (clean rectangle)\n```'
        },
        {
          type: 'tip',
          content: '**Be fair:** Focus on significant geometry issues. Minor imperfections (e.g., building corner 1cm off) usually don\'t need to be counted. The building should look messy or clearly wrong.'
        }
      ],
      keyTakeaways: [
        'There are 10 specific error types to track',
        'Each building counts as 1 error per type (not multiple)',
        'Use JOSM validation (Shift+V) to help identify errors',
        'Compare with imagery for missing buildings',
        'Be fair—count significant issues, not minor imperfections',
        'When in doubt, check project guidelines or ask team lead'
      ]
    }
  },
  {
    id: 'validator-6',
    title: 'Validation Best Practices',
    shortTitle: 'Best Practices',
    estimatedTime: 20,
    content: {
      introduction: 'Following best practices ensures consistent, high-quality validations and makes you a more efficient validator.',
      mainContent: [
        {
          type: 'text',
          content: '## DO\'s - Essential Practices'
        },
        {
          type: 'list',
          content: '### Always Do These:',
          items: [
            '**Select the date first** - Ensures you only see work from that specific day',
            '**Use JOSM\'s built-in validation** - Press Shift+V to run checks',
            '**Be thorough but fair** - Check carefully but don\'t count minor issues',
            '**Add detailed comments** - Explain what you found, be constructive',
            '**Reset session between validations** - Keeps JOSM clean and fast',
            '**Save validated data immediately** - Don\'t skip the export step',
            '**Double-check before submitting** - Review the validation summary',
            '**Keep the plugin panel open** - Saves time and shows status'
          ]
        },
        {
          type: 'text',
          content: '## DON\'Ts - Common Mistakes to Avoid'
        },
        {
          type: 'list',
          content: '### Never Do These:',
          items: [
            '**Don\'t skip date selection** - Required for accurate isolation',
            '**Don\'t validate without isolating** - You might review wrong data',
            '**Don\'t count the same error multiple times** - One building = one error per type',
            '**Don\'t be overly critical** - Focus on significant issues only',
            '**Don\'t submit without reviewing** - Can\'t edit after submission',
            '**Don\'t skip the export step** - Creates project deliverables',
            '**Don\'t continue without resetting** - Layers pile up, JOSM slows down',
            '**Don\'t work completely offline** - Need internet for isolation and submission'
          ]
        },
        {
          type: 'text',
          content: '## Error Counting Guidelines\n\n### How to Count Multiple Errors on One Building'
        },
        {
          type: 'text',
          content: 'Example: A building has hanging nodes AND missing tags\n\n**Correct counting:**\n- +1 hanging nodes\n- +1 missing tags\n- Total: 2 errors recorded'
        },
        {
          type: 'warning',
          content: '**Don\'t count the same error type twice for one building!**\n\nIf a building has 3 hanging nodes, count as:\n- +1 hanging nodes (not +3)\n\nEach building can only contribute 1 count per error type.'
        },
        {
          type: 'text',
          content: '## Quality vs. Quantity\n\n**Focus on quality, not speed!**'
        },
        {
          type: 'list',
          content: 'Quality Validation Means:',
          items: [
            'Taking time to inspect each building carefully',
            'Using JOSM validation tools (Shift+V)',
            'Comparing with satellite imagery',
            'Being consistent in your decisions',
            'Adding helpful, constructive comments',
            'Not rushing through validations'
          ]
        },
        {
          type: 'text',
          content: '### Typical Validation Times:\n- Small task (10-20 buildings): 10-15 minutes\n- Medium task (30-50 buildings): 15-25 minutes\n- Large task (60-100 buildings): 25-35 minutes\n\nMost validators complete 5-15 validations per day.'
        },
        {
          type: 'text',
          content: '## Writing Good Validation Comments'
        },
        {
          type: 'list',
          content: '### Good Comments:',
          items: [
            '"Good quality work overall. Minor tag issues on 3 buildings in northeast corner."',
            '"Several buildings need geometry fixes. Buildings are wavy and not properly squared."',
            '"Mapper missed 3 clear buildings visible in southeast area. Otherwise excellent work."',
            '"Excellent work! All buildings properly traced and tagged. No issues found."'
          ]
        },
        {
          type: 'list',
          content: '### Bad Comments:',
          items: [
            '"Bad work" (not specific or helpful)',
            '"Lots of errors" (what kind? where?)',
            '"OK" (not informative)',
            '(leaving comment field empty)'
          ]
        },
        {
          type: 'tip',
          content: '## Pro Tips for Efficiency\n\n1. **Use keyboard shortcuts:**\n   - Shift+V: Open validation panel\n   - Ctrl+A: Select all\n   - Alt+Shift+T: Show tags panel\n\n2. **Set up dual monitors:**\n   - Imagery on one screen\n   - JOSM on another\n\n3. **Take breaks every hour:**\n   - Validation requires concentration\n   - Prevents fatigue errors\n\n4. **Create a checklist:**\n   - Print out the 10 error types\n   - Check off as you review\n   - Ensures nothing is missed'
        },
        {
          type: 'text',
          content: '## When You\'re Unsure\n\nIf you\'re not sure whether something is an error:'
        },
        {
          type: 'steps',
          content: 'Decision Process:',
          items: [
            'Check JOSM\'s validation panel (Shift+V)',
            'Compare with project guidelines',
            'Ask your team lead or supervisor',
            'Be consistent—make the same decision for similar cases',
            'Document your decision in the comments'
          ]
        },
        {
          type: 'warning',
          content: '## Remember: You\'re Recording, Not Rejecting\n\nAll validation results are recorded—whether perfect or with errors. You\'re not rejecting the mapper\'s work; you\'re providing data that helps:\n\n- Track mapper performance over time\n- Identify training needs\n- Improve project workflows\n- Ensure client deliverables meet standards\n\nBe thorough and accurate, but also fair and constructive.'
        }
      ],
      keyTakeaways: [
        'Always select date first, then isolate',
        'Use JOSM validation tools (Shift+V)',
        'One building = one error per type (max)',
        'Quality over quantity—be thorough',
        'Write specific, helpful comments',
        'Reset between validations',
        'You\'re recording data, not rejecting work'
      ]
    }
  },
  {
    id: 'validator-7',
    title: 'Troubleshooting Common Issues',
    shortTitle: 'Troubleshooting',
    estimatedTime: 25,
    content: {
      introduction: 'Even with a well-designed tool, you may encounter issues. This section covers common problems and their solutions.',
      mainContent: [
        {
          type: 'text',
          content: '## Issue 1: Plugin Not Loading\n\n**Symptoms:**\n- Plugin doesn\'t appear in Windows menu\n- No DPW Validation Tool panel'
        },
        {
          type: 'steps',
          content: 'Solutions:',
          items: [
            'Check JOSM version (Help → About, must be 18823+)',
            'Verify plugin installation (check %APPDATA%\\JOSM\\plugins\\ for DPWValidationTool.jar)',
            'Check JOSM logs (Help → Show Log, search for "DPWValidationTool")',
            'Restart JOSM completely',
            'Re-install the plugin if needed'
          ]
        },
        {
          type: 'text',
          content: '## Issue 2: "Not Authenticated" Error\n\n**Symptoms:**\n- Error message: "Not authenticated" or "OAuth error"\n- Can\'t isolate work'
        },
        {
          type: 'steps',
          content: 'Solutions:',
          items: [
            'Go to Edit → Preferences → Connection Settings',
            'Click "Authenticate" under OSM Server',
            'Log in with your OSM account in the browser',
            'Verify "Authenticated as: [username]" appears',
            'Restart JOSM and try again'
          ]
        },
        {
          type: 'text',
          content: '## Issue 3: "User Not Authorized" Error\n\n**Symptoms:**\n- Error message: "User not authorized"\n- Error says to contact project administrator'
        },
        {
          type: 'steps',
          content: 'Solutions:',
          items: [
            'Verify you\'re logged in with the correct OSM account',
            'Contact project administrator with your exact OSM username',
            'Wait for confirmation that you\'ve been added',
            'Restart JOSM',
            'Click "Refresh Mapper List"',
            'Try isolating work again'
          ]
        },
        {
          type: 'text',
          content: '## Issue 4: "No Buildings Found" After Isolation\n\n**Symptoms:**\n- Isolation completes but no buildings appear\n- Empty validation layer'
        },
        {
          type: 'list',
          content: 'Possible causes and solutions:',
          items: [
            '**Wrong date:** Mapper didn\'t work on that date → Select different date',
            '**Wrong mapper:** Mapper never worked on this project → Select different mapper',
            '**Network issue:** Couldn\'t download data → Check internet, try again',
            '**No work in area:** Mapper worked elsewhere → Check project task boundaries'
          ]
        },
        {
          type: 'text',
          content: '## Issue 5: Cannot Submit Validation\n\n**Symptoms:**\n- "Record Validation" button doesn\'t work\n- Error during submission'
        },
        {
          type: 'steps',
          content: 'Solutions:',
          items: [
            'Check internet connection (submission requires internet)',
            'Verify all required fields are filled (total buildings, mapper, date)',
            'Check field length limits (Task ID: 100 chars, Comments: 1000 chars)',
            'Wait 10 seconds and try again',
            'Check JOSM logs (Help → Show Log) for error messages'
          ]
        },
        {
          type: 'text',
          content: '## Issue 6: Export Failed\n\n**Symptoms:**\n- No export prompt after submission\n- Export fails with error'
        },
        {
          type: 'steps',
          content: 'Solutions:',
          items: [
            'Check if validation layer still exists in Layers panel',
            'Verify write permissions to target folder',
            'Check available disk space (OSM files are 1-50 MB)',
            'Try saving to a different location',
            'Manual export: Right-click layer → Save As...'
          ]
        },
        {
          type: 'text',
          content: '## Issue 7: Cloud Backup Failed\n\n**Symptoms:**\n- Message: "Cloud upload failed"\n- Local file saved but not backed up'
        },
        {
          type: 'tip',
          content: '**Don\'t worry!** Your local file is safe on your computer. The plugin shows:\n- ✓ File saved locally\n- ⚠️ Cloud backup failed\n\nYour work is not lost. Project managers can retrieve the local file if needed.'
        },
        {
          type: 'steps',
          content: 'Solutions:',
          items: [
            'Check internet connection',
            'Wait a few minutes—may be temporary server issue',
            'Contact support if problem persists',
            'Continue working—local file is safe'
          ]
        },
        {
          type: 'text',
          content: '## Issue 8: Plugin Becomes Unresponsive\n\n**Symptoms:**\n- Plugin panel doesn\'t respond to clicks\n- Buttons don\'t work'
        },
        {
          type: 'steps',
          content: 'Solutions:',
          items: [
            'Close plugin panel: Windows → DPW Validation Tool (uncheck)',
            'Reopen plugin panel: Windows → DPW Validation Tool (check)',
            'Click "Reset Session" if available',
            'Save any work and restart JOSM',
            'Close other programs if system is slow',
            'Restart computer if needed'
          ]
        },
        {
          type: 'text',
          content: '## Issue 9: Mapper List is Empty\n\n**Symptoms:**\n- Mapper dropdown has no options\n- Can\'t select a mapper'
        },
        {
          type: 'steps',
          content: 'Solutions:',
          items: [
            'Click "Refresh Mapper List" button',
            'Wait for "success" message',
            'Check internet connection',
            'Verify you\'re an authorized validator',
            'Wait 1-2 minutes and try again'
          ]
        },
        {
          type: 'text',
          content: '## Issue 10: JOSM Runs Slowly\n\n**Symptoms:**\n- JOSM is laggy or unresponsive\n- Takes long time to load or save'
        },
        {
          type: 'steps',
          content: 'Solutions:',
          items: [
            'Reset session to remove old layers',
            'Close other programs to free memory',
            'Restart JOSM',
            'Check if you have many plugins installed',
            'Increase JOSM memory: Edit → Preferences → Advanced',
            'Close unused JOSM panels'
          ]
        },
        {
          type: 'warning',
          content: '## When to Contact Support\n\nContact your project administrator if:\n- You\'re repeatedly getting "User not authorized" errors\n- Plugin consistently fails to submit validations\n- Cloud backup fails for multiple validations\n- You find a bug or unexpected behavior\n\nWhen reporting issues, include:\n- Plugin version (v3.0.3)\n- JOSM version\n- What you were doing\n- Error message (if any)\n- Screenshot (if helpful)'
        }
      ],
      keyTakeaways: [
        'Most issues can be fixed with restart or re-authentication',
        'Check JOSM version (18823+) and authentication first',
        'Local files are always saved even if cloud backup fails',
        'Reset session if plugin becomes unresponsive',
        'Contact administrator for authorization issues',
        'Report bugs on GitHub with details'
      ]
    }
  }
];

// ============================================================================
// STAFF AUTHENTICATION SYSTEM
// ============================================================================

/**
 * Registered Staff IDs Database
 * TODO: Move this to a secure backend database
 * For now, this is a placeholder for staff ID registration
 */
const registeredStaffIds: Map<string, StaffCredentials> = new Map([
  // Example entries - Replace with actual staff data
  // ['SC001', { staffId: 'SC001', name: 'John Validator', role: 'validator', registeredAt: new Date('2025-01-01') }],
  // ['SC002', { staffId: 'SC002', name: 'Jane Admin', role: 'admin', registeredAt: new Date('2025-01-01') }],
]);

/**
 * Validates a Staff ID
 * @param staffId - The staff ID to validate
 * @returns Authentication result with success status and message
 * @deprecated This function is no longer used. Authentication now happens via the database API.
 */
export function authenticateStaffId(staffId: string): AuthenticationResult {
  // Trim and convert to uppercase for consistency
  const cleanStaffId = staffId.trim().toUpperCase();

  // Validate format (example: SC followed by 3+ digits)
  const staffIdPattern = /^SC\d{3,}$/;
  if (!staffIdPattern.test(cleanStaffId)) {
    return {
      success: false,
      message: 'Invalid Staff ID format. Staff ID should be in format: SC### (e.g., SC001)',
    };
  }

  // Note: Authentication is now handled by the database API
  // This function is kept for backward compatibility
  return {
    success: true,
    staffId: cleanStaffId,
    message: 'Please use the database authentication system.',
  };
}

/**
 * Registers a new Staff ID (Admin function)
 * @param staffId - The staff ID to register
 * @param name - Staff member's name
 * @param role - Staff role (validator or admin)
 * @returns Success status and message
 */
export function registerStaffId(
  staffId: string,
  name: string,
  role: 'validator' | 'admin' = 'validator'
): { success: boolean; message: string } {
  const cleanStaffId = staffId.trim().toUpperCase();

  // Validate format
  const staffIdPattern = /^SC\d{3,}$/;
  if (!staffIdPattern.test(cleanStaffId)) {
    return {
      success: false,
      message: 'Invalid Staff ID format. Use format: SC### (e.g., SC001)',
    };
  }

  // Check if already registered
  if (registeredStaffIds.has(cleanStaffId)) {
    return {
      success: false,
      message: 'Staff ID already registered.',
    };
  }

  // Register the staff ID
  registeredStaffIds.set(cleanStaffId, {
    staffId: cleanStaffId,
    name,
    role,
    registeredAt: new Date(),
  });

  return {
    success: true,
    message: `Staff ID ${cleanStaffId} registered successfully for ${name}.`,
  };
}

/**
 * Checks if a Staff ID is registered
 * @param staffId - The staff ID to check
 * @returns Boolean indicating if staff ID exists
 */
export function isStaffIdRegistered(staffId: string): boolean {
  const cleanStaffId = staffId.trim().toUpperCase();
  return registeredStaffIds.has(cleanStaffId);
}

/**
 * Gets all registered staff (Admin function)
 * @returns Array of all registered staff credentials
 */
export function getAllRegisteredStaff(): StaffCredentials[] {
  return Array.from(registeredStaffIds.values());
}

/**
 * Removes a Staff ID from registration (Admin function)
 * @param staffId - The staff ID to unregister
 * @returns Success status and message
 */
export function unregisterStaffId(staffId: string): { success: boolean; message: string } {
  const cleanStaffId = staffId.trim().toUpperCase();

  if (!registeredStaffIds.has(cleanStaffId)) {
    return {
      success: false,
      message: 'Staff ID not found.',
    };
  }

  registeredStaffIds.delete(cleanStaffId);

  return {
    success: true,
    message: `Staff ID ${cleanStaffId} has been unregistered.`,
  };
}

// ============================================================================
// TRAINING ACCESS FUNCTIONS
// ============================================================================

/**
 * Checks if user has access to validator training content
 * @param staffId - The staff ID to verify
 * @returns Boolean indicating access permission
 */
export function hasValidatorTrainingAccess(staffId: string): boolean {
  // For now, allow all authenticated staff members to access validator training
  // In production, you would check staff role from database
  // Staff with role 'admin' or 'validator' should have access

  // Check if staff role is stored in session
  const staffRole = sessionStorage.getItem('staffRole');

  if (staffRole === 'admin' || staffRole === 'validator') {
    return true;
  }

  // Fallback: Allow any authenticated staff (since they're logged in through database)
  return staffId && staffId.trim().length > 0;
}

/**
 * Gets validator training step (with authentication check)
 * @param id - Step ID
 * @param staffId - Staff ID for authentication
 * @returns Training step or undefined if not authenticated
 */
export function getValidatorStepById(
  id: string,
  staffId?: string
): TrainingStep | undefined {
  // If staffId provided, verify authentication
  if (staffId && !hasValidatorTrainingAccess(staffId)) {
    console.warn('Unauthorized access attempt to validator training');
    return undefined;
  }

  return validatorTrainingSteps.find(step => step.id === id);
}

/**
 * Gets next validator training step (with authentication check)
 * @param currentId - Current step ID
 * @param staffId - Staff ID for authentication
 * @returns Next training step or null
 */
export function getNextValidatorStep(
  currentId: string,
  staffId?: string
): TrainingStep | null {
  // If staffId provided, verify authentication
  if (staffId && !hasValidatorTrainingAccess(staffId)) {
    console.warn('Unauthorized access attempt to validator training');
    return null;
  }

  const currentIndex = validatorTrainingSteps.findIndex(step => step.id === currentId);
  if (currentIndex === -1 || currentIndex === validatorTrainingSteps.length - 1) {
    return null;
  }
  return validatorTrainingSteps[currentIndex + 1];
}

/**
 * Gets previous validator training step (with authentication check)
 * @param currentId - Current step ID
 * @param staffId - Staff ID for authentication
 * @returns Previous training step or null
 */
export function getPreviousValidatorStep(
  currentId: string,
  staffId?: string
): TrainingStep | null {
  // If staffId provided, verify authentication
  if (staffId && !hasValidatorTrainingAccess(staffId)) {
    console.warn('Unauthorized access attempt to validator training');
    return null;
  }

  const currentIndex = validatorTrainingSteps.findIndex(step => step.id === currentId);
  if (currentIndex <= 0) {
    return null;
  }
  return validatorTrainingSteps[currentIndex - 1];
}

/**
 * Gets total estimated time for validator training
 * @returns Total time in minutes
 */
export function getTotalValidatorEstimatedTime(): number {
  return validatorTrainingSteps.reduce((total, step) => total + step.estimatedTime, 0);
}

/**
 * Gets all validator training steps (with authentication check)
 * @param staffId - Staff ID for authentication
 * @returns Array of training steps or empty array if not authenticated
 */
export function getAllValidatorSteps(staffId?: string): TrainingStep[] {
  // If staffId provided, verify authentication
  if (staffId && !hasValidatorTrainingAccess(staffId)) {
    console.warn('Unauthorized access attempt to validator training');
    return [];
  }

  return validatorTrainingSteps;
}
