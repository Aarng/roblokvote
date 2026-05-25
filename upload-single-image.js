#!/usr/bin/env node
// Script para subir una imagen específica a Convex Storage
// Uso: node upload-single-image.js [nombre-personaje]

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const personaje = process.argv[2] || 'Kirito';
const imageFile = `${personaje}.png`;
const imagePath = path.join(__dirname, 'images', imageFile);

console.log(`📤 Subiendo imagen de ${personaje}...\n`);

// Verificar que existe
if (!fs.existsSync(imagePath)) {
    console.error(`❌ Error: No existe ${imagePath}`);
    console.log('\nArchivos disponibles:');
    const files = fs.readdirSync(path.join(__dirname, 'images'))
        .filter(f => f.toLowerCase().includes(personaje.toLowerCase()));
    files.forEach(f => console.log(`   - ${f}`));
    process.exit(1);
}

// Subir a Convex
try {
    console.log('⏳ Ejecutando: npx convex file upload...\n');

    const result = execSync(
        `npx convex file upload "${imagePath}" --name "${imageFile}"`,
        {
            encoding: 'utf8',
            stdio: 'pipe',
            cwd: __dirname
        }
    );

    console.log('✅ Imagen subida exitosamente!');
    console.log('\n📝 Resultado:');
    console.log(result);

    // Extraer URL del resultado (si está en el formato esperado)
    const urlMatch = result.match(/(https:\/\/[^\s]+)/);
    if (urlMatch) {
        console.log('\n🔗 URL de Storage:', urlMatch[1]);
        console.log('\n⚠️  IMPORTANTE: Copia esta URL y actualiza el personaje en Convex Dashboard');
    }

} catch (error) {
    console.error('\n❌ Error al subir imagen:');
    console.error(error.message);
    console.log('\n💡 Posibles soluciones:');
    console.log('   1. Verifica que Convex CLI esté instalado: npm install -g convex');
    console.log('   2. Inicia sesión: npx convex login');
    console.log('   3. Asegúrate que el servidor Convex esté corriendo: npx convex dev');
    console.log('   4. O ejecuta: npx convex deploy (si estás en producción)');
}
