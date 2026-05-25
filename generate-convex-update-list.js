#!/usr/bin/env node
// Genera lista de personajes para actualizar manualmente en Convex
// Salida: convex-update-list.md (formato tabla)

const fs = require('fs');
const path = require('path');

const dataJs = fs.readFileSync('./data.js', 'utf8');
const match = dataJs.match(/const candidates = (\[.*?\]);/s);

if (!match) {
    console.error('❌ Error: No se encontró el array de personajes');
    process.exit(1);
}

const characters = eval(match[1]);

// Verificar qué imágenes existen
const imagesDir = './images';
const existingImages = fs.readdirSync(imagesDir)
    .filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
    .map(f => f.toLowerCase());

// Generar lista
const list = characters.map((char, index) => {
    const sanitizedName = char.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const possibleFiles = [
        `${sanitizedName}.png`.toLowerCase(),
        `${sanitizedName}.jpg`.toLowerCase(),
        `${char.name.replace(/\s+/g, '_')}.png`.toLowerCase()
    ];

    const imageExists = possibleFiles.some(f => existingImages.includes(f));
    const suggestedFile = `${sanitizedName}.png`;

    return {
        order: index + 1,
        name: char.name,
        category: char.category,
        anime: char.anime,
        currentImage: char.image || 'NO ASIGNADA',
        suggestedImage: `images/${suggestedFile}`,
        imageExists: imageExists ? '✅' : '❌'
    };
});

// Mostrar en consola
console.log('\n╔════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    LISTA DE PERSONAJES PARA ACTUALIZAR EN CONVEX                               ║');
console.log('╚════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

console.log('Orden | Nombre                      | Categoría | Imagen Actual              | Sugerida                   | Estado');
console.log('------|-----------------------------|-----------|----------------------------|----------------------------|--------');

list.forEach(item => {
    const name = item.name.padEnd(27).substring(0, 27);
    const current = item.currentImage.padEnd(26).substring(0, 26);
    const suggested = item.suggestedImage.padEnd(26).substring(0, 26);
    const category = item.category.padEnd(9);
    const order = String(item.order).padStart(5);

    console.log(`${order} | ${name} | ${category} | ${current} | ${suggested} | ${item.imageExists}`);
});

// Generar archivo Markdown
const mdContent = `# Lista para Actualizar Personajes en Convex

> Generado: ${new Date().toLocaleString()}

## Instrucciones

1. Abre el [Convex Dashboard](https://dashboard.convex.dev)
2. Ve a **Data** → **characters**
3. Edita cada personaje y actualiza el campo **image**
4. Usa la ruta sugerida de la columna "Sugerir Imagen"

---

## Lista Completa (${list.length} personajes)

| # | Nombre | Anime | Categoría | Imagen Actual | Sugerir Imagen | Estado |
|---|--------|-------|-----------|---------------|----------------|--------|
${list.map(item =>
    `| ${item.order} | ${item.name} | ${item.anime} | ${item.category} | ${item.currentImage} | ${item.suggestedImage} | ${item.imageExists} |`
).join('\n')}

---

## Resumen de Imágenes

- ✅ Imagen encontrada en carpeta: ${list.filter(i => i.imageExists === '✅').length}
- ❌ Imagen NO encontrada: ${list.filter(i => i.imageExists === '❌').length}

## Archivos esperados en carpeta images/

\`\`\`
${list.map(item => item.suggestedImage.replace('images/', '')).join('\n')}
\`\`\`
`;

fs.writeFileSync('CONVEX_UPDATE_LIST.md', mdContent);
console.log(`\n✅ Archivo guardado: CONVEX_UPDATE_LIST.md`);

// También generar CSV para importar en Excel
const csvContent = [
    'Orden,Nombre,Anime,Categoria,Imagen Actual,Sugerir Imagen,Estado',
    ...list.map(item =>
        `${item.order},"${item.name}","${item.anime}",${item.category},"${item.currentImage}","${item.suggestedImage}",${item.imageExists === '✅' ? 'Existe' : 'Falta'}`
    )
].join('\n');

fs.writeFileSync('CONVEX_UPDATE_LIST.csv', csvContent);
console.log(`📊 Archivo CSV: CONVEX_UPDATE_LIST.csv`);

// Generar lista de IDs de Convex (placeholder)
const withIds = list.map((item, idx) => ({
    ...item,
    convexId: `[ID-${String(idx + 1).padStart(4, '0')}]` // Placeholder, reemplazar con IDs reales
}));

console.log('\n📝 Para obtener los IDs reales de Convex:');
console.log('   1. Ve al dashboard de Convex');
console.log('   2. Data → characters');
console.log('   3. Exporta o copia los IDs manualmente');
console.log('\n💡 Tip: Pega los IDs en la columna correspondiente del CSV\n');
