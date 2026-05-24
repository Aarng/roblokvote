import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Obtener todos los personajes ordenados
export const getAllCharacters = query({
  handler: async (ctx) => {
    const characters = await ctx.db
      .query("characters")
      .withIndex("by_order")
      .collect();
    return characters;
  },
});

// Obtener personajes por categoría
export const getCharactersByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    const characters = await ctx.db
      .query("characters")
      .withIndex("by_category", (q) => q.eq("category", category))
      .collect();
    return characters.sort((a, b) => a.order - b.order);
  },
});

// Obtener un personaje específico
export const getCharacter = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const character = await ctx.db
      .query("characters")
      .filter((q) => q.eq(q.field("name"), name))
      .first();
    return character;
  },
});

// Insertar un personaje (para migración inicial)
export const insertCharacter = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    emoji: v.string(),
    anime: v.string(),
    image: v.string(),
    title: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    // Verificar si ya existe
    const existing = await ctx.db
      .query("characters")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      // Actualizar
      await ctx.db.patch(existing._id, args);
      return { updated: true, id: existing._id };
    } else {
      // Crear nuevo
      const id = await ctx.db.insert("characters", args);
      return { created: true, id };
    }
  },
});

// Borrar todos los personajes (cuidado!)
export const clearAllCharacters = mutation({
  handler: async (ctx) => {
    const characters = await ctx.db.query("characters").collect();
    for (const char of characters) {
      await ctx.db.delete(char._id);
    }
    return { deleted: characters.length };
  },
});

// Obtener conteo de personajes
export const getCharacterCount = query({
  handler: async (ctx) => {
    const characters = await ctx.db.query("characters").collect();
    return {
      total: characters.length,
      byCategory: {
        MELEE: characters.filter((c) => c.category === "MELEE").length,
        ESPADA: characters.filter((c) => c.category === "ESPADA").length,
        MAGIA: characters.filter((c) => c.category === "MAGIA").length,
      },
    };
  },
});
