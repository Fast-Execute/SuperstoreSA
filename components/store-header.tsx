"use client";

import Link from "next/link";
import {useCart} from "./cart-provider";

/** Slim header for the cart and checkout pages. The home page has its own header with search. */
export function StoreHeader(){
  const {count,openDrawer}=useCart();
  return <header className="header shell">
    <Link className="logo" href="/" aria-label="SuperstoreSA home"><span className="logoMark">S</span> SUPERSTORE<span className="logoSA">SA</span></Link>
    <span style={{flex:1}}/>
    <Link className="secondary" href="/#shop">← Continue shopping</Link>
    <button type="button" className="cart" onClick={openDrawer}>Cart <b>{count}</b></button>
  </header>;
}
