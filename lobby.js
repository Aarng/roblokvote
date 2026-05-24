// Conexión Socket.io - detecta automáticamente el servidor
const socket = io(window.location.origin, {
  transports: ['websocket', 'polling'] // Fallback para compatibilidad
});

// Estado del juego
let currentLobby = null;
let isHost = false;
let currentCharacter = null;
let hasVoted = false;
let totalPlayers = 0;
let totalCharacters = candidates.length;
let isLoading = false; // Prevenir clicks duplicados

// Mostrar pantalla
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    hideError();
}

// Crear sala
function createLobby() {
    if (isLoading) return; // Prevenir clicks duplicados

    const name = document.getElementById('create-name').value.trim();
    const maxPlayers = parseInt(document.getElementById('max-players').value);

    if (!name) {
        showError('Por favor ingresa tu nombre');
        return;
    }

    if (maxPlayers < 2 || maxPlayers > 10) {
        showError('La cantidad de jugadores debe ser entre 2 y 10');
        return;
    }

    isLoading = true;
    const btn = document.querySelector('#screen-create .btn-primary');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Creando...';
    }

    socket.emit('create-lobby', { playerName: name, maxPlayers });
}

// Unirse a sala
function joinLobby() {
    if (isLoading) return; // Prevenir clicks duplicados

    const name = document.getElementById('join-name').value.trim();
    const code = document.getElementById('lobby-code').value.trim().toUpperCase();

    if (!name) {
        showError('Por favor ingresa tu nombre');
        return;
    }

    if (!code || code.length !== 6) {
        showError('Por favor ingresa un código válido de 6 caracteres');
        return;
    }

    isLoading = true;
    const btn = document.querySelector('#screen-join .btn-primary');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Uniendo...';
    }

    socket.emit('join-lobby', { code, playerName: name });
}

// Iniciar votación (solo host)
async function startVoting() {
    if (isLoading) return; // Prevenir clicks duplicados

    console.log('[CLIENT] Intentando iniciar votación, isHost:', isHost);
    if (!isHost) {
        console.error('[CLIENT] No eres el host, no puedes iniciar');
        return;
    }

    isLoading = true;
    const btn = document.getElementById('start-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Iniciando...';
    }

    console.log('[CLIENT] Emitiendo start-voting via WebSocket');

    // Intentar primero con WebSocket
    socket.emit('start-voting');

    // Re-habilitar después de 2 segundos si no hubo respuesta
    setTimeout(() => {
        if (isLoading) {
            isLoading = false;
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Iniciar Votación';
            }
        }
    }, 2000);
}

// Votar
function vote(voteValue) {
    if (hasVoted) return;

    hasVoted = true;
    document.getElementById('waiting-overlay').classList.add('active');

    // Deshabilitar botones
    document.querySelectorAll('.vote-btn').forEach(btn => btn.disabled = true);

    socket.emit('vote', { vote: voteValue });
}

// Eventos del Socket

// Lobby creado
socket.on('lobby-created', ({ code, maxPlayers, players }) => {
    isLoading = false;
    currentLobby = code;
    isHost = true;
    totalPlayers = players.length;

    document.getElementById('display-code').textContent = code;
    document.getElementById('max-players-display').textContent = maxPlayers;
    document.getElementById('current-players').textContent = players.length;

    updatePlayersList(players, true);
    updateProgress(players.length, maxPlayers);

    showScreen('screen-lobby');
});

// Unido a lobby
socket.on('lobby-joined', ({ code, maxPlayers, players }) => {
    isLoading = false;
    currentLobby = code;
    isHost = false;
    totalPlayers = players.length;

    document.getElementById('display-code').textContent = code;
    document.getElementById('max-players-display').textContent = maxPlayers;
    document.getElementById('current-players').textContent = players.length;
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('waiting-text').textContent = 'Esperando que el host inicie...';

    updatePlayersList(players, false);
    updateProgress(players.length, maxPlayers);

    showScreen('screen-lobby');
});

// Jugador se unió
socket.on('player-joined', ({ players, currentCount, maxPlayers }) => {
    totalPlayers = currentCount;
    document.getElementById('current-players').textContent = currentCount;
    updatePlayersList(players, isHost);
    updateProgress(currentCount, maxPlayers);

    // Habilitar botón de inicio si somos host y hay suficientes jugadores
    if (isHost && currentCount >= 2) {
        document.getElementById('start-btn').disabled = false;
        document.getElementById('waiting-text').textContent = '¡Listo para iniciar!';
    }
});

// Jugador salió
socket.on('player-left', ({ players, playerName }) => {
    updatePlayersList(players, isHost);
    document.getElementById('current-players').textContent = players.length;

    if (isHost && players.length < 2) {
        document.getElementById('start-btn').disabled = true;
        document.getElementById('waiting-text').textContent = 'Esperando más jugadores...';
    }
});

// Votación iniciada
socket.on('voting-started', ({ totalCharacters: total, players }) => {
    isLoading = false;
    totalCharacters = total;
    document.getElementById('total-chars').textContent = total;
    document.getElementById('total-voters').textContent = players.length;
    showScreen('screen-voting');
});

// Nuevo personaje
socket.on('new-character', ({ index, total, character }) => {
    console.log(`[CLIENT] Nuevo personaje recibido: ${index + 1}/${total} - ${character.name}`);
    currentCharacter = character;
    hasVoted = false;

    // Ocultar overlay de espera
    document.getElementById('waiting-overlay').classList.remove('active');

    // Actualizar UI
    document.getElementById('current-char-num').textContent = index + 1;
    document.getElementById('char-name').textContent = character.name;
    document.getElementById('char-anime').textContent = character.anime || 'Anime';
    document.getElementById('char-title').textContent = character.title || '';
    document.getElementById('char-category').textContent = character.category;
    document.getElementById('char-category').className = `character-category category-${character.category.toLowerCase()}`;

    // Imagen
    const img = document.getElementById('char-image');
    if (character.image) {
        img.src = character.image;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }

    // Habilitar botones
    document.querySelectorAll('.vote-btn').forEach(btn => btn.disabled = false);

    // Actualizar progreso
    const progress = ((index + 1) / total) * 100;
    document.getElementById('voting-progress').style.width = `${progress}%`;

    // Resetear estado
    document.getElementById('vote-status').style.display = 'block';
    document.getElementById('votes-count').textContent = '0';
});

// Progreso de votos
socket.on('vote-progress', ({ voted, total, votedPlayers }) => {
    document.getElementById('votes-count').textContent = voted;
});

// Resultado de voto
socket.on('vote-result', ({ character, approved, yesVotes, noVotes, requiredVotes, nextIn }) => {
    showScreen('screen-result');

    const resultDisplay = document.getElementById('result-display');
    const resultText = document.getElementById('result-text');
    const resultMessage = document.getElementById('result-message');

    if (approved) {
        resultDisplay.className = 'vote-result approved';
        resultText.textContent = '✓ Aprobado';
        resultMessage.textContent = `Mayoría votó SÍ (${yesVotes} de ${totalPlayers})`;
    } else {
        resultDisplay.className = 'vote-result rejected';
        resultText.textContent = '✕ Rechazado';
        resultMessage.textContent = `No alcanzó mayoría (${yesVotes} SÍ vs ${noVotes} NO)`;
    }

    document.getElementById('yes-votes').textContent = yesVotes;
    document.getElementById('no-votes').textContent = noVotes;

    // Volver a pantalla de votación después de un tiempo
    setTimeout(() => {
        showScreen('screen-voting');
    }, nextIn);
});

// Votación finalizada
socket.on('voting-finished', ({ totalCharacters, approved, rejected, byCategory, results }) => {
    // Ocultar overlay
    document.getElementById('waiting-overlay').classList.remove('active');

    showScreen('screen-final');

    document.getElementById('final-approved').textContent = approved;
    document.getElementById('final-rejected').textContent = rejected;

    // Guardar resultados para exportación
    window.votingResults = { totalCharacters, approved, rejected, byCategory, results };

    // Generar resultados por categoría
    const resultsContainer = document.getElementById('final-results');
    resultsContainer.innerHTML = '';

    const categories = ['MELEE', 'ESPADA', 'MAGIA'];
    const categoryColors = {
        'MELEE': '#e74c3c',
        'ESPADA': '#3498db',
        'MAGIA': '#9b59b6'
    };

    categories.forEach(cat => {
        const chars = byCategory[cat] || [];
        if (chars.length === 0) return;

        const catDiv = document.createElement('div');
        catDiv.className = 'result-category';
        catDiv.innerHTML = `
            <h3 style="background: ${categoryColors[cat]}; color: white;">${cat}</h3>
            ${chars.map(char => `
                <div class="character-mini">
                    <img src="${char.image || ''}" alt="${char.name}" onerror="this.style.display='none'">
                    <div style="flex: 1;">
                        <div style="font-weight: bold;">${char.name}</div>
                        <div style="font-size: 0.75rem; color: #aaa;">${char.anime || ''}</div>
                    </div>
                </div>
            `).join('')}
        `;
        resultsContainer.appendChild(catDiv);
    });
});

// Lobby cerrado
socket.on('lobby-closed', (message) => {
    alert(message);
    location.reload();
});

// Error
socket.on('error', (message) => {
    isLoading = false;
    // Re-habilitar botones
    document.querySelectorAll('.btn').forEach(btn => {
        btn.disabled = false;
        if (btn.textContent === 'Creando...') btn.textContent = 'Crear Sala';
        if (btn.textContent === 'Uniendo...') btn.textContent = 'Unirse';
    });
    showError(message);
});

// Funciones auxiliares

function updatePlayersList(players, isHostView) {
    const list = document.getElementById('players-list');
    list.innerHTML = '<h3>Jugadores:</h3>';

    players.forEach((player, index) => {
        const div = document.createElement('div');
        div.className = `player-item ${index === 0 && isHostView ? 'host' : ''}`;
        div.innerHTML = `
            <div class="avatar">${player.name.charAt(0).toUpperCase()}</div>
            <div class="name">${player.name}</div>
            ${index === 0 && isHostView ? '<div class="badge">HOST</div>' : ''}
        `;
        list.appendChild(div);
    });
}

function updateProgress(current, max) {
    const percentage = (current / max) * 100;
    document.getElementById('players-progress').style.width = `${percentage}%`;
}

function showError(message) {
    const existing = document.querySelector('.error-message');
    if (existing) existing.remove();

    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = message;

    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen) {
        activeScreen.insertBefore(error, activeScreen.firstChild);
    }

    setTimeout(hideError, 5000);
}

function hideError() {
    const error = document.querySelector('.error-message');
    if (error) error.remove();
}

// Teclado
socket.on('connect', () => {
    console.log('Conectado al servidor');
});

socket.on('disconnect', () => {
    console.log('Desconectado del servidor');
    showError('Conexión perdida. Intenta recargar la página.');
});

// Funciones de exportación
function exportToExcel() {
    if (!window.votingResults) {
        alert('No hay resultados para exportar');
        return;
    }

    const { results, byCategory } = window.votingResults;

    // Crear datos para Excel
    const data = [
        ['Personaje', 'Anime', 'Categoría', 'Estado', 'Votos SÍ', 'Votos NO', 'Total Votantes']
    ];

    results.forEach(r => {
        data.push([
            r.character.name,
            r.character.anime,
            r.character.category,
            r.approved ? 'Aprobado' : 'Rechazado',
            r.yesVotes,
            r.noVotes,
            r.totalPlayers
        ]);
    });

    // Agregar resumen
    data.push([]);
    data.push(['RESUMEN']);
    data.push(['Categoría', 'Aprobados']);
    Object.entries(byCategory).forEach(([cat, chars]) => {
        data.push([cat, chars.length]);
    });

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');

    // Descargar
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `votacion_anime_${date}.xlsx`);
}

function exportToCSV() {
    if (!window.votingResults) {
        alert('No hay resultados para exportar');
        return;
    }

    const { results } = window.votingResults;

    let csv = 'Personaje,Anime,Categoría,Estado,Votos SÍ,Votos NO,Total\n';

    results.forEach(r => {
        csv += `"${r.character.name}","${r.character.anime}","${r.character.category}",${r.approved ? 'Aprobado' : 'Rechazado'},${r.yesVotes},${r.noVotes},${r.totalPlayers}\n`;
    });

    // Descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    link.download = `votacion_anime_${date}.csv`;
    link.click();
}
