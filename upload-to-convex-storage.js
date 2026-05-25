#!/usr/bin/env node
// Script para subir imágenes a Convex Storage y actualizar URLs
// Requiere: npm install @convex-dev/cli (o usar el dashboard)

const fs = require('fs');
const path = require('path');

const DATA_FILE = './data.js';
const IMAGES_DIR = './images';

console.log('📤 Este script requiere subir imágenes manualmente al dashboard de Convex');
console.log('\nInstrucciones:');
console.log('1. Ve a https://dashboard.convex.dev');
console.log('2. Ve a la pestaña "Files" o "Storage"');
console.log('3. Arrastra las imágenes o usa "Upload File"');
console.log('4. Copia la URL generada para cada imagen');
console.log('5. Pégala en el campo "image" del personaje correspondiente\n');

// Cargar datos para mostrar qué imágenes necesitan URL
const dataContent = fs.readFileSync(DATA_FILE, 'utf8');
const match = dataContent.match(/const candidates = (\[.*?\]);/s);

if (!match) {
    console.error('❌ Error: No se encontró el array de personajes');
    process.exit(1);
}

const characters = eval(match[1]);

console.log('📋 Lista de imágenes que necesitan subirse a Convex Storage:\n');
console.log('Personaje | Archivo Local | URL a poner en Convex');
console.log('----------|---------------|---------------------');

characters.forEach((char, index) => {
    const filename = path.basename(char.image || '');
    const localPath = path.join(IMAGES_DIR, filename);
    const exists = fs.existsSync(localPath);

    if (exists) {
        console.log(`${index + 1}. ${char.name} | ${filename} | (subir y copiar URL)`);
    }
});

console.log('\n💡 Tip: Después de subir cada imagen, copia la URL y actualiza el personaje en:');
console.log('   Dashboard → Data → characters → [personaje] → campo "image"\n');

// Generar archivo de referencia
const referenceFile = 'convex-storage-upload-guide.txt';
const content = `Guía para subir imágenes a Convex Storage

Fecha: ${new Date().toLocaleString()}

Para cada personaje:
1. Ve al dashboard de Convex
2. Ve a Files/Storage
3. Sube la imagen: images/[nombre].png
4. Copia la URL generada
5. Ve a Data → characters
6. Busca el personaje
7. Pega la URL en el campo "image"

Lista de archivos a subir:
${characters.map(c => `- ${c.name}: ${c.image || 'N/A'}`).join('\n')}
`;

fs.writeFileSync(referenceFile, content);
console.log(`📄 Guía guardada en: ${referenceFile}`);
