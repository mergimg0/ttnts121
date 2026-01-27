"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartProvider } from "@/components/cart/cart-provider";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  // Admin routes have their own layout without site header/footer
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // Regular site pages get header, footer, and cart
  return (
    <CartProvider>
      <Header />
      <main>{children}</main>
      <Footer />
    </CartProvider>
  );
}
