export interface HouseholdSurveyStep {
  id: number;
  title: string;
  shortTitle: string;
  estimatedTime: number;
  content: {
    introduction: string;
    mainContent: Array<{
      type: 'text' | 'list' | 'warning' | 'tip';
      content: string | string[];
      title?: string;
    }>;
    keyTakeaways?: string[];
  };
}

export const householdSurveySteps: HouseholdSurveyStep[] = [
  {
    id: 1,
    title: "Introduction to Household Surveys",
    shortTitle: "Introduction",
    estimatedTime: 15,
    content: {
      introduction:
        "Welcome to the Household Survey training. You will be visiting homes in your settlement to collect important data about residents, housing conditions, and community needs. This data helps improve services and plan better infrastructure for your community.",
      mainContent: [
        {
          type: 'text',
          title: "What is a Household Survey?",
          content:
            "A household survey is a structured interview conducted at a person's home. You will ask a set of pre-defined questions and record the answers using ODK Collect on your phone. The data you collect helps planners understand community needs.",
        },
        {
          type: 'list',
          title: "Your Responsibilities:",
          content: [
            "Visit assigned households in your settlement",
            "Introduce yourself and explain the purpose of the survey",
            "Ask all required questions clearly and without bias",
            "Record answers accurately in ODK Collect",
            "Treat all information as confidential",
            "Submit your forms daily when you have internet access",
          ],
        },
        {
          type: 'tip',
          content:
            "Always wear your ID badge and carry your appointment letter when visiting households. This helps build trust with community members.",
        },
        {
          type: 'list',
          title: "Equipment You Need:",
          content: [
            "Smartphone with ODK Collect installed and configured",
            "Fully charged phone (bring a power bank if possible)",
            "Staff ID badge",
            "Printed household assignment list from your supervisor",
          ],
        },
      ],
      keyTakeaways: [
        "Household surveys collect structured data by visiting homes",
        "You record answers in ODK Collect on your phone",
        "Treat all respondent information as strictly confidential",
        "Submit collected forms every day",
      ],
    },
  },
  {
    id: 2,
    title: "ODK Collect Setup & Form Download",
    shortTitle: "ODK Setup",
    estimatedTime: 20,
    content: {
      introduction:
        "Before you can collect data, you need to configure ODK Collect with the survey project and download the household survey forms. Your supervisor will give you a QR code to scan to set up your phone automatically.",
      mainContent: [
        {
          type: 'list',
          title: "Setting Up ODK Collect:",
          content: [
            "Install ODK Collect from the Google Play Store (it's free)",
            "Open ODK Collect and tap the ⋮ menu in the top-right corner",
            "Select 'Add project' then 'Configure with QR code'",
            "Scan the QR code provided by your supervisor",
            "Your phone is now connected to the survey server",
          ],
        },
        {
          type: 'list',
          title: "Downloading Survey Forms:",
          content: [
            "On the ODK Collect home screen, tap 'Get Blank Form'",
            "Select all forms shown in the list",
            "Tap 'Get Selected' to download them to your phone",
            "You only need to do this once — forms are stored on your phone",
          ],
        },
        {
          type: 'warning',
          content:
            "Download all forms while you have a reliable internet connection (WiFi preferred). Once downloaded, you can collect data even without internet.",
        },
        {
          type: 'tip',
          content:
            "Check for form updates every Monday morning by tapping 'Get Blank Form' again. Your supervisor will tell you when new forms are available.",
        },
      ],
      keyTakeaways: [
        "Use the QR code from your supervisor to configure ODK Collect",
        "Download all forms before going to the field",
        "ODK Collect works offline — internet is only needed to download forms and upload responses",
        "Check for form updates at the start of each week",
      ],
    },
  },
  {
    id: 3,
    title: "Conducting the Interview",
    shortTitle: "Interview Skills",
    estimatedTime: 25,
    content: {
      introduction:
        "How you conduct the interview is just as important as what you ask. A good interviewer makes the respondent feel comfortable and records accurate answers. This step covers interview techniques, how to handle difficult situations, and ethical guidelines.",
      mainContent: [
        {
          type: 'list',
          title: "Starting the Interview:",
          content: [
            "Greet the household member politely in the local language",
            "Introduce yourself: name, organization (Spatial Collective), and purpose",
            "Explain that participation is voluntary and data is confidential",
            "Ask for consent before starting — if they refuse, thank them and move on",
            "Ensure you are speaking with the head of household or their representative",
          ],
        },
        {
          type: 'list',
          title: "During the Interview:",
          content: [
            "Read each question exactly as written — do not paraphrase",
            "Allow the respondent time to think before answering",
            "Record the answer before moving to the next question",
            "If a question is unclear, read it again slowly — do not explain it differently",
            "Never suggest answers or show your own opinion",
          ],
        },
        {
          type: 'warning',
          content:
            "Never fabricate or guess answers. If a respondent does not know the answer, record 'Don't Know' or skip the question as instructed in the form. Inaccurate data is worse than missing data.",
        },
        {
          type: 'tip',
          content:
            "If a household declines to participate, mark them as 'Refused' in the form and try again the next day. Never pressure someone to answer.",
        },
        {
          type: 'list',
          title: "Ending the Interview:",
          content: [
            "Thank the respondent for their time",
            "Answer any questions they have about how the data will be used",
            "Give them the supervisor's contact number if they have concerns",
            "Mark the household as 'Complete' in your assignment list",
          ],
        },
      ],
      keyTakeaways: [
        "Always obtain verbal consent before starting an interview",
        "Read questions exactly as written without paraphrasing",
        "Never fabricate answers — record 'Don't Know' when appropriate",
        "Thank respondents and offer contact information for follow-up questions",
      ],
    },
  },
  {
    id: 4,
    title: "Data Submission & Quality Control",
    shortTitle: "Submission & QC",
    estimatedTime: 15,
    content: {
      introduction:
        "After collecting data, you need to submit your completed forms to the server and follow quality control practices to ensure your data is accurate and complete. Daily submission is required.",
      mainContent: [
        {
          type: 'list',
          title: "Submitting Completed Forms:",
          content: [
            "At the end of each day, connect to WiFi or mobile data",
            "Open ODK Collect and tap 'Send Finalized Form'",
            "Select all completed forms",
            "Tap 'Send Selected' and wait for confirmation",
            "Forms marked with a green tick have been successfully uploaded",
          ],
        },
        {
          type: 'warning',
          content:
            "Submit forms every day without fail. Forms stored on your phone can be lost if your phone is damaged, lost, or runs out of storage. Do not keep more than one day's data on your phone at a time.",
        },
        {
          type: 'list',
          title: "Quality Control Checks:",
          content: [
            "Review each form before finalizing it to spot obvious errors",
            "Ensure GPS coordinates were captured for each household",
            "Check that mandatory fields (marked with *) are all filled in",
            "If you realize you made an error, contact your supervisor immediately",
            "Your supervisor may ask you to revisit a household to verify answers",
          ],
        },
        {
          type: 'tip',
          content:
            "Your daily submission count is tracked by your supervisor. Aim to submit at least the minimum target number of completed surveys each day as agreed with your supervisor.",
        },
        {
          type: 'list',
          title: "Common Mistakes to Avoid:",
          content: [
            "Submitting the same form twice — check 'Sent Forms' before resubmitting",
            "Forgetting to finalize a form — draft forms cannot be submitted",
            "Skipping GPS capture — location data is required for every household",
            "Waiting too long to submit — submit every day, not at the end of the week",
          ],
        },
      ],
      keyTakeaways: [
        "Submit all completed forms every day using WiFi or mobile data",
        "Review forms for errors before finalizing and submitting",
        "GPS location must be captured for every household",
        "Contact your supervisor immediately if you discover a data error",
      ],
    },
  },
];
