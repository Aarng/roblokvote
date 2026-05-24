// Cliente Convex simple para vanilla JS
const CONVEX_URL = 'https://hallowed-badger-330.convex.cloud/';

// Función para llamar a Convex
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

// Funciones específicas
const convexApi = {
  // Guardar un voto
  saveVote: async (voteData) => {
    return convexMutation('votes:saveVote', voteData);
  },

  // Guardar sesión completada
  completeSession: async (sessionData) => {
    return convexMutation('votes:completeSession', sessionData);
  },

  // Obtener resultados globales
  getGlobalResults: async () => {
    return convexQuery('votes:getGlobalResults');
  },

  // Obtener resultados por votante
  getResultsByVoter: async (voterName) => {
    return convexQuery('votes:getResultsByVoter', { voterName });
  },

  // Obtener todos los votantes
  getAllVoters: async () => {
    return convexQuery('votes:getAllVoters');
  },

  // Borrar resultados de un votante (admin)
  deleteVoterResults: async (voterName) => {
    return convexMutation('votes:deleteVoterResults', { voterName });
  }
};

// Exponer globalmente
window.convexApi = convexApi;
