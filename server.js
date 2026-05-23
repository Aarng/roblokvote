const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
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
  console.log('Nuevo jugador conectado:', socket.id);

  // Crear un nuevo lobby
  socket.on('create-lobby', ({ playerName, maxPlayers }) => {
    const lobby = createLobby(socket.id, maxPlayers);
    lobby.players.set(socket.id, { name: playerName, ready: true });
    lobbies.set(lobby.code, lobby);

    socket.join(lobby.code);
    socket.lobbyCode = lobby.code;

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
    const lobby = lobbies.get(socket.lobbyCode);

    if (!lobby || lobby.hostId !== socket.id) {
      socket.emit('error', 'No autorizado');
      return;
    }

    if (lobby.players.size < 2) {
      socket.emit('error', 'Se necesitan al menos 2 jugadores');
      return;
    }

    lobby.status = 'voting';
    lobby.currentCharacterIndex = 0;

    // Notificar a todos los jugadores
    io.to(lobby.code).emit('voting-started', {
      totalCharacters: require('./data.js').candidates.length,
      players: Array.from(lobby.players.values())
    });

    // Enviar primer personaje
    sendNextCharacter(lobby);

    console.log(`Votación iniciada en lobby ${lobby.code}`);
  });

  // Recibir voto de un jugador
  socket.on('vote', ({ vote }) => {
    const lobby = lobbies.get(socket.lobbyCode);

    if (!lobby || lobby.status !== 'voting') return;

    // Guardar voto
    const charIndex = lobby.currentCharacterIndex;
    if (!lobby.currentVotes.has(charIndex)) {
      lobby.currentVotes.set(charIndex, new Map());
    }
    lobby.currentVotes.get(charIndex).set(socket.id, vote);

    // Verificar si todos votaron
    const votes = lobby.currentVotes.get(charIndex);
    if (votes.size === lobby.players.size) {
      // Calcular resultado
      const result = calculateResult(votes, lobby.players.size);

      // Guardar resultado
      const candidates = require('./data.js').candidates;
      lobby.results.push({
        character: candidates[charIndex],
        approved: result.approved,
        yesVotes: result.yesCount,
        noVotes: result.noCount,
        totalPlayers: lobby.players.size
      });

      // Notificar a todos
      io.to(lobby.code).emit('vote-result', {
        character: candidates[charIndex],
        approved: result.approved,
        yesVotes: result.yesCount,
        noVotes: result.noCount,
        requiredVotes: Math.ceil(lobby.players.size / 2),
        nextIn: 3000
      });

      // Esperar y enviar siguiente personaje
      setTimeout(() => {
        lobby.currentCharacterIndex++;
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
  const candidates = require('./data.js').candidates;
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
