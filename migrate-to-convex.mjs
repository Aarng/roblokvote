#!/usr/bin/env node
/**
 * Migrar personajes e imágenes a Convex
 * Usage: node migrate-to-convex.mjs
 */
import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
if (!CONVEX_URL) {
  console.error("❌ Error: VITE_CONVEX_URL o CONVEX_URL no definido en .env.local");
  console.error("   Asegúrate de que el archivo .env.local exista y tenga VITE_CONVEX_URL=https://...");
  process.exit(1);
}

console.log(`🔗 Conectando a Convex: ${CONVEX_URL}`);
const client = new ConvexHttpClient(CONVEX_URL);

// Directorio de imágenes
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, "images");

// Importar data.js dinámicamente
const dataPath = path.join(__dirname, "data.js");
const dataModule = await import(`file://${dataPath}`);
const candidates = dataModule.candidates;

console.log(`📊 Total de personajes a migrar: ${candidates.length}\n`);

// Función para generar upload URL
async function getUploadUrl() {
  return await client.action("storage:generateUploadUrl", {});
}

// Función para subir imagen
async function uploadImage(filePath, uploadUrl) {
  const data = fs.readFileSync(filePath);
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: data,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return await res.json(); // { storageId }
}

// Función para obtener URL de imagen
async function getImageUrl(storageId) {
  return await client.query("storage:getImageUrl", { storageId });
}

// Función para insertar personaje
async function insertCharacter(charData) {
  return await client.mutation("characters:insertCharacter", charData);
}

// Función principal
async function main() {
  let success = 0;
  let failed = 0;
  let imageSuccess = 0;
  let imageFailed = 0;

  for (let i = 0; i < candidates.length; i++) {
    const char = candidates[i];
    console.log(`[${i + 1}/${candidates.length}] Procesando: ${char.name}`);

    let imageUrl = char.image; // Fallback a imagen original

    // Intentar subir imagen si existe
    const imageName = path.basename(char.image);
    const localPath = path.join(IMAGES_DIR, imageName);

    if (fs.existsSync(localPath)) {
      console.log(`  📁 Imagen encontrada: ${imageName}`);

      try {
        // 1. Obtener URL de subida
        const uploadUrl = await getUploadUrl();
        console.log(`  ⬆️  Subiendo a Convex Storage...`);

        // 2. Subir imagen
        const { storageId } = await uploadImage(localPath, uploadUrl);
        console.log(`  ✅ Imagen subida, storageId: ${storageId}`);

        // 3. Obtener URL pública
        const publicUrl = await getImageUrl(storageId);
        if (publicUrl) {
          imageUrl = publicUrl;
          console.log(`  🔗 URL pública obtenida`);
        }
        imageSuccess++;
      } catch (error) {
        console.log(`  ❌ Error subiendo imagen: ${error.message}`);
        imageFailed++;
      }
    } else {
      console.log(`  ⚠️  Imagen no encontrada: ${imageName}`);
      imageFailed++;
    }

    // 4. Insertar personaje en Convex
    const charData = {
      name: char.name,
      category: char.category,
      emoji: char.emoji,
      anime: char.anime,
      image: imageUrl,
      title: char.title,
      order: i
    };

    try {
      await insertCharacter(charData);
      console.log(`  ✅ Personaje guardado en Convex\n`);
      success++;
    } catch (error) {
      console.log(`  ❌ Error guardando personaje: ${error.message}\n`);
      failed++;
    }

    // Pequeña pausa para no saturar
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n========================================`);
  console.log(`📊 RESUMEN DE MIGRACIÓN`);
  console.log(`========================================`);
  console.log(`✅ Personajes migrados: ${success}/${candidates.length}`);
  console.log(`❌ Personajes fallidos: ${failed}`);
  console.log(`📸 Imágenes subidas: ${imageSuccess}`);
  console.log(`📸 Imágenes fallidas: ${imageFailed}`);
  console.log(`========================================`);
}

// Ejecutar
main().catch(err => {
  console.error("\n❌ Error fatal:", err);
  process.exit(1);
});
