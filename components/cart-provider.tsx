"use client";

import {createContext,useCallback,useContext,useEffect,useMemo,useState} from "react";
import {
  addItem,cartCount,cartSubtotal,parseStoredCart,removeItem,setItemQuantity,
  type CartItem,type CartProduct
} from "@/lib/cart";

const STORAGE_KEY="superstoresa-cart-v1";

type CartContextValue={
  items:CartItem[];
  count:number;
  subtotal:number;
  /** false until the saved cart has been read from the browser */
  ready:boolean;
  drawerOpen:boolean;
  add:(product:CartProduct)=>void;
  setQuantity:(productId:string,quantity:number)=>void;
  remove:(productId:string)=>void;
  removeUnavailable:()=>void;
  clear:()=>void;
  openDrawer:()=>void;
  closeDrawer:()=>void;
};

const CartContext=createContext<CartContextValue|null>(null);

export function CartProvider({children}:{children:React.ReactNode}){
  const [items,setItems]=useState<CartItem[]>([]);
  const [ready,setReady]=useState(false);
  const [drawerOpen,setDrawerOpen]=useState(false);

  // Read the saved cart after the first render, so server and browser markup match.
  useEffect(()=>{
    try{setItems(parseStoredCart(window.localStorage.getItem(STORAGE_KEY)));}catch{/* storage unavailable */}
    setReady(true);
  },[]);

  // Save every change once the saved cart has been loaded.
  useEffect(()=>{
    if(!ready) return;
    try{window.localStorage.setItem(STORAGE_KEY,JSON.stringify(items));}catch{/* storage full or blocked */}
  },[items,ready]);

  // Keep several open tabs in step.
  useEffect(()=>{
    const onStorage=(event:StorageEvent)=>{
      if(event.key===STORAGE_KEY) setItems(parseStoredCart(event.newValue));
    };
    window.addEventListener("storage",onStorage);
    return ()=>window.removeEventListener("storage",onStorage);
  },[]);

  const add=useCallback((product:CartProduct)=>setItems(current=>addItem(current,product)),[]);
  const setQuantity=useCallback((productId:string,quantity:number)=>setItems(current=>setItemQuantity(current,productId,quantity)),[]);
  const remove=useCallback((productId:string)=>setItems(current=>removeItem(current,productId)),[]);
  const removeUnavailable=useCallback(()=>setItems(current=>current.filter(i=>i.live)),[]);
  const clear=useCallback(()=>setItems([]),[]);
  const openDrawer=useCallback(()=>setDrawerOpen(true),[]);
  const closeDrawer=useCallback(()=>setDrawerOpen(false),[]);

  const value=useMemo<CartContextValue>(()=>({
    items,count:cartCount(items),subtotal:cartSubtotal(items),ready,drawerOpen,
    add,setQuantity,remove,removeUnavailable,clear,openDrawer,closeDrawer
  }),[items,ready,drawerOpen,add,setQuantity,remove,removeUnavailable,clear,openDrawer,closeDrawer]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart():CartContextValue{
  const value=useContext(CartContext);
  if(!value) throw new Error("useCart must be used inside <CartProvider>.");
  return value;
}

export const money=(value:number)=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR",maximumFractionDigits:2}).format(value);
