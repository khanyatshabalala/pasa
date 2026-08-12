import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, clearToken, getToken, setToken, type ProfileResponse, type TokenResponse } from "./api";

export type UserRole =
  | "parent"
  | "teacher"
  | "principal"
  | "school_admin"
  | "super_admin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  /** school_id extracted from profile/roles — null for super_admin and parent without a school */
  schoolId: string | null;
}

interface AuthCtx {
  user: AuthUser | null;
  profile: ProfileResponse | null;
  loading: boolean;
  primaryRole: UserRole;
  primarySchoolId: string | null;
  displayName: string | null;
  /** Call after a successful sign-in to store token + hydrate context */
  onSignIn: (resp: TokenResponse & { schoolId?: string | null }) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

// Decode JWT payload without verifying (we trust our own backend)
function decodeJwt(token: string): { sub: string; email: string; role: string; exp: number } | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function isExpired(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded) return true;
  return decoded.exp * 1000 < Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedUid = useRef<string | null>(null);

  const loadProfile = async (uid: string) => {
    if (fetchedUid.current === uid) return;
    fetchedUid.current = uid;
    try {
      const p = await api.get<ProfileResponse>("/api/v1/profile");
      setProfile(p);
    } catch {
      // non-fatal — profile may not be available yet
    }
  };

  const hydrateFromToken = async (token: string) => {
    const decoded = decodeJwt(token);
    if (!decoded) return;
    const u: AuthUser = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role as UserRole,
      schoolId: null, // will be filled after profile load if needed
    };
    setUser(u);
    await loadProfile(decoded.sub);
  };

  // Restore session on mount
  useEffect(() => {
    const token = getToken();
    if (token && !isExpired(token)) {
      hydrateFromToken(token).finally(() => setLoading(false));
    } else {
      clearToken();
      setLoading(false);
    }
  }, []);

  const onSignIn = async (resp: TokenResponse & { schoolId?: string | null }) => {
    setToken(resp.token);
    const decoded = decodeJwt(resp.token);
    if (!decoded) return;
    const u: AuthUser = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role as UserRole,
      schoolId: resp.schoolId ?? null,
    };
    setUser(u);
    fetchedUid.current = null; // force profile reload
    await loadProfile(decoded.sub);
  };

  const signOut = () => {
    clearToken();
    fetchedUid.current = null;
    setUser(null);
    setProfile(null);
  };

  const refresh = async () => {
    if (!user) return;
    fetchedUid.current = null;
    await loadProfile(user.id);
  };

  const primaryRole: UserRole = user?.role ?? "parent";
  const primarySchoolId = user?.schoolId ?? profile ? null : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        primaryRole,
        primarySchoolId: user?.schoolId ?? null,
        displayName: profile?.fullName ?? null,
        onSignIn,
        signOut,
        refresh,
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
