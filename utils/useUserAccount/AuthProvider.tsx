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
import Swal from "sweetalert2";
import { toast } from "@/components/mobile/Toast";
import type { User } from "@/interfaces/User";
import { apiRequest, registerAuthHandlers } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import { disablePush } from "@/modules/push";
import {
  getReportedSuspension,
  reportSuspension,
  subscribeSuspension,
} from "@/modules/suspension";
import {
  storageGet,
  storageGetJSON,
  storageRemove,
  storageSet,
} from "@/utils/safeStorage";
import { isMobileViewport } from "@/utils/useIsMobile";
import { isJwtUsable } from "./jwt";

// The platform login, mounted once for the whole app (app/providers.tsx).
//
// next-auth keeps the Google access token from sign-in and never refreshes
// it, so it stops working after about an hour. The platform JWT lasts much
// longer. So: exchange the Google token (or the school app's `?session=`)
// for a platform JWT only when there is no usable stored JWT, keep reusing
// that JWT, and when the API rejects it (401 / 4013) try one re-exchange
// before signing out.
//
// A `?session=` link can come from anyone, so it never silently replaces
// the signed-in account: a link for someone else asks first, and a link
// that signs a logged-out visitor in says whose account it was.

export type UserAccount = {
  isLogin: boolean;
  token: string | null;
  userData: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  /**
   * Applies a change the backend already accepted (description, SIGs,
   * notification setting…) to the signed-in profile, so every component
   * shows it without another `/user/me`.
   */
  updateUser: (patch: Partial<User> | ((user: User) => User)) => void;
};

type AuthState = {
  status: "loading" | "authenticated" | "unauthenticated";
  token: string | null;
  user: User | null;
};

type Exchange =
  | { ok: true; token: string; user: User }
  | { ok: false; definitive: boolean; message: string };

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

/** "王小明（@xiaoming）": enough to tell two accounts apart. */
function describeUser(user: User) {
  const name = user.name || user.email || "未命名的帳號";
  return user.customId ? `${name}（@${user.customId}）` : name;
}

function isSameUser(a: User, b: User) {
  if (a._id && b._id) {
    return a._id === b._id;
  }
  if (a.email && b.email) {
    return a.email.toLowerCase() === b.email.toLowerCase();
  }
  return false;
}

/** Takes `?session=` out of the address bar, so reload or copy-paste does not reuse it. */
function removeSessionFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(SESSION_KEY)) {
    return;
  }
  url.searchParams.delete(SESSION_KEY);
  // null state: Next.js patches replaceState, keeps its own state and
  // updates useSearchParams.
  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

function showNotice(icon: "success" | "error", title: string) {
  // Phones get the app's own toast: the fixed mobile header sits above
  // SweetAlert's toast.
  if (isMobileViewport()) {
    toast[icon](title);
    return;
  }
  void Swal.fire({
    toast: true,
    position: "top",
    icon,
    title,
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
  });
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
    return {
      ok: false,
      definitive: false,
      message: "伺服器暫時無法回應，請稍後再試",
    };
  }
  const definitive =
    result.kind === "unauthorized" ||
    (result.status !== null &&
      DEFINITIVE_LOGIN_FAILURES.includes(result.status));
  return { ok: false, definitive, message: result.message };
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
  // A `?session=` link that is still being resolved or confirmed.
  const pendingLink = useRef<string | null>(null);
  const linkRead = useRef(false);
  // Bumped when a link is dropped, so the normal login decision runs.
  const [linkDropped, setLinkDropped] = useState(0);

  const commit = useCallback((next: AuthState) => {
    stateRef.current = next;
    setState(next);
    // The profile says whether a mute or ban is in force (contract v4
    // §5.1). Signing out keeps a ban on show: the banner says why.
    if (next.user) {
      reportSuspension(next.user.suspension ?? null);
    }
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
    return { ok: false, definitive: true, message: "" };
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

  // A request refused with 4041 (modules/api/client reports it). A ban
  // refuses every request with a token, so the site carries on as for a
  // logged-out visitor, with the banner saying why; the Google session is
  // kept, so the next visit tries again and logs in once it is lifted. A
  // mute goes into the profile, so later profile updates keep it.
  useEffect(
    () =>
      subscribeSuspension(() => {
        const suspension = getReportedSuspension();
        const { token, user } = stateRef.current;
        if (!suspension || !token) {
          return;
        }
        if (suspension.type === "ban") {
          generation.current++;
          clearAccount();
          return;
        }
        const saved = user?.suspension;
        if (
          user &&
          (saved?.type !== suspension.type ||
            saved.until !== suspension.until ||
            saved.reason !== suspension.reason)
        ) {
          const next = { ...user, suspension };
          storageSet(USER_KEY, JSON.stringify(next));
          commit({ ...stateRef.current, user: next });
        }
      }),
    [clearAccount, commit],
  );

  useEffect(() => {
    registerAuthHandlers({
      getToken: () => stateRef.current.token,
      refreshToken,
    });
    return () => registerAuthHandlers(null);
  }, [refreshToken]);

  /** The account signed in right now, if any (token, and profile if known). */
  const signedInAccount = useCallback(() => {
    const token = stateRef.current.token ?? storageGet(TOKEN_KEY);
    if (!token) {
      return null;
    }
    return { user: stateRef.current.user ?? storageGetJSON<User>(USER_KEY) };
  }, []);

  // The school app signs users in with /?session=…. Resolve the link to
  // its account first; only then decide, against whoever is signed in.
  useEffect(() => {
    if (linkRead.current) {
      return;
    }
    linkRead.current = true;
    const fromUrl = new URLSearchParams(window.location.search).get(
      SESSION_KEY,
    );
    if (!fromUrl) {
      return;
    }
    // After this effect: Next.js patches history in its own mount effect.
    window.setTimeout(removeSessionFromUrl, 0);
    if (fromUrl === getSchoolSession()) {
      // The login we already use; nothing new to decide.
      return;
    }
    pendingLink.current = fromUrl;

    const adopt = (token: string, user: User) => {
      // Drops in-flight decisions about the previous account.
      generation.current++;
      pendingLink.current = null;
      memorySession.current = fromUrl;
      storageSet(SESSION_KEY, fromUrl);
      lastInputs.current = `session:${fromUrl}`;
      saveAccount(token, user);
    };

    const drop = () => {
      pendingLink.current = null;
      setLinkDropped((n) => n + 1);
    };

    (async () => {
      const result = await platformLogin({ session: fromUrl });
      if (pendingLink.current !== fromUrl) {
        return;
      }
      if (!result.ok) {
        drop();
        showNotice(
          "error",
          result.definitive
            ? "登入連結無效或已過期"
            : `無法使用登入連結：${result.message}`,
        );
        return;
      }

      const current = signedInAccount();
      if (!current) {
        // Nobody to replace, but whoever opened the link must notice
        // whose account they are now using.
        adopt(result.token, result.user);
        showNotice("success", `已登入：${describeUser(result.user)}`);
        return;
      }
      if (current.user && isSameUser(current.user, result.user)) {
        adopt(result.token, result.user);
        return;
      }

      const currentName =
        current.user?.name || current.user?.email || "目前的帳號";
      const choice = await Swal.fire({
        icon: "warning",
        text: `要切換成 ${describeUser(result.user)}登入嗎？目前登入的是 ${currentName}。`,
        showCancelButton: true,
        confirmButtonText: "切換",
        cancelButtonText: "取消",
        confirmButtonColor: "#0b5a83",
        focusCancel: true,
      });
      if (pendingLink.current !== fromUrl) {
        return;
      }
      if (choice.isConfirmed) {
        adopt(result.token, result.user);
        return;
      }
      drop();
    })();
  }, [getSchoolSession, saveAccount, signedInAccount]);

  useEffect(() => {
    if (pendingLink.current && !signedInAccount()) {
      // Nobody is signed in, so the link decides; stay loading meanwhile.
      return;
    }
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
        if (!me.ok && me.kind === "suspended") {
          // A ban: already signed out by the suspension listener above.
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
    linkDropped,
    getSchoolSession,
    signedInAccount,
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
    const token = stateRef.current.token;
    generation.current++;
    pendingLink.current = null;
    // A shared computer must not keep receiving this account's pushes.
    if (token) {
      void disablePush(token);
    }
    dropSchoolSession();
    clearAccount();
    reportSuspension(null);
    signOut();
  }, [dropSchoolSession, clearAccount]);

  const updateUser = useCallback(
    (patch: Partial<User> | ((user: User) => User)) => {
      const current = stateRef.current;
      if (!current.user) {
        return;
      }
      const user =
        typeof patch === "function"
          ? patch(current.user)
          : { ...current.user, ...patch };
      storageSet(USER_KEY, JSON.stringify(user));
      commit({ ...current, user });
    },
    [commit],
  );

  const value = useMemo<UserAccount>(
    () => ({
      isLogin: state.status === "authenticated" && Boolean(state.token),
      token: state.token,
      userData: state.user,
      isLoading: state.status === "loading",
      login,
      logout,
      updateUser,
    }),
    [state, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
