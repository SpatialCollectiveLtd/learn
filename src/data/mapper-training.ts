// Mapper training steps data structure
export interface TrainingStep {
  id: number;
  title: string;
  shortTitle: string;
  estimatedTime: number;
  content: {
    introduction: string;
    mainContent: Array<{
      type: 'text' | 'list' | 'warning' | 'tip' | 'code' | 'image';
      content: string | string[];
      title?: string;
      imageAlt?: string;
      imagePath?: string;
    }>;
    keyTakeaways?: string[];
  };
}

export const mapperTrainingSteps: TrainingStep[] = [
  {
    id: 1,
    title: "Welcome to Digital Mapping",
    shortTitle: "Introduction",
    estimatedTime: 5,
    content: {
      introduction: "Digital mapping is a critical skill that enables humanitarian organizations, health planners, disaster response teams, and development projects to make informed decisions. As a mapper, you'll contribute to creating and maintaining accurate geographic data that impacts real-world operations.",
      mainContent: [
        {
          type: 'text',
          content: "In this comprehensive training program, you'll learn the complete workflow of digital mapping using industry-standard tools and methodologies. You'll work with satellite imagery, contribute to OpenStreetMap, and become part of a global community of mappers."
        },
        {
          type: 'list',
          title: "What You'll Learn",
          content: [
            "Professional satellite image interpretation techniques",
            "JOSM (Java OpenStreetMap Editor) - The industry-standard mapping software",
            "HOT Tasking Manager workflow and project coordination",
            "Quality assurance and validation processes",
            "Collaboration with the global OpenStreetMap community",
            "Building and infrastructure digitization best practices"
          ]
        },
        {
          type: 'list',
          title: "Essential Requirements",
          content: [
            "Computer: Laptop or desktop with at least 4GB RAM (mobile devices are not suitable)",
            "Input Device: Mouse strongly recommended (trackpads make precise mapping difficult)",
            "Email: Active Gmail account for registrations",
            "Internet: Stable connection for downloading imagery and uploading data",
            "Time: Expect to dedicate 2-3 hours for initial setup and first tasks"
          ]
        },
        {
          type: 'warning',
          content: "Important: Digital mapping requires precision and attention to detail. Never rush through tasks. Quality is more important than quantity, and your work will be validated by experienced mappers."
        },
        {
          type: 'text',
          title: "How Mapping Projects Work",
          content: "You'll work as an individual contributor within a larger coordinated team effort. Each mapping project is divided into small grid squares called 'tasks.' You'll select and complete individual tasks, which are then reviewed by validators. Your compensation is based on volume, accuracy, and consistent quality."
        }
      ],
      keyTakeaways: [
        "Digital mapping supports humanitarian and development work globally",
        "You need a computer with mouse, Gmail account, and stable internet",
        "Quality and accuracy are prioritized over speed",
        "You work independently but as part of a coordinated team effort"
      ]
    }
  },
  {
    id: 2,
    title: "Setting Up Your Accounts",
    shortTitle: "Account Setup",
    estimatedTime: 15,
    content: {
      introduction: "Before you can start mapping, you need to set up three essential accounts. This process takes approximately 15 minutes and establishes your identity within the global mapping community.",
      mainContent: [
        {
          type: 'text',
          title: "Step 1: Gmail Account Creation",
          content: "If you don't already have a Gmail account, you'll need to create one. This email will be your primary communication channel and login credential for mapping platforms."
        },
        {
          type: 'list',
          title: "Gmail Setup Process",
          content: [
            "Navigate to gmail.com in your web browser",
            "Click 'Create account' and select 'For myself'",
            "Fill in your first and last name",
            "Choose a unique email address (this will be your username)",
            "Create a strong password (at least 12 characters with numbers and symbols)",
            "Add a recovery phone number (highly recommended)",
            "Complete the verification process",
            "Accept Google's Terms of Service"
          ]
        },
        {
          type: 'tip',
          content: "Pro Tip: Use a professional email address format like firstname.lastname@gmail.com. This email will appear in your mapping contributions and communications."
        },
        {
          type: 'text',
          title: "Step 2: OpenStreetMap (OSM) Account",
          content: "OpenStreetMap is the collaborative project that creates free editable maps of the world. All your mapping work will be contributed to and stored in the OSM database. Your OSM account is your mapping identity."
        },
        {
          type: 'list',
          title: "OSM Registration Steps",
          content: [
            "Visit openstreetmap.org in your browser",
            "Click the 'Sign Up' button in the top-right corner",
            "Enter your email address (use your Gmail from Step 1)",
            "Create a display name (this will be publicly visible on all your edits)",
            "Set a strong, unique password",
            "Read and accept the Contributor Terms",
            "Check your email for the confirmation message",
            "Click the confirmation link to activate your account",
            "Log in to verify your account is active"
          ]
        },
        {
          type: 'warning',
          content: "Critical: Your OSM display name will be permanently associated with all your mapping contributions. Choose a professional name you'll be comfortable with long-term. It cannot be easily changed later."
        },
        {
          type: 'text',
          title: "Step 3: HOT Tasking Manager Authorization",
          content: "The Humanitarian OpenStreetMap Team (HOT) Tasking Manager coordinates organized mapping projects. It divides large mapping areas into manageable tasks and tracks progress across teams."
        },
        {
          type: 'list',
          title: "Tasking Manager Setup",
          content: [
            "Navigate to tasks.hotosm.org",
            "Click 'Log in' in the top-right corner",
            "Select 'Log in with OpenStreetMap'",
            "You'll be redirected to OpenStreetMap to authorize the connection",
            "Review the permissions (Tasking Manager needs to read your profile and submit edits)",
            "Click 'Grant Access' to authorize",
            "You'll be redirected back to the Tasking Manager",
            "Complete your Tasking Manager profile (skill level, languages, experience)"
          ]
        },
        {
          type: 'tip',
          content: "Set your Tasking Manager skill level to 'Beginner' initially. This helps project managers assign appropriate tasks and ensures you receive tasks suitable for your experience level."
        }
      ],
      keyTakeaways: [
        "Three accounts required: Gmail, OpenStreetMap, and HOT Tasking Manager",
        "Your OSM display name is permanent and publicly visible",
        "Tasking Manager connects via OAuth to your OSM account",
        "Mark yourself as a beginner mapper in your Tasking Manager profile"
      ]
    }
  },
  {
    id: 3,
    title: "Installing and Configuring JOSM",
    shortTitle: "JOSM Setup",
    estimatedTime: 20,
    content: {
      introduction: "JOSM (Java OpenStreetMap Editor) is the professional-grade desktop editor used by experienced mappers worldwide. It offers advanced features, powerful editing tools, and efficient workflows that web-based editors cannot match.",
      mainContent: [
        {
          type: 'text',
          content: "JOSM requires Java to run, so you'll first install Java, then JOSM itself, and finally configure essential plugins and settings to optimize your mapping workflow."
        },
        {
          type: 'text',
          title: "Part 1: Java Installation",
          content: "JOSM is built on Java technology, so your system needs the Java Runtime Environment (JRE) to execute the application."
        },
        {
          type: 'list',
          title: "Installing Java",
          content: [
            "Visit java.com/download in your browser",
            "Click the 'Download Java' button for your operating system",
            "Run the downloaded installer file",
            "Follow the installation wizard (accept default settings)",
            "Wait for installation to complete",
            "Restart your computer to ensure Java is properly registered"
          ]
        },
        {
          type: 'text',
          title: "Part 2: JOSM Installation",
          content: "With Java installed, you're ready to install JOSM. Always download from the official website to ensure you get the latest stable version."
        },
        {
          type: 'list',
          title: "Downloading and Installing JOSM",
          content: [
            "Navigate to josm.openstreetmap.de",
            "Click 'Download' in the main navigation",
            "For Windows: Download 'Windows Installer'",
            "For Mac: Download the .dmg package",
            "For Linux: Download the .jar file",
            "Run the installer and follow the setup wizard",
            "Launch JOSM to verify successful installation",
            "You should see the JOSM welcome screen"
          ]
        },
        {
          type: 'warning',
          content: "First Launch: JOSM may appear blank or show warnings about missing data. This is normal. We'll configure everything in the next steps."
        },
        {
          type: 'text',
          title: "Part 3: Essential Plugin Installation",
          content: "JOSM's power comes from its plugin ecosystem. These extensions add crucial functionality for efficient mapping work."
        },
        {
          type: 'list',
          title: "Installing Required Plugins",
          content: [
            "In JOSM, go to Edit → Preferences (or press F12)",
            "Click the 'Plugins' icon (looks like a puzzle piece)",
            "Wait for the plugin list to load",
            "Search for and check these essential plugins:",
            "  • building_tools - Streamlines building digitization",
            "  • utilsplugin2 - Adds advanced editing features",
            "  • todo - Task management within JOSM",
            "  • imagery_offset_db - Corrects satellite image alignment",
            "Click 'OK' to download and install",
            "Restart JOSM when prompted"
          ]
        },
        {
          type: 'text',
          title: "Part 4: Initial Configuration",
          content: "Proper JOSM configuration improves performance and makes mapping more efficient."
        },
        {
          type: 'list',
          title: "Recommended Settings",
          content: [
            "Open Preferences (F12) → Connection Settings",
            "Enter your OSM username and password (this allows JOSM to upload your edits)",
            "Go to Map Settings → Projection",
            "Ensure 'Mercator' is selected (default)",
            "In Display Settings, adjust interface size if needed for your screen",
            "Enable 'Draw boundaries of downloaded data' to see your work area"
          ]
        },
        {
          type: 'tip',
          content: "Expert Tip: Spend time learning JOSM's keyboard shortcuts. Press 'H' at any time to see a help dialog with available shortcuts for your current mode."
        }
      ],
      keyTakeaways: [
        "Install Java first, then JOSM",
        "Essential plugins: building_tools, utilsplugin2, todo, imagery_offset_db",
        "Configure your OSM credentials in JOSM preferences",
        "Learn keyboard shortcuts to dramatically improve mapping speed"
      ]
    }
  },
  {
    id: 4,
    title: "Understanding the HOT Tasking Manager",
    shortTitle: "Tasking Manager",
    estimatedTime: 25,
    content: {
      introduction: "The HOT Tasking Manager is your command center for coordinated mapping projects. It divides large areas into manageable tasks, assigns work, tracks progress, and ensures consistent quality across distributed teams of mappers worldwide.",
      mainContent: [
        {
          type: 'text',
          content: "Before you start mapping, you need to understand how mapping projects are organized, how to select appropriate tasks, and how to use the Tasking Manager interface effectively."
        },
        {
          type: 'text',
          title: "Part 1: Project Structure and Organization",
          content: "Every mapping project in the Tasking Manager is designed for a specific purpose - disaster response, preventive health planning, infrastructure development, or humanitarian aid. Understanding project structure helps you choose appropriate tasks and contribute effectively."
        },
        {
          type: 'list',
          title: "Key Project Components",
          content: [
            "Project Area: The geographic region divided into a grid of task squares",
            "Project Instructions: Specific mapping requirements and guidelines",
            "Priority Areas: Tasks marked as urgent or high-importance",
            "Difficulty Level: Beginner, Intermediate, or Advanced classification",
            "Imagery Source: The satellite/aerial imagery you'll use for mapping",
            "Validation Requirements: Quality standards your work must meet"
          ]
        },
        {
          type: 'text',
          title: "Part 2: Task States and Workflow",
          content: "Each individual task square in a project moves through specific states that communicate its status to the entire mapping team."
        },
        {
          type: 'list',
          title: "Task Status Definitions",
          content: [
            "Ready: Available for mapping, no one has started work",
            "Locked for Mapping: You or another mapper is currently working on it",
            "Ready for Validation: Mapping complete, awaiting quality review",
            "Locked for Validation: A validator is currently reviewing the work",
            "Validated: Task approved, meets quality standards",
            "Invalidated: Task needs corrections, returned to mapper",
            "Bad Imagery: Satellite imagery too poor quality to map accurately"
          ]
        },
        {
          type: 'warning',
          content: "Critical: When you lock a task for mapping, you have a 2-hour window to complete and submit it. If you exceed this time without unlocking, the system automatically releases the task. Always unlock tasks if you can't complete them."
        },
        {
          type: 'text',
          title: "Part 3: Selecting Your First Task",
          content: "Choosing the right task is crucial for successful mapping. Don't just pick randomly - use the Tasking Manager's features to find appropriate work."
        },
        {
          type: 'list',
          title: "Task Selection Best Practices",
          content: [
            "Start with 'Beginner' projects until you've completed at least 20-30 tasks",
            "Read the complete project instructions before locking any task",
            "Use the 'Tasks' tab to view the grid and choose specific squares",
            "Check task priority levels (Priority 1 = most urgent)",
            "Look at completed neighboring tasks to understand mapping patterns",
            "Avoid tasks with complex features (large commercial areas, dense urban centers) initially",
            "Choose tasks with clear satellite imagery (minimal cloud cover, good resolution)"
          ]
        },
        {
          type: 'tip',
          content: "Pro Tip: Click on completed tasks in the grid to see what other mappers have created. This helps you understand the expected level of detail and mapping style for the project."
        },
        {
          type: 'text',
          title: "Part 4: The Mapping Workflow",
          content: "Follow this precise workflow for every task you map. Consistency is critical for team coordination."
        },
        {
          type: 'list',
          title: "Standard Mapping Process",
          content: [
            "1. Select Project: Browse projects, read descriptions, check difficulty level",
            "2. Review Instructions: Read ALL instructions, note specific requirements",
            "3. Lock Task: Click task square, click 'Map Selected Task' button",
            "4. Open JOSM: Click 'Edit with JOSM' to load task into editor",
            "5. Map Features: Follow project instructions precisely",
            "6. Review Work: Check for errors, missing features, improper tags",
            "7. Upload to OSM: File → Upload data in JOSM",
            "8. Mark Complete: Return to Tasking Manager, mark task 'Done'",
            "9. Add Comment: Describe what you mapped, any issues encountered",
            "10. Unlock Task: Submit to move task to 'Ready for Validation'"
          ]
        },
        {
          type: 'warning',
          content: "Never skip the comment step! Comments help validators understand your work and provide crucial context for future mappers working on adjacent tasks."
        },
        {
          type: 'text',
          title: "Part 5: Working with Task Instructions",
          content: "Every project has specific instructions that override general mapping guidelines. Always prioritize project-specific requirements."
        },
        {
          type: 'list',
          title: "Common Instruction Types",
          content: [
            "Features to Map: What you should digitize (buildings, roads, waterways, etc.)",
            "Features to Ignore: What to skip (small sheds, fences, temporary structures)",
            "Tagging Requirements: Specific OSM tags to apply",
            "Imagery Alignment: Whether imagery offset corrections are needed",
            "Minimum Size: Smallest features to map (e.g., 'buildings >20m²')",
            "Special Considerations: Local context, cultural factors, known issues"
          ]
        },
        {
          type: 'tip',
          content: "Expert Tip: Keep project instructions open in a separate browser tab while mapping. You'll reference them constantly, especially for tagging requirements."
        }
      ],
      keyTakeaways: [
        "HOT Tasking Manager coordinates distributed mapping through task assignments",
        "Always read complete project instructions before starting",
        "Tasks have a 2-hour lock window - unlock if you can't finish",
        "Follow the 10-step mapping workflow consistently",
        "Comments on completed tasks are mandatory, not optional",
        "Start with beginner projects until you build experience"
      ]
    }
  },
  {
    id: 5,
    title: "Building Digitization Fundamentals",
    shortTitle: "Drawing Buildings",
    estimatedTime: 30,
    content: {
      introduction: "Building digitization is the core skill of humanitarian mapping. Accurate building data enables population estimates, disaster response planning, health service delivery, and infrastructure development. This comprehensive guide covers every aspect of professional building mapping.",
      mainContent: [
        {
          type: 'text',
          content: "Building mapping requires precision, consistency, and attention to detail. Every building you map contributes to critical humanitarian work and must meet strict quality standards."
        },
        {
          type: 'text',
          title: "Part 1: The Building Tool in JOSM",
          content: "JOSM's building tool (from the building_tools plugin) streamlines the process of creating rectangular structures. Master this tool before attempting manual building creation."
        },
        {
          type: 'list',
          title: "Using the Building Tool",
          content: [
            "Activate: Press keyboard shortcut 'B' or click the building icon",
            "Click first corner: Place initial point at building corner",
            "Click opposite corner: Drag to define rectangle size and orientation",
            "Building appears: JOSM auto-creates perfectly rectangular shape",
            "Building is selected: Ready for tag application",
            "Apply tags: Tool automatically adds 'building=yes' tag"
          ]
        },
        {
          type: 'warning',
          content: "Critical: Always zoom in to maximum detail before drawing buildings. What looks like one building at low zoom may actually be multiple separate structures."
        },
        {
          type: 'text',
          title: "Part 2: Identifying Buildings from Satellite Imagery",
          content: "Not everything that looks like a roof is a building you should map. Learn to distinguish buildings from other structures and shadows."
        },
        {
          type: 'list',
          title: "Building Identification Criteria",
          content: [
            "Permanent Structure: Fixed foundation, not temporary or mobile",
            "Enclosed Walls: Complete walls on all sides (not open-air markets)",
            "Roof Visible: Clear roof outline visible in satellite imagery",
            "Appropriate Size: Typically >20m² (check project requirements)",
            "Distinct Shadow: Consistent shadow pattern indicating elevation",
            "Rectangular/Regular Shape: Most buildings have geometric patterns",
            "Context Clues: Located in residential, commercial, or institutional areas"
          ]
        },
        {
          type: 'list',
          title: "Do NOT Map These",
          content: [
            "Shadows on ground (very common beginner mistake)",
            "Vehicles or parked cars",
            "Small sheds or storage units (<20m²)",
            "Temporary structures or tents",
            "Open pavilions without walls",
            "Swimming pools or water tanks",
            "Outdoor sports courts",
            "Construction sites (incomplete buildings)"
          ]
        },
        {
          type: 'tip',
          content: "Pro Tip: If you're uncertain whether something is a building, check multiple neighboring tasks that have been validated. This shows you what experienced mappers consider appropriate."
        },
        {
          type: 'text',
          title: "Part 3: Drawing Rectangular Buildings",
          content: "Most buildings are rectangular. The building tool makes this fast and accurate."
        },
        {
          type: 'list',
          title: "Step-by-Step Process",
          content: [
            "1. Identify building outline clearly visible in imagery",
            "2. Press 'B' to activate building tool",
            "3. Click precisely at one corner of the building",
            "4. Move mouse to diagonally opposite corner",
            "5. Click to complete the rectangle",
            "6. JOSM creates building and selects it automatically",
            "7. Check the Properties panel - 'building=yes' should be present",
            "8. If correct, press ESC to deselect and move to next building"
          ]
        },
        {
          type: 'text',
          title: "Part 4: Complex Building Shapes",
          content: "Not all buildings are simple rectangles. L-shapes, courtyards, and irregular structures require different techniques."
        },
        {
          type: 'list',
          title: "L-Shaped Buildings",
          content: [
            "Draw as TWO separate buildings that share a wall",
            "Create first rectangle for one section",
            "Create second rectangle for perpendicular section",
            "Ensure shared wall nodes overlap exactly",
            "Select both buildings (hold Shift while clicking)",
            "Press 'M' to merge into single building",
            "Tool menu → Merge overlapping ways"
          ]
        },
        {
          type: 'list',
          title: "Buildings with Courtyards",
          content: [
            "Outer wall: Draw outer perimeter of building",
            "Inner courtyard: Draw separate shape for open courtyard area",
            "Select outer building first",
            "Hold Shift, click inner courtyard to select both",
            "Tools → Create multipolygon (or press Ctrl+B)",
            "Inner area becomes 'hole' in building",
            "Tag outer way with 'building=yes'",
            "Inner way automatically becomes 'inner' role"
          ]
        },
        {
          type: 'warning',
          content: "Advanced Shapes Warning: Multipolygons and complex buildings are error-prone. Until you've completed 50+ basic tasks, stick to simple rectangles. Complex buildings can wait."
        },
        {
          type: 'text',
          title: "Part 5: Squaring Buildings",
          content: "Building corners should be perfect 90-degree angles. JOSM provides a tool to fix slightly misaligned buildings."
        },
        {
          type: 'list',
          title: "The Squaring Tool",
          content: [
            "Select the building you want to square",
            "Press 'Q' keyboard shortcut (or Tools → Orthogonalize)",
            "JOSM adjusts all corners to exact 90-degree angles",
            "Building maintains approximate size and position",
            "Use this on every building unless it's truly non-rectangular",
            "Check result - ensure building still aligns with imagery"
          ]
        },
        {
          type: 'tip',
          content: "Efficiency Tip: After drawing a building with the B tool, immediately press Q to square it, then ESC to deselect. This becomes muscle memory: B-click-click-Q-ESC for each building."
        },
        {
          type: 'text',
          title: "Part 6: Building Alignment and Accuracy",
          content: "Your buildings must precisely align with the satellite imagery. Poor alignment creates unusable data."
        },
        {
          type: 'list',
          title: "Alignment Best Practices",
          content: [
            "Zoom to maximum (200% or higher) before drawing",
            "Place nodes at exact corners, not approximate positions",
            "Align with roof outline, not shadows",
            "If imagery is blurry, draw conservatively smaller rather than too large",
            "Check alignment from multiple zoom levels",
            "Compare your work to validated adjacent tasks",
            "If imagery has offset issues, check project instructions for correction method"
          ]
        },
        {
          type: 'text',
          title: "Part 7: Building Tags",
          content: "Proper tagging makes your building data useful. At minimum, every building needs the 'building=yes' tag."
        },
        {
          type: 'list',
          title: "Essential Building Tags",
          content: [
            "building=yes - Required for ALL buildings (auto-added by tool)",
            "building=residential - If clearly a house/home",
            "building=commercial - If clearly a shop/business",
            "building=industrial - Factories, warehouses",
            "building=school - Educational facility",
            "building=hospital - Healthcare facility",
            "building=church - Place of worship (if identifiable)",
            "source=Bing or source=Maxar - Document imagery source"
          ]
        },
        {
          type: 'warning',
          content: "Tagging Warning: Only add specific building types (residential, school, etc.) if you are absolutely certain from imagery or project instructions. When in doubt, use building=yes."
        }
      ],
      keyTakeaways: [
        "Use 'B' tool for rectangular buildings, 'Q' to square corners",
        "Zoom to maximum detail before drawing any building",
        "Do not map shadows, vehicles, or temporary structures",
        "Every building needs 'building=yes' tag at minimum",
        "Complex shapes (L-shapes, courtyards) require advanced techniques",
        "Alignment accuracy is critical - place nodes precisely",
        "When uncertain about building type, use generic 'building=yes'",
        "Practice on beginner projects before attempting complex urban areas"
      ]
    }
  },
  {
    id: 6,
    title: "Roads and Path Digitization",
    shortTitle: "Mapping Roads",
    estimatedTime: 25,
    content: {
      introduction: "Road and path mapping creates the transportation network that connects buildings, enables navigation, and supports logistics planning. Accurate road data is essential for emergency response, delivery services, and community development.",
      mainContent: [
        {
          type: 'text',
          content: "Roads in OpenStreetMap are represented as 'ways' - sequences of connected nodes that follow the centerline of the road. Unlike buildings (which are closed shapes), roads are open lines."
        },
        {
          type: 'text',
          title: "Part 1: Road Classification System",
          content: "OpenStreetMap uses a detailed hierarchy of road types. Proper classification is critical for routing and map rendering."
        },
        {
          type: 'list',
          title: "Road Type Hierarchy",
          content: [
            "highway=motorway - Major divided highways with controlled access",
            "highway=trunk - Important non-motorway routes",
            "highway=primary - Major roads connecting cities",
            "highway=secondary - Roads connecting towns",
            "highway=tertiary - Roads connecting smaller settlements",
            "highway=residential - Streets in residential areas",
            "highway=unclassified - Minor public roads",
            "highway=service - Access roads to buildings, parking lots",
            "highway=track - Agricultural/forestry tracks",
            "highway=path - Footpaths, hiking trails",
            "highway=footway - Dedicated pedestrian paths in urban areas"
          ]
        },
        {
          type: 'warning',
          content: "Classification Accuracy: Misclassifying roads affects GPS routing. A residential street tagged as 'primary' will route heavy traffic incorrectly. When uncertain, check validated neighboring tasks or ask in project chat."
        },
        {
          type: 'text',
          title: "Part 2: Drawing Roads in JOSM",
          content: "Roads are drawn using the standard line drawing tool. The key is following the road centerline accurately."
        },
        {
          type: 'list',
          title: "Road Drawing Process",
          content: [
            "1. Press 'A' to activate the drawing tool",
            "2. Click to place first node at road start",
            "3. Click along road centerline at intervals",
            "4. Add nodes at curves, intersections, and direction changes",
            "5. Press ESC when complete (don't double-click to finish)",
            "6. Road remains selected for tagging",
            "7. Add appropriate highway= tag from list above"
          ]
        },
        {
          type: 'tip',
          content: "Pro Tip: Place nodes closer together on curves and farther apart on straight sections. This creates smooth curves while minimizing unnecessary nodes."
        },
        {
          type: 'text',
          title: "Part 3: Road Intersections and Connections",
          content: "Where roads meet, they must share nodes to enable routing. Disconnected roads appear fine visually but break navigation."
        },
        {
          type: 'list',
          title: "Creating Proper Intersections",
          content: [
            "Zoom in to maximum detail at intersection",
            "Draw first road completely, including through intersection",
            "For second road: click directly ON existing road node at intersection",
            "JOSM shows highlighting when hovering over existing node",
            "This creates shared node, connecting the roads",
            "Both roads can now route through the intersection",
            "Never have two roads cross without sharing a node"
          ]
        },
        {
          type: 'warning',
          content: "Critical: Roads that visually cross but don't share a node create 'broken' routing. Always verify connections by selecting roads and checking shared nodes."
        },
        {
          type: 'text',
          title: "Part 4: Road Names",
          content: "Adding road names dramatically improves map usability and enables address-based routing."
        },
        {
          type: 'list',
          title: "Naming Roads",
          content: [
            "Only add names if visible on signage in imagery or confirmed by project",
            "Tag: name=Street Name (with proper capitalization)",
            "Use local language for name (name=Rue de la Paix)",
            "Add English translation if different (name:en=Peace Street)",
            "Don't abbreviate (write 'Street' not 'St', 'Avenue' not 'Ave')",
            "Don't add road type prefix (name=Main Street, not name=Main)",
            "Unnamed rural roads remain untagged for name"
          ]
        },
        {
          type: 'text',
          title: "Part 5: Road Surface and Conditions",
          content: "Surface tags inform routing decisions for different vehicle types."
        },
        {
          type: 'list',
          title: "Surface Tagging",
          content: [
            "surface=paved - Asphalt or concrete (smooth, all-weather)",
            "surface=unpaved - Gravel, dirt (rough, weather-dependent)",
            "surface=ground - Natural earth surface",
            "tracktype=grade1 through grade5 - Quality rating for tracks",
            "Only add surface tags if clearly visible in high-resolution imagery"
          ]
        },
        {
          type: 'tip',
          content: "Expert Tip: In many mapping projects, surface tagging is optional. Always check project instructions before spending time on surface attributes."
        }
      ],
      keyTakeaways: [
        "Roads are open lines following centerline, buildings are closed shapes",
        "highway= tag determines road type and routing priority",
        "Roads must share nodes at intersections to enable routing",
        "Add names only when confirmed by imagery or project instructions",
        "Press 'A' for line tool, 'ESC' to finish (not double-click)",
        "Check project instructions for required/optional road attributes",
        "When uncertain about classification, check validated adjacent tasks"
      ]
    }
  },
  {
    id: 7,
    title: "Validation and Quality Assurance",
    shortTitle: "Quality Checks",
    estimatedTime: 20,
    content: {
      introduction: "Quality assurance is not optional - it's a core part of every mapper's responsibility. Before uploading any data, you must validate your work using JOSM's built-in tools and manual inspection. Poor quality mapping creates more work for validators and undermines humanitarian efforts.",
      mainContent: [
        {
          type: 'text',
          content: "JOSM includes powerful validation tools that catch common errors automatically. Never upload without running validation and fixing all errors and warnings."
        },
        {
          type: 'text',
          title: "Part 1: JOSM Validation Tool",
          content: "The validation panel identifies errors, warnings, and potential issues in your mapping data."
        },
        {
          type: 'list',
          title: "Running Validation",
          content: [
            "Before upload: Select all your mapped data (Ctrl+A)",
            "Open validation: Window → Validation Results (or Shift+V)",
            "Run validation: Click the 'Validation' button in the panel",
            "Review results: Errors appear in red, warnings in yellow",
            "Click each issue to zoom to problem area",
            "Fix errors before upload - zero errors required",
            "Address warnings when possible, document if unfixable"
          ]
        },
        {
          type: 'warning',
          content: "Non-Negotiable: You MUST fix all validation errors before uploading. Uploading data with errors violates mapping protocols and may result in removal from projects."
        },
        {
          type: 'text',
          title: "Part 2: Common Validation Errors",
          content: "Understanding frequent errors helps you avoid them while mapping."
        },
        {
          type: 'list',
          title: "Most Common Errors and Fixes",
          content: [
            "Duplicate nodes: Two nodes at same location - Select both → Tools → Merge nodes",
            "Unconnected roads: Roads cross without shared node - Move node to snap to road",
            "Overlapping buildings: Buildings shouldn't overlap - Adjust boundaries",
            "Unclosed ways: Building missing final connecting node - Complete the shape",
            "Missing tags: Object without required tags - Add building=yes or highway= tag",
            "Crossing ways: Buildings overlapping incorrectly - Separate or fix boundaries",
            "Nodes close together: Nodes <0.5m apart - Delete unnecessary middle node"
          ]
        },
        {
          type: 'text',
          title: "Part 3: Manual Quality Checks",
          content: "Automated validation can't catch everything. Perform these manual inspections."
        },
        {
          type: 'list',
          title: "Manual Inspection Checklist",
          content: [
            "✓ All buildings are squared (press Q if not)",
            "✓ Buildings align accurately with imagery",
            "✓ No buildings mapped on shadows or vehicles",
            "✓ Roads connect properly at intersections",
            "✓ Road types match visible characteristics",
            "✓ All features have appropriate tags",
            "✓ No duplicate features (same building mapped twice)",
            "✓ Task edges: Features continuing into adjacent tasks are complete to boundary",
            "✓ Checked against project instructions for compliance"
          ]
        },
        {
          type: 'tip',
          content: "Pro Tip: Zoom out to see your entire task area at once. This reveals patterns, duplicate features, and alignment issues not visible when zoomed in."
        },
        {
          type: 'text',
          title: "Part 4: Preparing for Upload",
          content: "Before clicking upload, prepare your changeset with proper documentation."
        },
        {
          type: 'list',
          title: "Upload Checklist",
          content: [
            "Validation complete: Zero errors, warnings addressed",
            "Manual checks: Reviewed entire task area",
            "Changeset comment: Describe what you mapped",
            "Hashtags: Include project hashtag (e.g., #hotosm-project-12345)",
            "Source tag: Document imagery used (e.g., source=Bing)",
            "Review: Final scan before clicking Upload to OSM server"
          ]
        },
        {
          type: 'list',
          title: "Good Changeset Comments",
          content: [
            "✓ 'Mapped 47 buildings in residential area #hotosm-project-12345'",
            "✓ 'Added primary and residential roads #missingmaps'",
            "✓ 'Digitized buildings and paths in rural village'",
            "✗ 'mapping' (too vague)",
            "✗ 'buildings' (no context)",
            "✗ '' (empty - absolutely never!)"
          ]
        },
        {
          type: 'text',
          title: "Part 5: Responding to Validation Feedback",
          content: "When a validator invalidates your task, treat it as valuable learning, not criticism."
        },
        {
          type: 'list',
          title: "Handling Invalidation",
          content: [
            "Read validator comments carefully - they're educational",
            "Look at validator's fixes to understand issues",
            "Ask questions if feedback is unclear (use project chat)",
            "Apply lessons learned to future tasks",
            "Don't be discouraged - invalidation is normal in early tasks",
            "Track your validation rate - aim for >85% validation rate"
          ]
        },
        {
          type: 'warning',
          content: "Important: Repeated invalidation for the same issues indicates you're not learning from feedback. If invalidated 3+ times for similar problems, pause mapping and seek additional training."
        }
      ],
      keyTakeaways: [
        "Run JOSM validation (Shift+V) before every upload - zero errors required",
        "Manual quality checks catch issues automation misses",
        "Proper changeset comments are mandatory, not optional",
        "Include project hashtags in all uploads",
        "Treat invalidation as learning opportunity, not failure",
        "Aim for >85% validation rate on completed tasks",
        "Never upload data with validation errors"
      ]
    }
  }
];

export function getStepById(id: number): TrainingStep | undefined {
  return mapperTrainingSteps.find(step => step.id === id);
}

export function getNextStep(currentId: number): TrainingStep | null {
  const currentIndex = mapperTrainingSteps.findIndex(step => step.id === currentId);
  if (currentIndex >= 0 && currentIndex < mapperTrainingSteps.length - 1) {
    return mapperTrainingSteps[currentIndex + 1];
  }
  return null;
}

export function getPreviousStep(currentId: number): TrainingStep | null {
  const currentIndex = mapperTrainingSteps.findIndex(step => step.id === currentId);
  if (currentIndex > 0) {
    return mapperTrainingSteps[currentIndex - 1];
  }
  return null;
}
