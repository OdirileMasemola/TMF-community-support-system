import { Accessibility, Banknote, GraduationCap, Shirt, type LucideIcon } from "lucide-react";

export type DonationType = "clothes" | "wheelchairs" | "school-uniform" | "money";

export type DonationOption = {
  id: DonationType;
  title: string;
  description: string;
  icon: LucideIcon;
  buttonLabel: string;
};

export const donationOptions: DonationOption[] = [
  {
    id: "clothes",
    title: "Clothes",
    description: "Donate gently used or new clothing to support families and learners in need.",
    icon: Shirt,
    buttonLabel: "Donate clothes",
  },
  {
    id: "wheelchairs",
    title: "Wheelchairs",
    description: "Help provide mobility support for beneficiaries who need wheelchair assistance.",
    icon: Accessibility,
    buttonLabel: "Donate wheelchair",
  },
  {
    id: "school-uniform",
    title: "School uniform",
    description: "Contribute school uniforms so learners can attend school with dignity and confidence.",
    icon: GraduationCap,
    buttonLabel: "Donate uniform",
  },
  {
    id: "money",
    title: "Money",
    description: "Make a financial gift to fund programmes, resources, and urgent community needs.",
    icon: Banknote,
    buttonLabel: "Donate money",
  },
];

export const bankingDetails = {
  bankName: "First National Bank",
  accountHolder: "THEMBA MOLEFE FOUNDATION NPC",
  registrationNumber: "2019/168566/08",
  accountNumber: "63201118189",
  accountType: "Franchise Business Account",
  branchCode: "250655",
  branchName: "FNB Remote Banking",
  swiftCode: "FIRNZAJJ",
} as const;

export const inKindDeliveryNotice =
  "The delivery address will be provided once your donation request has been approved by an administrator.";

export const moneyDonationNotice =
  "After making your EFT payment, please submit your proof of payment below so we can confirm and record your donation.";
