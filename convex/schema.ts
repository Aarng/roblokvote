import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Tabla de personajes con imágenes
  characters: defineTable({
    name: v.string(),
    category: v.string(), // 'MELEE', 'ESPADA', 'MAGIA'
    emoji: v.string(),
    anime: v.string(),
    image: v.string(), // URL de la imagen (Convex Storage o local)
    title: v.string(),
    order: v.number(), // Para mantener el orden de aparición
    storageId: v.optional(v.string()), // ID de Convex Storage
  })
    .index("by_category", ["category"])
    .index("by_order", ["order"])
    .index("by_name", ["name"]),

  // Votos individuales de cada personaje
  votes: defineTable({
    voterName: v.string(),
    characterName: v.string(),
    category: v.string(),
    vote: v.string(), // 'SI' o 'NO'
    anime: v.optional(v.string()),
    timestamp: v.number(),
    sessionCompleted: v.optional(v.boolean()), // true cuando el votante completó toda la votación
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
    robloxUser: v.optional(v.string()), // Usuario de Roblox para el sorteo
  })
    .index("by_voter", ["voterName"]),

  // Recomendaciones de personajes por usuarios
  recommendations: defineTable({
    characterName: v.string(),
    anime: v.string(),
    category: v.string(), // 'MELEE', 'ESPADA', 'MAGIA'
    description: v.optional(v.string()),
    userName: v.string(), // Quién hizo la recomendación
    timestamp: v.number(),
  })
    .index("by_character", ["characterName"])
    .index("by_user", ["userName"])
    .index("by_category", ["category"]),
});
