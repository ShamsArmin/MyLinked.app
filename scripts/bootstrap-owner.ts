import { storage } from "../server/storage";

export async function bootstrapOwner(store = storage) {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;
  const username = process.env.OWNER_USERNAME || "owner";
  if (!email || !password) {
    throw new Error("OWNER_EMAIL and OWNER_PASSWORD must be set");
  }
  const users = await store.getAllUsers();
  const hasOwner = users.some((u: any) => u.role === "owner");
  if (hasOwner) {
    console.log("Owner already exists");
    return;
  }
  const user = await store.createUser({
    email,
    username,
    name: username,
    password,
    role: "owner",
    isAdmin: true,
  } as any);
  console.log("Owner created", { id: user.id, email: user.email });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  bootstrapOwner().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
