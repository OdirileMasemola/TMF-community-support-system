/** Today's date (YYYY-MM-DD) in South Africa (Africa/Johannesburg), where the foundation operates. */
export function todayInJohannesburg(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
