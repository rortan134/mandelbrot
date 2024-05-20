import "@/styles/globals.css";
import { Theme } from "@radix-ui/themes";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";

const WEBSITE_URL = "http://localhost:3000";
const APP_NAME = "TDR Gilberto";

const title = `${APP_NAME}`;
const description = "TDR Gilberto";

export const viewport: Viewport = {
  width: "device-width",
  height: "device-height",
  viewportFit: "cover",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1.00001,
  userScalable: false,
  colorScheme: "dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#181917" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(WEBSITE_URL),
  title: {
    default: title,
    template: `%s | ${APP_NAME}`,
  },
  description,
  category: "technology",
  referrer: "origin",
  applicationName: APP_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: {
      default: title,
      template: `%s | ${APP_NAME}`,
    },
    description,
    type: "website",
    url: WEBSITE_URL,
    siteName: APP_NAME,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    address: false,
    telephone: false,
  },
  other: {
    "msapplication-TileColor": "#000000",
    "applicable-device": "pc,mobile",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      tabIndex={-1}
      suppressHydrationWarning
      className={GeistSans.variable}
    >
      <body className="dark">
        <Theme
          accentColor="ruby"
          grayColor="sage"
          panelBackground="solid"
          radius="full"
          appearance="dark"
        >
          {children}
        </Theme>
      </body>
    </html>
  );
}
