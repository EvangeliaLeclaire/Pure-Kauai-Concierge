# Pure Kauai

An internal concierge tool for Pure Kauai: hosts fill out a guest form, Claude AI generates a bespoke luxury itinerary, and a shareable link lets guests read their journey, view the services & quote, and formally approve it.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `ANTHROPIC_API_KEY` — Claude API key
- Required env: `UNSPLASH_ACCESS_KEY` — Unsplash photo API key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite 6, Tailwind CSS, Wouter v3 (routing), TanStack Query (data fetching)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: Anthropic Claude claude-sonnet-4-5 (`@anthropic/sdk`)
- Photos: Unsplash API (fallback: picsum.photos)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)
- UI components: shadcn/ui (Radix UI primitives)
- Icons: Lucide React
- Fonts: Source Serif 4 (headings), Inter (body)
- Toast/copy utilities: custom hooks

## Where things live

- `artifacts/pure-kauai/src/pages/Home.tsx` — host concierge form (the only entry point for creating itineraries)
- `artifacts/pure-kauai/src/pages/Trip.tsx` — guest itinerary view (shareable, 2-tab experience)
- `artifacts/api-server/src/routes/itineraries/generate.ts` — Claude prompt + Unsplash photo fetch
- `artifacts/api-server/src/routes/itineraries/store.ts` — async Drizzle DB read/write
- `artifacts/api-server/src/routes/itineraries/index.ts` — Express route handlers (POST create, GET fetch, PATCH approve/edit)
- `artifacts/api-server/src/data/catalog.ts` — service catalog with names, descriptions, prices, categories
- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/itineraries.ts` — Drizzle table definition (itineraries)

## Architecture decisions

- **Contract-first API**: OpenAPI spec defined first → Orval generates React Query hooks and Zod schemas automatically. Server validates with those same schemas.
- **JSONB for itinerary data**: the entire `itinerary` payload (welcome message, days, activities, invoice) lives in a single Postgres JSONB column (`data`). Avoids a complex relational schema for deeply nested, AI-generated content that has no fixed shape.
- **Photo fetch is synchronous with generation**: Unsplash photos are fetched in parallel immediately after Claude responds, before saving to DB. This means the first page load always has photos — no lazy-loading second request needed.
- **Slug-based public URLs**: itineraries are accessed at `/trip/:slug` (e.g. `/trip/anderson-family-jun20`). The slug is generated from guest name + check-in date; no auth required on the guest side by design (internal tool, links are the access control).
- **Journey-only mode via URL param**: adding `?journey=1` to a guest link hides all pricing, the Services & Quote tab, and the sticky CTA bar — giving hosts a clean narrative-only share option without a separate endpoint or DB flag.

## Product

- **Host Portal** (`/`): concierge fills in guest name, dates, party size, special occasion, notes, then selects from three service categories (Villa Services, In-Villa Experiences, Excursions & Adventures). Submitting calls Claude to generate a full day-by-day itinerary with beautiful Kauai photography for each activity.
- **Guest Page** (`/trip/:slug`): two-tab view. "Your Journey" tab shows the AI-written welcome letter and each day's activities with photos. "Services & Quote" tab shows the itemized invoice and a formal Approve & Confirm button.
- **Host Preview** (`/trip/:slug?host=1`): adds a top banner with inline editing tools, sharing controls (copy guest link, journey-only link, email modal), and the ability to delete or rearrange activities.
- **Journey-only share** (`/trip/:slug?journey=1`): single-tab narrative view — no prices, no quote, no CTA. Suitable for sharing with family or friends.
- **Email Guest modal**: pre-composed subject and body with copy-to-clipboard and "Open Email Client" fallback.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **wouter v3 `useSearch()`** returns the query string WITH the leading `?`. Always parse with `new URLSearchParams(search).get("key")`.
- **`pnpm --filter @workspace/db run push`** must be run after any schema changes to `lib/db/src/schema/` before the API server will work in dev.
- **Never run `pnpm dev` at the workspace root** — individual artifact workflows (managed by Replit) are the correct way to start services.
- **Typecheck leaf packages** with `pnpm --filter @workspace/<name> run typecheck`, not `build` — `build` requires `PORT` and `BASE_PATH` env vars that only the workflow provides.
- **After any change to Orval output paths or the OpenAPI spec** run `pnpm --filter @workspace/api-spec run codegen` to regenerate hooks.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
