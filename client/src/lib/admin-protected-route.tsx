import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import PageShell from "../components/PageShell";

export function AdminProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has admin access by trying to access an admin endpoint
    fetch("/api/admin/users-with-roles", {
      credentials: "include",
    })
      .then((response) => {
        if (response.ok) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => {
        setIsAdmin(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!isAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/admin/login" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <PageShell>
        <Component />
      </PageShell>
    </Route>
  );
}