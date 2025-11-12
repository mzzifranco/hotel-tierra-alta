import { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';
import { Role } from '@prisma/client';

interface ExtendedUser extends NextAuthUser {
  role: Role;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        // Verificar si el usuario está activo
        if (!user.active) {
          throw new Error('Esta cuenta ha sido desactivada. Contacta al administrador.');
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        } as ExtendedUser;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const extendedUser = user as ExtendedUser;
        token.id = extendedUser.id;
        token.email = extendedUser.email;
        token.name = extendedUser.name;
        token.role = extendedUser.role;
      }
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          name: token.name as string | null,
          role: token.role as Role,
        },
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helpers
export function isStaff(role: Role): boolean {
  return role === 'OPERATOR' || role === 'ADMIN';
}

export function isAdmin(role: Role): boolean {
  return role === 'ADMIN';
}