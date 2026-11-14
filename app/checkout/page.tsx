"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {money,useCart} from "@/components/cart-provider";
import {StoreHeader} from "@/components/store-header";
import {PROVINCES,validateCheckoutForm,type CheckoutFormErrors,type CheckoutFormValues} from "@/lib/checkout-validation";

const EMPTY:CheckoutFormValues={name:"",phone:"",email:"",address:"",city:"",province:"",zip:""};

export default function CheckoutPage(){
  const router=useRouter();
  const {items,subtotal,ready,clear,removeUnavailable}=useCart();
  const [form,setForm]=useState<CheckoutFormValues>(EMPTY);
  const [errors,setErrors]=useState<CheckoutFormErrors>({});
  const [submitting,setSubmitting]=useState(false);
  const [serverError,setServerError]=useState("");

  const demoItems=items.filter(i=>!i.live);
  const set=(field:keyof CheckoutFormValues)=>(event:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>{
    setForm(f=>({...f,[field]:event.target.value}));
    if(errors[field]) setErrors(e=>({...e,[field]:undefined}));
  };

  async function submit(event:React.FormEvent){
    event.preventDefault();
    if(submitting) return;
    setServerError("");
    const result=validateCheckoutForm(form);
    if(!result.ok){
      setErrors(result.errors);
      const first=Object.keys(result.errors)[0];
      document.getElementById(`field-${first}`)?.focus();
      return;
    }
    setSubmitting(true);
    try{
      const response=await fetch("/api/checkout",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          items:items.map(i=>({productId:i.productId,quantity:i.quantity})),
          customer:{name:result.value.name,phone:result.value.phone,email:result.value.email},
          shipping:{address:result.value.address,city:result.value.city,province:result.value.province,zip:result.value.zip,country:"ZA"}
        })
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data?.order){
        setServerError(typeof data?.error==="string"?data.error:"We couldn't place your order. Please try again.");
        setSubmitting(false);
        return;
      }
      // Keep only what the confirmation page needs. Address and phone are not stored in the browser.
      try{
        window.sessionStorage.setItem("superstoresa-last-order",JSON.stringify({
          orderNumber:data.order.order_number,
          total:Number(data.order.total),
          items:(data.items??[]).map((i:any)=>({title:String(i.title),quantity:Number(i.quantity),total:Number(i.total_price)}))
        }));
      }catch{/* confirmation page falls back to a generic message */}
      clear();
      router.push("/checkout/success");
    }catch{
      setServerError("We couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  const field=(id:keyof CheckoutFormValues,label:string,props:React.InputHTMLAttributes<HTMLInputElement>={},optional=false)=>
    <div className="field">
      <label htmlFor={`field-${id}`}>{label}{optional&&<span className="muted"> (optional)</span>}</label>
      <input id={`field-${id}`} name={id} value={form[id]} onChange={set(id)} aria-invalid={Boolean(errors[id])} aria-describedby={errors[id]?`error-${id}`:undefined} {...props}/>
      {errors[id]&&<p className="fieldError" id={`error-${id}`}>{errors[id]}</p>}
    </div>;

  return <main>
    <StoreHeader/>
    <section className="shell pageSection">
      <h1 className="pageTitle">Checkout</h1>
      {!ready?<p className="muted">Loading your cart…</p>
      :items.length===0?<div className="emptyState"><p>Your cart is empty.</p><Link href="/#shop" className="primaryButton">Browse products</Link></div>
      :<div className="cartLayout">
        <form className="panel" onSubmit={submit} noValidate>
          <h2>Delivery details</h2>
          <p className="muted small">We deliver within South Africa.</p>
          {field("name","Full name",{autoComplete:"name"})}
          <div className="fieldRow">
            {field("phone","Phone number",{autoComplete:"tel",inputMode:"tel",placeholder:"082 555 1234"})}
            {field("email","Email",{autoComplete:"email",inputMode:"email",type:"email"},true)}
          </div>
          {field("address","Street address",{autoComplete:"street-address"})}
          <div className="fieldRow">
            {field("city","City / town",{autoComplete:"address-level2"})}
            <div className="field">
              <label htmlFor="field-province">Province <span className="muted">(optional)</span></label>
              <select id="field-province" name="province" value={form.province} onChange={set("province")} autoComplete="address-level1" aria-invalid={Boolean(errors.province)}>
                <option value="">Select…</option>
                {PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
              {errors.province&&<p className="fieldError">{errors.province}</p>}
            </div>
          </div>
          {field("zip","Postal code",{autoComplete:"postal-code",inputMode:"numeric",maxLength:4,placeholder:"0002"})}

          {demoItems.length>0&&<div className="notice warn" role="alert">
            <p>{demoItems.length===1?"1 item in your cart is":`${demoItems.length} items in your cart are`} from the demo catalogue and can't be ordered yet.</p>
            <button type="button" className="linkButton" onClick={removeUnavailable}>Remove demo items</button>
          </div>}
          {serverError&&<div className="notice error" role="alert">{serverError}</div>}

          <button type="submit" className="primaryButton block" disabled={submitting||demoItems.length>0}>{submitting?"Placing your order…":`Place order · ${money(subtotal)}`}</button>
          <p className="muted small">No payment is taken on this page yet. Your order is saved as pending.</p>
        </form>

        <aside className="panel summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <ul className="miniLines">{items.map(i=><li key={i.productId}><span>{i.name} × {i.quantity}</span><span>{money(i.price*i.quantity)}</span></li>)}</ul>
          <div className="summaryRow total"><span>Total</span><strong>{money(subtotal)}</strong></div>
          <Link href="/cart" className="linkButton">Edit cart</Link>
        </aside>
      </div>}
    </section>
  </main>;
}
