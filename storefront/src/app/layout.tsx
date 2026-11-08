import { getBaseURL } from "@lib/util/env"
import ErtIntro from "@modules/layout/components/ert-intro"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "EPFL Rocket Team Shop",
    template: "%s | EPFL Rocket Team Shop",
  },
  description:
    "Official merchandise of the EPFL Rocket Team. Every order supports students designing, building and launching rockets.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
}

// Runs before first paint: the logo intro plays only once per browser session.
const introSessionScript = `try{if(sessionStorage.getItem("ert-intro-seen")==="1"){document.documentElement.classList.add("ert-intro-seen")}else{sessionStorage.setItem("ert-intro-seen","1")}}catch(e){}`

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    // "dark" switches Medusa UI to its dark palette (remapped to ERT colours in globals.css).
    // suppressHydrationWarning: the inline script may add a class before React hydrates.
    <html lang="en" className="dark" data-mode="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introSessionScript }} />
      </head>
      <body>
        <ErtIntro />
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
