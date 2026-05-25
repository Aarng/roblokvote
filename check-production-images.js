#!/usr/bin/env node
/**
 * Verificar qué imágenes faltan en producción
 * Usage: node check-production-images.js
 */

const { ConvexHttpClient } = require("convex/browser");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.production" });

const CONVEX_URL = process.env.CONVEX_URL || "https://tangible-ram-819.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function checkImages() {
  console.log("🔍 Verificando imágenes en producción...\n");
  console.log(`URL: ${CONVEX_URL}\n`);

  // Obtener personajes de Convex
  try {
    const characters = await client.query("characters:getAllCharacters");

    console.log(`📊 Total personajes en Convex: ${characters.length}\n`);

    const withStorageUrl = characters.filter(c => c.image && c.image.startsWith("http"));
    const withLocalPath = characters.filter(c => c.image && !c.image.startsWith("http"));
    const withoutImage = characters.filter(c => !c.image);

    console.log("✅ Con URL de Convex Storage:", withStorageUrl.length);
    console.log("⚠️  Con ruta local (necesita subir):", withLocalPath.length);
    console.log("❌ Sin imagen:", withoutImage.length);

    if (withLocalPath.length > 0) {
      console.log("\n📋 Personajes que necesitan subir imagen:\n");
      withLocalPath.forEach(c => {
        console.log(`   - ${c.name}: ${c.image}`);
      });
    }

    if (withoutImage.length > 0) {
      console.log("\n📋 Personajes sin imagen:\n");
      withoutImage.forEach(c => {
        console.log(`   - ${c.name}`);
      });
    }

    console.log("\n✨ Para subir las imágenes faltantes, ejecuta:");
    console.log("   node upload-images-auto.mjs");
    console.log("\n✨ Para subir un personaje específico:");
    console.log('   node upload-images-auto.mjs "Nombre Personaje"');

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("\nAsegúrate de:");
    console.log("1. Estar en el directorio del proyecto");
    console.log("2. Tener el archivo .env.production configurado");
    console.log("3. Que Convex esté deployado");
  }
}

checkImages();
