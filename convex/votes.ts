import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Guardar un voto individual (upsert - evita duplicados)
export const saveVote = mutation({
  args: {
    voterName: v.string(),
    characterName: v.string(),
    category: v.string(),
    vote: v.string(),
    anime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Buscar si ya existe un voto para este votante + personaje
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_voter_character", (q) =>
        q.eq("voterName", args.voterName).eq("characterName", args.characterName)
      )
      .first();

    if (existing) {
      // Actualizar voto existente
      await ctx.db.patch(existing._id, {
        vote: args.vote,
        timestamp: Date.now(),
      });
      return { updated: true, id: existing._id };
    } else {
      // Crear nuevo voto (sessionCompleted: false = pendiente)
      const id = await ctx.db.insert("votes", {
        ...args,
        timestamp: Date.now(),
        sessionCompleted: false,
      });
      return { created: true, id };
    }
  },
});

// Guardar sesión completada y marcar todos los votos del votante como completados
export const completeSession = mutation({
  args: {
    voterName: v.string(),
    totalVoted: v.number(),
    totalYes: v.number(),
  },
  handler: async (ctx, args) => {
    // Guardar la sesión completada
    await ctx.db.insert("votingSessions", {
      ...args,
      completedAt: Date.now(),
    });

    // Marcar todos los votos de este votante como completados
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_voter", (q) => q.eq("voterName", args.voterName))
      .collect();

    for (const vote of votes) {
      await ctx.db.patch(vote._id, {
        sessionCompleted: true,
      });
    }

    return { success: true, votesMarked: votes.length };
  },
});

// Obtener resultados globales (TODOS los votos, incluyendo incompletos)
export const getGlobalResults = query({
  handler: async (ctx) => {
    const allVotes = await ctx.db.query("votes").collect();

    // Agrupar por categoría
    const byCategory: Record<string, { total: number; yes: number; characters: Record<string, { yes: number; no: number }> }> = {};

    for (const vote of allVotes) {
      // Contar TODOS los votos (completos e incompletos)
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

// Obtener todos los votantes con su progreso (incluyendo incompletos) - para admin
export const getAllVotersWithProgress = query({
  handler: async (ctx) => {
    const allVotes = await ctx.db.query("votes").collect();
    const sessions = await ctx.db.query("votingSessions").collect();
    const totalCharacters = 123; // Total de personajes para votar

    // Agrupar votos por votante
    const voterVotes: Record<string, {
      name: string;
      votesCount: number;
      yesCount: number;
      isComplete: boolean;
      completedAt?: number;
    }> = {};

    for (const vote of allVotes) {
      if (!voterVotes[vote.voterName]) {
        voterVotes[vote.voterName] = {
          name: vote.voterName,
          votesCount: 0,
          yesCount: 0,
          isComplete: false,
        };
      }
      voterVotes[vote.voterName].votesCount++;
      if (vote.vote === "SI") {
        voterVotes[vote.voterName].yesCount++;
      }
    }

    // Marcar completados
    for (const session of sessions) {
      if (voterVotes[session.voterName]) {
        voterVotes[session.voterName].isComplete = true;
        voterVotes[session.voterName].completedAt = session.completedAt;
      }
    }

    // Convertir a array y calcular porcentajes
    const voters = Object.values(voterVotes).map(v => ({
      name: v.name,
      votesCount: v.votesCount,
      yesCount: v.yesCount,
      progressPercent: Math.round((v.votesCount / totalCharacters) * 100),
      isComplete: v.isComplete,
      completedAt: v.completedAt,
    }));

    // Ordenar: primero completados, luego por porcentaje descendente
    return voters.sort((a, b) => {
      if (a.isComplete !== b.isComplete) return a.isComplete ? -1 : 1;
      return b.progressPercent - a.progressPercent;
    });
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

// Obtener todos los votos (para migración/admin)
export const getAllVotes = query({
  handler: async (ctx) => {
    const allVotes = await ctx.db.query("votes").collect();
    return allVotes;
  },
});

// Marcar votos de un votante como completados (para migración/admin)
export const markVoterAsComplete = mutation({
  args: { voterName: v.string() },
  handler: async (ctx, { voterName }) => {
    // Marcar todos los votos de este votante como completados
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_voter", (q) => q.eq("voterName", voterName))
      .collect();

    let marked = 0;
    for (const vote of votes) {
      if (vote.sessionCompleted !== true) {
        await ctx.db.patch(vote._id, {
          sessionCompleted: true,
        });
        marked++;
      }
    }

    return { success: true, marked };
  },
});

// Obtener personajes más votados (recomendaciones)
export const getTopCharacters = query({
  handler: async (ctx) => {
    const allVotes = await ctx.db.query("votes").collect();

    // Contar votos SI por personaje
    const characterVotes: Record<string, {
      name: string;
      category: string;
      anime: string;
      yes: number;
      no: number;
      total: number;
    }> = {};

    for (const vote of allVotes) {
      if (!characterVotes[vote.characterName]) {
        characterVotes[vote.characterName] = {
          name: vote.characterName,
          category: vote.category,
          anime: vote.anime || '',
          yes: 0,
          no: 0,
          total: 0,
        };
      }

      characterVotes[vote.characterName].total++;
      if (vote.vote === "SI") {
        characterVotes[vote.characterName].yes++;
      } else {
        characterVotes[vote.characterName].no++;
      }
    }

    // Convertir a array y ordenar por votos SI
    const sorted = Object.values(characterVotes).sort((a, b) => b.yes - a.yes);

    return sorted;
  },
});
