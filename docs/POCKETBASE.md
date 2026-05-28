# PocketBase Backend

PocketBase is the app backend for local development. The JavaScript SDK and
setup helpers are installed from npm, and the local PocketBase server binary is
downloaded into `.local-pocketbase/` by the setup script.

## First Run

```bash
npm install
npm run setup
npm run dev:full
```

`npm run setup` is idempotent. It downloads the PocketBase binary when needed,
creates or updates the local superuser, starts PocketBase temporarily, applies
the collections, and seeds a demo family account.

## Local Credentials

Defaults are intentionally local-development only:

```bash
PB_ADMIN_EMAIL=admin@digital-parent.local
PB_ADMIN_PASSWORD=digital-parent-admin-123
PB_APP_USERNAME=family
PB_APP_PASSWORD=password123
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

The app login uses username `family` and password `password123`. The admin UI is
at `http://127.0.0.1:8090/_/`.

Override any value in `.env`, `.env.local`, or the shell before running setup.
Shell values win over env-file values.

On Windows PowerShell, one-off overrides look like this:

```powershell
$env:PB_ADMIN_PASSWORD="change-me"; npm run setup
```

## Commands

```bash
npm run pb:install # Download the PocketBase binary only
npm run pb:setup   # Configure schema, admin, and demo app user
npm run pb:serve   # Run only PocketBase on localhost:8090
npm run dev:full   # Run PocketBase and Vite together
```

Data is stored in `.local-pocketbase/pb_data/` and ignored by git.
