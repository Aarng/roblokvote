#!/usr/bin/env node
// Script para exportar lista de personajes con IDs de Convex
// Útil para actualizar imágenes manualmente en el dashboard de Convex

const fs = require('fs');

const DATA_FILE = './data.js';

async function exportList() {
  // Cargar datos locales
  const dataContent = fs.readFileSync(DATA_FILE, 'utf8');
  const match = dataContent.match(/const characters = (\[.*?\]);/s);

  if (!match) {
    console.error('❌ No se encontró el array de personajes en data.js');
    return;
  }

  const characters = eval(match[1]);

  // Intentar cargar desde Convex si está disponible
  let convexData = [];
  try {
    // Esto requiere que Convex esté corriendo
    const { execSync } = require('child_process');
    const result = execSync('npx convex query characters:getAllCharacters --json 2>/dev/null || echo "[]"', { encoding: 'utf8' });
    convexData = JSON.parse(result);
  } catch (e) {
    console.log('⚠️  No se pudo obtener datos de Convex, usando data.js como referencia\n');
  }

  // Crear mapeo
  const mapping = characters.map((char, index) => {
    const convexChar = convexData.find(c => c.name === char.name);
    return {
      convexId: convexChar?._id || 'NO ENCONTRADO',
      name: char.name,
      anime: char.anime,
      category: char.category,
      currentImage: char.image || 'NO TIENE',
      suggestedImage: `images/${char.name.replace(/\s+/g, '_')}.png`
    };
  });

  // Generar output
  console.log('\n📋 LISTA DE PERSONAJES PARA CONVEX\n');
  console.log('='.repeat(100));
  console.log('Convex ID | Nombre | Anime | Categoría | Imagen Actual | Imagen Sugerida');
  console.log('='.repeat(100));

  mapping.forEach(item => {
    console.log(`${item.convexId} | ${item.name} | ${item.anime} | ${item.category} | ${item.currentImage} | ${item.suggestedImage}`);
  });

  // Guardar a archivo
  const outputFile = 'convex-character-list.csv';
  const csvContent = [
    'Convex ID,Nombre,Anime,Categoria,Imagen Actual,Imagen Sugerida',
    ...mapping.map(item =>
      `"${item.convexId}","${item.name}","${item.anime}","${item.category}","${item.currentImage}","${item.suggestedImage}"`
    )
  ].join('\n');

  fs.writeFileSync(outputFile, csvContent);
  console.log(`\n✅ Lista guardada en: ${outputFile}`);
  console.log(`📊 Total: ${mapping.length} personajes`);

  // Generar también en formato Markdown para fácil lectura
  const mdContent = `# Lista de Personajes para Convex\n\nActualizado: ${new Date().toLocaleString()}\n\n| Convex ID | Nombre | Anime | Categoría | Imagen Actual |\n|-----------|--------|-------|-----------|---------------|\n` +
    mapping.map(item =>
      `| ${item.convexId} | ${item.name} | ${item.anime} | ${item.category} | ${item.currentImage} |`
    ).join('\n') +
    '\n\n## Para actualizar imágenes en Convex Dashboard:\n\n1. Ve a https://dashboard.convex.dev\n2. Navega a la tabla "characters"\n3. Edita cada personaje y actualiza el campo "image"\n4. Usa las rutas sugeridas de la columna "Imagen Sugerida"\n';

  fs.writeFileSync('convex-character-list.md', mdContent);
  console.log(`📝 Versión Markdown: convex-character-list.md`);
}

console.log('📤 Exportando lista de personajes...\n');
exportList().catch(console.error);
