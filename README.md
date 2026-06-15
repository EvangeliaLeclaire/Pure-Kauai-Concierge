# Pure Kauai — AI Concierge

**A luxury itinerary platform for Pure Kauai villa hosts.** The concierge fills out a short guest form, Claude AI generates a bespoke day-by-day itinerary with Kauai photography, and a shareable link lets guests read their journey, review the services & quote, and formally approve it.

🌐 **[Live App](https://pure-kauai.replit.app)**

---

## What It Does

### For Hosts (Concierge Portal)
- Fill in guest name, travel dates, party size, special occasion, and notes
- Select services across three categories: **Villa Services**, **In-Villa Experiences**, and **Excursions & Adventures**
- Hit generate — Claude writes a full narrative welcome letter and day-by-day itinerary, with real Kauai photography pulled from Unsplash for each activity
- Preview the result, edit or rearrange activities, then share via a unique guest link

### For Guests (`/trip/:slug`)
- **Your Journey tab** — AI-written welcome letter + day-by-day activities with photos
- **Services & Quote tab** — itemized invoice with adult/child pricing and a formal Approve & Confirm button
- **Journey-only share** (`?journey=1`) — narrative view with no pricing, suitable for sharing with family or friends

### Host Preview Mode (`?host=1`)
- Inline editing tools to delete or reorder activities
- Sharing controls: copy guest link, copy journey-only link, email modal with pre-composed subject and body
- Live banner with trip details

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, Tailwind CSS, shadcn/ui |
| Routing | Wouter v3 |
| Data fetching | TanStack Query |
| API | Express 5 (Node.js 24) |
| Database | PostgreSQL + Drizzle ORM (JSONB data column) |
| AI | Anthropic Claude claude-sonnet-4-5 |
| Photos | Unsplash API |
| Validation | Zod v4, drizzle-zod |
| API contract | OpenAPI spec → Orval codegen (React Query hooks + Zod schemas) |
| Build | esbuild, TypeScript 5.9, pnpm workspaces |

---

## Architecture

- **Contract-first API** — OpenAPI spec is the source of truth; Orval generates all React Query hooks and Zod validators automatically. No hand-written fetch boilerplate.
- **JSONB for AI content** — the entire itinerary payload (welcome message, days, activities, invoice) lives in a single Postgres JSONB column. Avoids a brittle relational schema for deeply nested, AI-generated content.
- **Photos fetched in parallel with generation** — Unsplash photos are fetched immediately after Claude responds, before saving to DB. First page load always has photos, no lazy second request.
- **Slug-based public URLs** — `/trip/anderson-family-jun20`. No auth on the guest side by design; the link is the access control for this internal tool.
- **Journey-only mode via URL param** — `?journey=1` hides all pricing without a separate endpoint or DB flag.

---

## Project Structure

```
artifacts/
  pure-kauai/          # React + Vite frontend
  api-server/          # Express API server
lib/
  api-spec/            # OpenAPI spec + Orval codegen config
  db/                  # Drizzle ORM schema + migrations
  api-client-react/    # Generated React Query hooks
```

### Key Files

| File | Purpose |
|---|---|
| `artifacts/pure-kauai/src/pages/Home.tsx` | Host concierge form |
| `artifacts/pure-kauai/src/pages/Trip.tsx` | Guest itinerary view |
| `artifacts/api-server/src/routes/itineraries/generate.ts` | Claude prompt + Unsplash fetch |
| `artifacts/api-server/src/data/catalog.ts` | Service catalog (names, descriptions, prices) |
| `lib/api-spec/openapi.yaml` | OpenAPI contract |
| `lib/db/src/schema/itineraries.ts` | Database schema |

---

## Running Locally

**Prerequisites:** Node.js 24, pnpm, PostgreSQL

```bash
# Install dependencies
pnpm install

# Set environment variables
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
UNSPLASH_ACCESS_KEY=...

# Push DB schema
pnpm --filter @workspace/db run push

# Start API server (port 5000)
pnpm --filter @workspace/api-server run dev

# Start frontend (separate terminal)
pnpm --filter @workspace/pure-kauai run dev
```

---

Built with [Replit](https://replit.com) · Powered by [Claude](https://anthropic.com) · Photos by [Unsplash](https://unsplash.com)

