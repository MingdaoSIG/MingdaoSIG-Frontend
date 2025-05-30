import NextAuth from "next-auth";
import axios from "axios";
import GoogleProvider from "next-auth/providers/google";
import { profile } from "console";
import Swal from "sweetalert2";

const emoji: { [key: string]: string } = {
  developer: "<:developer:1222933983164235876>",
  "10.21_user": "<:1021user:1222933998913851442>",
  bug_hunter: "<:bughunter:1245079303000031282>",
};

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET!,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!profile?.email?.endsWith("@ms.mingdao.edu.tw"))
        return "/?error=not_md";
      if (account) {
        const urlencoded = new URLSearchParams();
        urlencoded.append("googleToken", String(account.access_token));

        const response = await (
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: urlencoded,
          })
        ).json();

        if (response.status === 2000) {
          let badgeData: string = "";
          const data = new FormData();
          const badges = Array<String>(String(response.data.badge));

          data.append("name", response.data.name);
          data.append("id", response.data._id);
          data.append("customId", response.data.customId);
          data.append("description", response.data.description);
          data.append("avatar", response.data.avatar);
          data.append("identity", response.data.identity);
          data.append("email", response.data.email);
          data.append("code", response.data.code);
          data.append("class", response.data.class || "No Class");

          if (response.data.badge.length > 0) {
            badges[0]?.split(",").forEach((badge: string) => {
              badgeData += emoji[badge];
              badgeData += " ";
            });
          }

          data.append("badge", badgeData !== "" ? badgeData : "No Badge");

          fetch(`${process.env.NEXTAUTH_URL}/api/webhook/login`, {
            method: "POST",
            body: data,
          });
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
      const _session: any = session;
      const _token: any = token;
      _session.accessToken = _token.accessToken;
      return _session;
    },
  },
});

export { handler as GET, handler as POST };
