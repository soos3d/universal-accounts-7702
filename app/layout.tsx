"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { PrivyProvider } from "@privy-io/react-auth";

const inter = Inter({ subsets: ["latin"] });

const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;
const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <PrivyProvider
          appId={appId!}
          clientId={clientId!}
          config={{
            embeddedWallets: {
              ethereum: {
                createOnLogin: "all-users",
              },
            },
          }}
        >
          {children}
        </PrivyProvider>
      </body>
    </html>
  );
}
