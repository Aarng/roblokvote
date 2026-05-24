import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Guardar un voto individual
export const saveVote = mutation({
  args: {
    voterName: v.string(),
    characterName: v.string(),
    category: v.string(),
    vote: v.string(),
    anime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("votes", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Guardar sesión completada
export const completeSession = mutation({
  args: {
    voterName: v.string(),
    totalVoted: v.number(),
    totalYes: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("votingSessions", {
      ...args,
      completedAt: Date.now(),
    });
  },
});

// Obtener resultados globales
export const getGlobalResults = query({
  handler: async (ctx) => {
    const allVotes = await ctx.db.query("votes").collect();

    // Agrupar por categoría
    const byCategory: Record<string, { total: number; yes: number; characters: Record<string, { yes: number; no: number }> }> = {};

    for (const vote of allVotes) {
      if (!byCategory[vote.category]) {
        byCategory[vote.category] = { total: 0, yes: 0, characters: {} };
      }

      byCategory[vote.category].total++;
      if (vote.vote === "SI") {
        byCategory[vote.category].yes++;
      }

      if (!byCategory[vote.category].characters[vote.characterName]) {
        byCategory[vote.category].characters[vote.characterName] = { yes: 0, no: 0 };
      }

      if (vote.vote === "SI") {
        byCategory[vote.category].characters[vote.characterName].yes++;
      } else {
        byCategory[vote.category].characters[vote.characterName].no++;
      }
    }

    return byCategory;
  },
});

// Obtener resultados por votante
export const getResultsByVoter = query({
  args: { voterName: v.string() },
  handler: async (ctx, { voterName }) => {
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_voter", (q) => q.eq("voterName", voterName))
      .collect();

    return votes;
  },
});

// Obtener todos los votantes únicos
export const getAllVoters = query({
  handler: async (ctx) => {
    const sessions = await ctx.db.query("votingSessions").collect();
    return sessions.map(s => ({
      name: s.voterName,
      completedAt: s.completedAt,
      totalYes: s.totalYes,
    }));
  },
});

// Borrar votos de un votante (para admin)
export const deleteVoterResults = mutation({
  args: { voterName: v.string() },
  handler: async (ctx, { voterName }) => {
    // Borrar votos
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_voter", (q) => q.eq("voterName", voterName))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Borrar sesión
    const sessions = await ctx.db
      .query("votingSessions")
      .withIndex("by_voter", (q) => q.eq("voterName", voterName))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
  },
});
