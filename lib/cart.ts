export type CartLine={productId:string;quantity:number};
export function addLine(lines:CartLine[],productId:string):CartLine[]{const found=lines.find(l=>l.productId===productId);return found?lines.map(l=>l.productId===productId?{...l,quantity:l.quantity+1}:l):[...lines,{productId,quantity:1}]}
export function removeLine(lines:CartLine[],productId:string):CartLine[]{return lines.flatMap(l=>l.productId===productId?(l.quantity>1?[{...l,quantity:l.quantity-1}]:[]):[l])}
