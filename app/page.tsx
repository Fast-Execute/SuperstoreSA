"use client";

import { useMemo, useRef, useState } from "react";

type Product = { id:string; name:string; category:string; price:number; oldPrice?:number; badge?:string; image:string };

const products: Product[] = [
 {id:"1",name:"Magnetic Fast-Charge Desk Dock",category:"Tech",price:299,oldPrice:399,badge:"Popular",image:"https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=900&q=80"},
 {id:"2",name:"Portable LED Work Light",category:"Home & Tools",price:349,oldPrice:499,badge:"Deal",image:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80"},
 {id:"3",name:"Minimal Everyday Backpack",category:"Lifestyle",price:549,oldPrice:699,image:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80"},
 {id:"4",name:"Smart Kitchen Storage Set",category:"Home & Tools",price:249,oldPrice:329,image:"https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=80"},
 {id:"5",name:"Wireless Earbuds Case + Stand",category:"Tech",price:199,oldPrice:279,image:"https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80"},
 {id:"6",name:"Premium Insulated Travel Bottle",category:"Lifestyle",price:279,oldPrice:359,badge:"New",image:"https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80"}
];
const categories=["All","Tech","Home & Tools","Lifestyle"];
const money=(v:number)=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR",maximumFractionDigits:0}).format(v);

export default function Home(){
 const [category,setCategory]=useState("All");
 const [logoTaps,setLogoTaps]=useState(0);
 const tapTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const handleLogoTap=(event:React.MouseEvent)=>{event.preventDefault();setLogoTaps(n=>{const next=n+1;if(tapTimer.current)clearTimeout(tapTimer.current);if(next>=7){window.location.href="/admin";return 0;}tapTimer.current=setTimeout(()=>setLogoTaps(0),1800);return next;});}; const [query,setQuery]=useState(""); const [cart,setCart]=useState<string[]>([]);
 const visible=useMemo(()=>products.filter(p=>(category==="All"||p.category===category)&&p.name.toLowerCase().includes(query.toLowerCase())),[category,query]);
 return <main>
  <div className="announcement">🇿🇦 Built for South Africa · Secure checkout coming next</div>
  <header className="header shell">
   <a className="logo" href="#" onClick={handleLogoTap} aria-label="SuperstoreSA logo"><span className="logoMark">S</span> SUPERSTORE<span className="logoSA">SA</span></a>
   <div className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products..." aria-label="Search products"/></div>
   <button className="cart">Cart <b>{cart.length}</b></button>
  </header>
  <section className="hero shell">
   <div className="heroCopy"><p className="eyebrow">SMART SHOPPING · FAIR PRICES</p><h1>Good products.<br/><em>Better value.</em></h1><p className="heroText">A carefully curated superstore for everyday life — with pricing designed around real landed costs, not inflated shelf prices.</p><div className="heroActions"><a className="primary" href="#shop">Shop the collection</a><a className="secondary" href="#how">How our pricing works →</a></div><div className="trustRow"><span>✓ Curated products</span><span>✓ Transparent pricing</span><span>✓ ZAR checkout</span></div></div>
   <div className="heroCard"><div className="heroGlow"/><span className="heroBadge">SUPERSTORE PICK</span><div className="heroProductShape">S</div><p>New arrivals<br/><strong>Landing weekly</strong></p></div>
  </section>
  <section className="categoryBar shell" id="shop"><div><p className="sectionKicker">SHOP</p><h2>Find your next favourite.</h2></div><div className="chips">{categories.map(item=><button key={item} className={category===item?"chip active":"chip"} onClick={()=>setCategory(item)}>{item}</button>)}</div></section>
  <section className="grid shell">{visible.map(p=><article className="product" key={p.id}><div className="productImage"><img src={p.image} alt=""/>{p.badge&&<span className="badge">{p.badge}</span>}</div><div className="productMeta"><span>{p.category}</span><span>★★★★★</span></div><h3>{p.name}</h3><div className="priceRow"><strong>{money(p.price)}</strong>{p.oldPrice&&<del>{money(p.oldPrice)}</del>}</div><button className="add" onClick={()=>setCart(c=>c.includes(p.id)?c:[...c,p.id])}>{cart.includes(p.id)?"Added ✓":"Add to cart"}</button></article>)}</section>
  <section className="value shell" id="how"><div><p className="sectionKicker">THE SUPERSTORE MODEL</p><h2>Price with discipline.</h2><p>Our supplier engine will calculate landed cost, then build a sensible retail price around shipping, fees and a controlled margin.</p></div><div className="formula"><span>Supplier cost</span><b>+</b><span>Shipping & fees</span><b>→</b><strong>Fair retail price</strong></div></section>
  <footer className="footer"><div className="shell footerInner"><div><a className="logo" href="#"><span className="logoMark">S</span> SUPERSTORE<span className="logoSA">SA</span></a><p>Smart shopping for South Africa.</p></div><div className="footerLinks"><span>Shop</span><span>About</span><span>Shipping</span><span>Support</span></div></div><div className="shell copyright">© 2026 SuperstoreSA · Built for value.</div></footer>
 </main>;
}