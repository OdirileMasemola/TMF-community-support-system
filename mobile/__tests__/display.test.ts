import { campaignProgress, formatStatusLabel, getInitials, roleHomePath } from "@/lib/display";
import { formatDate } from "@/lib/formater";

describe("roleHomePath", () => {
  it.each([
    ["administrator", "/admin/dashboard"],
    ["donor", "/donor/dashboard"],
    ["volunteer", "/volunteer/dashboard"],
    ["beneficiary", "/beneficiary/dashboard"],
    ["sponsor", "/sponsor/dashboard"],
  ])("sends %s to %s", (role, path) => {
    expect(roleHomePath(role)).toBe(path);
  });

  it("falls back for an unknown or missing role", () => {
    expect(roleHomePath("guest")).toBe("/dashboard");
    expect(roleHomePath(null)).toBe("/dashboard");
  });
});

describe("formatters", () => {
  it("turns stored values into readable labels", () => {
    expect(formatStatusLabel("under_review")).toBe("Under Review");
    expect(formatStatusLabel("in-kind donation")).toBe("In Kind Donation");
    expect(formatStatusLabel(null)).toBe("Unknown");
  });

  it("builds initials from a name", () => {
    expect(getInitials("Thandi Grace Mokoena")).toBe("TG");
    expect(getInitials("  ")).toBe("TM");
  });

  it("works out campaign progress and caps it at 100", () => {
    expect(campaignProgress(2500, 10000)).toBe(25);
    expect(campaignProgress(15000, 10000)).toBe(100);
    expect(campaignProgress(100, 0)).toBe(0);
  });

  it("leaves an unreadable date as it is", () => {
    expect(formatDate("not a date")).toBe("not a date");
  });

  it("formats a date in the South African style", () => {
    expect(formatDate("2026-10-08T10:00:00+02:00", "full")).toContain("2026");
    expect(formatDate("2026-10-08T10:00:00+02:00")).toMatch(/8/);
  });
});
