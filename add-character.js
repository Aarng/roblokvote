#!/usr/bin/env node
// Script para agregar personajes nuevos al sistema
// Uso: node add-character.js "Nombre" "Categoria" "Anime" "Titulo"

const fs = require('fs');

const DATA_FILE = './data.js';

// Colores para consola
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function printHelp() {
  console.log(`
${colors.blue}🎮 Agregar Personaje a Proyecto Piece${colors.reset}

Uso: node add-character.js [opciones]

Opciones:
  --interactive, -i     Modo interactivo (pregunta los datos)
  --json, -j '{...}'    Pasar datos como JSON

Ejemplos:
  node add-character.js -i
  node add-character.js -j '{"name":"Guts","category":"ESPADA","anime":"Berserk","title":"Espadachín Negro"}'

Categorías válidas: MELEE, ESPADA, MAGIA
`);
}

function getNextId(characters) {
  return Math.max(...characters.map(c => c._id || 0), 0) + 1;
}

function generateEmoji(name, category) {
  const emojis = {
    'MELEE': ['👊', '💥', '🥊', '💪', '⚡'],
    'ESPADA': ['⚔️', '🗡️', '⚡', '🔥', '💫'],
    'MAGIA': ['✨', '🔮', '⚡', '🔥', '❄️']
  };
  // Usar primer letra para seleccionar emoji consistente
  const index = name.charCodeAt(0) % emojis[category].length;
  return emojis[category][index];
}

function sanitizeFilename(name) {
  return name
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

function detectImage(name) {
  const sanitized = sanitizeFilename(name);
  const extensions = ['.png', '.jpg', '.jpeg', '.webp'];

  for (const ext of extensions) {
    const path = `images/${sanitized}${ext}`;
    if (fs.existsSync(path)) {
      return path;
    }
  }
  return '';
}

function addCharacter(characterData) {
  // Cargar data.js
  let dataContent = fs.readFileSync(DATA_FILE, 'utf8');

  const match = dataContent.match(/const characters = (\[.*?\]);/s);
  if (!match) {
    console.error(`${colors.red}❌ Error: No se encontró el array en data.js${colors.reset}`);
    return false;
  }

  let characters = eval(match[1]);

  // Verificar si ya existe
  if (characters.some(c => c.name.toLowerCase() === characterData.name.toLowerCase())) {
    console.error(`${colors.red}❌ Error: ${characterData.name} ya existe en la lista${colors.reset}`);
    return false;
  }

  // Generar datos automáticos
  const newCharacter = {
    _id: getNextId(characters),
    name: characterData.name,
    category: characterData.category.toUpperCase(),
    emoji: characterData.emoji || generateEmoji(characterData.name, characterData.category.toUpperCase()),
    anime: characterData.anime,
    image: characterData.image || detectImage(characterData.name),
    title: characterData.title || `Personaje de ${characterData.anime}`,
    order: characters.length + 1
  };

  // Agregar al array
  characters.push(newCharacter);

  // Guardar
  const newContent = `// Lista de personajes anime para Proyecto Piece
// Total: ${characters.length} personajes
// Actualizado: ${new Date().toLocaleString()}

const characters = ${JSON.stringify(characters, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = characters;
}
`;

  fs.writeFileSync(DATA_FILE, newContent);

  console.log(`${colors.green}✅ Personaje agregado exitosamente:${colors.reset}`);
  console.log(`   📛 Nombre: ${newCharacter.name}`);
  console.log(`   🎭 Anime: ${newCharacter.anime}`);
  console.log(`   🏷️  Categoría: ${newCharacter.category}`);
  console.log(`   🖼️  Imagen: ${newCharacter.image || 'No detectada'}`);
  console.log(`   🔢 ID: ${newCharacter._id}`);
  console.log(`\n${colors.yellow}⚠️  Recuerda:${colors.reset}`);
  console.log(`   1. Subir la imagen a images/ si no existe: ${sanitizeFilename(newCharacter.name)}.png`);
  console.log(`   2. Ejecutar: npx convex dev (para subir a Convex)`);
  console.log(`   3. O usar: node migrate-to-convex.js (si tienes migrador)`);

  return true;
}

function interactiveMode() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const questions = [
    { key: 'name', label: '📛 Nombre del personaje', validate: v => v.length > 0 },
    { key: 'anime', label: '🎬 Anime de origen', validate: v => v.length > 0 },
    { key: 'category', label: '🏷️  Categoría (MELEE/ESPADA/MAGIA)', validate: v => ['MELEE', 'ESPADA', 'MAGIA'].includes(v.toUpperCase()) },
    { key: 'title', label: '✨ Título/descripción (opcional)', optional: true },
    { key: 'emoji', label: '🎭 Emoji (opcional, ej: ⚔️)', optional: true }
  ];

  const answers = {};

  function ask(index) {
    if (index >= questions.length) {
      readline.close();
      addCharacter(answers);
      return;
    }

    const q = questions[index];
    const optional = q.optional ? ' (opcional)' : '';
    readline.question(`${q.label}${optional}: `, answer => {
      if (!q.optional && !q.validate(answer)) {
        console.log(`${colors.red}❌ Respuesta inválida${colors.reset}`);
        ask(index);
        return;
      }

      if (answer || q.optional) {
        answers[q.key] = answer;
      }
      ask(index + 1);
    });
  }

  console.log(`${colors.blue}\n🎮 Modo Interactivo - Agregar Personaje\n${colors.reset}`);
  ask(0);
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  printHelp();
  console.log(`${colors.yellow}Iniciando modo interactivo...${colors.reset}\n`);
  interactiveMode();
} else if (args[0] === '--help' || args[0] === '-h') {
  printHelp();
} else if (args[0] === '--interactive' || args[0] === '-i') {
  interactiveMode();
} else if (args[0] === '--json' || args[0] === '-j') {
  try {
    const data = JSON.parse(args[1]);
    if (!data.name || !data.category || !data.anime) {
      console.error(`${colors.red}❌ Error: name, category y anime son requeridos${colors.reset}`);
      process.exit(1);
    }
    addCharacter(data);
  } catch (e) {
    console.error(`${colors.red}❌ Error parseando JSON: ${e.message}${colors.reset}`);
    process.exit(1);
  }
} else {
  // Modo rápido: node add-character.js "Nombre" "Categoria" "Anime" "Titulo"
  const [name, category, anime, title] = args;
  if (!name || !category || !anime) {
    console.error(`${colors.red}❌ Error: Uso incorrecto${colors.reset}`);
    printHelp();
    process.exit(1);
  }
  addCharacter({ name, category, anime, title });
}
