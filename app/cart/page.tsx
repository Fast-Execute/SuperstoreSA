"use client";

import Link from "next/link";
import {CartLines} from "@/components/cart-lines";
import {money,useCart} from "@/components/cart-provider";
import {StoreHeader} from "@/components/store-header";

export default function CartPage(){
  const {items,count,subtotal,ready}=useCart();
  return <main>
    <StoreHeader/>
    <section className="shell pageSection">
      <h1 className="pageTitle">Your cart</h1>
      {!ready
        ?<p className="muted">Loading your cart…</p>
        :items.length===0
          ?<div className="emptyState"><p>Your cart is empty.</p><Link href="/#shop" className="primaryButton">Browse products</Link></div>
          :<div className="cartLayout">
            <div className="panel"><CartLines items={items}/></div>
            <aside className="panel summary" aria-label="Order summary">
              <h2>Order summary</h2>
              <div className="summaryRow"><span>Items ({count})</span><span>{money(subtotal)}</span></div>
              <div className="summaryRow total"><span>Total</span><strong>{money(subtotal)}</strong></div>
              <p className="muted small">No delivery fee is added at this step. Prices are confirmed again when you place your order.</p>
              <Link href="/checkout" className="primaryButton block">Proceed to checkout</Link>
            </aside>
          </div>}
    </section>
  </main>;
}
