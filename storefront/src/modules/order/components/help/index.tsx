import { ERT_MAIN_SITE } from "@lib/constants"
import { Heading } from "@medusajs/ui"
import React from "react"

const Help = () => {
  return (
    <div className="mt-6">
      <Heading className="text-base-semi">Need help?</Heading>
      <div className="text-base-regular my-2">
        <ul className="gap-y-2 flex flex-col">
          <li>
            <a href={`${ERT_MAIN_SITE}/contact/`} className="hover:text-ert-red">
              Contact the team ↗
            </a>
          </li>
          <li className="text-ui-fg-subtle txt-small">
            Questions about sizes, exchanges or pickup? Mention your order number.
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Help
