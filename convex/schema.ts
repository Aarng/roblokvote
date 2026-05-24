import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
    .index("by_category", ["category"]),

  // Sesiones de votación completadas
  votingSessions: defineTable({
    voterName: v.string(),
    totalVoted: v.number(),
    totalYes: v.number(),
    completedAt: v.number(),
  })
    .index("by_voter", ["voterName"]),
});
