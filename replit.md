# Food Palace Restaurant

A full-stack Nigerian restaurant ordering platform with customer-facing ordering, cart, checkout, order tracking, and a complete admin dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, shadcn/ui, Tailwind CSS, Framer Motion, TanStack Query, Wouter router
- API: Express 5, JWT auth (Node crypto — no bcrypt)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contract
- `lib/db/src/schema.ts` — Drizzle DB schema
- `lib/api-client-react/src/generated/api.ts` — auto-generated React Query hooks
- `lib/api-client-react/src/custom-fetch.ts` — fetch wrapper that injects JWT from localStorage
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/food-palace/src/pages/` — all customer + admin pages
- `artifacts/food-palace/src/contexts/` — AuthContext (JWT), CartContext (localStorage)
- `artifacts/food-palace/src/components/layouts/` — CustomerLayout, AdminLayout

## Architecture decisions

- JWT stored in `localStorage` as `food_palace_token` (customer) and `food_palace_admin_token` (admin); custom-fetch injects whichever is present as `Authorization: Bearer`
- Cart is client-side only (localStorage) — never stored in DB until checkout
- Orders API uses `optionalAuth` middleware so guests can place orders
- Drizzle `numeric` columns return strings — all route handlers convert with `Number()`
- Settings row is auto-created with defaults on first `GET /api/settings`

## Product

- **Customer**: Browse menu by category, search, view product details with variants/addons, add to cart, register/login, checkout with delivery zone selection, pay by bank transfer (MONIEPOINT MFB / 9110064364) or cash on delivery, track order status, save favorites
- **Admin** (`/admin/login`): Dashboard analytics, manage orders (status + payment confirmation), manage products/categories/delivery zones, update restaurant settings
- **WhatsApp** floating button linked to +2349110064364

## Delivery Zones

| Zone | Areas | Fee |
|------|-------|-----|
| Zone A | Unguwan Dosa, Kawo | ₦1,000 |
| Zone B | Barnawa, Kakuri | ₦1,500 |
| Zone C | Sabon Tasha, Ungwan Rimi | ₦2,000 |

## Admin Credentials

- Email: `admin@foodpalace.com`
- Password: `admin123`
- Login at: `/admin/login`

## User preferences

- Nigerian restaurant — Kaduna-based delivery zones
- Bank: MONIEPOINT MFB, Account: USMAN SAMBO MARAFA, 9110064364
- WhatsApp: +2349110064364
- Theme: Navy blue (#0f172a) + Gold (#d4a017)

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml` — generated hooks must stay in sync
- Drizzle numeric fields return strings from DB — always wrap in `Number()` in route handlers
- Do not run `pnpm dev` at workspace root — use workflow tools

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
