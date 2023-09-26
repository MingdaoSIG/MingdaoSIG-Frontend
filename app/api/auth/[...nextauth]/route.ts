import axios from "axios";
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
    async signIn({ profile }) {
      const response: any = await axios.post(`${process.env.API_URL}/login`, {
        email: profile?.email,
        avatar: profile?.picture,
      });

      console.log(response?.headers.authorization);
      return true;
    },
  },
});

export { handler as GET, handler as POST };
