# 🗳️ Sistema de Votación Multijugador - Personajes de Anime

Un sistema de votación web para elegir personajes favoritos de anime con modo individual y multijugador.

## 🎮 Características

### Modo Individual
- Sistema de swipe tipo Tinder (derecha = SÍ, izquierda = NO)
- 150 personajes de anime organizados en 3 categorías:
  - **MELEE** (Luchadores cuerpo a cuerpo)
  - **ESPADA** (Espadachines)
  - **MAGIA** (Usuarios de magia)
- Fotos reales de los personajes
- Títulos/epítetos de cada personaje obtenidos de wikis oficiales
- Controles: flechas del teclado o teclas A/D

### Modo Multijugador (Nuevo)
- Crear salas con código único
- Múltiples jugadores votan simultáneamente
- Sistema de mayoría: se requiere 50%+1 votos para aprobar
- Host controla el inicio de la votación
- Resultados en tiempo real
- Soporte para 2-10 jugadores

## 🚀 Instalación y Uso

### Requisitos
- Node.js (v14 o superior)
- Navegador web moderno

### Instalación
```bash
npm install
```

### Iniciar el servidor
```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
roblokvote/
├── index.html          # Modo individual
├── lobby.html          # Interfaz multijugador
├── lobby.js           # Lógica del cliente multijugador
├── server.js          # Servidor Node.js + Socket.io
├── app.js             # Lógica del modo individual
├── data.js            # Datos de los 150 personajes
├── images/            # Fotos de los personajes
├── scraper.py         # Script para obtener imágenes y datos
└── README.md
```

## 🎯 Cómo Usar

### Modo Individual
1. Abre `http://localhost:3000`
2. Haz swipe o usa las teclas A/D para votar
3. Al finalizar, descarga tus resultados

### Modo Multijugador
1. Abre `http://localhost:3000/lobby.html`
2. **Crear Sala**: Define tu nombre y cantidad de jugadores
3. **Unirse**: Ingresa el código de 6 caracteres
4. El host inicia cuando todos están listos
5. Cada personaje se aprueba por mayoría de votos
6. Al finalizar, se muestran los personajes aprobados por categoría

## 📝 Sistema de Votación Multijugador

- **Aprobación**: Requiere mayoría simple (50% + 1)
- Ejemplo con 3 jugadores: necesita 2 votos SÍ
- Ejemplo con 4 jugadores: necesita 3 votos SÍ
- Ejemplo con 5 jugadores: necesita 3 votos SÍ

## 🎨 Personajes Incluidos

Los 150 personajes provienen de:
- One Piece, Naruto, Dragon Ball
- Jujutsu Kaisen, Hunter x Hunter, Demon Slayer
- My Hero Academia, Bleach, Attack on Titan
- One Punch Man, Chainsaw Man, Black Clover
- Fairy Tail, Sword Art Online, Re:Zero
- Overlord, Seven Deadly Sins, JoJo
- Fate, Mushoku Tensei, Slime, Berserk
- Inuyasha, Madoka Magica, Sailor Moon
- Konosuba, Frieren, Mashle, y más...

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Backend**: Node.js, Express, Socket.io
- **Web Scraping**: Python + BeautifulSoup + AniList API

## 📄 Licencia

MIT
