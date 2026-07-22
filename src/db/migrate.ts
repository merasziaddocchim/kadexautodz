import { migrate } from "drizzle-orm/neon-http/migrator";
import { getDb } from "./index";

async function main() {
  await migrate(getDb(), { migrationsFolder: "drizzle" });
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
