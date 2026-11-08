import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

export const metadata: Metadata = {
  title: { absolute: "EPFL Rocket Team Shop" },
  description:
    "Official merchandise of the EPFL Rocket Team. Every order supports students designing, building and launching rockets.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products, count },
  } = await listProducts({
    regionId: region.id,
    queryParams: { limit: 8, fields: "*variants.calculated_price" },
  })

  return (
    <>
      <Hero />
      <section className="content-container py-16 small:py-24" data-testid="home-products">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="ert-label">The collection</span>
            <h2 className="mt-2 text-[28px] font-normal small:text-[34px]">All products</h2>
          </div>
          {count > products.length && (
            <LocalizedClientLink href="/store" className="ert-btn">
              View all →
            </LocalizedClientLink>
          )}
        </div>
        {products.length ? (
          <ul className="grid grid-cols-1 gap-x-6 gap-y-12 xsmall:grid-cols-2 medium:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductPreview product={product} region={region} isFeatured />
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-extralight text-ert-text-muted">
            New merch is on its way - check back soon.
          </p>
        )}
      </section>
    </>
  )
}
