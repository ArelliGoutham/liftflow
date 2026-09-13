import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import type { Session } from 'next-auth';
import { findUserByEmail, createUser } from '@/lib/db/repositories/userRepository';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return false;

      try {
        const email = user.email ?? '';
        const existingUser = await findUserByEmail(email);

        if (!existingUser) {
          await createUser({
            authProviderId: account.providerAccountId,
            name: user.name?.trim() || 'User',
            email: email.toLowerCase().trim(),
            image: user.image ?? undefined,
          });
        }

        return true;
      } catch {
        return false;
      }
    },
    async session({ session }): Promise<Session> {
      if (session.user?.email) {
        const dbUser = await findUserByEmail(session.user.email);
        if (dbUser) {
          session.user.id = dbUser._id.toString();
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET!,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
