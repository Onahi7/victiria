import NextAuth, { NextAuthOptions } from "next-auth"
import { getServerSession } from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { users } from "@/lib/db/schema"
import { db } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1)

        if (!user.length) {
          return null
        }

        const userData = user[0]
        
        // Check password
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          userData.password || ""
        )

        if (!passwordMatch) {
          return null
        }

        return {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || ""
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

// Helper function to get server session
export const getAuthSession = () => getServerSession(authOptions)

// Export auth for compatibility
export const auth = () => getServerSession(authOptions)

// For compatibility with route handlers
export const handlers = { GET: handler, POST: handler }
