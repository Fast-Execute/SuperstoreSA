"use client";
import {useState} from "react";
import {calculateRetailPrice} from "@/lib/pricing";

export default function AdminPage(){
 const [cost,setCost]=useState(100); const [shipping,setShipping]=useState(60); const [margin,setMargin]=useState(0.3);
 const result=calculateRetailPrice({supplierCost:cost,shipping,duties:0,paymentFees:0,operatingCost:0,targetMargin:margin});
 return <main className="admin"><div className="shell adminPanel"><p className="sectionKicker">SUPERSTORESA ADMIN</p><h1>Pricing cockpit</h1><p className="adminLead">Test landed cost and retail pricing before a product goes live.</p><div className="adminGrid"><label>Supplier cost (ZAR)<input type="number" value={cost} onChange={e=>setCost(Number(e.target.value))}/></label><label>Shipping (ZAR)<input type="number" value={shipping} onChange={e=>setShipping(Number(e.target.value))}/></label><label>Target margin<input type="number" min="0" max=".9" step=".01" value={margin} onChange={e=>setMargin(Number(e.target.value))}/></label></div><div className="result"><span>Landed cost <b>R {result.landedCost.toFixed(0)}</b></span><span>Retail price <b>R {result.retailPrice.toFixed(0)}</b></span><span>Gross profit <b>R {result.grossProfit.toFixed(0)}</b></span><span>Gross margin <b>{(result.grossMargin*100).toFixed(1)}%</b></span></div><a href="/">← Back to store</a></div></main>;
}