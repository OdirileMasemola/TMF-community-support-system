#!/usr/bin/env bash
# Builds a THROWAWAY local database from supabase/migrations and runs the SQL
# tests. It refuses to run against anything but a local server; it never
# touches the live Supabase project.
#
# Needs a local PostgreSQL 17 server with pgcrypto (contrib) and a superuser.
#   PGHOST=/tmp PGPORT=55432 PGUSER=postgres ./supabase/tests/run_local_tests.sh
set -euo pipefail

case "${PGHOST:-localhost}" in
  localhost|127.0.0.1|::1|/*) ;;
  *) echo "Refusing to run: PGHOST must be a local server (got ${PGHOST})." >&2; exit 1 ;;
esac

here="$(cd "$(dirname "$0")" && pwd)"
db="tmf_local_test_$$"
log="$(mktemp)"
psql -d postgres -v ON_ERROR_STOP=1 -qc "create database ${db}"
trap 'psql -d postgres -qc "drop database if exists ${db}" >/dev/null; rm -f "${log}"' EXIT

run() {
  # Runs one file in a single transaction; prints everything except NOTICEs.
  if ! psql -d "${db}" -v ON_ERROR_STOP=1 -q -1 -f "$1" >"${log}" 2>&1; then
    grep -v NOTICE "${log}" >&2 || true
    echo "FAILED: $(basename "$1")" >&2
    exit 1
  fi
  grep -E "passed|ERROR|FAILED" "${log}" || true
}

run "${here}/local_supabase_stub.sql"
for file in $(ls "${here}/../migrations/"*.sql | sort); do
  echo "migration: $(basename "${file}")"
  run "${file}"
done
for test in "${here}"/*_test.sql; do
  echo "test: $(basename "${test}")"
  run "${test}"
done
echo "All SQL tests passed."
