import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { v7 as uuid } from "uuid";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5000";

export const auth = betterAuth({
  baseURL: baseUrl,
  trustedOrigins: [baseUrl, "https://5000.refind.id"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
    transaction: true,
  }),
  advanced: {
    database: {
      generateId(options) {
        return uuid();
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
