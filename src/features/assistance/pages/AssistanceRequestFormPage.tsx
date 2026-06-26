import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function AssistanceRequestFormPage() {
  const [requestType, setRequestType] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast.info("Connect this form to the assistance_requests table next.");
  }

  return (
    <div>
      <h1 className="page-title">Submit Assistance Request</h1>
      <p className="page-description">Capture the request details and upload supporting documents after the request is saved.</p>

      <Card className="mt-6 max-w-2xl">
        <form className="form-grid" onSubmit={handleSubmit}>
          <Input label="Request type" value={requestType} onChange={(event) => setRequestType(event.target.value)} required />
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Request description
            <textarea className="min-h-32 rounded-lg border border-slate-300 px-3 py-2" value={description} onChange={(event) => setDescription(event.target.value)} required />
          </label>
          <Button type="submit">Submit request</Button>
        </form>
      </Card>
    </div>
  );
}
