import {
  isPublicSignupRole,
  isValidEmail,
  isValidPhoneNumber,
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validateRegistration,
  type RegistrationValues,
} from "@/lib/validation";

const valid: RegistrationValues = {
  fullName: "Thandi Mokoena",
  email: "thandi@example.com",
  phoneNumber: "072 000 0000",
  password: "community123",
  confirmPassword: "community123",
  role: "donor",
  organisationName: "",
};

describe("validateRegistration", () => {
  it("accepts a complete form", () => {
    expect(validateRegistration(valid)).toBeNull();
  });

  it("needs a full name", () => {
    expect(validateRegistration({ ...valid, fullName: "   " })).toBe("Enter your full name.");
  });

  it("needs a valid email address", () => {
    expect(validateRegistration({ ...valid, email: "" })).toBe("Enter your email address.");
    expect(validateRegistration({ ...valid, email: "thandi@" })).toBe("Enter a valid email address.");
  });

  it("allows a blank phone number but rejects a malformed one", () => {
    expect(validateRegistration({ ...valid, phoneNumber: "" })).toBeNull();
    expect(validateRegistration({ ...valid, phoneNumber: "12ab" })).toBe(
      "Enter a valid phone number, or leave it blank.",
    );
  });

  it("needs a role that people may choose for themselves", () => {
    expect(validateRegistration({ ...valid, role: null })).toBe("Choose how you are joining TMF.");
  });

  it("needs an organisation name for sponsors only", () => {
    expect(validateRegistration({ ...valid, role: "sponsor" })).toBe("Enter your organisation's name.");
    expect(validateRegistration({ ...valid, role: "sponsor", organisationName: "Sipho Holdings" })).toBeNull();
  });

  it("needs a long enough password", () => {
    const short = "a".repeat(MIN_PASSWORD_LENGTH - 1);
    expect(validateRegistration({ ...valid, password: short, confirmPassword: short })).toBe(
      `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  });

  it("needs the passwords to match", () => {
    expect(validateRegistration({ ...valid, confirmPassword: "community124" })).toBe("The passwords do not match.");
  });
});

describe("field helpers", () => {
  it("recognises public sign-up roles and refuses administrator", () => {
    expect(isPublicSignupRole("volunteer")).toBe(true);
    expect(isPublicSignupRole("sponsor")).toBe(true);
    expect(isPublicSignupRole("administrator")).toBe(false);
    expect(isPublicSignupRole(null)).toBe(false);
  });

  it("checks email addresses", () => {
    expect(isValidEmail(" person@tmf.org.za ")).toBe(true);
    expect(isValidEmail("person@tmf")).toBe(false);
    expect(validateEmail("person@tmf.org.za")).toBeNull();
  });

  it("checks phone numbers", () => {
    expect(isValidPhoneNumber("+27 72 076 9116")).toBe(true);
    expect(isValidPhoneNumber("(011) 555-0182")).toBe(true);
    expect(isValidPhoneNumber("12345")).toBe(false);
  });
});
