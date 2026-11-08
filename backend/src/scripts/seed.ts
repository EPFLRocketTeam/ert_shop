/**
 * ERT shop seed: Switzerland / CHF setup + one sample product.
 *
 *   yarn seed
 *
 * Safe to run repeatedly: if the store already has a region it only re-exports
 * the publishable API key and exits. In Docker it runs automatically on every
 * start of the server container (see docker-entrypoint.sh).
 *
 * If PUBLISHABLE_KEY_FILE is set, the publishable key is written to that file
 * so the storefront container can pick it up without any manual copy/paste.
 *
 * Creates:
 *  - store currency CHF (default)
 *  - region "Switzerland" (CH, CHF) using Stripe if STRIPE_API_KEY is set,
 *    otherwise the manual "system" provider (dev only - no real payment!)
 *  - tax region CH (no default rate - ERT is not VAT-registered, adjust if needed)
 *  - stock location "ERT - EPFL" with two shipping options:
 *      * Pickup at EPFL (free) - main option for the pre-order model
 *      * Swiss Post (flat CHF 9)
 *  - publishable API key "ERT Webshop" linked to the default sales channel
 *  - a sample "ERT T-Shirt" product (CHF 40, sizes S-XL, pre-order /
 *    no inventory tracking) to test the purchase flow end-to-end
 */
import fs from "fs"
import path from "path"
import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createApiKeysWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[]
    store_id: string
  }) => {
    const normalizedInput = transform({ input }, (data) => ({
      selector: { id: data.input.store_id },
      update: {
        supported_currencies: data.input.supported_currencies.map((c) => ({
          currency_code: c.currency_code,
          is_default: c.is_default ?? false,
        })),
      },
    }))
    return new WorkflowResponse(updateStoresStep(normalizedInput))
  }
)

function exportPublishableKey(token: string, logger: { info: (m: string) => void }) {
  logger.info(
    `Publishable API key (storefront NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY): ${token}`
  )
  const file = process.env.PUBLISHABLE_KEY_FILE
  if (file) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, token)
    logger.info(`Publishable API key written to ${file}`)
  }
}

export default async function seedErtShop({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // Already seeded? Then only re-export the key.
  const { data: existingRegions } = await query.graph({ entity: "region", fields: ["id"] })
  if (existingRegions.length) {
    logger.info("Store already seeded, skipping.")
    const { data: keys } = await query.graph({
      entity: "api_key",
      fields: ["token"],
      filters: { type: "publishable", revoked_at: null },
    })
    if (keys[0]?.token) {
      exportPublishableKey(keys[0].token, logger)
    } else {
      logger.warn("No publishable API key found - create one in the admin dashboard.")
    }
    return
  }
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const storeModuleService = container.resolve(Modules.STORE)

  const COUNTRIES = ["ch"]
  const paymentProviders = process.env.STRIPE_API_KEY
    ? ["pp_stripe_stripe"]
    : ["pp_system_default"]

  // ---- Store & sales channel ----
  logger.info("Seeding store...")
  const [store] = await storeModuleService.listStores()
  let salesChannels = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  })
  if (!salesChannels.length) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: "Default Sales Channel" }] },
    })
    salesChannels = result
  }
  const salesChannel = salesChannels[0]

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [{ currency_code: "chf", is_default: true }],
    },
  })
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { name: "EPFL Rocket Team Shop", default_sales_channel_id: salesChannel.id },
    },
  })

  // ---- Region & tax ----
  logger.info(`Seeding region (payment providers: ${paymentProviders.join(", ")})...`)
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Switzerland",
          currency_code: "chf",
          countries: COUNTRIES,
          payment_providers: paymentProviders,
        },
      ],
    },
  })
  const region = regionResult[0]

  await createTaxRegionsWorkflow(container).run({
    input: COUNTRIES.map((country_code) => ({ country_code, provider_id: "tp_system" })),
  })

  // ---- Stock location & fulfillment ----
  logger.info("Seeding stock location and shipping options...")
  const { result: stockLocationResult } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: "ERT - EPFL",
          address: {
            address_1: "EPFL",
            city: "Lausanne",
            postal_code: "1015",
            country_code: "CH",
          },
        },
      ],
    },
  })
  const stockLocation = stockLocationResult[0]

  await updateStoresWorkflow(container).run({
    input: { selector: { id: store.id }, update: { default_location_id: stockLocation.id } },
  })

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })

  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({ type: "default" })
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null
  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Default Shipping Profile", type: "default" }] },
    })
    shippingProfile = result[0]
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "ERT - EPFL delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Switzerland",
        geo_zones: COUNTRIES.map((country_code) => ({ country_code, type: "country" as const })),
      },
    ],
  })

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  })

  const storeRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ]

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Pickup at EPFL",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Pickup",
          description: "Collect your order from the team at EPFL once the batch arrives.",
          code: "pickup-epfl",
        },
        prices: [
          { currency_code: "chf", amount: 0 },
          { region_id: region.id, amount: 0 },
        ],
        rules: storeRules,
      },
      {
        name: "Swiss Post",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Swiss Post",
          description: "Shipped by post once the batch arrives.",
          code: "swiss-post",
        },
        prices: [
          { currency_code: "chf", amount: 9 },
          { region_id: region.id, amount: 9 },
        ],
        rules: storeRules,
      },
    ],
  })

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id, add: [salesChannel.id] },
  })

  // ---- Publishable API key (goes into the storefront's env) ----
  logger.info("Seeding publishable API key...")
  const { data: existingKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token"],
    filters: { type: "publishable" },
  })
  let publishableKey = existingKeys?.[0] as { id: string; token: string } | undefined
  if (!publishableKey) {
    const {
      result: [created],
    } = await createApiKeysWorkflow(container).run({
      input: { api_keys: [{ title: "ERT Webshop", type: "publishable", created_by: "" }] },
    })
    publishableKey = created as unknown as { id: string; token: string }
  }
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishableKey.id, add: [salesChannel.id] },
  })

  // ---- Sample product ----
  logger.info("Seeding sample product...")
  const { result: categories } = await createProductCategoriesWorkflow(container).run({
    input: { product_categories: [{ name: "Merch", is_active: true }] },
  })

  const sizes = ["S", "M", "L", "XL"]
  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "ERT T-Shirt (sample)",
          handle: "ert-t-shirt",
          description:
            "Sample product used to test the shop end-to-end. Replace with the real merch catalogue from the admin dashboard.",
          status: ProductStatus.PUBLISHED,
          category_ids: [categories[0].id],
          shipping_profile_id: shippingProfile.id,
          weight: 200,
          options: [{ title: "Size", values: sizes }],
          variants: sizes.map((size) => ({
            title: size,
            sku: `ERT-TSHIRT-${size}`,
            options: { Size: size },
            // Pre-order model: no stock tracking, orders are collected first
            // and the batch is produced afterwards.
            manage_inventory: false,
            prices: [{ amount: 40, currency_code: "chf" }],
          })),
          sales_channels: [{ id: salesChannel.id }],
        },
      ],
    },
  })

  logger.info("Done.")
  exportPublishableKey(publishableKey.token, logger)
}
