import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useSession } from "./AuthProvider";

/** Signed-in screens. Signed out goes to /sign-in. */
export function RequireSession({ children }: { children: ReactNode }) {
  const session = useSession();
  if (session === undefined) return null;
  if (session === null) return <Navigate to="/sign-in" replace />;
  return children;
}

/** The sign-in screen. Already signed in goes to Today. */
export function RequireNoSession({ children }: { children: ReactNode }) {
  const session = useSession();
  if (session === undefined) return null;
  if (session) return <Navigate to="/" replace />;
  return children;
}
