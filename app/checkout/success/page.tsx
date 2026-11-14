"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {money} from "@/components/cart-provider";
import {StoreHeader} from "@/components/store-header";

type LastOrder={orderNumber:string;total:number;items:{title:string;quantity:number;total:number}[]};

export default function CheckoutSuccessPage(){
  const [order,setOrder]=useState<LastOrder|null>(null);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    try{
      const raw=window.sessionStorage.getItem("superstoresa-last-order");
      if(raw) setOrder(JSON.parse(raw));
    }catch{/* show the generic message */}
    setLoaded(true);
  },[]);

  return <main>
    <StoreHeader/>
    <section className="shell pageSection">
      <div className="panel confirmation">
        <p className="sectionKicker">ORDER RECEIVED</p>
        <h1 className="pageTitle">Thank you for your order.</h1>
        {!loaded?null:order
          ?<>
            <p>Your order number is <strong>{order.orderNumber}</strong>. Keep it for any questions about your order.</p>
            <ul className="miniLines">{order.items.map((i,n)=><li key={n}><span>{i.title} × {i.quantity}</span><span>{money(i.total)}</span></li>)}</ul>
            <div className="summaryRow total"><span>Total</span><strong>{money(order.total)}</strong></div>
          </>
          :<p>Your order was received. If you didn't see an order number, check the details you entered or contact us.</p>}
        <p className="muted small">Your order is saved as pending. Online payment isn't switched on yet, so no payment has been taken.</p>
        <Link href="/" className="primaryButton">Back to the shop</Link>
      </div>
    </section>
  </main>;
}
