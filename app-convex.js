// App.js modificado para cargar personajes desde Convex
let currentIndex = 0;
let votes = [];
let candidates = [];
let categories = ['MELEE', 'ESPADA', 'MAGIA'];
let voteQueue = Promise.resolve(); // Cola de votos para evitar pérdida de datos
let isVoting = false; // Bloqueo para evitar votos simultáneos

// Clave para guardar progreso en localStorage
const PROGRESS_KEY = 'proyectpiece_progress';

// Elementos del DOM
let card, cardName, cardCategory, cardImage, cardAnime, cardDescription;
let currentCategoryBadge, progressText, cardContainer, controls, instructions, results, resultsGrid;

const categoryColors = {
  'MELEE': 'category-melee',
  'ESPADA': 'category-espada',
  'MAGIA': 'category-magia'
};

const categoryGradients = {
  'MELEE': 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
  'ESPADA': 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
  'MAGIA': 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)'
};

// Usar las funciones de convex-client.js (ya cargado globalmente)
// convexQuery y convexMutation están disponibles desde convex-client.js

// Cargar personajes desde Convex
async function loadCharactersFromConvex() {
  try {
    console.log('[CONVEX] Cargando personajes...');
    candidates = await convexQuery('characters:getAllCharacters');

    if (!candidates || candidates.length === 0) {
      console.error('[CONVEX] No se recibieron personajes');
      // Fallback a localStorage si existe
      const localData = localStorage.getItem('cachedCharacters');
      if (localData) {
        candidates = JSON.parse(localData);
        console.log('[LOCAL] Usando datos cacheados');
      }
    } else {
      // Cachear localmente
      localStorage.setItem('cachedCharacters', JSON.stringify(candidates));
      console.log(`[CONVEX] ${candidates.length} personajes cargados`);
    }

    return candidates.length > 0;
  } catch (error) {
    console.error('[CONVEX] Error cargando personajes:', error);
    // Fallback a cache local
    const localData = localStorage.getItem('cachedCharacters');
    if (localData) {
      candidates = JSON.parse(localData);
      console.log('[LOCAL] Usando datos cacheados tras error');
      return true;
    }
    return false;
  }
}

// Guardar progreso actual
function saveProgress() {
  const voterName = sessionStorage.getItem('voterName');
  if (!voterName || votes.length === 0) return;

  const progress = {
    voterName: voterName,
    currentIndex: currentIndex,
    votes: votes,
    timestamp: Date.now(),
    totalCandidates: candidates.length
  };

  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  console.log(`[Progress] Guardado: ${currentIndex}/${candidates.length} personajes votados`);
}

// Cargar progreso guardado
function loadProgress() {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (!saved) return null;

    const progress = JSON.parse(saved);
    const voterName = sessionStorage.getItem('voterName');

    // Solo cargar si es el mismo votante
    if (progress.voterName === voterName) {
      return progress;
    }
  } catch (e) {
    console.error('[Progress] Error cargando progreso:', e);
  }
  return null;
}

// Limpiar progreso guardado
function clearProgress() {
  localStorage.removeItem(PROGRESS_KEY);
  console.log('[Progress] Progreso limpiado');
}

// Mostrar diálogo para continuar o reiniciar
function showResumeDialog(savedProgress) {
  return new Promise((resolve) => {
    const votedCount = savedProgress.votes.length;
    const totalCount = savedProgress.totalCandidates || candidates.length;
    const remaining = totalCount - votedCount;

    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'resume-modal';
    modal.innerHTML = `
      <div class="resume-dialog">
        <h2>🎮 ¡Bienvenido de vuelta, ${savedProgress.voterName}!</h2>
        <p>Tienes una votación en progreso:</p>
        <div class="progress-stats">
          <div class="stat">
            <span class="stat-value">${votedCount}</span>
            <span class="stat-label">votados</span>
          </div>
          <div class="stat">
            <span class="stat-value">${remaining}</span>
            <span class="stat-label">restantes</span>
          </div>
          <div class="stat">
            <span class="stat-value">${Math.round((votedCount/totalCount)*100)}%</span>
            <span class="stat-label">completado</span>
          </div>
        </div>
        <div class="resume-actions">
          <button class="btn-resume" onclick="this.closest('.resume-modal').remove(); resolve('resume')">
            ▶️ Continuar votación
          </button>
          <button class="btn-restart" onclick="this.closest('.resume-modal').remove(); resolve('restart')">
            🔄 Empezar de nuevo
          </button>
        </div>
      </div>
    `;

    // Agregar estilos si no existen
    if (!document.getElementById('resume-styles')) {
      const styles = document.createElement('style');
      styles.id = 'resume-styles';
      styles.textContent = `
        .resume-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          backdrop-filter: blur(5px);
        }
        .resume-dialog {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 40px;
          border-radius: 20px;
          text-align: center;
          max-width: 400px;
          border: 1px solid rgba(255,255,255,0.1);
          animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .resume-dialog h2 {
          color: #f39c12;
          margin-bottom: 15px;
        }
        .resume-dialog p {
          color: rgba(255,255,255,0.7);
          margin-bottom: 25px;
        }
        .progress-stats {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin: 25px 0;
          padding: 20px;
          background: rgba(255,255,255,0.05);
          border-radius: 15px;
        }
        .stat {
          text-align: center;
        }
        .stat-value {
          display: block;
          font-size: 2rem;
          font-weight: bold;
          color: #f39c12;
        }
        .stat-label {
          display: block;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.6);
          text-transform: uppercase;
        }
        .resume-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 25px;
        }
        .btn-resume, .btn-restart {
          padding: 15px 30px;
          border-radius: 30px;
          border: none;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }
        .btn-resume {
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
        }
        .btn-resume:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(243, 156, 18, 0.4);
        }
        .btn-restart {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
        }
        .btn-restart:hover {
          background: rgba(255,255,255,0.2);
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(modal);
  });
}

async function init() {
  // Guardar referencias a elementos
  card = document.getElementById('card');
  cardName = document.getElementById('cardName');
  cardCategory = document.getElementById('cardCategory');
  cardImage = document.getElementById('cardImage');
  cardAnime = document.getElementById('cardAnime');
  cardDescription = document.getElementById('cardDescription');
  currentCategoryBadge = document.getElementById('currentCategory');
  progressText = document.getElementById('progress');
  cardContainer = document.getElementById('cardContainer');
  controls = document.getElementById('controls');
  instructions = document.getElementById('instructions');
  results = document.getElementById('results');
  resultsGrid = document.getElementById('resultsGrid');

  // Verificar si hay un nombre registrado
  const voterName = sessionStorage.getItem('voterName');
  if (!voterName) {
    return;
  }

  // Cargar personajes desde Convex
  const loaded = await loadCharactersFromConvex();
  if (!loaded) {
    console.error('[ERROR] No se pudieron cargar los personajes');
    alert('Error al cargar los personajes. Intenta recargar la página.');
    return;
  }

  console.log(`[INIT] Iniciando votación con ${candidates.length} personajes`);

  // Verificar si hay progreso guardado
  const savedProgress = loadProgress();

  if (savedProgress && savedProgress.votes.length > 0 && savedProgress.votes.length < candidates.length) {
    // Hay progreso guardado incompleto
    const action = await showResumeDialog(savedProgress);

    if (action === 'resume') {
      // Restaurar progreso
      currentIndex = savedProgress.currentIndex;
      votes = savedProgress.votes;
      console.log(`[INIT] Restaurando progreso: ${votes.length}/${candidates.length} votados`);
    } else {
      // Reiniciar
      votes = [];
      currentIndex = 0;
      clearProgress();
    }
  } else {
    // No hay progreso o ya está completo
    votes = [];
    currentIndex = 0;
    if (savedProgress && savedProgress.votes.length >= candidates.length) {
      clearProgress();
    }
  }

  sessionSaved = false; // Reiniciar bandera para nuevo votante
  loadCard();
  setupGestures();
  setupKeyboard();
}

function loadCard() {
  if (currentIndex >= candidates.length) {
    showResults();
    return;
  }

  const candidate = candidates[currentIndex];

  if (!candidate) {
    console.error(`[ERROR] No se encontró el personaje en índice ${currentIndex}`);
    return;
  }

  console.log(`[LOAD] Cargando personaje ${currentIndex + 1}/${candidates.length}: ${candidate.name}`);

  // Cargar datos
  cardName.textContent = candidate.name;
  cardCategory.textContent = candidate.category;
  cardCategory.className = `card-category ${categoryColors[candidate.category]}`;
  cardAnime.textContent = candidate.anime || 'Anime';
  cardDescription.textContent = candidate.title || 'Sin título';

  // Cargar imagen con fallback a emoji
  const imgContainer = document.querySelector('.card-image-container');

  // Limpiar contenedor y preparar imagen
  imgContainer.innerHTML = '';

  if (candidate.image) {
    const img = document.createElement('img');
    img.className = 'card-image';
    img.alt = candidate.name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.objectPosition = 'center top';

    img.onerror = function() {
      showEmojiFallback(imgContainer, candidate);
    };

    imgContainer.appendChild(img);
    img.src = candidate.image;

    if (img.complete && img.naturalWidth === 0) {
      img.onerror();
    }
  } else {
    showEmojiFallback(imgContainer, candidate);
  }

  // Actualizar badge de categoría
  currentCategoryBadge.textContent = candidate.category;
  currentCategoryBadge.className = `category-badge ${categoryColors[candidate.category]}`;

  // Actualizar barra de progreso moderna
  updateProgressBar();

  // Resetear transformaciones
  card.style.transform = 'translateX(0) rotate(0)';
  hideStamps();
}

// Función para actualizar la barra de progreso moderna
function updateProgressBar() {
  const total = candidates.length;
  const current = currentIndex + 1;
  const percent = Math.round((current / total) * 100);
  const remaining = total - current;

  // Calcular tiempo estimado: ~3 segundos por voto
  const secondsPerVote = 3;
  const remainingSeconds = remaining * secondsPerVote;
  const minutes = Math.ceil(remainingSeconds / 60);

  // Actualizar elementos del DOM
  const progressPercent = document.getElementById('progressPercent');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressCount = document.getElementById('progressCount');
  const progressTime = document.getElementById('progressTime');

  if (progressPercent) progressPercent.textContent = `${percent}%`;
  if (progressBarFill) progressBarFill.style.width = `${percent}%`;
  if (progressCount) progressCount.innerHTML = `<strong>${current}</strong> / ${total} votados`;
  if (progressTime) {
    if (remaining === 0) {
      progressTime.innerHTML = '🎉 ¡Completado!';
    } else {
      const minText = minutes === 1 ? 'minuto' : 'minutos';
      progressTime.innerHTML = `⏱️ ~${minutes} ${minText} restantes`;
    }
  }
}

function showEmojiFallback(container, candidate) {
  container.innerHTML = '';

  const fallback = document.createElement('div');
  fallback.className = 'card-image-fallback';
  fallback.style.width = '100%';
  fallback.style.height = '100%';
  fallback.style.display = 'flex';
  fallback.style.alignItems = 'center';
  fallback.style.justifyContent = 'center';
  fallback.style.fontSize = '6rem';
  fallback.style.background = categoryGradients[candidate.category];
  fallback.style.color = 'white';
  fallback.textContent = candidate.emoji || '👤';

  container.appendChild(fallback);
}

function hideStamps() {
  document.querySelector('.stamp-like').style.opacity = '0';
  document.querySelector('.stamp-nope').style.opacity = '0';
}

function showStamps(likeOpacity, nopeOpacity) {
  document.querySelector('.stamp-like').style.opacity = likeOpacity;
  document.querySelector('.stamp-nope').style.opacity = nopeOpacity;
}

function setupGestures() {
  // Drag/swipe deshabilitado - usar botones o teclado
}

function animateAndVote(like) {
  const direction = like ? 1 : -1;
  const distance = window.innerWidth;

  card.style.transition = 'transform 0.5s ease';
  card.style.transform = `translateX(${direction * distance}px) rotate(${direction * 30}deg)`;

  if (like) {
    document.querySelector('.stamp-like').style.opacity = '1';
  } else {
    document.querySelector('.stamp-nope').style.opacity = '1';
  }

  setTimeout(() => {
    vote(like);
  }, 300);
}

async function vote(like) {
  // Evitar votos múltiples simultáneos
  if (isVoting) {
    console.log('[Vote] Bloqueado - voto en progreso');
    return;
  }
  isVoting = true;

  const candidate = candidates[currentIndex];

  try {
    // Agregar a la cola de votos para asegurar orden y completitud
    voteQueue = voteQueue.then(async () => {
      votes.push({
        name: candidate.name,
        category: candidate.category,
        vote: like ? 'SI' : 'NO',
        anime: candidate.anime,
        image: candidate.image,
        emoji: candidate.emoji,
        timestamp: new Date().toISOString()
      });

      // Guardar progreso localmente después de cada voto
      saveProgress();

      // Guardar en Convex
      const voterName = sessionStorage.getItem('voterName') || 'Anónimo';
      try {
        await convexMutation('votes:saveVote', {
          voterName: voterName,
          characterName: candidate.name,
          category: candidate.category,
          vote: like ? 'SI' : 'NO',
          anime: candidate.anime
        });
        console.log(`[Vote] Guardado: ${candidate.name} = ${like ? 'SI' : 'NO'}`);
      } catch (e) {
        console.error('[Vote] Error guardando en Convex:', e);
      }
    });

    await voteQueue; // Esperar a que este voto se complete
  } finally {
    isVoting = false; // Liberar el bloqueo
  }

  currentIndex++;

  card.style.transition = 'none';
  card.style.transform = 'translateX(0) rotate(0)';

  setTimeout(() => {
    card.style.transition = '';
    loadCard();
  }, 50);
}

function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (currentIndex >= candidates.length) return;

    const key = e.key.toLowerCase();

    if (e.key === 'ArrowRight' || key === 'd') {
      e.preventDefault();
      animateAndVote(true);
    } else if (e.key === 'ArrowLeft' || key === 'a') {
      e.preventDefault();
      animateAndVote(false);
    }
  });
}

async function showResults() {
  // Limpiar progreso guardado al completar
  clearProgress();

  cardContainer.style.display = 'none';
  controls.style.display = 'none';
  instructions.style.display = 'none';
  currentCategoryBadge.style.display = 'none';
  progressText.style.display = 'none';

  // Ocultar contenedor de progreso y badge
  const progressContainer = document.getElementById('progressContainer');
  const swordBadge = document.getElementById('swordRewardBadge');
  if (progressContainer) progressContainer.style.display = 'none';
  if (swordBadge) swordBadge.style.display = 'none';

  results.style.display = 'block';

  const voterName = sessionStorage.getItem('voterName') || 'Anónimo';
  const yesVotes = votes.filter(v => v.vote === 'SI');
  const byCategory = {};

  categories.forEach(cat => {
    byCategory[cat] = yesVotes.filter(v => v.category === cat);
  });

  await saveVoterResults(voterName, votes, yesVotes, byCategory);

  const resultsTitle = results.querySelector('h2');
  if (resultsTitle) {
    resultsTitle.innerHTML = `🎉 Resultados de <span style="color: #f39c12;">${voterName}</span>`;
  }

  // Actualizar contenido de resultados para incluir mensaje de recompensa
  const resultsParagraph = results.querySelector('p');
  if (resultsParagraph) {
    resultsParagraph.innerHTML = `Estos son tus personajes favoritos por categoría.<br><br>
      <span style="font-size: 1.2rem; color: #00aaff;">🗡️ ¡Has ganado la <strong>Espada Azure</strong>! 🎁</span><br>
      <span style="color: rgba(255,255,255,0.7);">Entraste al sorteo por completar todas las votaciones.</span>`;
  }

  resultsGrid.innerHTML = categories.map(cat => {
    const catVotes = byCategory[cat];
    const catColor = categoryColors[cat];
    const bgColors = {
      'MELEE': '#e74c3c',
      'ESPADA': '#3498db',
      'MAGIA': '#9b59b6'
    };

    return `
      <div class="result-category">
        <h3 class="${catColor}" style="background: ${bgColors[cat]}; color: white;">${cat}</h3>
        ${catVotes.length > 0
          ? catVotes.map(v => `
            <div class="favorite-card">
              <div style="width: 50px; height: 50px; border-radius: 50%; background: ${bgColors[cat]}; display: flex; align-items: center; justify-content: center; font-size: 1.8rem;">${v.emoji || '👤'}</div>
              <div class="info">
                <div class="name">${v.name}</div>
                <div class="anime">${v.anime || ''}</div>
              </div>
            </div>
          `).join('')
          : '<div style="color: #888; font-style: italic; padding: 10px;">No hay votos</div>'
        }
        <p style="margin-top: 10px; color: #888; font-size: 0.85rem;">Total: ${catVotes.length} favoritos</p>
      </div>
    `;
  }).join('');

  // Agregar formulario de usuario de Roblox
  const robloxForm = document.createElement('div');
  robloxForm.className = 'roblox-form-container';
  robloxForm.innerHTML = `
    <div class="roblox-form-card">
      <div class="sword-emoji">🗡️</div>
      <h3>¡Reclama tu Espada Azure!</h3>
      <p>Has completado la votación y ahora participas en el sorteo.<br>Ingresa tu usuario de Roblox para poder contactarte si ganas:</p>
      <div class="roblox-input-group">
        <span class="roblox-icon">🎮</span>
        <input type="text" id="roblox-username" placeholder="Usuario de Roblox" maxlength="30" autocomplete="off">
      </div>
      <button id="btn-save-roblox" onclick="saveRobloxUser()">Guardar y Participar en el Sorteo</button>
      <div id="roblox-message" class="roblox-message"></div>
    </div>
  `;

  // Insertar después del botón de descargar
  const downloadBtn = results.querySelector('.btn-download');
  if (downloadBtn) {
    downloadBtn.parentNode.insertBefore(robloxForm, downloadBtn.nextSibling);
  } else {
    results.appendChild(robloxForm);
  }

  // Agregar estilos si no existen
  if (!document.getElementById('roblox-form-styles')) {
    const styles = document.createElement('style');
    styles.id = 'roblox-form-styles';
    styles.textContent = `
      .roblox-form-container {
        max-width: 500px;
        margin: 30px auto;
        animation: fadeInUp 0.5s ease;
      }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .roblox-form-card {
        background: linear-gradient(135deg, rgba(0,170,255,0.2), rgba(155,89,182,0.2));
        border: 2px solid rgba(0,170,255,0.4);
        border-radius: 20px;
        padding: 30px;
        text-align: center;
      }
      .sword-emoji {
        font-size: 4rem;
        margin-bottom: 15px;
        filter: drop-shadow(0 0 20px rgba(0,170,255,0.8));
        animation: float 3s ease-in-out infinite;
      }
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      .roblox-form-card h3 {
        color: #00aaff;
        font-size: 1.5rem;
        margin-bottom: 10px;
      }
      .roblox-form-card p {
        color: rgba(255,255,255,0.7);
        margin-bottom: 20px;
        font-size: 0.95rem;
      }
      .roblox-input-group {
        display: flex;
        align-items: center;
        background: rgba(255,255,255,0.1);
        border: 2px solid rgba(0,170,255,0.3);
        border-radius: 12px;
        padding: 5px 15px;
        margin-bottom: 20px;
        transition: border-color 0.3s;
      }
      .roblox-input-group:focus-within {
        border-color: #00aaff;
      }
      .roblox-icon {
        font-size: 1.5rem;
        margin-right: 10px;
      }
      #roblox-username {
        flex: 1;
        background: transparent;
        border: none;
        color: white;
        font-size: 1.1rem;
        outline: none;
        padding: 10px 0;
      }
      #roblox-username::placeholder {
        color: rgba(255,255,255,0.4);
      }
      #btn-save-roblox {
        width: 100%;
        padding: 15px 30px;
        background: linear-gradient(135deg, #00aaff, #9b59b6);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.3s, box-shadow 0.3s;
      }
      #btn-save-roblox:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(0,170,255,0.4);
      }
      #btn-save-roblox:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
      .roblox-message {
        margin-top: 15px;
        font-size: 0.95rem;
        min-height: 24px;
      }
      .roblox-message.success {
        color: #2ecc71;
      }
      .roblox-message.error {
        color: #e74c3c;
      }
    `;
    document.head.appendChild(styles);
  }
}

let sessionSaved = false;

async function saveVoterResults(voterName, allVotes, yesVotes, byCategory) {
  // Evitar guardar múltiples veces en la misma sesión
  if (sessionSaved) {
    console.log('[Session] Ya guardada, ignorando duplicado');
    return;
  }
  sessionSaved = true;

  let allResults = JSON.parse(localStorage.getItem('proyectpiece_results') || '[]');

  const voterRecord = {
    id: Date.now(),
    votante: voterName,
    fecha: new Date().toISOString(),
    total_votados: candidates.length,
    total_favoritos: yesVotes.length,
    favoritos_por_categoria: byCategory,
    todos_los_votos: allVotes
  };

  const existingIndex = allResults.findIndex(r => r.votante === voterName);
  if (existingIndex >= 0) {
    allResults[existingIndex] = voterRecord;
  } else {
    allResults.push(voterRecord);
  }

  localStorage.setItem('proyectpiece_results', JSON.stringify(allResults));

  try {
    await convexMutation('votes:completeSession', {
      voterName: voterName,
      totalVoted: allVotes.length,
      totalYes: yesVotes.length
    });
    console.log('[Session] Guardada exitosamente en Convex');
  } catch (e) {
    console.log('[Session] Error guardando en Convex:', e);
    // Si falla, resetear la bandera para permitir reintentar
    sessionSaved = false;
  }
}

function downloadResults() {
  const yesVotes = votes.filter(v => v.vote === 'SI');
  const voterName = sessionStorage.getItem('voterName') || 'Anónimo';

  const byCategory = {};
  categories.forEach(cat => {
    byCategory[cat] = yesVotes.filter(v => v.category === cat).map(v => ({
      name: v.name,
      anime: v.anime
    }));
  });

  const data = {
    votante: voterName,
    fecha: new Date().toLocaleString('es-ES'),
    total_votados: candidates.length,
    total_favoritos: yesVotes.length,
    favoritos_por_categoria: byCategory,
    todos_los_votos: votes
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `votacion_${voterName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Guardar usuario de Roblox
async function saveRobloxUser() {
  const input = document.getElementById('roblox-username');
  const message = document.getElementById('roblox-message');
  const btn = document.getElementById('btn-save-roblox');

  const robloxUser = input.value.trim();

  if (!robloxUser) {
    message.textContent = 'Por favor ingresa tu usuario de Roblox';
    message.className = 'roblox-message error';
    return;
  }

  if (robloxUser.length < 3) {
    message.textContent = 'El usuario debe tener al menos 3 caracteres';
    message.className = 'roblox-message error';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Guardando...';

  const voterName = sessionStorage.getItem('voterName') || 'Anónimo';

  try {
    // Guardar en Convex
    await convexMutation('votes:saveRobloxUser', {
      voterName: voterName,
      robloxUser: robloxUser
    });

    // Guardar en localStorage para recordar
    localStorage.setItem('proyectpiece_roblox_' + voterName, robloxUser);

    message.innerHTML = '✅ ¡Usuario guardado! Estás participando en el sorteo de la Espada Azure. ¡Buena suerte! 🗡️🎉';
    message.className = 'roblox-message success';

    btn.textContent = '¡Participando!';

    // Opcional: ocultar el formulario después de 3 segundos
    setTimeout(() => {
      const formCard = document.querySelector('.roblox-form-card');
      if (formCard) {
        formCard.innerHTML = `
          <div class="sword-emoji">🗡️</div>
          <h3 style="color: #2ecc71;">¡Listo!</h3>
          <p style="color: rgba(255,255,255,0.8);">
            Tu usuario <strong>${robloxUser}</strong> ha sido registrado.<br>
            Participas en el sorteo de la Espada Azure.<br>
            ¡Te contactaremos por Discord si ganas! 🎉
          </p>
        `;
      }
    }, 3000);

  } catch (error) {
    console.error('[ERROR] Error guardando usuario Roblox:', error);
    message.textContent = 'Error al guardar. Intenta de nuevo.';
    message.className = 'roblox-message error';
    btn.disabled = false;
    btn.textContent = 'Guardar y Participar en el Sorteo';
  }
}

// Inicializar
document.addEventListener('DOMContentLoaded', init);

// Exponer funciones globalmente para los botones HTML
window.vote = vote;
window.animateAndVote = animateAndVote;
window.downloadResults = downloadResults;
window.saveRobloxUser = saveRobloxUser;
