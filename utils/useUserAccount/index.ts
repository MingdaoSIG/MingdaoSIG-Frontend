import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import type { User } from "@/interfaces/User";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useUserAccount() {
  const { data: session, status: OAuth } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sessionLocalStorage = localStorage.getItem("session");

      // 優先使用 session 登入
      if (sessionLocalStorage) {
        try {
          const { token, data } = await platformLoginWithSession(
            sessionLocalStorage
          );
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(data));
          setToken(token);
          setUserData(data);
          setIsLogin(true);
          setIsLoading(false);
          return; // 成功登入後直接返回，不再檢查 OAuth
        } catch (error) {
          console.error("Session login failed:", error);
          // session 失效，清除 session 但不立即登出
          localStorage.removeItem("session");
          // 繼續檢查 OAuth
        }
      }

      // 如果 OAuth 正在載入，等待
      if (OAuth === "loading") {
        setIsLoading(true);
        return;
      }

      // OAuth 登入成功
      if (OAuth === "authenticated") {
        try {
          const accessToken = (session as any)?.accessToken;
          const { token, data } = await platformLogin(accessToken);
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(data));
          setToken(token);
          setUserData(data);
          setIsLogin(true);
          setIsLoading(false);
        } catch (error) {
          console.error("OAuth login failed:", error);
          setIsLogin(false);
          setIsLoading(false);
          signOut();
        }
        return;
      }

      // ✅ 修復：只有在沒有 session 且 OAuth 未認證時才登出
      // 而且不要在每次 OAuth 狀態變化時都重置狀態
      if (!sessionLocalStorage && OAuth === "unauthenticated") {
        // 只有在真正需要登出時才設置
        if (isLogin) {
          setIsLogin(false);
        }
        setIsLoading(false);
      }
    })();
  }, [OAuth, session]); // ⚠️ 移除 isLogin 依賴避免循環

  // ✅ 修復：更安全的清除邏輯
  useEffect(() => {
    if (!isLogin && !isLoading) {
      // 只在確定登出時才清除
      const sessionExists = localStorage.getItem("session");
      if (!sessionExists) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUserData(null);
      }
    }
  }, [isLogin, isLoading]);

  const login = useCallback(() => {
    signIn("google");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("session");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUserData(null);
    setIsLogin(false);
    signOut();
  }, []);

  return { isLogin, token, userData, isLoading, login, logout };
}

async function platformLogin(accessToken: string) {
  try {
    const urlencoded = new URLSearchParams();
    urlencoded.append("googleToken", accessToken);
    const response = await (
      await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlencoded,
      })
    ).json();

    if (response.status !== 2000)
      throw new Error("Failed to login to platform");

    return {
      token: response.authorization.toString().split(" ")[1],
      data: response.data,
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

async function platformLoginWithSession(session: string) {
  try {
    const urlencoded = new URLSearchParams();
    urlencoded.append("session", session);
    const response = await (
      await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlencoded,
      })
    ).json();

    if (response.status !== 2000)
      throw new Error("Failed to login to platform");

    return {
      token: response.authorization.toString().split(" ")[1],
      data: response.data,
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
}
