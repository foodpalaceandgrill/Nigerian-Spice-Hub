import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { User } from "@workspace/api-client-react";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User, isAdmin?: boolean) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("food_palace_token") || localStorage.getItem("food_palace_admin_token");
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return !!localStorage.getItem("food_palace_admin_token");
  });
  
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading } = useGetCurrentUser({
    query: {
      enabled: !!token,
      retry: 1,
      queryKey: getGetCurrentUserQueryKey()
    }
  });

  const login = (newToken: string, userData: User, admin = false) => {
    if (admin) {
      localStorage.setItem("food_palace_admin_token", newToken);
      setIsAdmin(true);
    } else {
      localStorage.setItem("food_palace_token", newToken);
      setIsAdmin(false);
    }
    setToken(newToken);
    queryClient.setQueryData(getGetCurrentUserQueryKey(), userData);
  };

  const logout = () => {
    localStorage.removeItem("food_palace_token");
    localStorage.removeItem("food_palace_admin_token");
    setToken(null);
    setIsAdmin(false);
    queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
    setLocation("/auth/login");
  };

  useEffect(() => {
    if (token && !isUserLoading && !user) {
      logout();
    }
  }, [token, isUserLoading, user]);

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading: isUserLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}