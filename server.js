const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Cargar datos de personajes
const { candidates, categories } = require('./data.js');
console.log(`Servidor cargado con ${candidates.length} personajes`);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'] // Permitir fallback a polling
});

// Trust proxy para Railway
app.set('trust proxy', 1);

// Middleware para parsear JSON
app.use(express.json());

// Healthcheck para Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), lobbies: lobbies.size });
});

// API REST para iniciar votación (fallback)
app.post('/api/start-voting', (req, res) => {
  const { lobbyCode, socketId } = req.body;
  console.log(`[HTTP API] Solicitud start-voting: lobby=${lobbyCode}, socket=${socketId}`);

  const lobby = lobbies.get(lobbyCode);
  if (!lobby) {
    return res.status(404).json({ error: 'Lobby no encontrado' });
  }

  if (lobby.players.size < 2) {
    return res.status(400).json({ error: 'Se necesitan al menos 2 jugadores' });
  }

  lobby.status = 'voting';
  lobby.currentCharacterIndex = 0;

  io.to(lobby.code).emit('voting-started', {
    totalCharacters: candidates.length,
    players: Array.from(lobby.players.values())
  });

  sendNextCharacter(lobby);

  console.log(`[HTTP API] Votación iniciada en ${lobby.code}`);
  res.json({ success: true, message: 'Votación iniciada' });
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Almacenamiento de lobbies
const lobbies = new Map();

// Generar código de lobby aleatorio
function generateLobbyCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Estructura de un lobby
function createLobby(hostId, maxPlayers) {
  return {
    code: generateLobbyCode(),
    hostId: hostId,
    maxPlayers: parseInt(maxPlayers),
    players: new Map(), // socketId -> {name, ready}
    currentCharacterIndex: 0,
    currentVotes: new Map(), // characterIndex -> {socketId -> vote}
    results: [], // {character, approved, votes}
    status: 'waiting', // waiting, voting, finished
    createdAt: Date.now()
  };
}

io.on('connection', (socket) => {
  console.log('=== NUEVO JUGADOR CONECTADO:', socket.id, '===');

  // Listar todos los eventos registrados
  socket.onAny((eventName, ...args) => {
    console.log(`[SOCKET EVENT] ${eventName} de ${socket.id}`, args);
  });

  // Manejar errores en el socket individual
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });

  // Crear un nuevo lobby
  socket.on('create-lobby', ({ playerName, maxPlayers }) => {
    console.log(`[DEBUG] create-lobby recibido: playerName=${playerName}, maxPlayers=${maxPlayers}`);

    if (!playerName || !maxPlayers) {
      console.error('[DEBUG] Datos invalidos:', { playerName, maxPlayers });
      socket.emit('error', 'Datos invalidos');
      return;
    }

    const lobby = createLobby(socket.id, maxPlayers);
    lobby.players.set(socket.id, { name: playerName, ready: true });
    lobbies.set(lobby.code, lobby);

    socket.join(lobby.code);
    socket.lobbyCode = lobby.code;

    console.log(`[DEBUG] Lobby creado: ${lobby.code}, jugadores: ${lobby.players.size}`);

    socket.emit('lobby-created', {
      code: lobby.code,
      maxPlayers: lobby.maxPlayers,
      players: Array.from(lobby.players.values())
    });

    console.log(`Lobby ${lobby.code} creado por ${playerName}`);
  });

  // Unirse a un lobby existente
  socket.on('join-lobby', ({ code, playerName }) => {
    const lobby = lobbies.get(code.toUpperCase());

    if (!lobby) {
      socket.emit('error', 'Lobby no encontrado');
      return;
    }

    if (lobby.players.size >= lobby.maxPlayers) {
      socket.emit('error', 'Lobby lleno');
      return;
    }

    if (lobby.status !== 'waiting') {
      socket.emit('error', 'La votación ya comenzó');
      return;
    }

    lobby.players.set(socket.id, { name: playerName, ready: true });
    socket.join(code.toUpperCase());
    socket.lobbyCode = code.toUpperCase();

    // Notificar al jugador que se unió
    socket.emit('lobby-joined', {
      code: lobby.code,
      maxPlayers: lobby.maxPlayers,
      players: Array.from(lobby.players.values()),
      isHost: false
    });

    // Notificar a todos los demás jugadores
    socket.to(code.toUpperCase()).emit('player-joined', {
      players: Array.from(lobby.players.values()),
      currentCount: lobby.players.size,
      maxPlayers: lobby.maxPlayers
    });

    console.log(`${playerName} se unió al lobby ${code}`);
  });

  // Iniciar la votación (solo host)
  socket.on('start-voting', () => {
    console.log(`[DEBUG] start-voting recibido de socket: ${socket.id}`);
    console.log(`[DEBUG] socket.lobbyCode: ${socket.lobbyCode}`);

    const lobby = lobbies.get(socket.lobbyCode);

    if (!lobby) {
      console.error(`[DEBUG] Lobby no encontrado: ${socket.lobbyCode}`);
      socket.emit('error', 'Lobby no encontrado');
      return;
    }

    if (lobby.hostId !== socket.id) {
      console.error(`[DEBUG] No autorizado: host=${lobby.hostId}, socket=${socket.id}`);
      socket.emit('error', 'No autorizado - Solo el host puede iniciar');
      return;
    }

    if (lobby.players.size < 2) {
      console.error(`[DEBUG] Jugadores insuficientes: ${lobby.players.size}`);
      socket.emit('error', 'Se necesitan al menos 2 jugadores');
      return;
    }

    lobby.status = 'voting';
    lobby.currentCharacterIndex = 0;

    console.log(`[DEBUG] Iniciando votación en lobby ${lobby.code} con ${lobby.players.size} jugadores`);

    // Notificar a todos los jugadores
    io.to(lobby.code).emit('voting-started', {
      totalCharacters: candidates.length,
      players: Array.from(lobby.players.values())
    });

    // Enviar primer personaje
    sendNextCharacter(lobby);

    console.log(`Votación iniciada en lobby ${lobby.code}`);
  });

  // Recibir voto de un jugador
  socket.on('vote', ({ vote }) => {
    console.log(`[VOTE] Voto recibido de ${socket.id}: ${vote ? 'SI' : 'NO'}`);

    const lobby = lobbies.get(socket.lobbyCode);

    if (!lobby) {
      console.error(`[VOTE] Lobby no encontrado para socket ${socket.id}`);
      return;
    }

    if (lobby.status !== 'voting') {
      console.error(`[VOTE] Lobby ${lobby.code} no está en modo voting (status: ${lobby.status})`);
      return;
    }

    // Guardar voto
    const charIndex = lobby.currentCharacterIndex;
    if (!lobby.currentVotes.has(charIndex)) {
      lobby.currentVotes.set(charIndex, new Map());
    }
    lobby.currentVotes.get(charIndex).set(socket.id, vote);

    const votes = lobby.currentVotes.get(charIndex);
    console.log(`[VOTE] Votos: ${votes.size}/${lobby.players.size} para personaje ${charIndex + 1}`);

    // Verificar si todos votaron
    if (votes.size === lobby.players.size) {
      // Calcular resultado
      const result = calculateResult(votes, lobby.players.size);

      // Guardar resultado
      const currentCharacter = candidates[charIndex];
      lobby.results.push({
        character: currentCharacter,
        approved: result.approved,
        yesVotes: result.yesCount,
        noVotes: result.noCount,
        totalPlayers: lobby.players.size
      });

      console.log(`[VOTE] Resultado: ${result.approved ? 'APROBADO' : 'RECHAZADO'} - ${currentCharacter.name} (${result.yesCount} SI, ${result.noCount} NO)`);

      // Notificar a todos
      io.to(lobby.code).emit('vote-result', {
        character: currentCharacter,
        approved: result.approved,
        yesVotes: result.yesCount,
        noVotes: result.noCount,
        requiredVotes: Math.ceil(lobby.players.size / 2),
        nextIn: 3000
      });

      // Esperar y enviar siguiente personaje
      setTimeout(() => {
        lobby.currentCharacterIndex++;
        console.log(`[VOTE] Enviando siguiente personaje: ${lobby.currentCharacterIndex + 1}/${candidates.length}`);
        if (lobby.currentCharacterIndex < candidates.length) {
          sendNextCharacter(lobby);
        } else {
          finishVoting(lobby);
        }
      }, 3000);
    } else {
      // Notificar que alguien votó pero falta gente
      io.to(lobby.code).emit('vote-progress', {
        voted: votes.size,
        total: lobby.players.size,
        votedPlayers: Array.from(votes.keys()).map(id => lobby.players.get(id)?.name || 'Desconocido')
      });
    }
  });

  // Desconexión
  socket.on('disconnect', () => {
    const lobby = lobbies.get(socket.lobbyCode);
    if (lobby) {
      const playerName = lobby.players.get(socket.id)?.name;
      lobby.players.delete(socket.id);

      // Si el host se fue, cerrar el lobby
      if (lobby.hostId === socket.id) {
        io.to(lobby.code).emit('lobby-closed', 'El host abandonó el lobby');
        lobbies.delete(lobby.code);
      } else {
        socket.to(lobby.code).emit('player-left', {
          players: Array.from(lobby.players.values()),
          playerName: playerName
        });
      }
    }
    console.log('Jugador desconectado:', socket.id);
  });
});

function sendNextCharacter(lobby) {
  const candidates = candidates;
  const character = candidates[lobby.currentCharacterIndex];

  io.to(lobby.code).emit('new-character', {
    index: lobby.currentCharacterIndex,
    total: candidates.length,
    character: character
  });
}

function calculateResult(votes, totalPlayers) {
  let yesCount = 0;
  let noCount = 0;

  for (const vote of votes.values()) {
    if (vote) yesCount++;
    else noCount++;
  }

  // Mayoría simple: más de la mitad
  const required = Math.ceil(totalPlayers / 2);
  const approved = yesCount >= required;

  return { approved, yesCount, noCount };
}

function finishVoting(lobby) {
  lobby.status = 'finished';

  // Generar estadísticas
  const approvedCount = lobby.results.filter(r => r.approved).length;
  const rejectedCount = lobby.results.length - approvedCount;

  // Agrupar por categoría
  const byCategory = {};
  for (const result of lobby.results) {
    const cat = result.character.category;
    if (!byCategory[cat]) byCategory[cat] = [];
    if (result.approved) {
      byCategory[cat].push(result.character);
    }
  }

  io.to(lobby.code).emit('voting-finished', {
    totalCharacters: lobby.results.length,
    approved: approvedCount,
    rejected: rejectedCount,
    byCategory: byCategory,
    results: lobby.results
  });

  console.log(`Votación finalizada en lobby ${lobby.code}`);
}

// Manejo de errores para prevenir crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
