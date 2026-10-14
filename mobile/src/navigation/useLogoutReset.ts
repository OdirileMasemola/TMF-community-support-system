import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useQueryClient, type Query } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";

/** Public campaign lists are the same for everyone, so they survive a sign-out. */
export function isUserSpecificQuery(query: Pick<Query, "queryKey">): boolean {
  return query.queryKey[0] !== "campaigns";
}

/**
 * When a session ends (a successful sign-out or Supabase dropping an expired
 * session), remove the previous user's cached data and replace the whole
 * navigation stack with the welcome screen so Back cannot return to a portal.
 * Must be called before the root gate's effect so dismissAll runs first.
 */
export function useLogoutReset(session: Session | null, isLoading: boolean, onPublicScreen: boolean) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const hadSession = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (session) {
      hadSession.current = true;
      return;
    }
    if (!hadSession.current) return;
    hadSession.current = false;
    queryClient.cancelQueries({ predicate: isUserSpecificQuery });
    queryClient.removeQueries({ predicate: isUserSpecificQuery });
    if (router.canDismiss()) router.dismissAll();
    // On a protected screen the root gate performs the single replace to
    // /welcome; only a public screen (e.g. Help) needs it done here.
    if (onPublicScreen) router.replace("/welcome");
  }, [isLoading, session, onPublicScreen, queryClient, router]);
}
