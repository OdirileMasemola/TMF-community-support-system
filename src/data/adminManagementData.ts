export const adminCampaigns = [
  { id: "CMP-001", title: "Winter Relief Drive", status: "Active", location: "Johannesburg", raised: "R84,500", goal: "R120,000", deadline: "30 Aug 2026" },
  { id: "CMP-002", title: "Youth Education Support", status: "Active", location: "Soweto", raised: "R52,300", goal: "R75,000", deadline: "15 Sep 2026" },
  { id: "CMP-003", title: "Family Care Support", status: "Review", location: "Alexandra", raised: "R0", goal: "R50,000", deadline: "Draft" },
  { id: "CMP-004", title: "Back to School", status: "Completed", location: "Midrand", raised: "R61,000", goal: "R60,000", deadline: "Closed" },
];

export const adminDonations = [
  { id: "DN-1045", donor: "Northwind Community Trust", campaign: "Winter Relief Drive", amount: "R2,400.00", status: "Verified", date: "20 Jul 2026" },
  { id: "DN-1044", donor: "Blue River Foundation", campaign: "Youth Education Support", amount: "R890.00", status: "Pending", date: "19 Jul 2026" },
  { id: "DN-1043", donor: "Oak Street Outreach", campaign: "Winter Relief Drive", amount: "R5,120.00", status: "Verified", date: "18 Jul 2026" },
  { id: "DN-1042", donor: "Harbor Support Group", campaign: "Family Care Support", amount: "R310.50", status: "Review", date: "17 Jul 2026" },
];

export const adminVolunteers = [
  { id: "VOL-118", name: "Thabo Molefe", campaign: "Winter Relief Drive", submitted: "20 Jul 2026", status: "Pending" },
  { id: "VOL-117", name: "Nomsa Dlamini", campaign: "Youth Education Support", submitted: "19 Jul 2026", status: "Pending" },
  { id: "VOL-116", name: "Sipho Nkosi", campaign: "Community Health Awareness", submitted: "18 Jul 2026", status: "Approved" },
  { id: "VOL-115", name: "Lerato Khumalo", campaign: "Back to School", submitted: "16 Jul 2026", status: "Approved" },
];

export const adminSponsors = [
  { id: "SPN-031", organisation: "GreenFuture Holdings", type: "Financial", campaign: "Youth Education Support", amount: "R25,000", status: "Active" },
  { id: "SPN-030", organisation: "Metro Logistics SA", type: "Goods", campaign: "Winter Relief Drive", amount: "In-kind", status: "Pending" },
  { id: "SPN-029", organisation: "City Health Partners", type: "Services", campaign: "Community Health Awareness", amount: "R12,000", status: "Active" },
];

export const adminUsers = [
  { id: "USR-001", name: "Admin User", email: "admin@tmf.org.za", role: "Administrator", status: "Active" },
  { id: "USR-002", name: "Thabo Molefe", email: "thabo.m@example.com", role: "Volunteer", status: "Active" },
  { id: "USR-003", name: "Nandi Pillay", email: "nandi.p@example.com", role: "Donor", status: "Active" },
  { id: "USR-004", name: "GreenFuture Holdings", email: "partnerships@greenfuture.co.za", role: "Sponsor", status: "Pending" },
  { id: "USR-005", name: "Sibusiso Ndlovu", email: "sibusiso.n@example.com", role: "Beneficiary", status: "Active" },
];

export const adminEvents = [
  { id: "EVT-014", title: "Community Health Awareness", date: "24 Jul 2026", location: "Soweto Community Hall", status: "Scheduled", volunteers: 18 },
  { id: "EVT-013", title: "Winter Relief Distribution", date: "2 Aug 2026", location: "Alexandra Centre", status: "Scheduled", volunteers: 24 },
  { id: "EVT-012", title: "Youth Education Workshop", date: "9 Aug 2026", location: "TMF Headquarters", status: "Draft", volunteers: 0 },
];

export const adminNotifications = [
  { id: "NTF-501", title: "New volunteer application received", category: "Volunteers", timestamp: "10 minutes ago", unread: true },
  { id: "NTF-500", title: "Donation proof awaiting verification", category: "Donations", timestamp: "35 minutes ago", unread: true },
  { id: "NTF-499", title: "Campaign deadline approaching", category: "Campaigns", timestamp: "2 hours ago", unread: false },
  { id: "NTF-498", title: "Sponsor application submitted", category: "Sponsors", timestamp: "Yesterday", unread: true },
];

export const adminReports = [
  { id: "RPT-01", title: "User Report", description: "Registered users by role and activity.", lastGenerated: "Never" },
  { id: "RPT-02", title: "Campaign Report", description: "Campaign progress, goals, and completion rates.", lastGenerated: "12 Jul 2026" },
  { id: "RPT-03", title: "Donation Report", description: "Verified donations, pending proofs, and totals.", lastGenerated: "15 Jul 2026" },
  { id: "RPT-04", title: "Volunteer Report", description: "Applications, approvals, and active volunteers.", lastGenerated: "Never" },
  { id: "RPT-05", title: "System Summary Report", description: "High-level operational snapshot for leadership.", lastGenerated: "1 Jul 2026" },
];
