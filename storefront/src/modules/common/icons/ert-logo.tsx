import React from "react"

/**
 * ERT rocket logo (nose cone + Swiss badge + three fins), vectorised from the
 * official PNG. viewBox 188 x 344.
 */
const ErtLogo: React.FC<React.SVGProps<SVGSVGElement> & { mono?: boolean }> = ({
  mono = false,
  ...props
}) => {
  const red = mono ? "currentColor" : "#e20816"
  const white = mono ? "currentColor" : "#ffffff"
  return (
    <svg viewBox="0 0 188 344" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path
        fill={red}
        d="M2 170A374.6 374.6 0 0 1 94 .5A374.6 374.6 0 0 1 186 170L153.5 170A278.5 278.5 0 0 0 94 49.5A278.5 278.5 0 0 0 34.5 170Z"
      />
      <circle cx="94" cy="148.5" r="21.75" fill={red} />
      <path fill={mono ? "#000" : white} d="M90 136h8v9h9v8h-9v9h-8v-9h-9v-8h9z" />
      <path fill={white} d="M2 218H34V317L2 341Z" />
      <path fill={white} d="M78 218H110V317L94 343L78 317Z" />
      <path fill={white} d="M154 218H186V341L154 317Z" />
    </svg>
  )
}

export default ErtLogo
