import { Request, Response } from "express";
import { storage } from "./storage";

export function createAdminUserHandler(store = storage) {
  return async (req: Request, res: Response) => {
    const { email, username, password, name } = req.body || {};
    if (!email || !username || !password || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const existing = await store.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }
    const user = await store.createUser({
      email,
      username,
      password,
      name,
      role: "admin",
      isAdmin: true,
    } as any);
    return res.status(201).json({ user });
  };
}
