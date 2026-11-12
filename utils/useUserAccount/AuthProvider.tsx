"use client";

import type { Session } from "next-auth";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@/interfaces/User";
import { apiRequest, registerAuthHandlers } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import {
  storageGet,
  storageGetJSON,
  storageRemove,
  storageSet,
} from "@/utils/safeStorage";
import { isJwtUsable } from "./jwt";

// The platform login, mounted once for the whole app (app/providers.tsx).
//
// next-auth keeps the Google access token from sign-in and never refreshes
// it, so it stops working after about an hour. The platform JWT lasts much
// longer. So: exchange the Google token (or the school app's `?session=`)
// for a platform JWT only when there is no usable stored JWT, keep reusing
// that JWT, and when the API rejects it (401 / 4013) try one re-exchange
// before signing out.

export type UserAccount = {
  isLogin: boolean;
  token: string | null;
  userData: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
};

type AuthState = {
  status: "loading" | "authenticated" | "unauthenticated";
  token: string | null;
  user: User | null;
};

type Exchange =
  | { ok: true; token: string; user: User }
  | { ok: false; definitive: boolean };

const TOKEN_KEY = "token";
const USER_KEY = "user";
const SESSION_KEY = "session";

/** Login failures that mean the credential is bad, not a passing hiccup. */
const DEFINITIVE_LOGIN_FAILURES: number[] = [
  CustomStatus.INVALID_BODY,
  CustomStatus.INVALID_JWT,
  CustomStatus.INVALID_GOOGLE_ACCESS_TOKEN,
  CustomStatus.INVALID_SESSION,
];

export const AuthContext = createContext<UserAccount | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readAccessToken(session: Session | null) {
  const value = (session as unknown as Record<string, unknown> | null)
    ?.accessToken;
  return typeof value === "string" && value ? value : null;
}

async function platformLogin(
  credential: { googleToken: string } | { session: string },
): Promise<Exchange> {
  const result = await apiRequest<User>("/login", {
    method: "POST",
    body: new URLSearchParams(credential),
  });
  if (result.ok) {
    const authorization = result.body.authorization;
    const token =
      typeof authorization === "string"
        ? authorization.split(" ")[1]
        : undefined;
    if (token && isRecord(result.data)) {
      return { ok: true, token, user: result.data };
    }
    return { ok: false, definitive: false };
  }
  const definitive =
    result.kind === "unauthorized" ||
    (result.status !== null &&
      DEFINITIVE_LOGIN_FAILURES.includes(result.status));
  return { ok: false, definitive };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status: oauthStatus } = useSession();
  const accessToken = readAccessToken(session);
  const sessionEmail = session?.user?.email ?? null;

  const [state, setState] = useState<AuthState>({
    status: "loading",
    token: null,
    user: null,
  });

  // Handlers run outside render (API calls, timers), so they read refs.
  const stateRef = useRef(state);
  const accessTokenRef = useRef(accessToken);
  const oauthStatusRef = useRef(oauthStatus);
  accessTokenRef.current = accessToken;
  oauthStatusRef.current = oauthStatus;

  // Mirrors the school-app session for browsers that block localStorage.
  const memorySession = useRef<string | null>(null);
  // Bumped by every login decision; stale async results are dropped.
  const generation = useRef(0);
  const refreshing = useRef<Promise<string | null> | null>(null);
  const lastInputs = useRef<string | null>(null);

  const commit = useCallback((next: AuthState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const getSchoolSession = useCallback(
    () => memorySession.current ?? storageGet(SESSION_KEY),
    [],
  );

  const dropSchoolSession = useCallback(() => {
    memorySession.current = null;
    storageRemove(SESSION_KEY);
  }, []);

  const saveAccount = useCallback(
    (token: string, user: User) => {
      storageSet(TOKEN_KEY, token);
      storageSet(USER_KEY, JSON.stringify(user));
      commit({ status: "authenticated", token, user });
    },
    [commit],
  );

  const clearAccount = useCallback(() => {
    storageRemove(TOKEN_KEY);
    storageRemove(USER_KEY);
    commit({ status: "unauthenticated", token: null, user: null });
  }, [commit]);

  /** School-app session first, then the Google access token. */
  const exchange = useCallback(async (): Promise<Exchange> => {
    const schoolSession = getSchoolSession();
    if (schoolSession) {
      const result = await platformLogin({ session: schoolSession });
      if (result.ok || !result.definitive) {
        return result;
      }
      dropSchoolSession();
    }
    const googleToken = accessTokenRef.current;
    if (googleToken) {
      return platformLogin({ googleToken });
    }
    return { ok: false, definitive: true };
  }, [getSchoolSession, dropSchoolSession]);

  /** The login cannot be recovered: forget it, without reloading the page. */
  const endSession = useCallback(() => {
    clearAccount();
    if (oauthStatusRef.current === "authenticated") {
      signOut({ redirect: false }).catch((error: unknown) => {
        console.error("Sign out failed:", error);
      });
    }
  }, [clearAccount]);

  const refreshToken = useCallback(
    (failedToken: string): Promise<string | null> => {
      const current = stateRef.current.token;
      if (current && current !== failedToken && isJwtUsable(current)) {
        // Someone else already re-exchanged; use the new token.
        return Promise.resolve(current);
      }
      if (refreshing.current) {
        return refreshing.current;
      }
      if (!current) {
        return Promise.resolve(null);
      }
      const run = ++generation.current;
      const task = (async () => {
        const result = await exchange();
        if (run !== generation.current) {
          return stateRef.current.token;
        }
        if (result.ok) {
          saveAccount(result.token, result.user);
          return result.token;
        }
        if (result.definitive) {
          endSession();
        }
        return null;
      })().finally(() => {
        refreshing.current = null;
      });
      refreshing.current = task;
      return task;
    },
    [exchange, saveAccount, endSession],
  );

  useEffect(() => {
    registerAuthHandlers({
      getToken: () => stateRef.current.token,
      refreshToken,
    });
    return () => registerAuthHandlers(null);
  }, [refreshToken]);

  // The school app signs users in with /?session=…: that is a new login,
  // so it replaces whatever account was stored before.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("session");
    if (fromUrl && fromUrl !== getSchoolSession()) {
      memorySession.current = fromUrl;
      storageSet(SESSION_KEY, fromUrl);
      storageRemove(TOKEN_KEY);
      storageRemove(USER_KEY);
    }
  }, [getSchoolSession]);

  useEffect(() => {
    const schoolSession = getSchoolSession();
    if (!schoolSession && oauthStatus === "loading") {
      return;
    }
    // Only a different login source or Google account needs a new decision;
    // next-auth refetching the same session on focus does not.
    const inputs = schoolSession
      ? `session:${schoolSession}`
      : `${oauthStatus}:${accessToken ?? ""}:${sessionEmail ?? ""}`;
    if (inputs === lastInputs.current) {
      return;
    }
    lastInputs.current = inputs;

    const run = ++generation.current;
    const isCurrent = () => run === generation.current;

    if (!schoolSession && oauthStatus === "unauthenticated") {
      clearAccount();
      return;
    }

    const storedToken = stateRef.current.token ?? storageGet(TOKEN_KEY);
    const storedUser = stateRef.current.user ?? storageGetJSON<User>(USER_KEY);
    const sameAccount =
      Boolean(schoolSession) ||
      !sessionEmail ||
      !storedUser?.email ||
      storedUser.email.toLowerCase() === sessionEmail.toLowerCase();

    if (storedToken && isJwtUsable(storedToken) && sameAccount) {
      commit({
        status: storedUser ? "authenticated" : "loading",
        token: storedToken,
        user: storedUser,
      });
      (async () => {
        // Refresh the profile (permission, avatar…) without logging in again.
        const me = await apiRequest<User>("/user/me", { token: storedToken });
        if (!isCurrent()) {
          return;
        }
        if (me.ok && isRecord(me.data)) {
          storageSet(USER_KEY, JSON.stringify(me.data));
          commit({
            status: "authenticated",
            token: storedToken,
            user: me.data,
          });
          return;
        }
        if (!storedUser) {
          await refreshToken(storedToken);
          if (stateRef.current.status === "loading") {
            commit({ status: "authenticated", token: storedToken, user: null });
          }
        }
      })();
      return;
    }

    commit({ status: "loading", token: null, user: null });
    (async () => {
      const result = await exchange();
      if (!isCurrent()) {
        return;
      }
      if (result.ok) {
        saveAccount(result.token, result.user);
      } else if (result.definitive) {
        endSession();
      } else {
        // Network trouble or rate limit: logged out for now, but keep the
        // Google session so the next visit can try again.
        clearAccount();
      }
    })();
  }, [
    oauthStatus,
    accessToken,
    sessionEmail,
    getSchoolSession,
    commit,
    clearAccount,
    saveAccount,
    exchange,
    endSession,
    refreshToken,
  ]);

  const login = useCallback(() => {
    signIn("google");
  }, []);

  const logout = useCallback(() => {
    generation.current++;
    dropSchoolSession();
    clearAccount();
    signOut();
  }, [dropSchoolSession, clearAccount]);

  const value = useMemo<UserAccount>(
    () => ({
      isLogin: state.status === "authenticated" && Boolean(state.token),
      token: state.token,
      userData: state.user,
      isLoading: state.status === "loading",
      login,
      logout,
    }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
