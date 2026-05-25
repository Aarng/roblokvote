#!/usr/bin/env node
// Script para actualizar la imagen de un personaje existente
// Uso: node update-character-image.js [nombre-personaje] [archivo-nuevo]

const fs = require('fs');
const path = require('path');

const DATA_FILE = './data.js';
const IMAGES_DIR = './images';

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function printHelp() {
  console.log(`
${colors.blue}🖼️  Actualizar Imagen de Personaje${colors.reset}

Uso:
  node update-character-image.js                    # Modo interactivo
  node update-character-image.js "Guts" "guts_v2.png"  # Modo directo

El script buscará automáticamente imágenes que coincidan con el nombre del personaje.
`);
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[_\s-]+/g, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function findCharacter(characters, searchName) {
  const normalizedSearch = normalizeName(searchName);

  // Buscar coincidencia exacta primero
  let match = characters.find(c => normalizeName(c.name) === normalizedSearch);

  // Si no, buscar coincidencia parcial
  if (!match) {
    match = characters.find(c =>
      normalizeName(c.name).includes(normalizedSearch) ||
      normalizedSearch.includes(normalizeName(c.name))
    );
  }

  return match;
}

function findImageFiles(searchName) {
  const normalizedSearch = normalizeName(searchName);
  const files = fs.readdirSync(IMAGES_DIR);

  return files
    .filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
    .filter(f => {
      const normalizedFile = normalizeName(f.replace(/\.[^/.]+$/, ''));
      return normalizedFile === normalizedSearch ||
             normalizedFile.includes(normalizedSearch) ||
             normalizedSearch.includes(normalizedFile);
    })
    .map(f => ({
      filename: f,
      path: `images/${f}`,
      fullPath: path.join(IMAGES_DIR, f)
    }));
}

function listAllImages() {
  const files = fs.readdirSync(IMAGES_DIR);
  return files
    .filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
    .sort();
}

function showCharacterInfo(char) {
  console.log(`\n${colors.blue}📋 Información actual:${colors.reset}`);
  console.log(`   📛 Nombre: ${char.name}`);
  console.log(`   🎭 Anime: ${char.anime}`);
  console.log(`   🏷️  Categoría: ${char.category}`);
  console.log(`   🖼️  Imagen actual: ${char.image || 'No tiene'});
  console.log(`   🎭 Emoji: ${char.emoji}`);
}

function interactiveMode() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Cargar datos
  let dataContent = fs.readFileSync(DATA_FILE, 'utf8');
  const match = dataContent.match(/const characters = (\[.*?\]);/s);
  if (!match) {
    console.error(`${colors.red}❌ Error: No se encontró el array de personajes${colors.reset}`);
    process.exit(1);
  }

  let characters = eval(match[1]);

  function askCharacter() {
    console.log(`\n${colors.blue}🎮 Personajes disponibles:${colors.reset} ${characters.length}`);
    console.log(`${colors.yellow}💡 Tip:${colors.reset} Puedes escribir parte del nombre\n`);

    readline.question('📛 Nombre del personaje a actualizar: ', (searchName) => {
      if (!searchName.trim()) {
        console.log(`${colors.red}❌ Nombre requerido${colors.reset}`);
        askCharacter();
        return;
      }

      const character = findCharacter(characters, searchName);

      if (!character) {
        console.log(`${colors.red}❌ Personaje no encontrado: "${searchName}"${colors.reset}`);
        console.log(`${colors.yellow}Buscando similares...${colors.reset}`);

        // Mostrar algunos personajes como referencia
        const suggestions = characters
          .filter(c =>
            normalizeName(c.name).includes(normalizeName(searchName).substring(0, 3))
          )
          .slice(0, 5);

        if (suggestions.length > 0) {
          console.log('\n¿Quizás buscabas?');
          suggestions.forEach(c => console.log(`   - ${c.name}`));
        }

        askCharacter();
        return;
      }

      showCharacterInfo(character);

      // Buscar imágenes disponibles
      const matchingImages = findImageFiles(character.name);

      if (matchingImages.length === 0) {
        console.log(`\n${colors.red}⚠️  No se encontraron imágenes para "${character.name}"${colors.reset}`);
        console.log(`\n${colors.yellow}Imágenes disponibles en la carpeta:${colors.reset}`);
        const allImages = listAllImages();
        allImages.slice(0, 20).forEach(img => console.log(`   - ${img}`));
        if (allImages.length > 20) console.log(`   ... y ${allImages.length - 20} más`);

        readline.question(`\n📁 Escribe el nombre exacto del archivo (o ruta relativa): `, (filename) => {
          handleImageSelection(character, filename, characters, dataContent);
        });
      } else if (matchingImages.length === 1) {
        console.log(`\n${colors.green}✅ Imagen encontrada:${colors.reset} ${matchingImages[0].filename}`);
        readline.question(`¿Usar esta imagen? (s/n): `, (answer) => {
          if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
            updateImage(character, matchingImages[0].path, characters, dataContent);
          } else {
            askForCustomImage(character, characters, dataContent, readline);
          }
        });
      } else {
        console.log(`\n${colors.blue}🖼️  Imágenes encontradas:${colors.reset}`);
        matchingImages.forEach((img, i) => {
          console.log(`   ${i + 1}. ${img.filename}`);
        });
        console.log(`   ${matchingImages.length + 1}. Especificar otra ruta`);

        readline.question(`\nSelecciona (1-${matchingImages.length + 1}): `, (answer) => {
          const selection = parseInt(answer);
          if (selection >= 1 && selection <= matchingImages.length) {
            updateImage(character, matchingImages[selection - 1].path, characters, dataContent);
          } else if (selection === matchingImages.length + 1) {
            askForCustomImage(character, characters, dataContent, readline);
          } else {
            console.log(`${colors.red}❌ Opción inválida${colors.reset}`);
            readline.close();
          }
        });
      }
    });
  }

  function askForCustomImage(character, characters, dataContent, rl) {
    rl.question('📁 Nombre del archivo (en carpeta images/): ', (filename) => {
      handleImageSelection(character, filename, characters, dataContent);
    });
  }

  function handleImageSelection(character, filename, characters, dataContent) {
    if (!filename.trim()) {
      console.log(`${colors.red}❌ Operación cancelada${colors.reset}`);
      readline.close();
      return;
    }

    // Agregar prefijo images/ si no lo tiene
    const imagePath = filename.startsWith('images/') ? filename : `images/${filename}`;

    // Verificar que existe
    const fullPath = imagePath.startsWith('images/')
      ? path.join(process.cwd(), imagePath)
      : path.join(IMAGES_DIR, path.basename(imagePath));

    if (!fs.existsSync(fullPath)) {
      console.error(`${colors.red}❌ Error: No existe el archivo: ${imagePath}${colors.reset}`);
      console.log(`\n${colors.yellow}Buscando archivos similares...${colors.reset}`);
      const allImages = listAllImages();
      const similar = allImages.filter(f =>
        f.toLowerCase().includes(path.basename(filename).toLowerCase().substring(0, 3))
      );
      if (similar.length > 0) {
        console.log('Archivos similares:');
        similar.forEach(f => console.log(`   - ${f}`));
      }
      readline.close();
      return;
    }

    updateImage(character, imagePath, characters, dataContent);
    readline.close();
  }

  function updateImage(character, newImagePath, characters, dataContent) {
    const oldImage = character.image;
    character.image = newImagePath;

    // Guardar
    const newContent = `// Lista de personajes anime para Proyecto Piece
// Total: ${characters.length} personajes
// Última actualización: ${new Date().toLocaleString()}

const characters = ${JSON.stringify(characters, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = characters;
}
`;

    fs.writeFileSync(DATA_FILE, newContent);

    console.log(`\n${colors.green}✅ Imagen actualizada exitosamente!${colors.reset}`);
    console.log(`   📛 Personaje: ${character.name}`);
    console.log(`   🖼️  Imagen anterior: ${oldImage || 'Ninguna'}`);
    console.log(`   🖼️  Nueva imagen: ${newImagePath}`);
    console.log(`\n${colors.yellow}⚠️  Recuerda:${colors.reset}`);
    console.log(`   1. Si reemplazaste un archivo, borra la imagen vieja si ya no se usa`);
    console.log(`   2. Refresca la landing page para ver el cambio`);
    console.log(`   3. El cambio se reflejará inmediatamente en el sistema de votación`);
  }

  console.log(`${colors.blue}\n🖼️  ACTUALIZAR IMAGEN DE PERSONAJE${colors.reset}\n`);
  askCharacter();
}

// Modo directo
function directMode(characterName, newImageFile) {
  // Cargar datos
  let dataContent = fs.readFileSync(DATA_FILE, 'utf8');
  const match = dataContent.match(/const characters = (\[.*?\]);/s);
  if (!match) {
    console.error(`${colors.red}❌ Error: No se encontró el array de personajes${colors.reset}`);
    process.exit(1);
  }

  let characters = eval(match[1]);
  const character = findCharacter(characters, characterName);

  if (!character) {
    console.error(`${colors.red}❌ Personaje no encontrado: "${characterName}"${colors.reset}`);
    process.exit(1);
  }

  // Verificar imagen
  const imagePath = newImageFile.startsWith('images/') ? newImageFile : `images/${newImageFile}`;
  const fullPath = path.join(process.cwd(), imagePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`${colors.red}❌ No existe el archivo: ${imagePath}${colors.reset}`);
    process.exit(1);
  }

  // Actualizar
  const oldImage = character.image;
  character.image = imagePath;

  const newContent = `// Lista de personajes anime para Proyecto Piece
// Total: ${characters.length} personajes
// Última actualización: ${new Date().toLocaleString()}

const characters = ${JSON.stringify(characters, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = characters;
}
`;

  fs.writeFileSync(DATA_FILE, newContent);

  console.log(`${colors.green}✅ Imagen actualizada!${colors.reset}`);
  console.log(`   ${character.name}: ${oldImage || 'Ninguna'} → ${imagePath}`);
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  printHelp();
  if (args.length === 0) {
    console.log('Iniciando modo interactivo...\n');
    interactiveMode();
  }
} else if (args.length === 2) {
  // Modo directo: node update-character-image.js "Nombre" "archivo.png"
  directMode(args[0], args[1]);
} else {
  console.error(`${colors.red}❌ Error: Argumentos inválidos${colors.reset}`);
  printHelp();
  process.exit(1);
}
