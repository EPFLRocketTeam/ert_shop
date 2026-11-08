# ERT Shop - Roadmap

One branch per step, merged into `main` through a pull request after review.
Branch naming: `feat/...` new functionality, `chore/...` setup/infra, `fix/...` bug fixes.

| # | Branch | What | Done when |
|---|---|---|---|
| 0 | `chore/initial-scaffold` | Medusa backend + Next.js storefront + Docker/compose + README | Merged into `main` |
| 1 | `feat/ert-theme` | Storefront looks like epflrocketteam.ch: dark theme, ERT red, Aspekta font, ERT header/footer, home page hero, product cards, ERT texts instead of "Medusa Store" | Home, store, product, cart and checkout pages all use the ERT style |
| 2 | `feat/logo-intro` | Animated ERT logo intro when entering the shop (once per session, skippable, respects "reduced motion") | Plays on first visit, never blocks navigation |
| 3 | `feat/stripe-checkout` | Real test checkout with ERT Stripe **test** keys, webhook, switch Card Element -> Payment Element so **TWINT** works | Test order paid by card and by TWINT shows as paid in the admin |
| 4 | `feat/payment-fee` | Pass the Stripe processing fee on to the customer at checkout | Fee visible as its own line in cart/checkout and on the order |
| 5 | `feat/member-discounts` | Member pricing via Medusa promotions (how members are verified: to decide) | A member can check out at the member price |
| 6 | `chore/deploy-dokploy` | Deploy the compose stack on Dokploy, env vars, domains `shop.` / `api.shop.`, Stripe live webhook, backups of Postgres | Shop reachable on shop.epflrocketteam.ch with HTTPS |
| 7 | *(ert_website repo)* `feat/shop-link` | Link to the shop from the main site (nav/footer), optionally reuse the logo intro there | Link live on epflrocketteam.ch |
| 8 | - | Real catalogue: products, photos, sizes, prices (admin dashboard, no code) | Pre-order batch open |

Later / nice to have: order confirmation emails (notification module), pre-order deadline +
"batch closed" state, stats for the board (orders per product/size for the supplier order).

Blocked on others:
- DNS access to epflrocketteam.ch (Jordan) - needed for step 6
- Dokploy server capacity check - needed for step 6
- Member verification method (board) - needed for step 5
