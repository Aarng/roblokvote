# Subir Imágenes a Convex Storage

## Método Manual (Recomendado)

### Paso 1: Acceder al Dashboard
1. Ve a [https://dashboard.convex.dev](https://dashboard.convex.dev)
2. Selecciona tu proyecto

### Paso 2: Subir Archivos
1. Navega a la pestaña **"Files"** (Storage)
2. Haz clic en **"Upload File"** o arrastra archivos
3. Selecciona la imagen de tu computadora

### Paso 3: Obtener URL
Una vez subida, verás la imagen en la lista con una URL como:
```
https://hallowed-badger-330.convex.cloud/api/storage/305f4997-1d3c-41d0-8376-3ae80f6edb65
```

### Paso 4: Actualizar Personaje
1. Ve a **Data** → **characters**
2. Busca el personaje (ej: Kirito)
3. Haz clic en el documento para editar
4. En el campo `image`, pega la URL de Convex Storage
5. Guarda los cambios

---

## Método Automático (con CLI)

Si tienes configurado el CLI de Convex:

```bash
# Instalar herramienta de storage (si no la tienes)
npm install -g @convex-dev/cli

# Subir archivo
npx convex file upload images/Kirito.png

# Te devolverá la URL
```

---

## Ejemplo de Actualización

**Antes:**
```json
{
  "name": "Kirito",
  "image": "images/Kirito.png"
}
```

**Después:**
```json
{
  "name": "Kirito",
  "image": "https://hallowed-badger-330.convex.cloud/api/storage/305f4997-1d3c-41d0-8376-3ae80f6edb65"
}
```

---

## Lista de Imágenes a Subir

Ver `convex-storage-upload-guide.txt` para la lista completa.

O ejecuta:
```bash
node upload-to-convex-storage.js
```

---

## Notas Importantes

- Las URLs de Convex Storage son **permanentes** (no expiran)
- Una vez subida la imagen, no necesitas volver a subirla
- El tamaño máximo de archivo es de **5MB**
- Formatos soportados: PNG, JPG, GIF, WebP
