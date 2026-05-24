// Script para migrar personajes desde data.js a Convex
// Ejecutar con: node migrate-characters.js

const { candidates } = require('./data.js');

const CONVEX_URL = 'https://hallowed-badger-330.convex.cloud/';

async function migrateCharacters() {
  console.log(`Migrando ${candidates.length} personajes a Convex...\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < candidates.length; i++) {
    const char = candidates[i];
    const charData = {
      name: char.name,
      category: char.category,
      emoji: char.emoji,
      anime: char.anime,
      image: char.image,
      title: char.title,
      order: i
    };

    try {
      const response = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'characters:insertCharacter',
          args: charData
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.created) {
          console.log(`✅ Creado: ${char.name}`);
        } else {
          console.log(`🔄 Actualizado: ${char.name}`);
        }
        success++;
      } else {
        console.log(`❌ Error con ${char.name}: HTTP ${response.status}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ Error con ${char.name}: ${error.message}`);
      failed++;
    }

    // Pequeña pausa para no saturar
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ Completado: ${success} éxitos, ${failed} fallos`);
}

migrateCharacters().catch(console.error);
