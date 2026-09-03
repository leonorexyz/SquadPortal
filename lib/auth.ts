import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const betterAuthUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

if (!betterAuthSecret && process.env.NODE_ENV === "production" && !isProductionBuild) {
  throw new Error("BETTER_AUTH_SECRET must be configured in production.");
}

export const googleAuthConfigured = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  baseURL: betterAuthUrl,
  secret: betterAuthSecret ?? "squad-portal-local-development-secret",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
    usePlural: true,
  }),
  account: {
    accountLinking: {
      enabled: true,
      // Workspace admins pre-provision members before their first Google login.
      // Google verifies ownership of the matching email during OAuth.
      trustedProviders: ["google"],
      requireLocalEmailVerified: false,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      // The local mock flow acknowledges reset requests without exposing reset tokens.
      if (process.env.NODE_ENV === "production") throw new Error("Password reset email delivery is not configured.");
      void user;
      void url;
    },
  },
  socialProviders: googleAuthConfigured
    ? {
        google: {
          clientId: googleClientId as string,
          clientSecret: googleClientSecret as string,
          prompt: "select_account",
        },
      }
    : undefined,
});
