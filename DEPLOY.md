# 🚀 Instrucciones para Subir a Internet

## Opción 1: Railway.app (RECOMENDADA)
Gratis, rápido, sin tarjeta de crédito.

### Pasos:
1. Ve a https://railway.app y crea una cuenta (puedes usar GitHub)
2. Crea un nuevo proyecto
3. Selecciona "Deploy from GitHub repo"
4. Sube este proyecto a GitHub:
   ```bash
   git init
   git add .
   git commit -m "Primer commit"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/roblokvote.git
   git push -u origin main
   ```
5. Conecta tu repo en Railway
6. Railway detectará automáticamente el `railway.toml`
7. Obtendrás una URL como: `https://roblokvote-production.up.railway.app`
8. **IMPORTANTE**: Ve a Settings > Public Networking y activa el dominio público

## Opción 2: Render.com
Gratis, sin tarjeta, pero más lento al iniciar.

### Pasos:
1. Ve a https://render.com y crea cuenta
2. Crea un "Web Service"
3. Conecta tu repo de GitHub
4. Selecciona "Node" como runtime
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Clic en "Create Web Service"
8. Obtendrás una URL como: `https://roblokvote.onrender.com`

## Opción 3: Glitch.com (Más fácil, pero duerme)
Ideal para pruebas rápidas.

### Pasos:
1. Ve a https://glitch.com
2. Crea cuenta
3. Clic en "New Project" > "Import from GitHub"
4. Pega la URL de tu repo
5. Glitch detectará automáticamente el servidor
6. URL será: `https://roblokvote.glitch.me`

⚠️ **Nota**: Glitch "duerme" después de 5 minutos sin uso. Tarda 5-10 segundos en despertar.

## Opción 4: Fly.io (Requiere tarjeta, pero muy bueno)
1. Instala flyctl: https://fly.io/docs/hands-on/install/
2. `fly auth login`
3. `fly launch` (en la carpeta del proyecto)
4. `fly deploy`

## 📋 Preparar el Proyecto

Antes de subir, asegúrate de tener estos archivos:
- `package.json` ✅
- `server.js` ✅
- `railway.toml` o `render.yaml` ✅
- `data.js` ✅
- `images/` con todas las fotos ✅

## 🔧 Cambiar el Puerto (si es necesario)

Si el servicio usa otro puerto, Railway/Render lo detectan automáticamente con la variable de entorno `PORT`.

El servidor ya está configurado para esto en `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

## 🌐 URL para Compartir

Una vez desplegado, comparte:
- **Home**: `https://tu-app.railway.app/`
- **Multijugador**: `https://tu-app.railway.app/lobby.html`

## ✅ Verificar que Funciona

1. Abre la URL del lobby
2. Crea una sala
3. En otro dispositivo/celular, únete con el código
4. Deberían poder votar juntos

## 🆘 Solución de Problemas

### Error "Cannot find module"
- Asegúrate de que `package.json` tiene:
  ```json
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1"
  }
  ```

### Las imágenes no cargan
- Verifica que la carpeta `images/` esté en el repo
- El tamaño total no debe exceder el límite gratuito (generalmente 1GB)

### El modo multijugador no conecta
- Revisa los logs del servicio
- Asegúrate que WebSockets estén habilitados (Railway y Render lo soportan)

## 📦 Archivos a Incluir en Git

```bash
git add .
git add images/
git commit -m "Proyecto listo para deploy"
```

**NO incluir:**
- `node_modules/` (añadir a `.gitignore`)
- Archivos temporales

## 🎉 Listo!

Una vez desplegado, tendrás una URL permanente para compartir con amigos.
