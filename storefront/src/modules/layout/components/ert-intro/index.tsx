"use client"

import { useEffect, useState } from "react"

/**
 * Animated ERT logo intro: the rocket assembles, ignites and launches, and the
 * shop appears underneath. Plays once per browser session (a tiny inline
 * script in the root layout marks <html class="ert-intro-seen"> before paint
 * on later page loads, so there is no flash). Any click or key press skips it.
 * Styles: "ERT intro" section in styles/globals.css.
 */
export default function ErtIntro() {
  const [visible, setVisible] = useState(true)
  const [skipping, setSkipping] = useState(false)

  useEffect(() => {
    if (document.documentElement.classList.contains("ert-intro-seen")) {
      setVisible(false)
      return
    }
    const skip = () => setSkipping(true)
    window.addEventListener("keydown", skip, { once: true })
    return () => window.removeEventListener("keydown", skip)
  }, [])

  useEffect(() => {
    if (!skipping) return
    const t = setTimeout(() => setVisible(false), 260)
    return () => clearTimeout(t)
  }, [skipping])

  if (!visible) return null

  return (
    <div
      className={`ert-intro${skipping ? " ert-intro--skip" : ""}`}
      aria-hidden="true"
      title="Click to skip"
      onClick={() => setSkipping(true)}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && e.animationName === "ert-intro-gone") {
          setVisible(false)
        }
      }}
    >
      <svg className="ert-intro__rocket" viewBox="0 0 188 344" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ert-intro-flame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" />
            <stop offset=".25" stopColor="#ffd35c" />
            <stop offset=".6" stopColor="#ff6a1a" />
            <stop offset="1" stopColor="#e20816" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="ert-intro__flame"
          fill="url(#ert-intro-flame)"
          d="M70 318 C 70 360, 84 400, 94 440 C 104 400, 118 360, 118 318 Z"
        />
        <path className="ert-intro__fin ert-intro__fin--l" fill="#fff" d="M2 218H34V317L2 341Z" />
        <path className="ert-intro__fin ert-intro__fin--m" fill="#fff" d="M78 218H110V317L94 343L78 317Z" />
        <path className="ert-intro__fin ert-intro__fin--r" fill="#fff" d="M154 218H186V341L154 317Z" />
        <path
          className="ert-intro__nose-fill"
          fill="#e20816"
          d="M2 170A374.6 374.6 0 0 1 94 .5A374.6 374.6 0 0 1 186 170L153.5 170A278.5 278.5 0 0 0 94 49.5A278.5 278.5 0 0 0 34.5 170Z"
        />
        <path
          className="ert-intro__nose-stroke"
          pathLength={1}
          d="M2 170A374.6 374.6 0 0 1 94 .5A374.6 374.6 0 0 1 186 170L153.5 170A278.5 278.5 0 0 0 94 49.5A278.5 278.5 0 0 0 34.5 170Z"
        />
        <circle className="ert-intro__badge" cx="94" cy="148.5" r="21.75" fill="#e20816" />
        <path className="ert-intro__cross" fill="#fff" d="M90 136h8v9h9v8h-9v9h-8v-9h-9v-8h9z" />
      </svg>
    </div>
  )
}
