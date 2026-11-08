import { ERT_MAIN_SITE } from "@lib/constants"
import ErtLogo from "@modules/common/icons/ert-logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/** Home hero in the style of epflrocketteam.ch: label, rule, huge title, light lead text. */
const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden border-b border-ui-border-base">
      {/* oversized faint logo as backdrop (no photo on purpose) */}
      <ErtLogo
        mono
        className="pointer-events-none absolute -right-24 top-1/2 hidden h-[130%] w-auto -translate-y-1/2 text-white opacity-[0.06] small:block"
      />
      <div className="content-container relative flex min-h-[70vh] flex-col justify-end pb-16 pt-32 small:pb-24">
        <span className="ert-label">Official merch</span>
        <div className="mt-2 mb-6 h-px w-full max-w-[640px] bg-white" />
        <h1 className="font-semibold leading-[0.95] tracking-[-0.01em] text-[44px] xsmall:text-[64px] medium:text-[90px]">
          EPFL ROCKET TEAM
          <span className="block text-ert-red">SHOP</span>
        </h1>
        <p className="mt-8 max-w-[520px] text-[17px] font-extralight leading-relaxed small:text-[20px]">
          Wear the team. Official EPFL Rocket Team merchandise. Every order
          supports the students who design, build and launch our rockets.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <LocalizedClientLink href="/store" className="ert-btn-primary">
            Shop all products →
          </LocalizedClientLink>
          <a href={ERT_MAIN_SITE} className="ert-btn">
            Discover the team →
          </a>
        </div>
      </div>
    </section>
  )
}

export default Hero
