// Mobile Mapping training steps data structure
// Simple training on ODK Collect app for field data collection

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

export const mobileMappingSteps: MobileMappingStep[] = [
  {
    id: 1,
    title: "Welcome to Mobile Mapping",
    shortTitle: "Introduction",
    estimatedTime: 5,
    content: {
      introduction: "Mobile mapping allows you to collect real-world data using your smartphone. You'll be visiting locations, recording information, and helping create accurate maps of your community.",
      mainContent: [
        {
          type: 'text',
          content: "As a mobile mapper, you'll use a simple app called ODK Collect to gather information about buildings, roads, and facilities in your area. The data you collect helps planners and organizations make better decisions for your community."
        },
        {
          type: 'list',
          title: "What You'll Be Doing",
          content: [
            "Walking around assigned areas in your community",
            "Using your phone to fill out simple forms about what you see",
            "Taking photos when required",
            "Recording GPS locations automatically",
            "Submitting your data when you have internet connection"
          ]
        },
        {
          type: 'list',
          title: "What You Need",
          content: [
            "An Android smartphone (Android 5.0 or newer)",
            "At least 100MB of free storage space",
            "Access to Google Play Store",
            "Internet connection for downloading forms and submitting data",
            "Charged phone battery (bring a power bank if possible)"
          ]
        },
        {
          type: 'tip',
          content: "Don't worry if you've never done this before! The app is very simple to use, and you'll get the hang of it quickly. Just follow the steps in this training."
        }
      ],
      keyTakeaways: [
        "Mobile mapping uses your smartphone to collect real data",
        "You need an Android phone with internet access",
        "The app (ODK Collect) is free and easy to use",
        "Your work helps improve your community"
      ]
    }
  },
  {
    id: 2,
    title: "Installing ODK Collect",
    shortTitle: "Install App",
    estimatedTime: 10,
    content: {
      introduction: "ODK Collect is a free app that lets you fill out forms and collect data on your phone. Let's install it step by step.",
      mainContent: [
        {
          type: 'list',
          title: "Step 1: Open Google Play Store",
          content: [
            "Find the Play Store icon on your phone (looks like a colorful triangle)",
            "Tap to open it",
            "Make sure you're connected to the internet (WiFi is best)"
          ]
        },
        {
          type: 'list',
          title: "Step 2: Search for ODK Collect",
          content: [
            "Tap the search bar at the top",
            "Type: ODK Collect",
            "Look for the app with a blue icon showing a clipboard",
            "Make sure it says 'ODK' and has millions of downloads"
          ]
        },
        {
          type: 'list',
          title: "Step 3: Install the App",
          content: [
            "Tap the green 'Install' button",
            "Wait for the download to complete (about 20MB)",
            "The button will change to 'Open' when done",
            "Tap 'Open' to launch the app"
          ]
        },
        {
          type: 'list',
          title: "Step 4: Allow Permissions",
          content: [
            "When asked, tap 'Allow' for location access - needed for GPS",
            "Tap 'Allow' for camera access - needed for photos",
            "Tap 'Allow' for storage access - needed to save forms"
          ]
        },
        {
          type: 'warning',
          content: "Important: You MUST allow all permissions for the app to work properly. Without location permission, your data won't have GPS coordinates."
        },
        {
          type: 'tip',
          content: "If you can't find the app, you can also visit this link on your phone: https://play.google.com/store/apps/details?id=org.odk.collect.android"
        }
      ],
      keyTakeaways: [
        "ODK Collect is free from Google Play Store",
        "Search for 'ODK Collect' - blue clipboard icon",
        "Allow ALL permissions when asked",
        "The app needs about 20MB to download"
      ]
    }
  },
  {
    id: 3,
    title: "Getting Your Forms",
    shortTitle: "Get Forms",
    estimatedTime: 10,
    content: {
      introduction: "Now that ODK Collect is installed, you need to connect it to our server to download the data collection forms you'll use in the field.",
      mainContent: [
        {
          type: 'list',
          title: "Step 1: Open App Settings",
          content: [
            "Open ODK Collect app",
            "Tap the three dots (⋮) in the top right corner",
            "Select 'Settings' from the menu",
            "Tap 'Server'"
          ]
        },
        {
          type: 'list',
          title: "Step 2: Enter Server Details",
          content: [
            "Your supervisor will give you the server URL",
            "Type or paste the URL exactly as given",
            "Enter your username (usually your Youth ID)",
            "Enter the password provided to you",
            "Tap 'Save' or go back"
          ]
        },
        {
          type: 'list',
          title: "Step 3: Download Forms",
          content: [
            "Go back to the main screen",
            "Tap 'Get Blank Form'",
            "Wait for the list of available forms to load",
            "Tap 'Select All' or choose the forms you need",
            "Tap 'Get Selected'"
          ]
        },
        {
          type: 'tip',
          content: "Always download forms when you have a good internet connection. Once downloaded, you can fill them even without internet!"
        },
        {
          type: 'warning',
          content: "Keep your username and password safe. Don't share them with anyone. Each person must use their own account."
        }
      ],
      keyTakeaways: [
        "Get server details from your supervisor",
        "Enter URL, username, and password in Settings",
        "Download forms using 'Get Blank Form'",
        "Forms work offline once downloaded"
      ]
    }
  },
  {
    id: 4,
    title: "Collecting Data in the Field",
    shortTitle: "Collect Data",
    estimatedTime: 10,
    content: {
      introduction: "You're now ready to collect data! Here's how to fill out forms and submit your work.",
      mainContent: [
        {
          type: 'list',
          title: "Starting a New Form",
          content: [
            "Open ODK Collect",
            "Tap 'Fill Blank Form'",
            "Select the form you want to fill",
            "The form will open with the first question"
          ]
        },
        {
          type: 'list',
          title: "Filling Out Questions",
          content: [
            "Read each question carefully",
            "Swipe LEFT to go to the next question",
            "Swipe RIGHT to go back to the previous question",
            "Some questions are required - you can't skip them",
            "For GPS questions, wait for accuracy to show (lower is better)"
          ]
        },
        {
          type: 'list',
          title: "Taking Photos",
          content: [
            "When a photo is needed, tap 'Take Photo'",
            "Your camera will open",
            "Take a clear photo of what's required",
            "Tap the checkmark to accept the photo"
          ]
        },
        {
          type: 'list',
          title: "Saving Your Work",
          content: [
            "At the end of the form, tap 'Save Form and Exit'",
            "You can mark it as 'Finalized' if complete",
            "Or save as draft if you need to finish later"
          ]
        },
        {
          type: 'list',
          title: "Submitting Data",
          content: [
            "Go back to the main screen",
            "Tap 'Send Finalized Form'",
            "Select the forms you want to submit",
            "Tap 'Send Selected'",
            "Wait for 'Success' message"
          ]
        },
        {
          type: 'warning',
          content: "Always submit your forms at the end of each day when you have internet. Don't let forms pile up!"
        },
        {
          type: 'tip',
          content: "If you make a mistake, you can go back and change your answers before saving. Once submitted, you cannot change it."
        }
      ],
      keyTakeaways: [
        "Use 'Fill Blank Form' to start collecting data",
        "Swipe left/right to navigate between questions",
        "Save your form when done",
        "Submit forms daily using 'Send Finalized Form'"
      ]
    }
  }
];
