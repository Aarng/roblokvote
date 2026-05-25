#!/usr/bin/env node
/**
 * Subir imágenes de personajes a Convex Storage y actualizar URLs automáticamente
 * Usage:
 *   node upload-images-auto.mjs                    # Subir todas las imágenes
 *   node upload-images-auto.mjs "Kirito"             # Subir solo un personaje específico
 */

import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para consola
const colors = {
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  reset: "\x1b[0m"
};

// 1. Cargar variables de entorno
// Detectar si es producción o desarrollo
const isProduction = process.argv.includes("--prod") || process.argv.includes("-p");
const envFile = isProduction ? ".env.production" : ".env.local";
dotenv.config({ path: envFile });

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL ||
  (isProduction ? "https://tangible-ram-819.convex.cloud" : "https://hallowed-badger-330.convex.cloud");

if (!CONVEX_URL) {
  console.error(`${colors.red}❌ Error: Falta CONVEX_URL${colors.reset}`);
  console.log("\nAsegurate de tener:");
  console.log(`  Archivo ${envFile} con:`);
  console.log('  VITE_CONVEX_URL="https://tu-proyecto.convex.cloud"');
  process.exit(1);
}

const envName = isProduction ? "PRODUCCIÓN" : "DESARROLLO";
console.log(`${colors.blue}🔗 Conectando a Convex [${envName}]: ${CONVEX_URL}${colors.reset}\n`);

const client = new ConvexHttpClient(CONVEX_URL);

// 2. Cargar personajes de data.js
const dataPath = path.resolve(__dirname, "data.js");
const dataContent = fs.readFileSync(dataPath, "utf8");
const match = dataContent.match(/const candidates = (\[.*?\]);/s);

if (!match) {
  console.error(`${colors.red}❌ Error: No se encontró el array candidates en data.js${colors.reset}`);
  process.exit(1);
}

const characters = eval(match[1]);
console.log(`${colors.blue}📦 Total de personajes en data.js: ${characters.length}${colors.reset}\n`);

// 3. Filtrar por nombre si se especificó
const specificName = process.argv[2];
let charactersToUpload = characters;

if (specificName) {
  charactersToUpload = characters.filter(c =>
    c.name.toLowerCase().includes(specificName.toLowerCase())
  );
  console.log(`${colors.yellow}🔍 Filtrando por "${specificName}": ${charactersToUpload.length} personaje(s)${colors.reset}\n`);
}

// 4. Verificar imágenes existentes
const imagesDir = path.resolve(__dirname, "images");
const filesToUpload = [];

for (const char of charactersToUpload) {
  const filename = path.basename(char.image || "");
  const localPath = path.join(imagesDir, filename);

  // Verificar si ya tiene URL de Convex (empieza con http)
  if (char.image && char.image.startsWith("http")) {
    console.log(`${colors.yellow}⏩ ${char.name}: Ya tiene URL de Convex${colors.reset}`);
    continue;
  }

  if (fs.existsSync(localPath)) {
    const stats = fs.statSync(localPath);
    filesToUpload.push({
      name: char.name,
      local: localPath,
      filename: filename,
      category: char.category,
      size: Math.round(stats.size / 1024) // KB
    });
  } else {
    console.log(`${colors.red}❌ ${char.name}: Imagen no encontrada (${filename})${colors.reset}`);
  }
}

if (filesToUpload.length === 0) {
  console.log(`\n${colors.green}✅ No hay imágenes para subir${colors.reset}`);
  process.exit(0);
}

console.log(`${colors.blue}📤 Imágenes a subir: ${filesToUpload.length}${colors.reset}\n`);

// 5. Función para subir imagen
async function uploadImage(fileInfo) {
  try {
    console.log(`${colors.blue}📤 Subiendo ${fileInfo.name} (${fileInfo.size}KB)...${colors.reset}`);

    // 1. Leer archivo
    const data = fs.readFileSync(fileInfo.local);
    const ext = path.extname(fileInfo.local).toLowerCase();
    const contentType = ext === ".png" ? "image/png" :
                        ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
                        "image/png";

    // 2. Obtener URL de subida desde Convex
    console.log(`   📝 Solicitando URL de subida...`);

    // Usar fetch directamente al endpoint de Convex
    const generateUrlEndpoint = `${CONVEX_URL}/api/mutation`;
    const response = await fetch(generateUrlEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "storage:generateUploadUrl",
        args: {}
      })
    });

    if (!response.ok) {
      throw new Error(`Error generando URL: ${response.statusText}`);
    }

    const { value: uploadUrl } = await response.json();
    console.log(`   ✅ URL obtenida`);

    // 3. Subir archivo binario
    console.log(`   📤 Subiendo archivo (${fileInfo.size}KB)...`);
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: data,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Error subiendo archivo: ${uploadResponse.statusText}`);
    }

    const { storageId } = await uploadResponse.json();
    console.log(`   ✅ Archivo subido - Storage ID: ${storageId.substring(0, 20)}...`);

    // 4. Guardar referencia en Convex y actualizar personaje
    console.log(`   💾 Actualizando personaje...`);
    const saveResponse = await fetch(generateUrlEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "storage:saveFile",
        args: {
          storageId: storageId,
          characterName: fileInfo.name,
          contentType: contentType
        }
      })
    });

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      throw new Error(`Error guardando referencia: ${errorText}`);
    }

    const result = await saveResponse.json();
    console.log(`   ✅ Personaje actualizado: ${result.value?.url?.substring(0, 60)}...`);

    return {
      success: true,
      name: fileInfo.name,
      url: result.value?.url,
      storageId: storageId
    };

  } catch (error) {
    console.error(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return { success: false, name: fileInfo.name, error: error.message };
  }
}

// 6. Ejecutar subidas
async function main() {
  const results = [];
  let successful = 0;
  let failed = 0;

  for (const file of filesToUpload) {
    const result = await uploadImage(file);
    results.push(result);

    if (result.success) {
      successful++;
    } else {
      failed++;
    }

    console.log(""); // Línea en blanco entre uploads
  }

  console.log("=".repeat(60));
  console.log(`${colors.blue}📊 RESUMEN${colors.reset}`);
  console.log("=".repeat(60));
  console.log(`Total procesados: ${results.length}`);
  console.log(`${colors.green}✅ Exitosos: ${successful}${colors.reset}`);
  console.log(`${colors.red}❌ Fallidos: ${failed}${colors.reset}`);

  if (successful > 0) {
    console.log(`\n${colors.green}✅ Imágenes subidas correctamente a Convex Storage [${envName}]!${colors.reset}`);
    console.log(`Las URLs se han guardado automáticamente en cada personaje.`);
  }

  if (failed > 0) {
    console.log(`\n${colors.yellow}⚠️ Algunas imágenes fallaron.${colors.reset}`);
    console.log(`Revisa los errores arriba o intenta de nuevo.`);
  }

  console.log(`\n${colors.blue}💡 Usos:${colors.reset}`);
  console.log(`  node upload-images-auto.mjs           # Subir todas (desarrollo)`);
  console.log(`  node upload-images-auto.mjs --prod    # Subir todas (producción)`);
  console.log(`  node upload-images-auto.mjs "Kirito"  # Subir específico`);


main().catch(error => {
  console.error(`${colors.red}Error fatal: ${error.message}${colors.reset}`);
  process.exit(1);
});
