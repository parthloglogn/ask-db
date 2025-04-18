import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./db";
import bcrypt from "bcrypt";

export const authConfig: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user as User;
      
      // Update session in the database with correct userId and sessionToken
      if (token.sessionToken) {
        await prisma.session.upsert({
          where: {
            sessionToken: token.sessionToken as string, // Ensure the sessionToken is passed correctly
          },
          update: { 
            sessionToken: token.sessionToken as string,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Set session expiration to 30 days
          },
          create: {
            userId: BigInt(token.sub || "0"),  // Ensure userId is BigInt type
            sessionToken: token.sessionToken as string,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Set session expiration to 30 days
          }
        });
      }

      return session;
    },
    async signIn({ user, account }) {
      // Check if Google provider is used
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email as string }
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email as string,
              first_name: user.name?.split(" ")[0] || "",
              last_name: user.name?.split(" ")[1] || "",
              image: user.image || "",
              created_by: user.email as string,
              modified_by: user.email,
              is_active: true,
              login_ts: new Date(),
            },
          });
        }
      }
      return true;
    }
  },

  pages: {
    signIn: "/dashboard",  // If the user is already authenticated, they will be redirected to this page
    error: "/error"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET
};
