# CAISH Applications

Applications portal for Cambridge AI Safety Hub programmes (MARS, HVP, internships).

Deployed at <https://application.caish.org>.

## Stack

- Next.js (app router) on Vercel
- Postgres on Neon (auth tokens, sessions, audit logs)
- Airtable as source of truth for application data
- Auth.js v5 with Resend email magic links
- Tailwind CSS

## Local development

```sh
npm install
npm run dev
```

Local env vars go in `.env.local` (gitignored). Production env vars live in the Vercel dashboard.
