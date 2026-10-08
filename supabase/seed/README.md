# TMF M2 "Database ready": seed data (applied to live on 2026-10-08; verify PASS=88 FAIL=0)

Plan stories: US2.5.1 (test Auth accounts for every role), US2.5.2 (seed.sql, at least 10 rows per table), US2.5.3 (verification).

| File | Purpose |
|---|---|
| `01_seed_auth_users.sql` | 42 confirmed email/password accounts in `auth.users` + `auth.identities`. Contains the placeholder `__SET_TEST_PASSWORD_HERE__` and **no real password**. |
| `02_seed.sql` | Public-schema seed data. One transaction, fixed UUIDs, idempotent. |
| `03_seed_verify.sql` | A single read-only SELECT: row counts, FK orphans, seed isolation, CHECK re-validation and business rules. |
| `04_seed_cleanup.sql` | Removes seed rows and seed users only. Refuses to run if non-seed rows reference seed rows. |
| `accounts.tsv` | Email, role, whether the account can log in, and account status. |
| `gen/` | Generator (`python3 gen/build.py`) that writes the files above. |
| `harness/` | Local test harness: `run_seed.sh`, a realistic Auth shim, a simulation of the live starting state and a snapshot query. |

How seed rows are identified:
- Every seed id matches `5eed____-5eed-4eed-8eed-5eed5eed5eed`.
- Every seed account email matches `seed.%@example.com`.
- Seed contact-form senders use `seed.contact.*@example.com`.
- Receipt numbers start with `TMF-SEED-`.
- `reports.metadata` contains `"seed": true`.

## Accounts (42: 14 can log in, 28 are data-only)

The role spread is 2 administrators and 10 each of donor, beneficiary, volunteer and sponsor. Both administrators and the first 3 accounts of every other role get the shared test password. The other 28 accounts have `encrypted_password = ''`, so nobody can log in to them. They exist only so that every role-profile table reaches 10 rows.

## Applying on live (applied 2026-10-08; re-run only with explicit approval)

Use the SQL Editor (it runs as `postgres`). No service-role key is needed.
1. Optional read-only pre-check: `select table_name, column_name, is_nullable, column_default, is_generated from information_schema.columns where table_schema = 'auth' and table_name in ('users', 'identities') order by 1, 2;`. Script 01 also checks these columns itself and aborts if any are missing.
2. Open `01_seed_auth_users.sql` and replace the placeholder (it appears once, in the `with pw(v)` line) with a disposable test-only password. Run the script, then close the tab without saving.
   - Writes to `auth.users` and `auth.identities`.
   - The `handle_new_user` trigger adds `profiles` rows (pending; administrators are downgraded to beneficiary) and the role profiles.
   - The user_settings trigger adds the `user_settings` rows.
3. Run `02_seed.sql`. It promotes the two administrators (adds `administrator_profiles` and removes the beneficiary profile the trigger gave them), activates the accounts and inserts the rest of the data.
4. Run `03_seed_verify.sql` and expect `SUMMARY | RESULTS | PASS`.
5. To remove everything, run `04_seed_cleanup.sql`. Files that seed accounts upload to Storage have to be deleted in the Storage UI.
