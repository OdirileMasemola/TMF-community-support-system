import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const reportTypes = [
  "User Report",
  "Campaign Report",
  "Volunteer Application Report",
  "Beneficiary Assistance Report",
  "Donation Report",
  "Sponsorship Report",
  "System Summary Report",
];

export function ReportsPage() {
  function exportSamplePdf() {
    const doc = new jsPDF();
    doc.text("TMF Community Support System - Sample Report", 14, 16);
    autoTable(doc, {
      startY: 24,
      head: [["Report", "Output"]],
      body: reportTypes.map((item) => [item, "Screen / PDF"]),
    });
    doc.save("tmf-sample-report.pdf");
  }

  return (
    <div>
      <h1 className="page-title">Reports</h1>
      <p className="page-description">Administrators can generate reports for users, campaigns, donations, sponsorships, requests, and system summaries.</p>

      <Card className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Available report types</h2>
            <p className="mt-2 text-sm text-slate-600">Connect these to live Supabase queries as you build each module.</p>
          </div>
          <Button onClick={exportSamplePdf}>Export sample PDF</Button>
        </div>

        <ul className="mt-5 grid gap-2 text-sm text-slate-700">
          {reportTypes.map((item) => <li key={item} className="rounded-lg bg-slate-50 p-3">{item}</li>)}
        </ul>
      </Card>
    </div>
  );
}
