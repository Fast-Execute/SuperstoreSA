"use client";

import {MAX_LINE_QUANTITY,type CartItem} from "@/lib/cart";
import {money,useCart} from "./cart-provider";

/** The list of cart lines with quantity controls. Used by the drawer and the cart page. */
export function CartLines({items}:{items:CartItem[]}){
  const {setQuantity,remove}=useCart();
  return <ul className="cartLines">
    {items.map(item=>{
      const max=typeof item.stock==="number"?Math.min(MAX_LINE_QUANTITY,item.stock):MAX_LINE_QUANTITY;
      return <li className="cartLine" key={item.productId}>
        {item.image?<img src={item.image} alt="" className="cartLineImage"/>:<div className="cartLineImage"/>}
        <div className="cartLineBody">
          <p className="cartLineName">{item.name}</p>
          <p className="cartLinePrice">{money(item.price)}{!item.live&&<span className="demoTag">Demo</span>}</p>
          <div className="cartLineControls">
            <div className="stepper" role="group" aria-label={`Quantity of ${item.name}`}>
              <button type="button" onClick={()=>setQuantity(item.productId,item.quantity-1)} aria-label={`Decrease quantity of ${item.name}`}>−</button>
              <span aria-live="polite">{item.quantity}</span>
              <button type="button" onClick={()=>setQuantity(item.productId,item.quantity+1)} disabled={item.quantity>=max} aria-label={`Increase quantity of ${item.name}`}>+</button>
            </div>
            <button type="button" className="linkButton" onClick={()=>remove(item.productId)}>Remove</button>
          </div>
          {item.quantity>=max&&<p className="cartLineNote">{typeof item.stock==="number"&&item.stock<MAX_LINE_QUANTITY?`Only ${item.stock} in stock.`:`Limit of ${MAX_LINE_QUANTITY} per order.`}</p>}
        </div>
        <p className="cartLineTotal">{money(item.price*item.quantity)}</p>
      </li>;
    })}
  </ul>;
}
