# ERT Shop

Online merch shop for the EPFL Rocket Team - `shop.epflrocketteam.ch`.

| Part | Folder | Tech |
|---|---|---|
| Backend + admin dashboard | `backend/` | [Medusa v2](https://docs.medusajs.com) (Node 22, Postgres, Redis) |
| Storefront | `storefront/` | Medusa's official Next.js starter |
| Payments | - | Stripe (ERT account), via Medusa's built-in Stripe provider |

Shop setup (seeded by `backend/src/scripts/seed.ts`): one region **Switzerland / CHF**, shipping
options **Pickup at EPFL** (free) and **Swiss Post** (CHF 9), and a sample "ERT T-Shirt" (CHF 40,
pre-order: no stock tracking). Real products are managed from the admin dashboard.

## Local development

Requirements: Node 22, Postgres 16, Redis 7 (or just Docker - see below).

```bash
# backend
cd backend
cp .env.template .env            # fill in DATABASE_URL, optionally Stripe TEST keys
yarn install
npx medusa db:migrate
yarn seed                        # prints the publishable API key at the end
npx medusa user -e you@epfl.ch -p <password>   # admin login
yarn dev                         # http://localhost:9000  (admin: /app)

# storefront (second terminal)
cd storefront
cp .env.template .env.local      # set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY from the seed output
yarn install
yarn dev                         # http://localhost:8000
```

`yarn` here is the Yarn 4 bundled in each folder (`.yarn/releases`) - run `corepack enable` once, or
use `node .yarn/releases/yarn-4.12.0.cjs <cmd>`.

Without `STRIPE_API_KEY` the region uses Medusa's manual payment provider (orders go through without
any real payment) - **only for local testing.**

## Stripe

1. Use **test keys** (`sk_test_...` / `pk_test_...`) until a full checkout has been verified.
2. Backend: `STRIPE_API_KEY` (secret key). Storefront: `NEXT_PUBLIC_STRIPE_KEY` (publishable key).
3. Webhook: Stripe Dashboard -> Developers -> Webhooks -> add endpoint
   `https://api.shop.epflrocketteam.ch/hooks/payment/stripe_stripe`
   with the `payment_intent.*` events (`succeeded`, `amount_capturable_updated`, `payment_failed`,
   `canceled`, `processing`, `requires_action`, `partially_funded`); put its signing secret in
   `STRIPE_WEBHOOK_SECRET`.
4. Keys go **only** into `.env` files / Dokploy environment variables - never into git.

Note: the region is created with Stripe only if `STRIPE_API_KEY` was set when `yarn seed` ran.
If you seeded without it, add the Stripe provider to the region in the admin dashboard
(Settings -> Regions -> Switzerland).

## Running everything with Docker (local or Dokploy)

Everything is described in `docker-compose.yml`: Postgres, Redis, Medusa **server** (API + admin),
Medusa **worker** (background jobs) and the storefront.

```bash
cp .env.example .env     # fill in passwords/secrets (see comments in the file)
docker compose up -d --build
```

On start the server container automatically:
1. runs the database migrations,
2. seeds the shop on the very first start (later starts skip this),
3. writes the publishable API key to a shared volume,
4. creates the admin user if `MEDUSA_ADMIN_EMAIL` / `MEDUSA_ADMIN_PASSWORD` are set.

The storefront container waits until the backend is healthy, reads the key, then runs
`next build` (Next.js prerenders pages from the live backend, so it can't build earlier) and
starts. **The first start takes a few minutes** - follow it with `docker compose logs -f storefront`.

- Shop: http://localhost:8000 - Admin: http://localhost:9000/app
- Admin user later / another one: `docker compose exec medusa-server npx medusa user -e <email> -p <password>`

### Troubleshooting

- **`role "..." does not exist` / `password authentication failed`** in the postgres logs:
  Postgres creates its user and password only the **first** time it starts on an empty volume.
  If `POSTGRES_USER` / `POSTGRES_PASSWORD` changed after that, the database still has the old
  ones. On a fresh setup with no data worth keeping, wipe the volumes and start again:
  `docker compose down -v && docker compose up -d --build`.
  (On a server with real orders, never use `-v` - change the password inside Postgres instead.)
- Keep `POSTGRES_PASSWORD` to letters and digits (e.g. the hex output of the command in
  `.env.example`): characters like `@ : / #` break the `DATABASE_URL` connection string.

### Dokploy (production)

Server: the dedicated shop server (4C / 8 GB / 80 GB, `185.223.253.189`).
DNS: `shop.epflrocketteam.ch` and `api.shop.epflrocketteam.ch` both point to it.

The whole stack (incl. its own Postgres and Redis) is **one Dokploy "Compose" service** -
no separate Dokploy database/application services are needed.

1. Project `ert-shop` -> environment `production` -> **Create Service -> Compose**, server
   `4C 80GB 8GB`.
2. **General -> Provider**: GitHub, repository `EPFLRocketTeam/ert_shop`, branch `main`,
   compose path `./docker-compose.yml`. Enable **Autodeploy** (redeploys on every push/merge to
   `main`).
3. **Advanced**: enable **Isolated Deployments** (Dokploy then wires the networking between the
   containers and its proxy by itself).
4. **Environment**: everything from `.env.example`, with **new** production secrets (never reuse
   the local ones) and the production URLs:
   ```
   STORE_CORS=https://shop.epflrocketteam.ch
   ADMIN_CORS=https://api.shop.epflrocketteam.ch
   AUTH_CORS=https://api.shop.epflrocketteam.ch
   MEDUSA_BACKEND_URL=https://api.shop.epflrocketteam.ch
   NEXT_PUBLIC_BASE_URL=https://shop.epflrocketteam.ch
   MEDUSA_ADMIN_EMAIL=...        # first admin login
   MEDUSA_ADMIN_PASSWORD=...
   ```
   Stripe stays empty until the checkout step (then test keys first).
5. **Domains** (HTTPS, certificate: Let's Encrypt):
   - `shop.epflrocketteam.ch` -> service `storefront`, port `8000`
   - `api.shop.epflrocketteam.ch` -> service `medusa-server`, port `9000`
6. **Deploy**. First deploy takes a while (image builds + storefront build at start). Then:
   shop at https://shop.epflrocketteam.ch, admin at https://api.shop.epflrocketteam.ch/app.
7. Later (checkout step): Stripe webhook -> `https://api.shop.epflrocketteam.ch/hooks/payment/stripe_stripe`.

The container ports are bound to `127.0.0.1` only, so on the server the services are reachable
from the internet exclusively through Dokploy's HTTPS proxy.

## Next steps

- [ ] Run a full test checkout with Stripe test keys
- [ ] TWINT: the starter's checkout only uses Stripe's Card Element; TWINT needs switching to
      Stripe's Payment Element (+ enabling TWINT in the Stripe dashboard)
- [ ] Pass the Stripe processing fee on to the customer at checkout
- [ ] Member discount codes (Medusa promotions)
- [ ] Re-theme the storefront to match epflrocketteam.ch
- [ ] Link to the shop from the main website
