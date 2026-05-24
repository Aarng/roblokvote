// Script para migrar personajes e imágenes a Convex
// Ejecutar con: node migrate-with-images.js

const fs = require('fs');
const path = require('path');
const { candidates } = require('./data.js');

const CONVEX_URL = 'https://hallowed-badger-330.convex.cloud/';
const IMAGES_DIR = './images';

// Función para obtener URL de subida
async function getUploadUrl() {
  const response = await fetch(`${CONVEX_URL}/api/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'storage:generateUploadUrl',
      args: {}
    })
  });

  if (!response.ok) {
    throw new Error(`Error obteniendo upload URL: ${response.status}`);
  }

  return response.json();
}

// Función para subir imagen
async function uploadImage(filePath, uploadUrl) {
  const fileBuffer = fs.readFileSync(filePath);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/png',
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    throw new Error(`Error subiendo imagen: ${response.status}`);
  }

  // La respuesta contiene el storage ID
  return response.text();
}

// Función para insertar personaje
async function insertCharacter(charData) {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'characters:insertCharacter',
      args: charData
    })
  });

  if (!response.ok) {
    throw new Error(`Error insertando personaje: ${response.status}`);
  }

  return response.json();
}

// Función principal de migración
async function migrateWithImages() {
  console.log(`Migrando ${candidates.length} personajes con imágenes...\n`);

  let success = 0;
  let failed = 0;
  let imageSuccess = 0;
  let imageFailed = 0;

  for (let i = 0; i < candidates.length; i++) {
    const char = candidates[i];
    console.log(`\n[${i + 1}/${candidates.length}] Procesando: ${char.name}`);

    let imageUrl = char.image; // Fallback a la imagen original

    // Intentar subir la imagen si existe localmente
    const imageName = path.basename(char.image);
    const localPath = path.join(IMAGES_DIR, imageName);

    if (fs.existsSync(localPath)) {
      console.log(`  📁 Imagen local encontrada: ${imageName}`);

      try {
        // Obtener URL de subida
        const uploadUrl = await getUploadUrl();
        console.log(`  ⬆️  Subiendo a Convex Storage...`);

        // Subir imagen
        const storageId = await uploadImage(localPath, uploadUrl);
        console.log(`  ✅ Imagen subida, storageId: ${storageId}`);

        // Construir URL de Convex
        imageUrl = `${CONVEX_URL}/api/storage/${storageId}`;
        imageSuccess++;
      } catch (error) {
        console.log(`  ❌ Error subiendo imagen: ${error.message}`);
        imageFailed++;
      }
    } else {
      console.log(`  ⚠️  Imagen local no encontrada, usando: ${char.image}`);
    }

    // Insertar personaje con la URL (de Convex o fallback)
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
      const result = await insertCharacter(charData);
      console.log(`  ✅ Personaje guardado en Convex`);
      success++;
    } catch (error) {
      console.log(`  ❌ Error guardando personaje: ${error.message}`);
      failed++;
    }

    // Pausa para no saturar
    await new Promise(resolve => setTimeout(resolve, 200));
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

// Ejecutar migración
migrateWithImages().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
