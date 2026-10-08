import { WEB_APP_URL } from "@/lib/links";
import type { UserRole } from "@/types/app.types";

export type HelpTopic = "general" | UserRole;

export type FaqItem = {
  question: string;
  answer: string;
};

export type HelpSection = {
  topic: HelpTopic;
  /** Short chip label. */
  label: string;
  title: string;
  summary: string;
  howTo: string[];
  faqs: FaqItem[];
};

/** The documented rule for Google sign-ups (also shown on the register screen and in mobile/README.md). */
export const GOOGLE_SIGNUP_RULE =
  "Signing up with Google creates a beneficiary account. If you joined to donate, volunteer or sponsor, contact the foundation and an administrator can change your role.";

export const HELP_CONTACT = {
  phone: "+27 72 076 9116",
  email: "hope.molefe@icloud.com",
  area: "Nhlapo section, Katlehong, Gauteng",
  website: WEB_APP_URL,
} as const;

export const helpSections: HelpSection[] = [
  {
    topic: "general",
    label: "Getting started",
    title: "Your account",
    summary: "Creating an account, signing in and finding your way around the app.",
    howTo: [
      "Tap Create account on the sign-in screen, fill in your details and choose how you are joining TMF.",
      "If the app asks you to check your email, open the confirmation link, then sign in with your email and password.",
      "After signing in you land in the portal for your role. Use the tabs at the bottom to move between its main pages.",
      "Use the bell for notifications, your initials for your profile and the menu (three dots) for Settings, Help and Sign out.",
    ],
    faqs: [
      {
        question: "Can I sign up with Google?",
        answer: GOOGLE_SIGNUP_RULE,
      },
      {
        question: "Why does my account say Pending?",
        answer:
          "New accounts start as pending until the foundation reviews them. You can already sign in and use your portal while you wait.",
      },
      {
        question: "I forgot my password. What now?",
        answer:
          "Tap Forgot your password? on the sign-in screen and enter your email address. The reset email opens the TMF website.",
      },
      {
        question: "Can I change my role myself?",
        answer:
          "No. Roles can only be changed by an administrator, so contact the foundation using the details below.",
      },
      {
        question: "How do I change the theme or my notification choices?",
        answer:
          "Open the menu (three dots) and choose Settings. Your choices are saved to your account, and the theme is also kept on this phone.",
      },
    ],
  },
  {
    topic: "donor",
    label: "Donors",
    title: "Giving as a donor",
    summary: "Recording donations and sending proof of payment.",
    howTo: [
      "Open Donate, choose a campaign or the general fund and enter the amount.",
      "Use the payment reference shown on the form for your EFT so the foundation can match your payment.",
      "Submit a photo of your proof of payment straight away, or skip for now and send it later.",
      "Open History to see every donation and whether its proof has been verified.",
    ],
    faqs: [
      {
        question: "When is my donation marked as verified?",
        answer: "An administrator checks each proof of payment. Once it is approved, the donation shows as Verified.",
      },
      {
        question: "Can I give to the foundation without choosing a campaign?",
        answer: "Yes. Choose General fund on the Donate screen.",
      },
    ],
  },
  {
    topic: "volunteer",
    label: "Volunteers",
    title: "Volunteering",
    summary: "Applying for campaigns and logging your hours.",
    howTo: [
      "Open Find to see active campaigns and tap Apply. You can add a preferred role.",
      "Track your applications and any assignments you are placed on under Applied.",
      "After helping, open Hours and log the date and number of hours you worked.",
    ],
    faqs: [
      {
        question: "How will I know if my application is approved?",
        answer: "You get a notification when an organiser reviews it, and its status changes under Applied.",
      },
      {
        question: "Can I log hours without an assignment?",
        answer: "Yes. Choosing an assignment is optional when you log hours.",
      },
    ],
  },
  {
    topic: "beneficiary",
    label: "Beneficiaries",
    title: "Getting assistance",
    summary: "Asking for help and following your requests.",
    howTo: [
      "Open Ask, choose the kind of help you need and describe your situation.",
      "Add a supporting document if you have one, and say where it would be easiest for you to collect.",
      "Follow each request under Requests. You will be notified when its status changes.",
      "Open Collect to see where and when to collect assistance that has been approved for you.",
    ],
    faqs: [
      {
        question: "How long does request review take?",
        answer: "Most assistance requests are reviewed within 3 to 7 working days, depending on the programme.",
      },
      {
        question: "What documents may be requested?",
        answer:
          "The foundation may request proof of residence, identity documents, or supporting household information.",
      },
      {
        question: "Where do I collect approved assistance?",
        answer: "Collection details appear under Collect once a request is approved.",
      },
    ],
  },
  {
    topic: "sponsor",
    label: "Sponsors",
    title: "Sponsoring",
    summary: "Committing funding to campaigns and answering sponsorship requests.",
    howTo: [
      "Open Campaigns, choose an active campaign and tap Sponsor this campaign to commit an amount.",
      "Open Requests to see specific needs the foundation has asked sponsors to support, then accept or decline.",
      "Open Pledges to see all your commitments and which ones have been confirmed.",
    ],
    faqs: [
      {
        question: "Why is my commitment still pending?",
        answer: "The foundation confirms each pledge once the funds are arranged. It then shows as Confirmed.",
      },
      {
        question: "Can I add a message when I respond to a request?",
        answer: "Yes. The message is optional and is sent to the foundation's team with your response.",
      },
    ],
  },
  {
    topic: "administrator",
    label: "Administrators",
    title: "Running the foundation",
    summary: "Reviewing work, managing users and running campaigns.",
    howTo: [
      "Open Reviews to approve or reject assistance requests and volunteer applications, and to verify payment proofs.",
      "Open Users to activate or suspend accounts.",
      "Open Campaigns to create a draft campaign, then publish or close it.",
      "Reports, events and other management tools are on the web dashboard.",
    ],
    faqs: [
      {
        question: "A user signed up with Google but needs a different role. What do I do?",
        answer:
          "Google sign-ups start as beneficiaries and users cannot change their own role. Only an administrator can change it. The apps do not have a role editor yet, so this is done in the Supabase dashboard.",
      },
      {
        question: "What happens when I suspend an account?",
        answer: "The user can no longer use their portal until an administrator activates the account again.",
      },
    ],
  },
];

export function helpSectionFor(topic: HelpTopic): HelpSection {
  return helpSections.find((section) => section.topic === topic) ?? helpSections[0];
}
