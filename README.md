# ⚔️ Proyecto Piece - Anime Action RPG Voting

Sistema de votación para personajes de anime. La comunidad decide qué personajes formarán parte de nuestro juego Action RPG en Roblox.

## 🎮 Características

- **123 personajes** de anime organizados en 3 categorías:
  - **MELEE** (Luchadores cuerpo a cuerpo)
  - **ESPADA** (Espadachines)
  - **MAGIA** (Usuarios de magia/poderes)

- **Sistema de votación tipo Tinder**: Desliza o usa botones para votar SÍ/NO
- **Guardado de progreso**: Puedes cerrar y volver después, tu progreso se guarda
- **Estadísticas globales**: Solo cuentan votos de usuarios que completaron toda la votación
- **Recomendaciones**: La comunidad puede sugerir nuevos personajes
- **Landing page dinámica**: Personajes destacados rotan cada 20 segundos

## 📁 Estructura del Proyecto

```
roblokvote/
├── index.html              # Landing page principal
├── vote.html               # Sistema de votación
├── status.html             # Estadísticas globales
├── recommendations.html    # Ranking de recomendaciones
├── statusadmin.html        # Panel admin (proteger en producción)
├── app-convex.js          # Lógica de votación
├── convex-client.js       # Cliente Convex
├── data.js                # Datos de los 123 personajes
├── images/                # Imágenes de personajes (123 archivos)
├── convex/                # Backend Convex
│   ├── schema.ts
│   ├── votes.ts
│   ├── recommendations.ts
│   └── characters.ts
└── update-images.js       # Script para actualizar imágenes
└── add-character.js       # Script para agregar personajes
```

## 🚀 Uso

### Desarrollo local
```bash
npm install
npx convex dev
```

### Scripts útiles

**Actualizar imágenes:**
```bash
node update-images.js
```
Escannea la carpeta `images/` y actualiza `data.js` con las rutas correctas.

**Agregar personaje nuevo:**
```bash
# Modo interactivo
node add-character.js -i

# Modo rápido
node add-character.js "Guts" "ESPADA" "Berserk" "El Espadachín Negro"

# JSON
node add-character.js -j '{"name":"Guts","category":"ESPADA","anime":"Berserk","title":"Espadachín Negro"}'
```

## 📝 Flujo de Datos

1. Los personajes están en `data.js` (usado para referencia)
2. Los votos se guardan en **Convex** (base de datos serverless)
3. Las imágenes deben estar en `images/Nombre_Personaje.png`

### Para agregar un personaje nuevo:

1. **Subir imagen** a `images/` (formato: PNG, JPG)
   - Nombre del archivo = nombre del personaje con guiones bajos
   - Ejemplo: `Son_Goku.png`, `Roronoa_Zoro.png`

2. **Ejecutar:**
   ```bash
   node add-character.js -i
   ```
   O editar manualmente `data.js`

3. **Migrar a Convex:**
   ```bash
   npx convex dev
   # Luego en el dashboard de Convex, insertar el personaje
   ```

## 🔧 Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Backend**: Convex (serverless database)
- **Hosting**: Recomendado Netlify/Vercel (estático)
- **Base de datos**: Convex (real-time, serverless)

## 🛡️ Configuración de Producción

Antes de deploy:

1. **Proteger admin panel:**
   - Renombrar `statusadmin.html` a algo aleatorio
   - O agregar autenticación básica

2. **Variables de entorno (.env):**
   ```
   CONVEX_URL=tu-url-de-convex
   ```

3. **Deploy Convex:**
   ```bash
   npx convex deploy
   ```

4. **Deploy frontend:**
   ```bash
   # Subir archivos HTML/JS a Netlify/Vercel
   # Excluir: node_modules, .claude, archivos .bat/.ps1
   ```

## 📄 Licencia

MIT - Proyecto comunitario de fans del anime.

---

**Nota:** Este es un proyecto de fans. No afiliado con los creadores de los animes mencionados.
