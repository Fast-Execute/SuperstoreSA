"use client";

import Link from "next/link";
import {useEffect,useRef} from "react";
import {CartLines} from "./cart-lines";
import {money,useCart} from "./cart-provider";

export function CartDrawer(){
  const {items,count,subtotal,drawerOpen,closeDrawer}=useCart();
  const closeRef=useRef<HTMLButtonElement>(null);

  useEffect(()=>{
    if(!drawerOpen) return;
    const previous=document.activeElement as HTMLElement|null;
    closeRef.current?.focus();
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape") closeDrawer();};
    document.addEventListener("keydown",onKey);
    const overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return ()=>{
      document.removeEventListener("keydown",onKey);
      document.body.style.overflow=overflow;
      previous?.focus?.();
    };
  },[drawerOpen,closeDrawer]);

  if(!drawerOpen) return null;

  return <div className="drawerRoot">
    <div className="drawerBackdrop" onClick={closeDrawer} aria-hidden="true"/>
    <aside className="drawer" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <header className="drawerHeader">
        <h2>Your cart <span>({count})</span></h2>
        <button ref={closeRef} type="button" className="iconButton" onClick={closeDrawer} aria-label="Close cart">✕</button>
      </header>
      {items.length===0
        ?<div className="drawerEmpty"><p>Your cart is empty.</p><button type="button" className="primaryButton" onClick={closeDrawer}>Keep shopping</button></div>
        :<>
          <div className="drawerBody"><CartLines items={items}/></div>
          <footer className="drawerFooter">
            <div className="summaryRow"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            <Link href="/checkout" className="primaryButton block" onClick={closeDrawer}>Checkout</Link>
            <Link href="/cart" className="secondaryButton block" onClick={closeDrawer}>View full cart</Link>
          </footer>
        </>}
    </aside>
  </div>;
}
