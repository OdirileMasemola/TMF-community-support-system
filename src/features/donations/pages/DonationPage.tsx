import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function DonationPage() {
  return (
    <div>
      <h1 className="page-title">Donations</h1>
      <p className="page-description">Donors can make donations and view donation history.</p>

      <Card className="mt-6 max-w-xl">
        <form className="form-grid">
          <Input label="Donation amount" type="number" min="1" placeholder="Example: 500" />
          <Input label="Payment method" placeholder="EFT, Card, Cash, Other" />
          <Input label="Campaign ID" placeholder="Select campaign later" />
          <Button type="button">Process donation</Button>
        </form>
      </Card>
    </div>
  );
}
