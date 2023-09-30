import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET!,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn() {
      // async signIn({ account }) {
      // console.log(account);
      // const _account: any = account;
      // console.log(_account?.access_token);
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
      //console.log(_session);
      return _session;
    },
  },
});

export { handler as GET, handler as POST };
