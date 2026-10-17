import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { TopProgressBar } from "@/components/ui/Spinner";

/** Shows a thin top progress bar whenever any query is fetching or any mutation is running. */
export function GlobalLoadingBar() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  return <TopProgressBar active={fetching + mutating > 0} />;
}
