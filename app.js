let currentIndex = 0;
let votes = [];

const card = document.getElementById('card');
const cardName = document.getElementById('cardName');
const cardCategory = document.getElementById('cardCategory');
const cardImage = document.getElementById('cardImage');
const cardAnime = document.getElementById('cardAnime');
const cardDescription = document.getElementById('cardDescription');
const currentCategoryBadge = document.getElementById('currentCategory');
const progressText = document.getElementById('progress');
const cardContainer = document.getElementById('cardContainer');
const controls = document.getElementById('controls');
const instructions = document.getElementById('instructions');
const results = document.getElementById('results');
const resultsGrid = document.getElementById('resultsGrid');

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

function init() {
  // Verificar si hay un nombre registrado
  const voterName = sessionStorage.getItem('voterName');
  if (!voterName) {
    // No inicializar hasta que se registre el nombre
    return;
  }

  // Verificar que candidates esté cargado
  if (typeof candidates === 'undefined' || !candidates || candidates.length === 0) {
    console.error('[ERROR] No se encontró la lista de personajes (candidates)');
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
  cardImage = document.createElement('img');
  cardImage.className = 'card-image';
  cardImage.alt = candidate.name;
  cardImage.style.width = '100%';
  cardImage.style.height = '100%';
  cardImage.style.objectFit = 'contain';
  cardImage.style.objectPosition = 'center top';

  // Manejar error de carga - mostrar emoji
  cardImage.onerror = function() {
    showEmojiFallback(imgContainer, candidate);
  };

  // Si hay URL de imagen, intentar cargarla
  if (candidate.image) {
    imgContainer.appendChild(cardImage);
    cardImage.src = candidate.image;

    // Verificar si la imagen ya está en caché y falló
    if (cardImage.complete && cardImage.naturalWidth === 0) {
      cardImage.onerror();
    }
  } else {
    // No hay imagen, mostrar emoji directamente
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

function hideStamps() {
  document.querySelector('.stamp-like').style.opacity = '0';
  document.querySelector('.stamp-nope').style.opacity = '0';
}

// Función para mostrar emoji fallback cuando la imagen no carga
function showEmojiFallback(container, candidate) {
  // Limpiar contenedor
  container.innerHTML = '';

  // Crear elemento de fallback con emoji
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
  fallback.textContent = candidate.emoji || getEmojiForCharacter(candidate.name, candidate.category);

  container.appendChild(fallback);
}

// Obtener emoji apropiado según el personaje
function getEmojiForCharacter(name, category) {
  // Emojis por categoría como fallback
  const categoryEmojis = {
    'MELEE': ['👊', '💪', '🥊', '🦵', '🏃', '⚡'],
    'ESPADA': ['⚔️', '🗡️', '🏴‍☠️', '🔪', '🛡️', '⚡'],
    'MAGIA': ['🔮', '✨', '🪄', '⭐', '🌟', '💫']
  };

  // Emojis específicos para personajes conocidos
  const specificEmojis = {
    'luffy': '🏴‍☠️',
    'zoro': '⚔️',
    'sanji': '🦵',
    'goku': '🔥',
    'vegeta': '👑',
    'saitama': '👨‍🦲',
    'naruto': '🍥',
    'sasuke': '🔥',
    'gojo': '👓',
    'sukuna': '😈',
    'eren': '⚔️',
    'levi': '🗡️',
    'tanjiro': '🎴',
    'zenitsu': '⚡',
    'asta': '⚔️',
    'asta': '📖',
    'ichigo': '🗡️',
    'lucy': '🔑',
    'natsu': '🔥',
    'ace': '🔥',
    'kirito': '⚔️',
    'asuna': '🗡️',
    'rimuru': '💧',
    'ainz': '💀',
    'megumin': '💥',
    'frieren': '✨'
  };

  const lowerName = name.toLowerCase();

  // Buscar emoji específico
  for (const [key, emoji] of Object.entries(specificEmojis)) {
    if (lowerName.includes(key)) {
      return emoji;
    }
  }

  // Fallback a emoji de categoría basado en el nombre
  const emojis = categoryEmojis[category] || ['👤'];
  return emojis[lowerName.length % emojis.length];
}

function showStamps(likeOpacity, nopeOpacity) {
  document.querySelector('.stamp-like').style.opacity = likeOpacity;
  document.querySelector('.stamp-nope').style.opacity = nopeOpacity;
}

// Funciones de gestos deshabilitadas - solo votación por botones/teclado
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
  const voteData = {
    name: candidate.name,
    category: candidate.category,
    vote: like ? 'SI' : 'NO',
    anime: candidate.anime,
    image: candidate.image,
    emoji: candidate.emoji,
    timestamp: new Date().toISOString()
  };
  votes.push(voteData);

  // Guardar en Convex
  const voterName = sessionStorage.getItem('voterName') || 'Anónimo';
  try {
    if (window.convexApi) {
      await window.convexApi.saveVote({
        voterName: voterName,
        characterName: candidate.name,
        category: candidate.category,
        vote: like ? 'SI' : 'NO',
        anime: candidate.anime
      });
    }
  } catch (e) {
    console.log('Convex no disponible, usando solo localStorage');
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

    // Flecha derecha o D = SI (votar a favor)
    if (e.key === 'ArrowRight' || key === 'd') {
      e.preventDefault();
      animateAndVote(true);
    }
    // Flecha izquierda o A = NO (votar en contra)
    else if (e.key === 'ArrowLeft' || key === 'a') {
      e.preventDefault();
      animateAndVote(false);
    }
  });
}

function showResults() {
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

  // Guardar resultados en localStorage para análisis global
  saveVoterResults(voterName, votes, yesVotes, byCategory);

  // Agregar el nombre del votante al título de resultados
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
  // Obtener resultados existentes
  let allResults = JSON.parse(localStorage.getItem('proyectpiece_results') || '[]');

  // Crear registro de este votante
  const voterRecord = {
    id: Date.now(),
    votante: voterName,
    fecha: new Date().toISOString(),
    total_votados: candidates.length,
    total_favoritos: yesVotes.length,
    favoritos_por_categoria: byCategory,
    todos_los_votos: allVotes
  };

  // Verificar si este votante ya existe (mismo nombre)
  const existingIndex = allResults.findIndex(r => r.votante === voterName);
  if (existingIndex >= 0) {
    allResults[existingIndex] = voterRecord;
  } else {
    allResults.push(voterRecord);
  }

  // Guardar en localStorage
  localStorage.setItem('proyectpiece_results', JSON.stringify(allResults));

  // Guardar en Convex
  try {
    if (window.convexApi) {
      await window.convexApi.completeSession({
        voterName: voterName,
        totalVoted: allVotes.length,
        totalYes: yesVotes.length
      });
    }
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
init();
