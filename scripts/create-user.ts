import bcrypt from "bcryptjs";
import { getDb } from "../src/db";
import { users } from "../src/db/schema";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: npm run create-user -- <email> <password>");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [row] = await getDb()
    .insert(users)
    .values({ email, passwordHash })
    .returning({ id: users.id, email: users.email });
  console.log(`Created user ${row.email} (${row.id})`);
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("users_email_unique")) {
    console.error("A user with that email already exists.");
  } else {
    console.error(message);
  }
  process.exit(1);
});
