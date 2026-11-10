"use client"

import { Stripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { HttpTypes } from "@medusajs/types"
import { createContext } from "react"

type StripeWrapperProps = {
  paymentSession: HttpTypes.StorePaymentSession
  stripeKey?: string
  stripePromise: Promise<Stripe | null> | null
  children: React.ReactNode
}

export const StripeContext = createContext(false)

const StripeWrapper: React.FC<StripeWrapperProps> = ({
  paymentSession,
  stripeKey,
  stripePromise,
  children,
}) => {
  const options: StripeElementsOptions = {
    clientSecret: paymentSession!.data?.client_secret as string | undefined,
    // Payment Element styled like the rest of the shop (ERT dark theme)
    appearance: {
      theme: "night",
      variables: {
        colorPrimary: "#da291c",
        colorBackground: "#1e1e1e",
        colorText: "#f6f6f6",
        colorTextSecondary: "#a9a9a9",
        colorDanger: "#ef4a3d",
        fontFamily: "Aspekta, Inter, system-ui, sans-serif",
        borderRadius: "8px",
      },
    },
    fonts:
      typeof window !== "undefined"
        ? [
            {
              family: "Aspekta",
              src: `url(${window.location.origin}/fonts/Aspekta-400.woff2)`,
              weight: "400",
            },
          ]
        : [],
  }

  if (!stripeKey) {
    throw new Error(
      "Stripe key is missing. Set NEXT_PUBLIC_STRIPE_KEY environment variable."
    )
  }

  if (!stripePromise) {
    throw new Error(
      "Stripe promise is missing. Make sure you have provided a valid Stripe key."
    )
  }

  if (!paymentSession?.data?.client_secret) {
    throw new Error(
      "Stripe client secret is missing. Cannot initialize Stripe."
    )
  }

  return (
    <StripeContext.Provider value={true}>
      <Elements options={options} stripe={stripePromise}>
        {children}
      </Elements>
    </StripeContext.Provider>
  )
}

export default StripeWrapper
