import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { User } from "@/interfaces/User";
import { sendLoginWebhook } from "@/modules/loginWebhook";

/** Looks the user up on the platform for the login notice; null on failure. */
async function fetchPlatformUser(accessToken: string): Promise<User | null> {
  try {
    const body = new URLSearchParams();
    body.append("googleToken", accessToken);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10000),
    });
    const json = await response.json();
    return json?.status === 2000 && json.data ? (json.data as User) : null;
  } catch {
    return null;
  }
}

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET as string,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!profile?.email?.endsWith("@ms.mingdao.edu.tw")) {
        return "/?error=not_md";
      }
      if (account?.access_token) {
        // The notice is best effort: a slow or failing backend or Discord
        // must never block the sign-in itself.
        const user = await fetchPlatformUser(account.access_token);
        if (user) {
          void sendLoginWebhook(user);
        }
      }

      return true;
    },
    async jwt({ token, account }) {
      const _token = token;
      if (account) {
        _token.accessToken = account?.access_token;
      }

      return _token;
    },
    async session({ session, token }) {
      const _session = session as unknown as Record<string, unknown>;
      _session.accessToken = (
        token as unknown as Record<string, unknown>
      ).accessToken;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
