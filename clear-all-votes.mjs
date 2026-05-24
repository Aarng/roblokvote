import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
const client = new ConvexHttpClient(CONVEX_URL);

console.log("🗑️  LIMPIEZA COMPLETA DE DATOS\n");

async function clearAll() {
  try {
    // 1. Obtener todos los votos
    console.log("1️⃣  Obteniendo votos...");
    const allVotes = await client.query("votes:getGlobalResults");
    console.log(`   Encontrados: ${allVotes ? Object.keys(allVotes).length : 0} categorías con votos`);

    // 2. Obtener todos los votantes
    console.log("\n2️⃣  Obteniendo votantes...");
    const voters = await client.query("votes:getAllVoters");
    console.log(`   Encontrados: ${voters ? voters.length : 0} votantes`);

    if (voters && voters.length > 0) {
      console.log("\n3️⃣  Eliminando votantes...");
      for (const voter of voters) {
        try {
          await client.mutation("votes:deleteVoterResults", { voterName: voter.name });
          console.log(`   ✅ Eliminado: ${voter.name}`);
        } catch (e) {
          console.log(`   ❌ Error eliminando ${voter.name}: ${e.message}`);
        }
      }
    }

    console.log("\n✅ LIMPIEZA COMPLETADA");
    console.log("\nTodos los votos han sido eliminados de Convex.");
    console.log("Los usuarios deberán recargar la página para limpiar su caché local.");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

clearAll();
