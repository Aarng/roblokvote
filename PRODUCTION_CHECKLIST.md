# 🚀 Checklist para Producción - Proyecto Piece

## Estado Actual del Proyecto
- ✅ 123 personajes configurados
- ✅ Sistema de votación con guardado de progreso
- ✅ Landing page con personajes dinámicos
- ✅ Estadísticas globales
- ✅ Sistema de recomendaciones
- ✅ Imágenes en Convex Storage (algunas subidas)

---

## 📋 Tareas Pendientes para Producción

### 1. Convex Backend (Crítico)

- [ ] **Deploy de Convex a producción**
  ```bash
  npx convex deploy
  ```
  
- [ ] **Verificar URLs de imágenes en Convex Storage**
  - Revisar que todas las imágenes estén subidas
  - Comando para verificar: `node upload-images-auto.mjs`
  - Si falta alguna: `node upload-images-auto.mjs "Nombre Personaje"`

- [ ] **Confirmar schema en producción**
  - Verificar tabla `characters` tiene campo `storageId`
  - Verificar tabla `votes` tiene campo `sessionCompleted`

### 2. Variables de Entorno

- [ ] **Crear archivo `.env.production`**
  ```
  VITE_CONVEX_URL=https://tu-proyecto.convex.cloud
  ```

- [ ] **Verificar que `.env.local` no se suba a Git**
  - Revisar `.gitignore` incluye `.env.local`

### 3. Seguridad del Admin Panel

- [ ] **Proteger `statusadmin.html`**
  - **Opción A (Recomendada):** Renombrar a URL aleatoria
    ```bash
    # Ejemplo:
    mv statusadmin.html admin-x8k9m2.html
    ```
  - **Opción B:** Agregar autenticación simple con PIN

### 4. Optimizaciones Frontend

- [ ] **Verificar todas las imágenes cargan**
  - Revisar en landing page
  - Revisar en sistema de votación

- [ ] **Agregar meta tags SEO en `index.html`**
  ```html
  <meta name="description" content="Proyecto Piece - Vota por personajes de anime para nuestro Action RPG en Roblox">
  <meta property="og:title" content="Proyecto Piece - Anime Action RPG">
  <meta property="og:image" content="URL-de-tu-imagen">
  ```

- [ ] **Verificar versión de scripts**
  - Asegurar que `convex-client.js` y `app-convex.js` tengan `?v=X` actualizado

### 5. Testing Pre-Producción

- [ ] **Test de votación completo**
  - [ ] Votar algunos personajes
  - [ ] Cerrar pestaña
  - [ ] Volver y verificar continúa donde quedó
  - [ ] Completar votación
  - [ ] Verificar que aparece en estadísticas

- [ ] **Test de recomendaciones**
  - [ ] Enviar recomendación
  - [ ] Verificar aparece en ranking

- [ ] **Test responsive**
  - [ ] Probar en móvil
  - [ ] Probar en tablet
  - [ ] Probar en desktop

### 6. Hosting

- [ ] **Elegir proveedor de hosting**
  - **Opción A (Recomendada):** Netlify (gratis, dominio custom, muy fácil)
  - **Opción B:** Vercel (gratis, muy rápido)
  - **Opción C:** Cloudflare Pages (gratis, CDN global)

- [ ] **Configurar dominio (opcional)**
  - Comprar dominio si se quiere personalizado
  - Configurar DNS apuntando al hosting

- [ ] **Subir archivos al hosting**
  ```
  Archivos a subir:
  - index.html
  - vote.html
  - status.html
  - recommendations.html
  - statusadmin.html (con nombre seguro)
  - app-convex.js
  - convex-client.js
  - data.js
  - Carpeta images/ (si no están todas en Convex Storage)
  ```

### 7. Post-Deploy

- [ ] **Verificar sitio en producción**
  - [ ] Landing page carga
  - [ ] Personajes se ven
  - [ ] Votación funciona
  - [ ] Estadísticas se actualizan

- [ ] **Testear flujo completo**
  - Desde landing → votación → completar → estadísticas

- [ ] **Monitoreo**
  - Revisar Convex dashboard por errores
  - Verificar uso de storage

---

## 🎯 Orden Recomendado de Ejecución

### Fase 1: Preparación (30 min)
1. Subir todas las imágenes restantes a Convex Storage
2. Verificar schema y deploy de Convex
3. Renombrar admin panel

### Fase 2: Testing (20 min)
4. Testing completo en local
5. Verificar todas las funcionalidades

### Fase 3: Deploy (15 min)
6. Crear cuenta en Netlify/Vercel
7. Subir archivos
8. Configurar variables de entorno

### Fase 4: Verificación (15 min)
9. Testear sitio en producción
10. Compartir URL para testing

---

## 🆘 Troubleshooting

### Problema: Las imágenes no se ven en producción
**Solución:** Verificar que todas las imágenes estén subidas a Convex Storage y las URLs estén guardadas en los personajes.

### Problema: Los votos no se guardan
**Solución:** Verificar que `VITE_CONVEX_URL` apunte al deployment correcto.

### Problema: Error de CORS
**Solución:** Convex ya maneja CORS, pero verificar que el dominio del hosting esté permitido.

---

## 📞 Recursos

- **Convex Dashboard:** https://dashboard.convex.dev
- **Documentación Convex:** https://docs.convex.dev
- **Netlify:** https://netlify.com
- **Vercel:** https://vercel.com

---

**Última actualización:** 2025-05-24
**Versión del proyecto:** 1.0
