# Themba Molefe Foundation - Community Support Management System

A React + TypeScript + Supabase starter project for the proposed Community Support Management System.

## Main features covered in this skeleton

- Role-based authentication using Supabase Auth
- Role-based dashboards for Administrator, Volunteer, Beneficiary, Donor, and Sponsor
- Campaign management
- Volunteer campaign applications
- Beneficiary assistance requests
- Supporting document upload structure
- Donation and sponsorship modules
- Notifications module
- Reports module with PDF-ready structure
- Supabase database schema with Row Level Security policies

## Recommended setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment variables

Create `.env.local` and add your Supabase details:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase setup

1. Create a new Supabase project.
2. Open the SQL Editor.
3. Run `supabase/migrations/0001_initial_schema.sql`.
4. Create a private Storage bucket called `supporting-documents` if it was not created by the SQL script.
5. Enable Email/Password authentication in Supabase Auth.
6. Start the app and register a user.

## Important database design note

The original academic design has a `USER` table with a password field. In the real implementation, passwords must not be stored in your own public table. Supabase Auth stores and protects authentication data, while the app stores user profile data in the `profiles` table.

## Suggested development order

1. Authentication and role-based registration
2. Dashboard layout and protected routes
3. Campaign module
4. Volunteer applications module
5. Beneficiary assistance requests and documents
6. Donations and sponsorships
7. Notifications
8. Reports and PDF export
9. Admin user management
10. Testing, RLS policy review, and deployment
