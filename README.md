# MyLinked Admin Roles

## Migrations
Run database migrations:

```bash
npm run db:migrate
```

## Bootstrap owner account
Create the first owner account (idempotent):

```bash
OWNER_EMAIL=you@example.com OWNER_PASSWORD="StrongP@ss" npx tsx scripts/bootstrap-owner.ts
```

## Create additional admins
1. Log in as the owner using the admin login page.
2. Open the admin panel and use the **Create Admin User** form.

Admins and owners can access `/admin`. Regular users are denied.
