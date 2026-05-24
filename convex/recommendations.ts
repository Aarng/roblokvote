import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Guardar una recomendación
export const saveRecommendation = mutation({
  args: {
    characterName: v.string(),
    anime: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("recommendations", {
      ...args,
      timestamp: Date.now(),
    });
    return { success: true, id };
  },
});

// Obtener todas las recomendaciones (para admin)
export const getAllRecommendations = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("recommendations").collect();
    return all;
  },
});

// Obtener recomendaciones agrupadas por personaje con conteos (para ranking público)
export const getRecommendationsRanking = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("recommendations").collect();

    // Agrupar por personaje
    const grouped: Record<string, {
      characterName: string;
      anime: string;
      category: string;
      count: number;
      descriptions: string[];
    }> = {};

    for (const rec of all) {
      const key = `${rec.characterName}|${rec.anime}`;
      if (!grouped[key]) {
        grouped[key] = {
          characterName: rec.characterName,
          anime: rec.anime,
          category: rec.category,
          count: 0,
          descriptions: [],
        };
      }
      grouped[key].count++;
      if (rec.description) {
        grouped[key].descriptions.push(rec.description);
      }
    }

    // Convertir a array y ordenar por cantidad
    const sorted = Object.values(grouped).sort((a, b) => b.count - a.count);

    // Calcular porcentajes
    const total = sorted.reduce((sum, item) => sum + item.count, 0);
    const withPercentage = sorted.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }));

    return withPercentage;
  },
});

// Obtener estadísticas de recomendaciones
export const getRecommendationStats = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("recommendations").collect();

    const totalRecommendations = all.length;
    const uniqueUsers = new Set(all.map(r => r.userName)).size;

    // Contar por categoría
    const byCategory: Record<string, number> = {};
    for (const rec of all) {
      byCategory[rec.category] = (byCategory[rec.category] || 0) + 1;
    }

    return {
      totalRecommendations,
      uniqueUsers,
      byCategory,
    };
  },
});

// Eliminar todas las recomendaciones (para admin si es necesario)
export const clearAllRecommendations = mutation({
  handler: async (ctx) => {
    const all = await ctx.db.query("recommendations").collect();
    for (const rec of all) {
      await ctx.db.delete(rec._id);
    }
    return { success: true, deleted: all.length };
  },
});
