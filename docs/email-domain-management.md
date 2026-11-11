# Email domain management and email verification

[Back to the project README](../README.md) | [API](../api/README.md)

This explains how TMF decides whether an email address can be used to register, how administrators
control that, and how the address is proved to belong to the person registering.

## Two separate questions

| Question | Answered by | What it proves |
| --- | --- | --- |
| Can this domain receive email, and is it allowed? | **Domain validation**: format check, mail DNS lookup, administrator policy | That mail *could* be delivered to the domain and that TMF accepts it |
| Does this person control this mailbox? | **Ownership verification**: the Supabase confirmation email | That the person opened a link sent to that exact address |

A domain passing validation never makes an account verified. An account is verified only when
Supabase Auth has set `email_confirmed_at` after the link in the confirmation email was opened.
`user_metadata.email_verified` (or anything else the client sends) is ignored: signed-in users can
edit their own `user_metadata`.

## Registration flow (web and mobile)

```
browser / app
  │ 1. POST /api/v1/auth/registration/email-check { email }      (public, rate limited)
  │      format → normalise (lower-case, IDN → punycode) → mail DNS → domain policy
  │      ← 200 { email (normalised), domain, attestation, attestationExpiresAt }
  │      ← 422 INVALID_EMAIL | EMAIL_DOMAIN_UNDELIVERABLE | EMAIL_DOMAIN_RESTRICTED
  │      ← 503 EMAIL_DOMAIN_CHECK_UNAVAILABLE (DNS or policy lookup failed: fail closed)
  │ 2. supabase.auth.signUp({ email: normalised, password,
  │        options: { emailRedirectTo: <web>/auth/callback, data: { …, email_attestation } } })
  │      Supabase runs the "Before User Created" hook → public.hook_before_user_created
  │        format + domain policy (always) and the attestation (when the secret is configured)
  │ 3. Supabase sends the confirmation email → user opens it → email_confirmed_at is set
```

The API never sees the password; clients still call Supabase for the sign-up itself.

### Mail DNS check

Implemented in `api/src/modules/emailDomains/dnsValidator.ts` with Node's built-in `dns/promises`
(no third-party service and no list of "allowed providers"):

1. Look up **MX** records. Any usable MX record → the domain can receive email.
2. A **null MX** (`MX 0 .`, RFC 7505) means the domain explicitly refuses mail → rejected.
3. No MX records → fall back to the **implicit MX** rule (RFC 5321 §5.1): an **A** or **AAAA**
   record means mail is delivered to that host.
4. NXDOMAIN or no MX/A/AAAA → "This email domain is not configured to receive email."
5. Timeouts (default 3 s, `EMAIL_DNS_TIMEOUT_MS`) and resolver failures → 503, *not* cached and
   *not* treated as valid.

Results are cached in memory: positive results for `EMAIL_DNS_CACHE_TTL_SECONDS` (default 1 hour),
negative results for one sixth of that (at least 60 s). Concurrent checks of the same domain share
one lookup.

### Custom domains

Any domain with working mail DNS is accepted in open mode: company domains (`company.co.za`),
schools, NGOs, government (`gov.za`), personal domains and internationalised domains (entered in
Unicode, stored as punycode, e.g. `xn--…`). There is no Gmail/Outlook allowlist.

## Administrator management

Web dashboard → **Administration → Email Domains** (`/admin/email-domains`). Mobile admin keeps to
the major day-to-day features, so this screen is web only.

- **Registration mode** (one setting, `public.email_domain_policy`):
  - **Open** (default): any domain that can receive email, except domains marked *blocked*.
  - **Restricted**: only *active approved* domains (and their subdomains). Switching asks for
    confirmation and warns if no approved domain is listed.
- **Domains** (`public.email_domain_settings`): add, list/search/filter, activate or deactivate,
  approve or block, edit notes, re-check DNS, remove. Each row shows domain, policy, status, mail
  DNS status, dates and actions. A domain name cannot be renamed; remove it and add the new one.
- **Matching**: a rule for `company.co.za` also covers `hr.company.co.za`; the most specific active
  rule wins. Inactive rules are ignored.
- **Recent changes**: every insert/update/delete of a domain or the mode is written by a database
  trigger to `public.email_domain_audit_log` with the old and new values and the acting user.

Changes apply to **new registrations only**. Existing accounts, including accounts on a domain that
is later blocked, keep signing in; the checks run only when an account is created.

## Security controls

- **Server side only.** The API check is for good error messages; the Supabase Auth hook enforces
  the same rules inside Supabase for *every* account creation path: web, mobile, OAuth, dashboard
  invites and **direct calls to Supabase `signUp` with the public anon key**.
- **Direct-signUp bypass.** Without the hook, anyone could call `signUp` with the public anon key
  and skip the API. The hook closes that for format and domain policy. Postgres cannot do DNS
  lookups, so the API issues an **attestation** (`v1.<expiry>.<HMAC-SHA256>` over the normalised
  address, valid 15 minutes) and the hook verifies it with a secret stored in Supabase Vault. When
  the secret is configured, a sign-up that did not pass the API's DNS check is rejected.
  OAuth sign-ups (Google proves the address) and active approved domains whose stored DNS status is
  valid (so administrators can still invite users from the dashboard) do not need one.
- **Admin-only data.** RLS lets only active administrators read or change the policy, domains and
  audit log; suspended accounts are denied by a restrictive policy; anon has no table access. The
  audit log cannot be written or deleted by clients. The API uses the caller's own token (no
  service-role key), so RLS applies to every admin request.
- **Rate limiting.** The public email check is limited per client (`EMAIL_CHECK_RATE_LIMIT_MAX`
  per minute, default 10) on top of the global limit. Resending confirmation emails has a 60 s
  client cooldown and Supabase's own per-address and hourly limits.
- **Privacy.** API logs record the domain and outcome, not the address. Error messages never echo
  DNS or database errors.

## Messages shown to users

| Situation | Message |
| --- | --- |
| Malformed address | Please enter a valid email address. |
| Domain cannot receive email | This email domain is not configured to receive email. |
| Restricted mode / blocked domain | Registration using this email domain is currently restricted. |
| Sign-up accepted | Please check your inbox to verify your email address. |
| Expired link | Your verification link has expired. Please request another one. |
| DNS or policy check failed | We could not check your email address right now. Please try again in a moment. |

## Supabase and Resend configuration (owner action required)

None of these were changed by the code change; they must be set by the project owner.

1. **Apply the migration** `supabase/migrations/20261112120000_email_domain_management.sql`
   (SQL editor or your normal deployment). It is idempotent.
2. **Enable the hook**: Authentication → Hooks → *Before User Created* → Postgres function
   `public.hook_before_user_created`.
3. **Attestation secret** (closes the DNS bypass): generate a random secret of at least 32
   characters and store the *same* value in
   - Supabase Vault, secret name `email_signup_attestation_secret`, and
   - the API's environment, `EMAIL_SIGNUP_ATTESTATION_SECRET` (Azure App Service → Configuration).
   Set both before or at the same time; if only Vault has it, sign-ups fail until the API has it.
4. **Confirm email** must be ON (Authentication → Providers → Email).
5. **Redirect URLs**: the allow list must include `<web origin>/auth/callback` for every web
   origin in use (the mobile app sends confirmation links to the website's callback too).
6. **Custom SMTP**: emails are currently sent through Resend from `onboarding@resend.dev`, which
   Resend only delivers to the Resend account owner's own address. Verify a TMF sending domain in
   Resend and use an address on it as the sender.
7. **Email rate limit**: the project allows 2 auth emails per hour, which is why sign-ups showed
   "email limit reached". Raise it (Authentication → Rate Limits) once custom SMTP is in place.

## Tests

- SQL (local throwaway Postgres only): `supabase/tests/run_local_tests.sh` applies all migrations
  to a temporary database and runs `supabase/tests/email_domain_management_test.sql` (policy
  decisions, RLS, audit trail, hook with and without attestation). It refuses non-local hosts.
- API: `api/tests/emailDomains.*.test.ts` (mocked DNS resolver, no network).
- Web: `web/src/features/auth/__tests__/registration.test.ts`, `RegisterPage.test.tsx`,
  `AuthCallbackPage.test.tsx`, `web/src/pages/admin/__tests__/AdminEmailDomainsPage.test.tsx`.
- Mobile: `mobile/__tests__/emailRegistration.test.ts`, `emailVerificationScreens.test.tsx`.

## Known limitations

- Until the attestation secret is configured, a direct `signUp` call to a domain that is not
  blocked but has no mail DNS can still create an **unconfirmed** account. It can never become
  verified because the confirmation email cannot be delivered, but it is a gap until step 3 above.
- A DNS result can be up to the cache TTL old; administrators can force a re-check per domain.
- Mail DNS proves a domain *can* receive email, not that a mailbox exists; only the confirmation
  email proves ownership.
