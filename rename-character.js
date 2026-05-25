#!/usr/bin/env node
// Script para renombrar un personaje existente
// Útil cuando el nombre está mal escrito o necesitas corregirlo

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

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[_\s-]+/g, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function findCharacter(characters, searchName) {
  const normalizedSearch = normalizeName(searchName);
  return characters.find(c => normalizeName(c.name) === normalizedSearch);
}

function interactiveMode() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let dataContent = fs.readFileSync(DATA_FILE, 'utf8');
  const match = dataContent.match(/const characters = (\[.*?\]);/s);
  if (!match) {
    console.error(`${colors.red}❌ Error: No se encontró el array de personajes${colors.reset}`);
    process.exit(1);
  }

  let characters = eval(match[1]);

  console.log(`${colors.blue}\n✏️  RENOMBRAR PERSONAJE${colors.reset}\n`);

  readline.question('📛 Nombre actual del personaje: ', (oldName) => {
    const character = findCharacter(characters, oldName);

    if (!character) {
      console.error(`${colors.red}❌ Personaje "${oldName}" no encontrado${colors.reset}`);
      readline.close();
      return;
    }

    console.log(`\n${colors.blue}Personaje encontrado:${colors.reset}`);
    console.log(`   📛 Nombre: ${character.name}`);
    console.log(`   🎭 Anime: ${character.anime}`);
    console.log(`   🏷️  Categoría: ${character.category}`);
    console.log(`   🖼️  Imagen: ${character.image}`);

    readline.question(`\n✏️  Nuevo nombre: `, (newName) => {
      if (!newName.trim()) {
        console.log(`${colors.yellow}⚠️  Operación cancelada${colors.reset}`);
        readline.close();
        return;
      }

      // Verificar que no exista
      if (findCharacter(characters, newName) && normalizeName(newName) !== normalizeName(character.name)) {
        console.error(`${colors.red}❌ Ya existe un personaje llamado "${newName}"${colors.reset}`);
        readline.close();
        return;
      }

      const oldNameBackup = character.name;
      character.name = newName.trim();

      // Preguntar si también quiere actualizar el nombre del archivo de imagen
      if (character.image) {
        readline.question(`\n🖼️  ¿También renombrar el archivo de imagen? (s/n): `, (answer) => {
          let imageUpdated = false;

          if (answer.toLowerCase() === 's') {
            const oldImagePath = path.join(process.cwd(), character.image);
            const ext = path.extname(character.image);
            const newFilename = newName.replace(/\s+/g, '_') + ext;
            const newImagePath = path.join(IMAGES_DIR, newFilename);

            if (fs.existsSync(oldImagePath)) {
              try {
                fs.renameSync(oldImagePath, newImagePath);
                character.image = `images/${newFilename}`;
                imageUpdated = true;
                console.log(`${colors.green}✅ Archivo renombrado:${colors.reset} ${path.basename(character.image)} → ${newFilename}`);
              } catch (e) {
                console.error(`${colors.red}❌ Error renombrando archivo:${colors.reset} ${e.message}`);
              }
            }
          }

          saveChanges(character, oldNameBackup, characters, dataContent, imageUpdated);
          readline.close();
        });
      } else {
        saveChanges(character, oldNameBackup, characters, dataContent, false);
        readline.close();
      }
    });
  });
}

function saveChanges(character, oldName, characters, dataContent, imageRenamed) {
  const newContent = `// Lista de personajes anime para Proyecto Piece
// Total: ${characters.length} personajes
// Última actualización: ${new Date().toLocaleString()}

const characters = ${JSON.stringify(characters, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = characters;
}
`;

  fs.writeFileSync(DATA_FILE, newContent);

  console.log(`\n${colors.green}✅ Personaje renombrado exitosamente!${colors.reset}`);
  console.log(`   📛 ${oldName} → ${character.name}`);
  if (imageRenamed) {
    console.log(`   🖼️  Archivo de imagen también renombrado`);
  }
  console.log(`\n${colors.yellow}⚠️  Importante:${colors.reset}`);
  console.log(`   Los votos existentes en Convex siguen vinculados al nombre antiguo.`);
  console.log(`   Si ya hay votos para "${oldName}", considera:`);
  console.log(`   1. Mantener el nombre original en Convex, O`);
  console.log(`   2. Migrar los votos manualmente en el dashboard de Convex`);
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  interactiveMode();
} else if (args.length === 2) {
  // Modo directo
  let dataContent = fs.readFileSync(DATA_FILE, 'utf8');
  const match = dataContent.match(/const characters = (\[.*?\]);/s);
  if (!match) {
    console.error(`${colors.red}❌ Error: No se encontró el array de personajes${colors.reset}`);
    process.exit(1);
  }

  let characters = eval(match[1]);
  const character = findCharacter(characters, args[0]);

  if (!character) {
    console.error(`${colors.red}❌ Personaje "${args[0]}" no encontrado${colors.reset}`);
    process.exit(1);
  }

  const oldName = character.name;
  character.name = args[1];

  saveChanges(character, oldName, characters, dataContent, false);
} else {
  console.log(`
${colors.blue}✏️  Renombrar Personaje${colors.reset}

Uso:
  node rename-character.js                    # Modo interactivo
  node rename-character.js "Nombre Viejo" "Nombre Nuevo"
`);
}
