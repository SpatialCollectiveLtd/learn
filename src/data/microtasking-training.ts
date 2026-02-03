// Microtasking training steps data structure
// Platform: micro.spatialcollective.co.ke
// Simple image classification tasks with quality focus

export interface MicrotaskingStep {
  id: number;
  title: string;
  shortTitle: string;
  estimatedTime: number;
  content: {
    introduction: string;
    mainContent: Array<{
      type: 'text' | 'list' | 'warning' | 'tip' | 'code';
      content: string | string[];
      title?: string;
    }>;
    keyTakeaways?: string[];
  };
}

export const microtaskingSteps: MicrotaskingStep[] = [
  {
    id: 1,
    title: "Getting Started & Login",
    shortTitle: "Getting Started",
    estimatedTime: 10,
    content: {
      introduction: "Welcome to the Spatial Collective Microtasking Platform! You'll be completing simple image classification tasks using your smartphone. This training will teach you everything you need to know to start earning through microtasking.",
      mainContent: [
        {
          type: 'text',
          title: "What is Microtasking?",
          content: "Microtasking is completing small, simple tasks on your phone - like looking at images and answering questions about them. Each task takes only a few seconds, and you can complete up to 300 tasks per day at your own pace."
        },
        {
          type: 'list',
          title: "What You'll Be Doing:",
          content: [
            "Looking at images on your phone",
            "Reading a simple question about each image",
            "Tapping 'Yes' or 'No' to answer the question",
            "Moving to the next image automatically",
            "Earning based on the number of tasks you complete accurately"
          ]
        },
        {
          type: 'list',
          title: "What You Need:",
          content: [
            "Smartphone with internet connection (WiFi or mobile data)",
            "Valid phone number starting with 07 (Safaricom, Airtel, or Telkom)",
            "Registration completed by your field trainer",
            "A quiet place where you can focus"
          ]
        },
        {
          type: 'text',
          title: "How to Access the Platform",
          content: "You'll use a web-based platform that works in any phone browser. No app installation needed!"
        },
        {
          type: 'list',
          title: "Accessing the Platform:",
          content: [
            "Open your phone browser (Chrome, Safari, Firefox, etc.)",
            "Go to: https://micro.spatialcollective.co.ke",
            "Bookmark this page for easy access later",
            "Login with your registered phone number"
          ]
        },
        {
          type: 'warning',
          content: "Important: Make sure you're registered first! Your field trainer must register your phone number before you can login. If you try to login without registration, you'll get an error."
        },
        {
          type: 'text',
          title: "How to Login",
          content: "The login process is simple but requires your phone number in a specific format."
        },
        {
          type: 'list',
          title: "Login Steps:",
          content: [
            "Enter your phone number in the field",
            "Use this format: 0712345678 (10 digits starting with 07)",
            "Tap the 'Continue' button",
            "Wait for the green loading spinner",
            "You'll see 'Loading your tasks...' if successful"
          ]
        },
        {
          type: 'warning',
          content: "Phone Number Format Rules: Your phone number MUST be exactly 10 digits and start with 07. Common mistakes include using international format (+254), leaving out the 0, or using landline numbers."
        },
        {
          type: 'list',
          title: "Phone Number Format Examples:",
          content: [
            "✅ CORRECT: 0712345678",
            "✅ CORRECT: 0722334455",
            "✅ CORRECT: 0733445566",
            "❌ WRONG: +254712345678 (don't use +254)",
            "❌ WRONG: 712345678 (missing the 0)",
            "❌ WRONG: 0112345678 (landlines not allowed)",
            "❌ WRONG: 07 1234 5678 (no spaces allowed)"
          ]
        },
        {
          type: 'list',
          title: "Common Login Issues:",
          content: [
            "\"Phone number must be 10 digits starting with 07\" - Check your format carefully",
            "\"Phone number not registered\" - Contact your field trainer to register",
            "\"Too many login attempts\" - Wait a few minutes before trying again",
            "\"Network error\" - Check your internet connection"
          ]
        },
        {
          type: 'tip',
          content: "Pro Tip: Save the website (micro.spatialcollective.co.ke) as a bookmark on your phone's home screen for instant access every day!"
        }
      ],
      keyTakeaways: [
        "Microtasking is answering simple questions about images",
        "Access the platform at https://micro.spatialcollective.co.ke",
        "Login with your phone number in format: 0712345678",
        "You must be registered by your field trainer first",
        "Up to 300 tasks can be completed per day"
      ]
    }
  },
  {
    id: 2,
    title: "Using the Platform & Completing Tasks",
    shortTitle: "Completing Tasks",
    estimatedTime: 15,
    content: {
      introduction: "Now that you know how to login, let's learn how to use the platform. You'll see two main screens: your dashboard (home screen) and the task page (where you work).",
      mainContent: [
        {
          type: 'text',
          title: "Your Dashboard - Understanding the Home Screen",
          content: "After logging in, you'll land on your dashboard. This is your control center where you see your progress and start working."
        },
        {
          type: 'list',
          title: "Dashboard Components:",
          content: [
            "Today's Progress: Large number showing tasks completed today",
            "Progress Bar: Visual indicator (red = working, green = target reached)",
            "Campaigns Completed: Number of different campaigns finished today",
            "Average Time: How long you take per task (in seconds)",
            "Action Buttons: Start/Continue Tasks, Refresh Stats, Logout"
          ]
        },
        {
          type: 'list',
          title: "What the Numbers Mean:",
          content: [
            "Tasks Completed: Your total for today (resets daily)",
            "Daily Target: Maximum 300 tasks per day",
            "Campaigns: Different projects with different questions",
            "Average Time: Aim for at least 2 seconds per task"
          ]
        },
        {
          type: 'text',
          title: "Starting Your Work",
          content: "When you're ready to work, tap the 'Continue Tasks' or 'Start Your Tasks' button. The page will load and show you the task interface."
        },
        {
          type: 'list',
          title: "The Task Page Layout:",
          content: [
            "Header: Back arrow, your name, and logout button at the top",
            "Progress Bar: Shows completion in current campaign",
            "Campaign Title: Name of the project you're working on",
            "Question: What you need to decide about each image",
            "Image Display: The picture you need to analyze",
            "Answer Buttons: Red 'No' button and Green 'Yes' button at the bottom"
          ]
        },
        {
          type: 'warning',
          content: "CRITICAL: Never rush through tasks! The system monitors how fast you work. Responses under 2 seconds are flagged and may not count toward your earnings. Take your time to look at each image properly."
        },
        {
          type: 'text',
          title: "Step-by-Step: How to Complete a Task",
          content: "Follow these steps carefully for every single task:"
        },
        {
          type: 'list',
          title: "Task Completion Workflow:",
          content: [
            "1. WAIT: Let the image fully load (you'll see a loading spinner)",
            "2. READ: Look at the question at the top of the page",
            "3. STUDY: Look at the entire image carefully, not just a quick glance",
            "4. THINK: Consider your answer - does the image match what the question asks?",
            "5. DECIDE: Choose your answer - tap 'No' (red) or 'Yes' (green)",
            "6. WAIT AGAIN: A spinning circle appears while your answer is saved",
            "7. NEXT: A new image automatically appears - repeat the process"
          ]
        },
        {
          type: 'list',
          title: "Understanding Button States:",
          content: [
            "Gray buttons: Image is still loading - DO NOT TAP YET",
            "Red & Green buttons: Image loaded - ready for your answer",
            "Spinning circle: Your answer is being saved - wait for next image"
          ]
        },
        {
          type: 'text',
          title: "What Happens After You Answer?",
          content: "The platform automatically manages your workflow:"
        },
        {
          type: 'list',
          title: "Possible Outcomes:",
          content: [
            "New Image Appears: Continue with the next task in the same campaign",
            "Campaign Complete Message: You finished all tasks in this campaign",
            "Daily Target Reached: You've completed 300 tasks for the day",
            "No More Tasks Available: All campaigns are finished for now"
          ]
        },
        {
          type: 'tip',
          content: "Work Smart: Take short breaks every 50-100 tasks to stay fresh and maintain accuracy. Quality is more valuable than speed!"
        },
        {
          type: 'list',
          title: "Dashboard Features You Should Use:",
          content: [
            "Refresh Stats: Update your progress numbers anytime",
            "Back Button: Return to dashboard to check your progress",
            "Logout: Always logout when you're done for the day"
          ]
        },
        {
          type: 'text',
          title: "Managing Your Daily Work",
          content: "You can work at your own pace throughout the day. Login and logout as many times as you want. Your progress is saved automatically, and the counter resets at midnight each day."
        }
      ],
      keyTakeaways: [
        "Dashboard shows your daily progress and statistics",
        "Wait for images to fully load before answering",
        "Take at least 2 seconds per task - quality over speed",
        "Buttons are gray while loading, red/green when ready",
        "Your progress is saved automatically",
        "Maximum 300 tasks per day",
        "Work at your own pace - take breaks when needed"
      ]
    }
  },
  {
    id: 3,
    title: "Quality Guidelines & Best Practices",
    shortTitle: "Quality & Best Practices",
    estimatedTime: 15,
    content: {
      introduction: "Success in microtasking comes from consistently giving accurate answers. This section teaches you the quality standards, common issues to avoid, and tips to maximize your earnings while maintaining accuracy.",
      mainContent: [
        {
          type: 'text',
          title: "Quality Standards - What Matters Most",
          content: "The platform tracks your performance to ensure data quality. Understanding these standards helps you work effectively and earn consistently."
        },
        {
          type: 'list',
          title: "Response Time Requirements:",
          content: [
            "Minimum 2 seconds per task (responses under 2 seconds are flagged)",
            "There's no maximum time - take as long as you need",
            "Quality and accuracy matter more than speed",
            "Rushing leads to mistakes and flagged work",
            "Average workers take 3-5 seconds per task"
          ]
        },
        {
          type: 'warning',
          content: "System Monitoring: The platform automatically tracks how fast you respond. If you consistently answer in under 2 seconds, your work may be flagged for review and could affect your earnings."
        },
        {
          type: 'list',
          title: "How to Give Quality Answers:",
          content: [
            "Read the question completely before looking at the image",
            "Look at the ENTIRE image, not just the center",
            "Consider the context of what you're seeing",
            "Be honest in your assessment - don't guess if unsure",
            "When in doubt, spend more time looking rather than rushing",
            "Stay focused - avoid distractions while working"
          ]
        },
        {
          type: 'text',
          title: "Handling Image Loading Issues",
          content: "Sometimes images take time to load, especially on slower internet connections. Here's how to handle it:"
        },
        {
          type: 'list',
          title: "Image Loading Best Practices:",
          content: [
            "WAIT: Give images 10-15 seconds to load on slow connections",
            "DON'T TAP: Buttons are disabled while loading for a reason",
            "CHECK CONNECTION: If images won't load, verify your internet",
            "REFRESH: Pull down on the page to reload if image fails",
            "SWITCH: Try WiFi if on mobile data, or vice versa"
          ]
        },
        {
          type: 'list',
          title: "If Images Are Blurry or Unclear:",
          content: [
            "Tap the image to zoom in (if your browser allows)",
            "Rotate your phone to landscape mode for larger view",
            "Ensure you're in good lighting to see your screen clearly",
            "Clean your screen if it's dirty or smudged",
            "Increase screen brightness if needed"
          ]
        },
        {
          type: 'text',
          title: "Troubleshooting Common Problems",
          content: "Most issues have simple solutions. Try these before asking for help:"
        },
        {
          type: 'list',
          title: "App Freezing or Not Responding:",
          content: [
            "Close your browser completely",
            "Reopen browser and go back to micro.spatialcollective.co.ke",
            "Login again with your phone number",
            "If problems persist, restart your phone"
          ]
        },
        {
          type: 'list',
          title: "Progress Not Updating:",
          content: [
            "Tap the 'Refresh Stats' button on your dashboard",
            "Go back to dashboard and return to tasks",
            "Logout and login again to refresh everything",
            "Check your internet connection"
          ]
        },
        {
          type: 'list',
          title: "Network Errors:",
          content: [
            "Check if your mobile data or WiFi is working",
            "Try switching between WiFi and mobile data",
            "Move to an area with better signal",
            "Wait a few minutes and try again"
          ]
        },
        {
          type: 'text',
          title: "Important Rules to Remember",
          content: "Following these rules ensures your work counts and you get paid:"
        },
        {
          type: 'list',
          title: "Daily Limits & Account Rules:",
          content: [
            "Maximum 300 tasks per day (counter resets daily)",
            "Minimum 2 seconds per task (quality requirement)",
            "Don't share your phone number with other workers",
            "Only you should use your account",
            "You can login from different devices (phone, tablet)",
            "Always logout when finished working"
          ]
        },
        {
          type: 'warning',
          content: "Account Security: Never share your phone number or let others use your account. Each worker must have their own registered number. Using someone else's account or letting others use yours violates the terms and may result in suspension."
        },
        {
          type: 'text',
          title: "Success Tips - Maximizing Your Earnings",
          content: "These strategies help you work efficiently while maintaining quality:"
        },
        {
          type: 'list',
          title: "Time Management:",
          content: [
            "Start early in the day when you're mentally fresh",
            "Work during hours when internet is faster (avoid peak times)",
            "Take 5-minute breaks every 50-100 tasks",
            "Split your 300 tasks across morning and afternoon if needed",
            "Keep your phone charged throughout the day"
          ]
        },
        {
          type: 'list',
          title: "Improving Your Accuracy:",
          content: [
            "Read each question twice before starting a new campaign",
            "Look at sample images carefully to understand the pattern",
            "Focus on one campaign at a time",
            "Take breaks if you feel tired or distracted",
            "Work in a quiet environment with minimal distractions"
          ]
        },
        {
          type: 'list',
          title: "Technical Tips:",
          content: [
            "Bookmark micro.spatialcollective.co.ke for quick access",
            "Use WiFi when available for faster image loading",
            "Keep your browser updated to the latest version",
            "Close other apps to free up phone memory",
            "Clear browser cache weekly for better performance"
          ]
        },
        {
          type: 'text',
          title: "Getting Help When You Need It",
          content: "If you encounter problems, there are several ways to get help:"
        },
        {
          type: 'list',
          title: "Help Resources:",
          content: [
            "Registration Issues: Contact your field trainer in your settlement",
            "Technical Problems: Try the troubleshooting steps in this training first",
            "Account Status: Your field trainer can check your registration",
            "Payment Questions: Speak with your field trainer",
            "Other Workers: Ask colleagues in your settlement who are experienced"
          ]
        },
        {
          type: 'tip',
          content: "Before Asking for Help: Try these quick fixes - close/reopen browser, check internet, clear cache, try different browser, or restart your phone. Most problems can be solved with these simple steps!"
        },
        {
          type: 'text',
          title: "Ready to Start?",
          content: "You now have all the knowledge you need to succeed in microtasking! Remember: quality over speed, follow the guidelines, and work at your own pace. Complete this training, then click 'Launch Platform' to start your first tasks at micro.spatialcollective.co.ke"
        }
      ],
      keyTakeaways: [
        "Minimum 2 seconds per task - never rush",
        "Quality and accuracy are more important than speed",
        "Wait for images to fully load before answering",
        "Work in focused sessions with breaks",
        "300 tasks maximum per day",
        "Contact your field trainer for registration or account issues",
        "Bookmark the platform and use WiFi when available",
        "Your success depends on consistent, accurate work"
      ]
    }
  }
];

// Platform URL constant
export const MICROTASKING_PLATFORM_URL = 'https://micro.spatialcollective.co.ke';
