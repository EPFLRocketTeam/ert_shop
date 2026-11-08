import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { StoreRegion } from "@medusajs/types"
import ErtLogo from "@modules/common/icons/ert-logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import { ERT_MAIN_SITE } from "@lib/constants"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      {/* translucent black bar, like the header of epflrocketteam.ch */}
      <header className="relative h-16 small:h-[72px] mx-auto bg-black/60 backdrop-blur-md">
        <nav className="content-container flex items-center justify-between w-full h-full text-[15px] font-semibold text-ert-text">
          <LocalizedClientLink
            href="/"
            className="flex items-center gap-3 h-full"
            data-testid="nav-store-link"
            aria-label="EPFL Rocket Team Shop - home"
          >
            <ErtLogo className="h-9 w-auto" />
            <span className="ert-label font-semibold tracking-[0.18em]">
              Shop
            </span>
          </LocalizedClientLink>

          <div className="flex items-center gap-x-8 h-full">
            <div className="hidden small:flex items-center gap-x-8 h-full">
              <LocalizedClientLink
                className="hover:text-ert-red transition-colors"
                href="/store"
                data-testid="nav-all-products-link"
              >
                All products
              </LocalizedClientLink>
              <LocalizedClientLink
                className="hover:text-ert-red transition-colors"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
              <a
                className="hover:text-ert-red transition-colors"
                href={ERT_MAIN_SITE}
                data-testid="nav-main-site-link"
              >
                epflrocketteam.ch&nbsp;↗
              </a>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ert-red flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
            <div className="small:hidden h-full">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
          </div>
        </nav>
      </header>
    </div>
  )
}
