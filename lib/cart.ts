export type CartLine={productId:string;quantity:number};

/** Most units of one product allowed in a single order. Matches the checkout API. */
export const MAX_LINE_QUANTITY=10;

export function addLine(lines:CartLine[],productId:string):CartLine[]{const found=lines.find(l=>l.productId===productId);return found?lines.map(l=>l.productId===productId?{...l,quantity:Math.min(l.quantity+1,MAX_LINE_QUANTITY)}:l):[...lines,{productId,quantity:1}]}
export function removeLine(lines:CartLine[],productId:string):CartLine[]{return lines.flatMap(l=>l.productId===productId?(l.quantity>1?[{...l,quantity:l.quantity-1}]:[]):[l])}

/** A cart line with the product details needed to display it. Prices are re-checked by the server at checkout. */
export type CartItem=CartLine&{name:string;price:number;image:string;/** true when the product came from the live catalogue, false for demo products */live:boolean;stock?:number};
export type CartProduct=Omit<CartItem,"quantity">;

function limitFor(stock:number|undefined):number{
  if(typeof stock==="number"&&Number.isFinite(stock)) return Math.max(0,Math.min(MAX_LINE_QUANTITY,Math.floor(stock)));
  return MAX_LINE_QUANTITY;
}

export function addItem(items:CartItem[],product:CartProduct):CartItem[]{
  const limit=limitFor(product.stock);
  if(limit<1) return items;
  const found=items.find(i=>i.productId===product.productId);
  if(!found) return [...items,{...product,quantity:1}];
  return items.map(i=>i.productId===product.productId?{...i,...product,quantity:Math.min(i.quantity+1,limit)}:i);
}

export function setItemQuantity(items:CartItem[],productId:string,quantity:number):CartItem[]{
  if(!Number.isFinite(quantity)||quantity<1) return items.filter(i=>i.productId!==productId);
  return items.map(i=>i.productId===productId?{...i,quantity:Math.min(Math.floor(quantity),limitFor(i.stock))}:i);
}

export function removeItem(items:CartItem[],productId:string):CartItem[]{return items.filter(i=>i.productId!==productId)}
export function cartCount(items:CartItem[]):number{return items.reduce((sum,i)=>sum+i.quantity,0)}
export function cartSubtotal(items:CartItem[]):number{return items.reduce((sum,i)=>sum+i.price*i.quantity,0)}

/** Reads a cart saved in the browser. Anything malformed is dropped instead of trusted. */
export function parseStoredCart(raw:string|null):CartItem[]{
  if(!raw) return [];
  let data:unknown;
  try{data=JSON.parse(raw);}catch{return [];}
  if(!Array.isArray(data)) return [];
  const items:CartItem[]=[];
  const seen=new Set<string>();
  for(const entry of data){
    if(!entry||typeof entry!=="object") continue;
    const e=entry as Record<string,unknown>;
    const productId=typeof e.productId==="string"?e.productId:"";
    const quantity=Number(e.quantity);
    const price=Number(e.price);
    if(!productId||seen.has(productId)||!Number.isInteger(quantity)||quantity<1||!Number.isFinite(price)||price<0) continue;
    const stock=typeof e.stock==="number"&&Number.isFinite(e.stock)?e.stock:undefined;
    seen.add(productId);
    items.push({
      productId,
      quantity:Math.min(quantity,limitFor(stock)||MAX_LINE_QUANTITY),
      name:typeof e.name==="string"?e.name.slice(0,200):"Product",
      price,
      image:typeof e.image==="string"?e.image:"",
      live:e.live===true,
      stock
    });
  }
  return items;
}
