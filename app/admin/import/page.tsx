"use client";

import {useState} from "react";

export default function ImportAdmin(){
  const [result,setResult]=useState<any>(null);
  async function preview(){
    const r=await fetch("/api/catalog/import",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        product:{
          supplierId:"DEMO-ALIBABA",
          supplierProductId:"DEMO-001",
          title:"Supplier Sample Product",
          description:"Normalized supplier product.",
          currency:"USD",
          price:120,
          stock:35,
          images:[],
          sourceUrl:""
        },
        category:"Tech",shippingCost:80,duties:20,paymentFees:10,operatingCost:15,targetMargin:.3
      })
    });
    setResult(await r.json());
  }
  return <main className="admin"><div className="shell adminPanel">
    <p className="sectionKicker">SUPPLIER PIPELINE</p>
    <h1>Import preview.</h1>
    <p className="adminLead">Normalize authorized supplier data first. Nothing is published automatically.</p>
    <button className="saveBtn" onClick={preview}>Run sample normalization →</button>
    {result&&<pre className="importPreview">{JSON.stringify(result.product??result,null,2)}</pre>}
    <p><a href="/admin/catalog">← Catalogue</a></p>
  </div></main>
}