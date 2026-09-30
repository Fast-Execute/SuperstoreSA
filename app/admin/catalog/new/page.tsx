"use client";

import {useState} from "react";

type FormState={name:string;sku:string;category:string;retailPrice:string;stock:string;description:string};

const slugify=(value:string)=>value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

export default function NewProduct(){
  const [saved,setSaved]=useState(false);
  const [error,setError]=useState("");
  const [form,setForm]=useState<FormState>({name:"",sku:"",category:"Tech",retailPrice:"",stock:"",description:""});
  const set=(key:keyof FormState,value:string)=>setForm(f=>({...f,[key]:value}));

  async function submit(e:React.FormEvent){
    e.preventDefault();
    setSaved(false);
    setError("");
    const sku=form.sku.trim().toUpperCase();
    const name=form.name.trim();
    const response=await fetch("/api/catalog",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        sku,
        name,
        slug:slugify(name),
        category:form.category,
        description:form.description.trim(),
        supplierId:"manual",
        supplierProductId:sku,
        supplierCost:0,
        shippingCost:0,
        duties:0,
        paymentFees:0,
        operatingCost:0,
        targetMargin:0.3,
        retailPrice:Number(form.retailPrice),
        currency:"ZAR",
        stock:Number(form.stock||0),
        status:"draft",
        images:[]
      })
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok){
      setError(payload.error??"Unable to save product.");
      return;
    }
    setSaved(true);
  }

  return <main className="admin"><div className="shell adminPanel">
    <p className="sectionKicker">CATALOGUE</p>
    <h1>Add product.</h1>
    <p className="adminLead">Create a catalogue record and save it to the connected Supabase database.</p>
    <form className="productForm" onSubmit={submit}>
      <label>Product name<input required value={form.name} onChange={e=>set("name",e.target.value)}/></label>
      <label>SKU<input required value={form.sku} onChange={e=>set("sku",e.target.value)}/></label>
      <label>Category<select value={form.category} onChange={e=>set("category",e.target.value)}><option>Tech</option><option>Home & Tools</option><option>Lifestyle</option></select></label>
      <label>Retail price (ZAR)<input required type="number" min="0" step="0.01" value={form.retailPrice} onChange={e=>set("retailPrice",e.target.value)}/></label>
      <label>Stock<input type="number" min="0" value={form.stock} onChange={e=>set("stock",e.target.value)}/></label>
      <label>Description<textarea value={form.description} onChange={e=>set("description",e.target.value)}/></label>
      <button className="saveBtn" type="submit">Save product →</button>
      {saved&&<p className="saved">✓ Product saved to Supabase as a draft.</p>}
      {error&&<p className="saved" role="alert">✕ {error}</p>}
    </form>
    <a href="/admin/catalog">← Back to catalogue</a>
  </div></main>
}