import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";

// Generar URL para subir una imagen al storage
export const generateUploadUrl = action({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Obtener URL de una imagen subida
export const getImageUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, { storageId }) => {
    const url = await ctx.storage.getUrl(storageId);
    return url;
  },
});

// Guardar referencia de imagen en la base de datos
export const saveImageReference = mutation({
  args: {
    characterName: v.string(),
    storageId: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    // Buscar el personaje
    const character = await ctx.db
      .query("characters")
      .filter((q) => q.eq(q.field("name"), args.characterName))
      .first();

    if (character) {
      // Actualizar con la URL de la imagen
      await ctx.db.patch(character._id, {
        image: args.url,
      });
      return { updated: true };
    }
    return { updated: false };
  },
});

// Listar todas las imágenes en storage
export const listImages = query({
  handler: async (ctx) => {
    // Esta función requiere el paquete @convex-dev/storage
    // Por ahora retornamos un array vacío
    return [];
  },
});
