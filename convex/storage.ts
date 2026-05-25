import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generar URL para subir archivo a storage
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Guardar referencia de archivo subido y actualizar personaje
export const saveFile = mutation({
  args: {
    storageId: v.string(),
    characterName: v.string(),
    contentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Buscar personaje por nombre
    const character = await ctx.db
      .query("characters")
      .withIndex("by_name", (q) => q.eq("name", args.characterName))
      .first();

    if (!character) {
      throw new Error(Personaje no encontrado: );
    }

    // Generar URL publica
    const url = await ctx.storage.getUrl(args.storageId);

    await ctx.db.patch(character._id, {
      image: url,
      storageId: args.storageId,
    });

    return { success: true, url, characterName: args.characterName };
  },
});

// Obtener URL de storage por ID
export const getStorageUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
