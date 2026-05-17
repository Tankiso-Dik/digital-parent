import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import type { Value } from "convex/values";
import { v } from "convex/values";
import { query } from "./_generated/server";

function normalizeUsername(username: string) {
  const normalized = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
    throw new Error("Invalid username");
  }
  return normalized;
}

function usernameToAuthEmail(username: string) {
  return `${normalizeUsername(username)}@digital-parent.local`;
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params: Record<string, Value | undefined>) {
        const username = normalizeUsername(String(params.username ?? ""));

        return {
          email: usernameToAuthEmail(username),
          name: username,
        };
      },
      validatePasswordRequirements(password: string) {
        if (password.length < 8 || password.length > 100) {
          throw new Error("Invalid password");
        }
      },
    }),
  ],
});

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = await getAuthUserId(ctx);

    return { identity, userId };
  },
});

export const checkUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    let email: string;
    try {
      email = usernameToAuthEmail(args.username);
    } catch {
      return { data: { available: false } };
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();

    return { data: { available: existing === null } };
  },
});
