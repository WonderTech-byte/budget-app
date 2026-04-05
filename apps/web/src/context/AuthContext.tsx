import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  loginApi,
  registerApi,
  logoutApi,
  resetPasswordApi,
  getCurrentUserApi,
} from "@/lib/api";

type User = {
  userId: string;
  username: string;
  fullName: string;
  email: string;
  budgets: any[];
};

type RegisterData = {
  username: string;
  fullName: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isLoggedIn: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Restore session on app load using backend session state
  useEffect(() => {
    getCurrentUserApi()
      .then((res) => {
        setUser(res);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await loginApi(email, password);
      setUser(res);
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await registerApi(data);
      setUser(res);
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await resetPasswordApi(email);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        resetPassword,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}