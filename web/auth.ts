import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
        try {
          const res = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          if (!res.ok) return null;
          const user = await res.json();
          // Return object that NextAuth stores in the JWT
          return {
            id: user.id,
            email: user.email,
            name: user.name ?? null,
            image: user.avatar_url ?? null,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user, trigger, session }) {
      // Refresh name after profile update (update() call from client)
      if (trigger === "update" && session?.name !== undefined) {
        token.name = session.name;
      }
      if (account) {
        if (account.provider === "google") {
          // First Google sign-in: upsert user in FastAPI DB
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
            const res = await fetch(`${apiUrl}/users/upsert`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                google_id: account.providerAccountId,
                email: token.email,
                name: token.name,
                avatar_url: token.picture,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              token.userId = data.id;
            }
          } catch {
            // auth still succeeds even if DB call fails
          }
        } else if (account.provider === "credentials") {
          // The FastAPI UUID is returned directly from authorize()
          token.userId = user?.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
