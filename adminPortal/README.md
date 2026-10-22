# neoPathshala adminPortal

A new admin workspace for mainPanel. It uses PostgreSQL schema `mainpanel_v2` and does not import legacy JSON data. Entrance portal data and the older public database schema are outside this rebuild.

## Start locally

```sh
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3000/setup. The requested owner email is `aashish@neopathshala.com`. Choose a password of at least 14 characters and create the owner account. Sign in using that password and the one-time code sent to the owner email. No authenticator app is required for accounts created through this setup. Setup is disabled once an owner exists and is unavailable in production.

## Server configuration

Use `.env.local` locally and the hosting provider’s server environment in production:

- `DATABASE_URL`: the Neon pooled connection, shared with mainPanel.
- `DIRECT_DATABASE_URL`: optional migration connection; never a client variable.
- `AUTH_SECRET`: a stable random secret of at least 32 characters for encrypting authenticator keys. Keep a secure backup. Changing it invalidates encrypted authenticator secrets.
- `APP_ORIGIN`: the exact admin origin, without a trailing slash.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: server-only mail settings for email OTP delivery. Authentication fails closed when delivery fails.

No credential uses a `NEXT_PUBLIC_` variable. Environment files are ignored by Git. Runtime pools use the isolated schema explicitly and retain TLS certificate verification.

Production owner bootstrap is `npm run admin:create`, with `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` supplied through the terminal environment. The command prints the authenticator enrollment key once and refuses to create a second initial owner. Remove bootstrap password variables afterward.

## Content workflow

Create a university, then a course, subjects, chapters, and resources. New content starts in Draft. Publish each parent and its children to make it visible in mainPanel. URL slugs are unique. Resources use HTTPS URLs. Archive content to remove it from public view. The new workspace intentionally contains no sample content.

Owners control settings and audit access. Editors manage content. Support staff manage student access. Permissions are enforced on server actions and pages. Student suspension revokes existing student sessions. Administrative changes and audit entries commit together. Every content save rotates the browser cache version, so online mainPanel clients refresh their public content.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

The local development dependency link reuses mainPanel’s installed packages. A fresh checkout or deployment installs its own packages from this app’s lockfile.
