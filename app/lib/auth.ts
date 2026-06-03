import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z.object({ email: z.string().email(), password: z.string() }).safeParse(credentials)
        if (!parsed.success) return null
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
        if (!user?.password) return null
        const ok = await bcrypt.compare(parsed.data.password, user.password)
        if (!ok) return null
        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role: string }).role
      return token
    },
    session({ session, token }) {
      if (session.user) (session.user as { role?: string }).role = token.role as string
      return session
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl
    },
  },
  pages: { signIn: "/login" },
})
