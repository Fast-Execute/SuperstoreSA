import {CatalogProduct} from "@/lib/catalog";
import {products} from "@/data/products";
const seed:CatalogProduct[]=products.map(p=>({id:p.id,sku:p.sku,name:p.name,slug:p.slug,category:p.category,description:p.description,supplierId:"seed",supplierProductId:p.id,supplierCost:Math.round(p.price*.55),shippingCost:40,duties:0,paymentFees:0,operatingCost:20,targetMargin:.3,retailPrice:p.price,currency:"ZAR",stock:p.stock,status:"active",images:[p.image]}));
export function listCatalog(){return seed}
export function findCatalog(id:string){return seed.find(p=>p.id===id)??null}
export function validateCatalogProduct(input:Partial<CatalogProduct>){if(!input.name||!input.sku||typeof input.retailPrice!=="number")throw new Error("name, sku and retailPrice are required");return input}
