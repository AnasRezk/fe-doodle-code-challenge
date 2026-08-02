# Contributor Guide

Read [DECISIONS.md](./DECISIONS.md) before changing architecture or dependencies.

## Setup

1. Use a current Node.js release supported by Next.js (Node.js 20.9 or newer).
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and update the API URL when needed.
4. Run `npm run dev` and open `http://localhost:3002`.

## Project boundaries

- Keep routes and layouts in `src/app`.
- Keep reusable UI in `src/components`; shadcn/ui primitives belong in `src/components/ui`.
- Keep API request types and HTTP calls in `src/lib/api`.
- Keep React Query hooks in `src/hooks`.
- Keep tests beside the code they cover; browser tests belong in `tests/e2e`.
- Read the display name and generated `access_token` from first-party cookies. The access token is a transport placeholder, not user identity.

## Checks

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e`
