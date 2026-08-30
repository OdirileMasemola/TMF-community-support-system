import { LoadingState } from "@/components/ui";

/** The gate in app/_layout.tsx redirects away from here as soon as the role is known. */
export default function Index() {
  return <LoadingState label="Opening your dashboard…" />;
}
