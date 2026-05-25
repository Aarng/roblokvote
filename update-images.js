// Script para actualizar referencias de imágenes según archivos en carpeta images/
// Busca imágenes en images/ y actualiza data.js con las rutas correctas

const fs = require('fs');
const path = require('path');

const IMAGES_DIR = './images';
const DATA_FILE = './data.js';

function normalizeName(name) {
  // Normalizar nombres para comparación
  return name
    .replace(/[_\s]+/g, '') // quitar guiones bajos y espacios
    .replace(/\.[^/.]+$/, '') // quitar extensión
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // quitar acentos
}

function getImageFiles() {
  const files = fs.readdirSync(IMAGES_DIR);
  return files
    .filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
    .map(f => ({
      filename: f,
      name: f.replace(/\.[^/.]+$/, ''),
      path: `images/${f}`
    }));
}

function updateDataJs() {
  console.log('📁 Escaneando carpeta images/...');
  const images = getImageFiles();
  console.log(`   ${images.length} imágenes encontradas`);

  let dataContent = fs.readFileSync(DATA_FILE, 'utf8');

  // Extraer el array de characters
  const match = dataContent.match(/const characters = (\[.*?\]);/s);
  if (!match) {
    console.error('❌ No se encontró el array characters en data.js');
    return;
  }

  let characters = eval(match[1]);
  let updatedCount = 0;
  let notFound = [];

  characters.forEach(char => {
    const charNameNormalized = normalizeName(char.name);

    // Buscar imagen que coincida
    const matchingImage = images.find(img => {
      const imgNameNormalized = normalizeName(img.name);
      return imgNameNormalized === charNameNormalized ||
             imgNameNormalized.includes(charNameNormalized) ||
             charNameNormalized.includes(imgNameNormalized);
    });

    if (matchingImage) {
      if (char.image !== matchingImage.path) {
        console.log(`✅ ${char.name}: ${char.image} → ${matchingImage.path}`);
        char.image = matchingImage.path;
        updatedCount++;
      }
    } else {
      notFound.push(char.name);
      // Si no hay imagen, mantener el placeholder o dejar vacío
      if (!char.image || char.image === '') {
        char.image = '';
      }
    }
  });

  // Reconstruir el archivo data.js
  const newContent = `// Lista de personajes anime para Proyecto Piece
// Actualizado automáticamente: ${new Date().toLocaleString()}

const characters = ${JSON.stringify(characters, null, 2)};

// Exportar para uso en Node.js (si es necesario)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = characters;
}
`;

  fs.writeFileSync(DATA_FILE, newContent);

  console.log('\n📊 Resumen:');
  console.log(`   ✅ ${updatedCount} imágenes actualizadas`);
  console.log(`   ⚠️  ${notFound.length} sin imagen:`);
  if (notFound.length > 0) {
    notFound.forEach(name => console.log(`      - ${name}`));
  }
}

// Ejecutar
updateDataJs();
console.log('\n✨ Listo! Ejecuta: node update-images.js');
