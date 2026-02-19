export const DEFAULT_SETTLEMENT_NAME = "Kayole Soweto";

export interface MobileMappingStep {
  id: number;
  title: string;
  shortTitle: string;
  estimatedTime: number;
  content: {
    introduction: string;
    mainContent: Array<{
      type: 'text' | 'list' | 'warning' | 'tip' | 'image';
      content: string | string[];
      title?: string;
      imageAlt?: string;
      imagePath?: string;
    }>;
    keyTakeaways?: string[];
  };
}


export function getMobileMappingSteps(settlementName: string = DEFAULT_SETTLEMENT_NAME): MobileMappingStep[] {
  return [
    {
      id: 1,
      title: "Welcome to Mobile Mapping",
      shortTitle: "Introduction",
      estimatedTime: 3,
      content: {
        introduction: `Mobile mapping allows you to collect real-world data using your smartphone. You'll be visiting locations in ${settlementName} and recording information about what you find.`,
        mainContent: [
          {
            type: 'text',
            content: "As a mobile mapper, you'll use a simple app called ODK Collect to gather information. The data you collect helps planners and organizations make better decisions for your community."
          },
          {
            type: 'list',
            title: "What You'll Be Doing",
            content: [
              `Walking around assigned areas in ${settlementName}`,
              "Using your phone to fill out forms about what you see",
              "Taking photos when required",
              "Recording GPS locations automatically",
              "Submitting your data when you have internet"
            ]
          },
          {
            type: 'list',
            title: "What You Need",
            content: [
              "An Android smartphone (Android 5.0 or newer)",
              "ODK Collect app installed (free from Play Store)",
              "Internet for downloading forms and submitting data"
            ]
          },
          {
            type: 'tip',
            content: "The app is very simple! You'll learn everything in this short training."
          }
        ],
        keyTakeaways: [
          "Mobile mapping uses your smartphone to collect data",
          "You need an Android phone with ODK Collect app",
          `Your work helps improve ${settlementName} community`
        ]
      }
    },
    {
      id: 2,
      title: "Install ODK Collect",
      shortTitle: "Install App",
      estimatedTime: 5,
      content: {
        introduction: "ODK Collect is a free app that lets you fill out forms on your phone. Here's how to install it.",
        mainContent: [
          {
            type: 'list',
            title: "Installation Steps",
            content: [
              "Open Google Play Store on your phone",
              "Search for: ODK Collect",
              "Look for the app with a blue clipboard icon",
              "Tap Install (it's about 20MB)",
              "Wait for download to complete"
            ]
          },
          {
            type: 'list',
            title: "Allow Permissions",
            content: [
              "When asked, tap 'Allow' for LOCATION - needed for GPS",
              "Tap 'Allow' for CAMERA - needed for photos",
              "Tap 'Allow' for STORAGE - needed to save forms"
            ]
          },
          {
            type: 'warning',
            content: "You MUST allow all permissions! Without location, your data won't have GPS coordinates."
          }
        ],
        keyTakeaways: [
          "ODK Collect is free from Play Store",
          "Allow ALL permissions when asked",
          "Look for the blue clipboard icon"
        ]
      }
    },
    {
      id: 3,
      title: "Connect to Server",
      shortTitle: "Connect",
      estimatedTime: 5,
      content: {
        introduction: "Now connect ODK Collect to our server. The easiest way is to scan a QR code.",
        mainContent: [
          {
            type: 'list',
            title: "Method 1: QR Code (Recommended)",
            content: [
              "Open ODK Collect",
              "Tap the menu icon (three dots ⋮)",
              "Select 'Add project'",
              "Select 'Configure with QR code'",
              "Scan the QR code shown on your training dashboard",
              "The server will connect automatically!"
            ]
          },
          {
            type: 'tip',
            content: "Your personal QR code is on this training page. Ask your trainer to show it on screen for you to scan."
          },
          {
            type: 'list',
            title: "After Connecting",
            content: [
              "The app will show 'Project added'",
              "You'll see the project name at the top",
              "Now you can download forms!"
            ]
          }
        ],
        keyTakeaways: [
          "Scan the QR code from your training dashboard",
          "Your trainer can display it for you",
          "Server connects automatically"
        ]
      }
    },
    {
      id: 4,
      title: "Collect & Submit Data",
      shortTitle: "Collect",
      estimatedTime: 5,
      content: {
        introduction: "You're ready to collect data! Here's how to fill forms and submit your work.",
        mainContent: [
          {
            type: 'list',
            title: "Download Forms First",
            content: [
              "Tap 'Get Blank Form'",
              "Wait for forms to load",
              "Tap each form to download it",
              "Forms work offline once downloaded!"
            ]
          },
          {
            type: 'list',
            title: "Fill Out a Form",
            content: [
              "Tap 'Fill Blank Form'",
              "Select the form you need",
              "Answer each question",
              "Swipe LEFT to go next, RIGHT to go back",
              "At the end, tap 'Save Form and Exit'"
            ]
          },
          {
            type: 'list',
            title: "Submit Your Work",
            content: [
              "When you have internet, tap 'Send Finalized Form'",
              "Select forms to send",
              "Tap 'Send Selected'",
              "Wait for 'Success' message"
            ]
          },
          {
            type: 'warning',
            content: "Submit your forms at the end of EVERY day. Don't let them pile up!"
          },
          {
            type: 'tip',
            content: "Check the Form Guides section on this page to understand what each question means."
          }
        ],
        keyTakeaways: [
          "Download forms first (Get Blank Form)",
          "Fill forms even without internet",
          "Submit daily using 'Send Finalized Form'",
          "Read Form Guides to understand questions"
        ]
      }
    }
  ];
}


export const mobileMappingSteps = getMobileMappingSteps();


export interface FormGuide {
  formId: string;
  formName: string;
  description: string;
  questions: Array<{
    question: string;
    explanation: string;
    examples?: string[];
    tip?: string;
  }>;
}

export const formGuides: FormGuide[] = [
  {
    formId: 'streetlight_training',
    formName: 'Street Light Survey (Training)',
    description: 'This form helps you practice data collection by surveying street lights in your area.',
    questions: [
      {
        question: 'GPS Location',
        explanation: 'This automatically captures where you are standing. Wait for the accuracy number to be below 10 meters before continuing.',
        tip: 'Stand directly next to the street light pole for best accuracy.'
      },
      {
        question: 'Street Light Status',
        explanation: 'Is the street light working or not? Working means it turns on at night. Broken means it does not work at all.',
        examples: ['Working - light turns on at night', 'Not Working - bulb is dead or pole is damaged', 'Unknown - cannot tell during daytime'],
        tip: 'If surveying during the day, check for visible damage. Ask residents if unsure.'
      },
      {
        question: 'Pole Condition',
        explanation: 'Describe the physical state of the light pole.',
        examples: ['Good - standing straight, no rust', 'Fair - minor rust or leaning slightly', 'Poor - heavily rusted, leaning badly, or damaged'],
      },
      {
        question: 'Photo',
        explanation: 'Take a clear photo of the street light. Make sure the whole pole is visible.',
        tip: 'Step back enough to capture the full pole in the photo. Avoid blurry images.'
      },
      {
        question: 'Additional Notes',
        explanation: 'Any other observations about this street light. This is optional.',
        examples: ['Near school entrance', 'Wires hanging dangerously', 'Recently installed']
      }
    ]
  }
];
