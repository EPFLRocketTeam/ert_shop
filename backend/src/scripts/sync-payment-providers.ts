/**
 * Keeps the regions' payment providers in line with the configuration:
 * when STRIPE_API_KEY is set, every region uses Stripe only (and the manual
 * "system" provider, which lets orders through without any payment, is
 * removed). Without a Stripe key nothing is changed, so local development
 * keeps working with the manual provider.
 *
 * Runs on every start of the server container (docker-entrypoint.sh), or by
 * hand: `yarn sync:payments`. Safe to run repeatedly.
 */
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

const STRIPE_PROVIDER = "pp_stripe_stripe"

export default async function syncPaymentProviders({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  if (!process.env.STRIPE_API_KEY) {
    logger.info("STRIPE_API_KEY not set - leaving region payment providers unchanged.")
    return
  }

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "payment_providers.id"],
  })

  for (const region of regions) {
    const current = (region.payment_providers ?? []).map((p) => p?.id).filter(Boolean)
    if (current.length === 1 && current[0] === STRIPE_PROVIDER) {
      continue
    }
    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: region.id },
        update: { payment_providers: [STRIPE_PROVIDER] },
      },
    })
    logger.info(
      `Region "${region.name}": payment providers [${current.join(", ")}] -> [${STRIPE_PROVIDER}]`
    )
  }
}
