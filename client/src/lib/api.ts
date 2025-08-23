export async function getUser() {
  const r = await fetch("/api/user", { credentials: "include" });
  if (!r.ok) throw new Error("getUser failed");
  return r.json();
}
export async function updateProfile(updates: Record<string, unknown>) {
  const r = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  });
  if (!r.ok) throw new Error("updateProfile failed");
  return r.json();
}
