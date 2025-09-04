export function requireAdmin(permission: string) {
  return (req: any, res: any, next: any) => {
    const user = req.user as any;
    const role = user?.role;
    const perms: string[] = user?.permissions || [];
    if (
      !user ||
      (!user.isAdmin &&
        role !== "admin" &&
        role !== "super_admin" &&
        !perms.includes(permission))
    ) {
      return res.status(403).json({ message: "Administrator privileges required" });
    }
    next();
  };
}
