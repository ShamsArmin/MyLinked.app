export async function getUser() {
  const res = await fetch("/api/user", { credentials: "include" });
  if (!res.ok) throw new Error("getUser failed");
  return res.json();
}

export async function updateProfile(updates: Record<string, unknown>) {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("updateProfile failed");
  return res.json();
}
