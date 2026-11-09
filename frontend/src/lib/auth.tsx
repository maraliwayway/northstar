import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, hasToken, onUnauthorized, setToken } from "./api";
import type { User } from "./types";

type AuthState = {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (attrs: Partial<Omit<User, "settings">> & { settings?: Partial<User["settings"]> }) => Promise<User>;
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!hasToken());

  useEffect(() => {
    if (hasToken()) {
      api
        .get<User>("/profile")
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setReady(true));
    }
    return onUnauthorized(() => setUser(null));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ token: string; user: User }>("/session", { email, password });
    setToken(result.token);
    setUser(result.user);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const result = await api.post<{ token: string; user: User }>("/registration", { user: { name, email, password } });
    setToken(result.token);
    setUser(result.user);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.del("/session");
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  const saveProfile = useCallback<AuthState["saveProfile"]>(async (attrs) => {
    const updated = await api.patch<User>("/profile", { profile: attrs });
    setUser(updated);
    return updated;
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signUp, signOut, saveProfile, setUser }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

// For pages that always render inside the signed-in layout.
export function useUser() {
  const { user, ...rest } = useAuth();
  if (!user) throw new Error("useUser called while signed out");
  return { user, ...rest };
}
