import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/src/lib/db";
import { operatori, autoscuole } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const [row] = await db
          .select({
            id: operatori.id,
            email: operatori.email,
            nome: operatori.nome,
            cognome: operatori.cognome,
            passwordHash: operatori.passwordHash,
            ruolo: operatori.ruolo,
            attivo: operatori.attivo,
            autoscuolaId: operatori.autoscuolaId,
            autoscuolaNome: autoscuole.nome,
          })
          .from(operatori)
          .innerJoin(autoscuole, eq(operatori.autoscuolaId, autoscuole.id))
          .where(eq(operatori.email, email))
          .limit(1);

        if (!row || !row.attivo) return null;

        const valid = await bcrypt.compare(password, row.passwordHash);
        if (!valid) return null;

        // Update last access
        await db
          .update(operatori)
          .set({ ultimoAccesso: new Date() })
          .where(eq(operatori.id, row.id));

        return {
          id: row.id,
          email: row.email,
          name: `${row.nome} ${row.cognome}`,
          autoscuolaId: row.autoscuolaId,
          autoscuolaNome: row.autoscuolaNome ?? "",
          ruolo: row.ruolo,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.autoscuolaId = (user as { autoscuolaId: string }).autoscuolaId;
        token.autoscuolaNome = (user as { autoscuolaNome: string }).autoscuolaNome;
        token.ruolo = (user as { ruolo: string }).ruolo;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.autoscuolaId = token.autoscuolaId as string;
      session.user.autoscuolaNome = token.autoscuolaNome as string;
      session.user.ruolo = token.ruolo as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
});

// Extend next-auth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      autoscuolaId: string;
      autoscuolaNome: string;
      ruolo: string;
    };
  }
}
