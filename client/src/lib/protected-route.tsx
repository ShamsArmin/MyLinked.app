import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import PageShell from "../components/PageShell";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

export function ProtectedRoute({ 
  path, 
  component: Component 
}: ProtectedRouteProps) {
  console.log("ProtectedRoute rendering for path:", path);
  
  // Get auth context with error handling
  let user = null;
  let isLoading = true;
  
  try {
    const auth = useAuth();
    user = auth.user;
    isLoading = auth.isLoading;
    console.log("Auth state in ProtectedRoute:", { 
      user: user ? "Authenticated" : "Not authenticated", 
      isLoading 
    });
  } catch (error) {
    console.error("Error using auth hook in ProtectedRoute:", error);
    // Default to loading state to prevent flickering
  }

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : user ? (
        <PageShell>
          <Component />
        </PageShell>
      ) : (
        <Redirect to="/auth" />
      )}
    </Route>
  );
}