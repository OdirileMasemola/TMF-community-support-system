import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function SponsorshipPage() {
  return (
    <div>
      <h1 className="page-title">Sponsorships</h1>
      <p className="page-description">Sponsors can support campaigns and view sponsored activities.</p>

      <Card className="mt-6 max-w-xl">
        <form className="form-grid">
          <Input label="Sponsorship amount" type="number" min="1" placeholder="Example: 5000" />
          <Input label="Sponsorship type" placeholder="Financial, Goods, Services" />
          <Input label="Campaign ID" placeholder="Select campaign later" />
          <Button type="button">Register sponsorship</Button>
        </form>
      </Card>
    </div>
  );
}
