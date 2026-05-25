import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Obtener sesión por votante
export const getSessionByVoter = query({
  args: { voterName: v.string() },
  handler: async (ctx, { voterName }) => {
    const session = await ctx.db
      .query("votingSessions")
      .withIndex("by_voter", (q) => q.eq("voterName", voterName))
      .first();
    return session;
  },
});

// Guardar sesión (para migración)
export const saveSession = mutation({
  args: {
    voterName: v.string(),
    currentIndex: v.number(),
    sessionData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Buscar si ya existe
    const existing = await ctx.db
      .query("votingSessions")
      .withIndex("by_voter", (q) => q.eq("voterName", args.voterName))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        currentIndex: args.currentIndex,
        sessionData: args.sessionData,
        lastUpdated: Date.now(),
      });
      return { updated: true };
    } else {
      const id = await ctx.db.insert("votingSessions", {
        voterName: args.voterName,
        currentIndex: args.currentIndex,
        sessionData: args.sessionData,
        lastUpdated: Date.now(),
      });
      return { created: true, id };
    }
  },
});

// Obtener todas las sesiones (para migración)
export const getAllSessions = query({
  handler: async (ctx) => {
    const sessions = await ctx.db.query("votingSessions").collect();
    return sessions;
  },
});

// Crear sesión completada (para migración)
export const createCompletedSession = mutation({
  args: {
    voterName: v.string(),
    totalVoted: v.number(),
    totalYes: v.number(),
    completedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("votingSessions", {
      voterName: args.voterName,
      totalVoted: args.totalVoted,
      totalYes: args.totalYes,
      completedAt: args.completedAt,
    });
    return { success: true, id };
  },
});

// Borrar sesión por votante
export const deleteSessionByVoter = mutation({
  args: { voterName: v.string() },
  handler: async (ctx, { voterName }) => {
    const sessions = await ctx.db
      .query("votingSessions")
      .withIndex("by_voter", (q) => q.eq("voterName", voterName))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
    return { deleted: sessions.length };
  },
});
