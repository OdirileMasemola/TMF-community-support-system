import { Card } from "@/components/ui/Card";

export function VolunteerApplicationsPage() {
  return (
    <div>
      <h1 className="page-title">Volunteer Applications</h1>
      <p className="page-description">Volunteers can apply for campaigns. Administrators can approve or reject applications.</p>

      <Card className="mt-6">
        <h2 className="text-lg font-bold">Module skeleton</h2>
        <p className="mt-2 text-slate-600">Build application creation, application status tracking, and admin approval here.</p>
      </Card>
    </div>
  );
}
