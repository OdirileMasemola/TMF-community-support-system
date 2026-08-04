export function formatDate(value: string, format: "day-month" | "full" = "day-month") {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (format === "full") {
    return new Intl.DateTimeFormat("en-ZA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
  }).format(date);
}
