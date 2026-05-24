// App.js modificado para cargar personajes desde Convex
let currentIndex = 0;
let votes = [];
let candidates = [];
let categories = ['MELEE', 'ESPADA', 'MAGIA'];

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

const CONVEX_URL = 'https://hallowed-badger-330.convex.cloud/';

// Helper para llamar a Convex
async function convexQuery(name, args = {}) {
  const response = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: name, args })
  });
  return response.json();
}

async function convexMutation(name, args = {}) {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: name, args })
  });
  return response.json();
}

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

  votes = [];
  currentIndex = 0;
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

  // Contadores
  const categoryCount = candidates.filter(c => c.category === candidate.category).length;
  const categoryIndex = candidates.slice(0, currentIndex + 1).filter(c => c.category === candidate.category).length;

  progressText.textContent = `${categoryIndex}/${categoryCount} en ${candidate.category} • Total: ${currentIndex + 1}/${candidates.length}`;

  // Resetear transformaciones
  card.style.transform = 'translateX(0) rotate(0)';
  hideStamps();
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
  const candidate = candidates[currentIndex];
  votes.push({
    name: candidate.name,
    category: candidate.category,
    vote: like ? 'SI' : 'NO',
    anime: candidate.anime,
    image: candidate.image,
    emoji: candidate.emoji,
    timestamp: new Date().toISOString()
  });

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
  } catch (e) {
    console.log('Convex no disponible, voto solo local');
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
  cardContainer.style.display = 'none';
  controls.style.display = 'none';
  instructions.style.display = 'none';
  currentCategoryBadge.style.display = 'none';
  progressText.style.display = 'none';
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
}

async function saveVoterResults(voterName, allVotes, yesVotes, byCategory) {
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
  } catch (e) {
    console.log('Convex no disponible');
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

// Inicializar
document.addEventListener('DOMContentLoaded', init);
