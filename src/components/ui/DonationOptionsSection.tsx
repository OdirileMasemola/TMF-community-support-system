import { useState } from "react";
import { Info, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  bankingDetails,
  donationOptions,
  inKindDeliveryNotice,
  moneyDonationNotice,
  type DonationType,
} from "@/data/donationData";
import { cn } from "@/lib/utils";

type InKindFormState = {
  fullName: string;
  email: string;
  phone: string;
  itemDetails: string;
  notes: string;
};

type MoneyFormState = {
  fullName: string;
  email: string;
  amount: string;
  paymentReference: string;
  proofOfPayment: File | null;
};

const initialInKindForm: InKindFormState = {
  fullName: "",
  email: "",
  phone: "",
  itemDetails: "",
  notes: "",
};

const initialMoneyForm: MoneyFormState = {
  fullName: "",
  email: "",
  amount: "",
  paymentReference: "",
  proofOfPayment: null,
};

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

function BankingDetailsCard() {
  const rows = [
    { label: "Bank", value: bankingDetails.bankName },
    { label: "Account holder", value: bankingDetails.accountHolder },
    { label: "Registration number", value: bankingDetails.registrationNumber },
    { label: "Account number", value: bankingDetails.accountNumber },
    { label: "Account type", value: bankingDetails.accountType },
    { label: "Branch code", value: bankingDetails.branchCode },
    { label: "Branch name", value: bankingDetails.branchName },
    { label: "Swift code", value: bankingDetails.swiftCode },
  ];

  return (
    <div className="rounded-2xl border border-border bg-background/70 p-5 backdrop-blur-xl">
      <h3 className="text-lg font-semibold text-foreground">FNB banking details</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Use these details when making an EFT payment to The Themba Molefe Foundation.
      </p>

      <dl className="mt-5 divide-y divide-border rounded-xl border border-border">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function InKindDonationForm({
  donationType,
  onCancel,
}: {
  donationType: DonationType;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<InKindFormState>(initialInKindForm);
  const option = donationOptions.find((item) => item.id === donationType);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast.success("Donation request submitted. We will contact you once it has been reviewed.");
    setForm(initialInKindForm);
    onCancel();
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <Notice>{inKindDeliveryNotice}</Notice>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          value={form.fullName}
          onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
          required
        />
        <Input
          label="Email address"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          required
        />
      </div>

      <Input
        label="Phone number"
        type="tel"
        value={form.phone}
        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
        required
      />

      <label className="grid gap-2 text-sm font-medium text-foreground">
        What are you donating?
        <textarea
          className="min-h-28 rounded-lg border border-border bg-card px-3 py-2 text-card-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          value={form.itemDetails}
          onChange={(event) => setForm((current) => ({ ...current, itemDetails: event.target.value }))}
          placeholder={`Describe the ${option?.title.toLowerCase() ?? "items"} you want to donate, including quantity and condition.`}
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-foreground">
        Additional notes
        <textarea
          className="min-h-24 rounded-lg border border-border bg-card px-3 py-2 text-card-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          value={form.notes}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Optional details such as preferred drop-off timing or special instructions."
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit">Submit donation request</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function MoneyDonationForm({ onCancel }: { onCancel: () => void }) {
  const [form, setForm] = useState<MoneyFormState>(initialMoneyForm);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.proofOfPayment) {
      toast.error("Please upload your proof of payment before submitting.");
      return;
    }

    toast.success("Proof of payment submitted. We will confirm your donation once it has been reviewed.");
    setForm(initialMoneyForm);
    onCancel();
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <Notice>{moneyDonationNotice}</Notice>
      <BankingDetailsCard />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          value={form.fullName}
          onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
          required
        />
        <Input
          label="Email address"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Amount donated (ZAR)"
          type="number"
          min="1"
          step="0.01"
          value={form.amount}
          onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
          placeholder="Example: 500"
          required
        />
        <Input
          label="Payment reference"
          value={form.paymentReference}
          onChange={(event) => setForm((current) => ({ ...current, paymentReference: event.target.value }))}
          placeholder="Reference used on your EFT"
        />
      </div>

      <label className="grid gap-2 text-sm font-medium text-foreground">
        Proof of payment
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-5">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Upload className="h-5 w-5 text-primary" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm text-foreground">Upload your bank confirmation, receipt, or screenshot.</p>
              <p className="mt-1 text-xs text-muted-foreground">Accepted formats: PDF, JPG, PNG.</p>
            </div>
          </div>
          <input
            className="mt-4 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                proofOfPayment: event.target.files?.[0] ?? null,
              }))
            }
            required
          />
          {form.proofOfPayment && (
            <p className="mt-2 text-xs text-muted-foreground">Selected file: {form.proofOfPayment.name}</p>
          )}
        </div>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit">Submit proof of payment</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function DonationOptionsSection() {
  const [activeDonation, setActiveDonation] = useState<DonationType | null>(null);
  const activeOption = donationOptions.find((option) => option.id === activeDonation);

  return (
    <section id="donation-options" className="scroll-mt-28 px-6 pb-16 pt-6 md:pt-10">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card/70 p-6 shadow-sm backdrop-blur-xl md:p-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Ways to give</p>
          <h2 className="mt-3 text-3xl font-bold text-card-foreground">Choose how you want to support the mission.</h2>
          <p className="mt-4 text-muted-foreground">
            Select a donation type below to submit your request. In-kind donations are reviewed by an administrator
            before delivery details are shared, and money donations require proof of payment after your EFT.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {donationOptions.map(({ id, title, description, icon: Icon, buttonLabel }) => {
            const isActive = activeDonation === id;

            return (
              <div
                key={id}
                className={cn(
                  "flex h-full flex-col rounded-2xl border bg-background/70 p-5 backdrop-blur-xl transition-colors",
                  isActive ? "border-primary shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_18%,transparent)]" : "border-border",
                )}
              >
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{description}</p>
                <Button
                  type="button"
                  className="mt-5 w-full"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setActiveDonation(isActive ? null : id)}
                >
                  {buttonLabel}
                </Button>
              </div>
            );
          })}
        </div>

        {activeDonation && activeOption && (
          <div className="mt-8 rounded-2xl border border-border bg-background/70 p-6 backdrop-blur-xl md:p-8">
            <h3 className="text-2xl font-bold text-foreground">{activeOption.title} donation</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeDonation === "money"
                ? "Complete your EFT using the banking details below, then submit your proof of payment."
                : "Tell us what you would like to donate and we will review your request."}
            </p>

            <div className="mt-6">
              {activeDonation === "money" ? (
                <MoneyDonationForm onCancel={() => setActiveDonation(null)} />
              ) : (
                <InKindDonationForm donationType={activeDonation} onCancel={() => setActiveDonation(null)} />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
