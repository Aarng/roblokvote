import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Tabla de personajes con imágenes
  characters: defineTable({
    name: v.string(),
    category: v.string(), // 'MELEE', 'ESPADA', 'MAGIA'
    emoji: v.string(),
    anime: v.string(),
    image: v.string(), // URL de la imagen
    title: v.string(),
    order: v.number(), // Para mantener el orden de aparición
  })
    .index("by_category", ["category"])
    .index("by_order", ["order"]),

  // Votos individuales de cada personaje
  votes: defineTable({
    voterName: v.string(),
    characterName: v.string(),
    category: v.string(),
    vote: v.string(), // 'SI' o 'NO'
    anime: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_voter", ["voterName"])
    .index("by_character", ["characterName"])
    .index("by_category", ["category"])
    .index("by_voter_character", ["voterName", "characterName"]),

  // Sesiones de votación completadas
  votingSessions: defineTable({
    voterName: v.string(),
    totalVoted: v.number(),
    totalYes: v.number(),
    completedAt: v.number(),
  })
    .index("by_voter", ["voterName"]),
});
