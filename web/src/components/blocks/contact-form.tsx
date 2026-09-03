import { useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ContactDetails {
  label: string;
  url: string;
}

interface ContactSectionProps {
  title?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: ContactDetails;
}

export function ContactSection({
  title = "Get in touch",
  description = "We’re available for questions, feedback, and collaboration opportunities. Let us know how we can help.",
  phone = "+27 12 345 6789",
  email = "hello@themba-molefe-foundation.org",
  website = { label: "themba-molefe-foundation.org", url: "https://www.themba-molefe-foundation.org" },
}: ContactSectionProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState("");

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setStatusMessage("");
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([name, value]) => {
      if (!value.trim()) {
        nextErrors[name] = "This field is required";
      }
    });

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Enter a valid email address";
    }

    return nextErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatusMessage("");
      return;
    }

    console.info("Contact form submitted", formData);
    setStatusMessage("Message sent. We’ll be in touch soon.");
    setErrors({});
    setFormData({ firstName: "", lastName: "", email: "", subject: "", message: "" });
  };

  return (
    <section id="contact-form" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 rounded-3xl border border-border/70 bg-background/70 p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] backdrop-blur lg:flex-row lg:p-10">
        <div className="flex-1 space-y-8">
          <div className="space-y-4 text-center lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Contact Details</p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h2>
            <p className="mx-auto max-w-xl text-base leading-7 text-muted-foreground lg:mx-0">{description}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/70 p-6">
            <h3 className="text-xl font-semibold text-foreground">Reach us directly</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <span className="font-semibold text-foreground">Phone:</span> {phone}
              </li>
              <li>
                <span className="font-semibold text-foreground">Email:</span>{" "}
                <a href={`mailto:${email}`} className="text-primary underline-offset-4 hover:underline">
                  {email}
                </a>
              </li>
              <li>
                <span className="font-semibold text-foreground">Website:</span>{" "}
                <a href={website.url} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
                  {website.label}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" aria-invalid={Boolean(errors.firstName)} />
              {errors.firstName ? <p className="text-sm text-primary">{errors.firstName}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" aria-invalid={Boolean(errors.lastName)} />
              {errors.lastName ? <p className="text-sm text-primary">{errors.lastName}</p> : null}
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" aria-invalid={Boolean(errors.email)} />
              {errors.email ? <p className="text-sm text-primary">{errors.email}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="Subject" aria-invalid={Boolean(errors.subject)} />
              {errors.subject ? <p className="text-sm text-primary">{errors.subject}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="Type your message here" rows={5} aria-invalid={Boolean(errors.message)} />
              {errors.message ? <p className="text-sm text-primary">{errors.message}</p> : null}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" className="w-full sm:w-auto">
              Send Message
            </Button>
            {statusMessage ? <p className="text-sm font-medium text-primary">{statusMessage}</p> : null}
          </div>
        </form>
      </div>
    </section>
  );
}

export default ContactSection;
