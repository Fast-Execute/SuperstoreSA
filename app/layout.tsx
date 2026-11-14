import type { Metadata } from "next";
import "./globals.css";
import "./admin/admin.css";
import "./cart.css";
import { CartProvider } from "@/components/cart-provider";
import { CartDrawer } from "@/components/cart-drawer";

export const metadata: Metadata = {
  title: "SuperstoreSA — Smart prices. Everyday value.",
  description: "A South African online superstore built around curated products and transparent value."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-ZA"><body><CartProvider>{children}<CartDrawer /></CartProvider></body></html>;
}
