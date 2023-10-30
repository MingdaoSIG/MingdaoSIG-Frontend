import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

import { User } from "@/interfaces/User";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useUserAccount() {
  const { data: session, status: OAuth } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      const userLocalStorage = localStorage.getItem("User");

      if (OAuth === "loading" || !userLocalStorage) setIsLoading(true);

      if (OAuth === "authenticated") {
        try {
          const accessToken = (session as any)?.accessToken;
          const { token, data } = await platformLogin(accessToken);
          localStorage.setItem("token", token);
          localStorage.setItem("User", JSON.stringify(data));
          setUserData(data);
          setIsLogin(true);
          setIsLoading(false);
        } catch (error) {
          console.error(error);
          setIsLogin(false);
          signOut();
        }
      } else if (OAuth !== "loading") {
        setIsLogin(false);
        setIsLoading(false);
      }
    })();
  }, [OAuth, session]);

  useEffect(() => {
    if (!isLogin) {
      localStorage.removeItem("token");
      localStorage.removeItem("User");
    }
  }, [isLogin]);

  const login = useCallback(() => {
    signIn("google");
  }, []);

  const logout = useCallback(() => {
    signOut();
  }, []);

  return { isLogin, userData, isLoading, login, logout };
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

    if (response.status !== 2000) throw new Error("Failed to login to platform");

    return {
      token: response.authorization.toString().split(" ")[1],
      data: response.data,
    };
  } catch (error) {
    throw new Error("Failed to login to platform");
  }
}

// function Test() {
//   const { isLogin, userData, isLoading, login, logout } = useUserAccount();
//   return (
//     <div className="h-[100vh] w-[100vw] flex flex-col items-center justify-center">
//       <h1>{isLogin ? "logged in" : "logged out"}</h1>
//       <h1>{JSON.stringify(userData)}</h1>
//       <h1>{isLoading ? "loading" : "not loading"}</h1>
//       <button
//         onClick={() => login()}
//       >
//         login
//       </button>
//       <button
//         onClick={() => logout()}
//       >
//         logout
//       </button>
//     </div>
//   );
// }