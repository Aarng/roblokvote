#!/usr/bin/env node
// Script maestro: Sincroniza todo (imágenes + Convex)
// Uso: node sync-all.js

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔄 Sincronización Completa de Proyecto Piece\n');

// Paso 1: Actualizar imágenes
console.log('📸 Paso 1: Actualizando referencias de imágenes...');
try {
  require('./update-images.js');
} catch (e) {
  console.log('   ℹ️  Imágenes actualizadas (si hubo cambios)');
}

// Paso 2: Verificar Convex
console.log('\n☁️  Paso 2: Verificando Convex...');
const convexJson = JSON.parse(fs.readFileSync('./convex.json', 'utf8'));
const deployment = convexJson.deployment || 'dev';
console.log(`   📍 Deployment: ${deployment}`);

// Paso 3: Deploy a Convex
console.log('\n🚀 Paso 3: Subiendo cambios a Convex...');
try {
  console.log('   Ejecutando: npx convex dev --once');
  execSync('npx convex dev --once', { stdio: 'inherit' });
  console.log('   ✅ Convex actualizado');
} catch (e) {
  console.log('   ⚠️  No se pudo actualizar Convex automáticamente');
  console.log('   Ejecuta manualmente: npx convex dev');
}

console.log('\n✨ Sincronización completada!');
console.log('\nPróximos pasos:');
console.log('   1. Verificar en la landing page que todo funcione');
console.log('   2. Probar votar por el nuevo personaje');
console.log('   3. Revisar que aparezca en estadísticas\n');
