import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
const client = new ConvexHttpClient(CONVEX_URL);

console.log("🗑️  Borrando personajes existentes...");
try {
  const result = await client.mutation("characters:clearAllCharacters", {});
  console.log(`✅ ${result.deleted} personajes borrados`);
} catch (e) {
  console.log("⚠️  No se pudieron borrar (puede que no existan aún):", e.message);
}
