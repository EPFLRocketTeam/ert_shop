import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const REDIS_URL = process.env.REDIS_URL
const STRIPE_API_KEY = process.env.STRIPE_API_KEY

// Redis-backed infrastructure modules. Used whenever REDIS_URL is set
// (docker-compose / Dokploy). Without it, Medusa falls back to in-memory
// implementations, which is fine for quick local hacking only.
const redisModules = REDIS_URL
  ? [
      {
        resolve: "@medusajs/medusa/cache-redis",
        options: { redisUrl: REDIS_URL },
      },
      {
        resolve: "@medusajs/medusa/event-bus-redis",
        options: { redisUrl: REDIS_URL },
      },
      {
        resolve: "@medusajs/medusa/workflow-engine-redis",
        options: { redis: { redisUrl: REDIS_URL } },
      },
      {
        resolve: "@medusajs/medusa/locking",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/locking-redis",
              id: "locking-redis",
              is_default: true,
              options: { redisUrl: REDIS_URL },
            },
          ],
        },
      },
    ]
  : []

// Stripe is only registered when a key is present, so the backend still boots
// for local development without Stripe credentials.
const paymentModule = STRIPE_API_KEY
  ? [
      {
        resolve: "@medusajs/medusa/payment",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/payment-stripe",
              id: "stripe",
              options: {
                apiKey: STRIPE_API_KEY,
                webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                // Capture immediately on order placement (merch pre-orders are
                // paid up front, nothing to authorise-then-capture later).
                capture: true,
              },
            },
          ],
        },
      },
    ]
  : []

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Medusa turns on SSL automatically for any database host that isn't
    // "localhost". Our Postgres runs next to Medusa in the same Docker network
    // without TLS, so SSL is off unless DATABASE_SSL=true (e.g. a managed DB).
    databaseDriverOptions: {
      connection: {
        ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
      },
    },
    redisUrl: REDIS_URL,
    // "server" | "worker" | "shared". In Dokploy we run one container as
    // server and one as worker; locally "shared" runs both in one process.
    workerMode: (process.env.MEDUSA_WORKER_MODE as
      | "shared"
      | "worker"
      | "server") || "shared",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  admin: {
    // The worker container doesn't need to serve the admin dashboard.
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [...redisModules, ...paymentModule],
})
