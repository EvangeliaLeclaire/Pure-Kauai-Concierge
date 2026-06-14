---
name: Pure Kauai Architecture
description: Stack, key decisions, and sharp edges for the Pure Kauai luxury travel concierge app
---

## Stack
- React + Vite (pure-kauai) at `/`
- Express 5 (api-server) at `/api`
- In-memory store (no DB) — itineraries wipe on server restart
- Claude claude-sonnet-4-5 for AI generation, Unsplash for photos (fallback: picsum)
- Orval codegen from `lib/api-spec/openapi.yaml`

## Host mode
- Host accesses `/trip/:slug?host=1`
- Detected via `new URLSearchParams(useSearch()).get("host") === "1"`
- wouter v3 `useSearch()` returns search string WITH leading `?`

## API surface
- `POST /api/itineraries` — generate (calls Claude, then awaits Unsplash photos)
- `GET /api/itineraries/:id` — fetch by UUID or slug
- `PATCH /api/itineraries/:id` — host inline edits `{ welcomeMessage?, days? }`
- `POST /api/itineraries/:id/approve` — guest approval

## Inline editing (host mode)
- Edit keys: `"welcome"`, `"title-{dayIdx}"`, `"desc-{dayIdx}-{actIdx}"`
- `handleSaveEdit(key)` builds patch and calls `useUpdateItinerary().mutate({ id, data: patch })`
- On success: invalidates React Query cache for the itinerary

## Sharp edges
- In-memory store: any server restart loses all itineraries — "not found" page explains this
- Claude call wrapped in try/catch; frontend shows error if generation fails
- JSON.parse of Claude output wrapped in try/catch
- Unsplash photos are optional (graceful fallback to picsum)
- `handleCopyLink` has execCommand fallback for blocked clipboard API
- checkOut > checkIn validated via Zod `.refine()` on form submit

## Brand
- Colors: #053E50 dark teal, #EBE2E0 sand, #37729A blue, #937C66 warm brown
- Fonts: Source Serif 4 headings/italic, Inter body
