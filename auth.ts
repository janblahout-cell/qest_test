import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow @qest.cz email addresses
      const email = user.email || profile?.email
      if (!email?.endsWith("@qest.cz")) {
        return false
      }

      // Save user and tokens to users + oauth tables
      if (account?.provider === "google" && email) {
        try {
          console.log("Saving user and tokens for:", email)

          // Upsert user
          const dbUser = await prisma.users.upsert({
            where: { email: email },
            update: {},
            create: { email: email },
          })

          // Upsert oauth with calendar consent
          await prisma.oauth.upsert({
            where: { user_id: dbUser.id },
            update: {
              key: dbUser.id.toString(),
              googleAccessToken: account.access_token,
              googleRefreshToken: account.refresh_token,
              calendarConsent: true,
              consentGrantedAt: new Date(),
              updatedAt: new Date(),
            },
            create: {
              user_id: dbUser.id,
              key: dbUser.id.toString(),
              googleAccessToken: account.access_token,
              googleRefreshToken: account.refresh_token,
              calendarConsent: true,
              consentGrantedAt: new Date(),
            },
          })

          console.log("Tokens saved successfully to oauth table!")
        } catch (error) {
          console.error("Error saving tokens:", error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token?.email) {
        session.user.email = token.email as string
      }
      return session
    },
  },
  pages: {
    signIn: "/consent",
  },
})
