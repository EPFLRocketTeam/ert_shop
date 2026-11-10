"use client"

import { isManual, isStripeLike } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import React, { useEffect, useRef, useState } from "react"
import ErrorMessage from "../error-message"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const stripe = useStripe()
  const elements = useElements()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const handledReturn = useRef(false)

  const onPaymentCompleted = async () => {
    // Completes the cart in Medusa (which re-checks the payment with Stripe)
    // and redirects to the order confirmation page.
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const isPaid = (status?: string) =>
    status === "succeeded" || status === "requires_capture" || status === "processing"

  // Back from a redirect-based method (e.g. TWINT): Stripe appends
  // payment_intent_client_secret + redirect_status to the return_url.
  useEffect(() => {
    const clientSecret = searchParams.get("payment_intent_client_secret")
    if (!stripe || !clientSecret || handledReturn.current) return
    handledReturn.current = true
    setSubmitting(true)

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent, error }) => {
      if (paymentIntent && isPaid(paymentIntent.status)) {
        return onPaymentCompleted()
      }
      setErrorMessage(
        error?.message ||
          "The payment was not completed. Please try again or choose another payment method."
      )
      setSubmitting(false)
      // drop Stripe's query params so a refresh doesn't re-run this
      router.replace(`${pathname}?step=review`, { scroll: false })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe, searchParams])

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    if (!stripe || !elements || !cart) {
      setSubmitting(false)
      return
    }

    const address = cart.billing_address

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // only used by redirect-based methods (TWINT); cards stay on the page
        return_url: `${window.location.origin}${pathname}?step=review`,
        payment_method_data: {
          billing_details: {
            name: [address?.first_name, address?.last_name].filter(Boolean).join(" "),
            email: cart.email ?? undefined,
            phone: address?.phone ?? undefined,
            address: {
              city: address?.city ?? undefined,
              country: address?.country_code ?? undefined,
              line1: address?.address_1 ?? undefined,
              line2: address?.address_2 ?? undefined,
              postal_code: address?.postal_code ?? undefined,
              state: address?.province ?? undefined,
            },
          },
        },
      },
      redirect: "if_required",
    })

    if (error) {
      // the payment can still have gone through (e.g. a retry after a timeout)
      if (isPaid(error.payment_intent?.status)) {
        return onPaymentCompleted()
      }
      setErrorMessage(error.message || "The payment failed. Please try again.")
      setSubmitting(false)
      return
    }

    if (isPaid(paymentIntent?.status)) {
      return onPaymentCompleted()
    }

    setSubmitting(false)
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid="submit-order-button"
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
