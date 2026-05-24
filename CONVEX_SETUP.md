# Configuración de Convex para Proyecto Piece

## Paso 1: Crear cuenta en Convex

1. Ve a https://convex.dev
2. Crea una cuenta gratuita (puedes usar GitHub)
3. Crea un nuevo proyecto llamado "proyectopiece"

## Paso 2: Obtener URL del proyecto

1. En el dashboard de Convex, ve a **Settings**
2. Copia la **Deployment URL** (empieza con `https://...`)

## Paso 3: Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```
VITE_CONVEX_URL=https://tu-proyecto.convex.cloud
```

## Paso 4: Instalar dependencias

```bash
npm install convex
```

## Paso 5: Inicializar Convex

```bash
npx convex dev
```

Esto subirá automáticamente el schema y las funciones de la carpeta `/convex`.

## Paso 6: Actualizar index.html

Reemplaza el `data.js` actual con la versión que usa Convex (te la daré después).

## Estructura creada

- `convex/schema.ts` - Define las tablas de la base de datos
- `convex/votes.ts` - Funciones para guardar/leer votos
- `convex-client.js` - Cliente de Convex para el frontend

## Funcionalidades

Con Convex tendrás:

- ✅ Resultados globales en tiempo real
- ✅ Todos los votantes ven los mismos datos
- ✅ No necesitas servidor Node.js (Static Site funciona)
- ✅ Gratuito para uso moderado

## Precios

- **Gratis**: 1M funciones/mes, 1GB storage (suficiente para miles de votos)
- **Pro**: $25/mes para proyectos grandes

## Verificación

Después de configurar, abre `convex-integration.html` en tu navegador para verificar que todo funciona.
