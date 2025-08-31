# MyLinked Admin Roles

## Database & migrations
Set your database connection via `DATABASE_URL` or standard `PG*` variables. Example:

```
DATABASE_URL=postgres://user:pass@host:5432/db
# or
PGHOST=host PGUSER=user PGPASSWORD=pass PGDATABASE=db
```

Run migrations:

```
npm run migrate
```

## Bootstrap owner account
Create the first owner account (idempotent):

```
OWNER_EMAIL=you@example.com OWNER_PASSWORD="StrongP@ss" npx tsx scripts/bootstrap-owner.ts
```

## Create additional admins
1. Log in as the owner using the admin login page.
2. Open the admin panel and use the **Create Admin User** form.

Admins and owners can access `/admin`. Regular users are denied.
