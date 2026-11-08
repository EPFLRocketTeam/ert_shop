import { listCategories } from "@lib/data/categories"
import { ERT_MAIN_SITE } from "@lib/constants"
import { Text } from "@medusajs/ui"
import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SOCIALS = [
  { name: "Instagram", href: "https://www.instagram.com/epflrocketteam/", icon: "/icons/instagram.svg" },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/epfl-rocket-team/", icon: "/icons/linkedin.svg" },
  { name: "YouTube", href: "https://www.youtube.com/channel/UCzwfq09H46CorH7S-K1UnUg", icon: "/icons/youtube.svg" },
]

const linkClass = "uppercase text-[13px] tracking-[0.06em] hover:text-ert-red transition-colors"

/** Footer modelled on the one of epflrocketteam.ch (wordmark, socials, uppercase links). */
export default async function Footer() {
  const productCategories = await listCategories().catch(() => [])
  const topCategories = (productCategories || []).filter((c) => !c.parent_category).slice(0, 4)

  return (
    <footer className="w-full border-t border-ui-border-base bg-black text-ert-text">
      <div className="content-container flex flex-col w-full">
        <div className="grid grid-cols-1 gap-12 py-16 small:grid-cols-3 small:items-end">
          <LocalizedClientLink href="/" aria-label="EPFL Rocket Team Shop - home" className="w-fit">
            <Image
              src="/images/ert-wordmark-white.webp"
              alt="ERT - EPFL Rocket Team"
              width={145}
              height={449}
              className="h-40 small:h-56 w-auto"
            />
          </LocalizedClientLink>

          <div className="flex flex-col gap-4 small:items-center">
            <span className="text-[13px] font-light">Follow us on social media</span>
            <ul className="flex gap-5">
              {SOCIALS.map((s) => (
                <li key={s.name}>
                  <a href={s.href} target="_blank" rel="noreferrer" aria-label={s.name} className="block opacity-90 hover:opacity-100">
                    <Image src={s.icon} alt="" width={28} height={28} className="h-7 w-7" unoptimized />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <ul className="flex flex-col gap-3 small:items-end" data-testid="footer-links">
            <li>
              <LocalizedClientLink href="/store" className={linkClass}>All products</LocalizedClientLink>
            </li>
            {topCategories.map((c) => (
              <li key={c.id}>
                <LocalizedClientLink href={`/categories/${c.handle}`} className={linkClass} data-testid="category-link">
                  {c.name}
                </LocalizedClientLink>
              </li>
            ))}
            <li>
              <LocalizedClientLink href="/account" className={linkClass}>Account</LocalizedClientLink>
            </li>
            <li>
              <a href={`${ERT_MAIN_SITE}/contact/`} className={linkClass}>Contact</a>
            </li>
            <li>
              <a href={ERT_MAIN_SITE} className={linkClass}>epflrocketteam.ch&nbsp;↗</a>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 small:flex-row small:gap-8 pb-8 text-[12px] text-ert-text-muted">
          <Text className="text-[12px]">© {new Date().getFullYear()} EPFL Rocket Team</Text>
          <a href={`${ERT_MAIN_SITE}/privacy-policy/`} className="hover:text-ert-text">Privacy Policy</a>
        </div>
      </div>
    </footer>
  )
}
