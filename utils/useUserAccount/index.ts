import { useContext } from "react";
import { AuthContext, type UserAccount } from "./AuthProvider";

/**
 * The signed-in platform account. State lives in <AuthProvider>, mounted
 * once in app/providers.tsx, so calling this from many components does not
 * log in again.
 */
export function useUserAccount(): UserAccount {
  const account = useContext(AuthContext);
  if (!account) {
    throw new Error("useUserAccount must be used inside <AuthProvider>");
  }
  return account;
}
