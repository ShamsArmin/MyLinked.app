import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";

console.log("Loading auth hook");

// Data types for login and registration
type LoginData = {
  username: string; 
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  name: string;
  email?: string | undefined;
  bio?: string | undefined;
};

// Define the authentication context type
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

// Create the authentication context with a default value to avoid null checking
const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  loginMutation: {} as UseMutationResult<User, Error, LoginData>,
  logoutMutation: {} as UseMutationResult<void, Error, void>,
  registerMutation: {} as UseMutationResult<User, Error, RegisterData>,
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// Authentication provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  console.log("AuthProvider rendering");
  
  // Create a mock toast function for safety
  const toast = {
    toast: (args: any) => console.log("Toast called:", args),
  }
  
  // Simple loading state
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Use effect to simulate initial loading
  useEffect(() => {
    console.log("Auth provider mounted");
    setTimeout(() => {
      setIsInitialLoading(false);
    }, 500);
  }, []);

  // Query to fetch the current user (with safer error handling)
  const {
    data: user,
    error,
    isLoading: isQueryLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        console.log("Fetching user data");
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.status === 401) {
          console.log("User not authenticated (401)");
          return null;
        }
        if (!res.ok) {
          console.log(`Error fetching user: ${res.status}`);
          return null;
        }
        const data = await res.json();
        console.log("User data fetched:", data);
        return data;
      } catch (error) {
        console.error("Error in user query:", error);
        return null;
      }
    },
    retry: false,
    enabled: !isInitialLoading,
  });

  // Combined loading state
  const isLoading = isInitialLoading || isQueryLoading;

  // Mutation for login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Login attempt with:", credentials.username);
      try {
        // Use the fetch API directly to ensure consistent behavior
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include"
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || "Login failed");
        }
        
        return data.user;
      } catch (error) {
        console.error("Login request error:", error);
        throw error;
      }
    },
    onSuccess: (user: User) => {
      console.log("Login successful:", user);
      queryClient.setQueryData(["/api/user"], user);
      // Invalidate notifications so they load immediately after login
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast.toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
      toast.toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for registration
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      console.log("Registration attempt for:", userData.username);
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }
      
      return data.user;
    },
    onSuccess: (user: User) => {
      console.log("Registration successful:", user);
      queryClient.setQueryData(["/api/user"], user);
      // Clear notifications cache in case any exist from a previous session
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast.toast({
        title: "Registration successful",
        description: `Welcome to MyLinked, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      console.error("Registration error:", error);
      toast.toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for logout - improved error handling
  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Logout attempt");
      try {
        const res = await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
        });
        
        if (!res.ok) {
          console.log("Server returned error for logout, proceeding with client-side logout");
          // We'll force client-side logout even if the server has an issue
          return { status: "client-side-only" };
        }
        
        return { status: "success" };
      } catch (err) {
        console.log("Error during logout request, forcing client-side logout:", err);
        // Return a value to ensure we don't trigger the error handler
        return { status: "client-side-only" };
      }
    },
    onSuccess: (result) => {
      console.log("Logout processing:", result);
      // Clear user data from cache regardless of server result
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      if (result.status === "client-side-only") {
        toast.toast({
          title: "Logged out",
          description: "You have been logged out locally. Server may be unavailable.",
        });
      } else {
        toast.toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
      }
      
      // Force a page refresh to clean up any lingering state
      setTimeout(() => {
        window.location.href = "/";
      }, 300);
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      // Even if there's a server error, we still want to log the user out locally
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast.toast({
        title: "Logged out",
        description: "You have been logged out locally, but there was a server error.",
      });
      
      // Force a page refresh to clean up any lingering state
      setTimeout(() => {
        window.location.href = "/";
      }, 300);
    },
  });

  const contextValue: AuthContextType = {
    user: user || null,
    isLoading,
    error: error || null,
    loginMutation,
    logoutMutation,
    registerMutation,
  };

  console.log("Auth context value:", { 
    user: user ? `User: ${user.username}` : "No user", 
    isLoading,
    hasError: !!error 
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use authentication context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.error("useAuth called outside AuthProvider");
    // Return default context instead of throwing
    return defaultAuthContext;
  }
  return context;
}