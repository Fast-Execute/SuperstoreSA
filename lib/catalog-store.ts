import { CatalogProduct } from "@/lib/catalog";
import { products } from "@/data/products";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";

const seed: CatalogProduct[] = products.map(p => ({
  id:p.id,sku:p.sku,name:p.name,slug:p.slug,category:p.category,description:p.description,
  supplierId:"seed",supplierProductId:p.id,supplierCost:Math.round(p.price*.55),shippingCost:40,duties:0,
  paymentFees:0,operatingCost:20,targetMargin:.3,retailPrice:p.price,currency:"ZAR",stock:p.stock,
  status:"active",images:[p.image]
}));

export function validateCatalogProduct(input: Partial<CatalogProduct>) {
  if (!input.name || !input.sku || !input.slug || !input.category || typeof input.retailPrice !== "number") {
    throw new Error("name, sku, slug, category and retailPrice are required");
  }
  return input;
}

function fromRow(row: Record<string, unknown>): CatalogProduct {
  return {
    id:String(row.id),sku:String(row.sku),name:String(row.name),slug:String(row.slug),
    category:String(row.category),description:String(row.description ?? ""),supplierId:String(row.supplier_id),
    supplierProductId:String(row.supplier_product_id),supplierCost:Number(row.supplier_cost),shippingCost:Number(row.shipping_cost),
    duties:Number(row.duties),paymentFees:Number(row.payment_fees),operatingCost:Number(row.operating_cost),
    targetMargin:Number(row.target_margin),retailPrice:Number(row.retail_price),currency:"ZAR",
    stock:Number(row.stock),status:row.status as CatalogProduct["status"],images:Array.isArray(row.images)?row.images as string[]:[],
    sourceUrl:row.source_url ? String(row.source_url):undefined
  };
}

export async function listCatalog(admin=false) {
  try {
    const client = admin ? getSupabaseAdmin() : getSupabasePublic();
    const query = client.from("products").select("*").order("created_at",{ascending:false});
    const {data,error}=await query;
    if(error) throw error;
    return (data ?? []).map(fromRow);
  } catch {
    return seed;
  }
}

export async function findCatalog(id:string, admin=false) {
  try {
    const client=admin?getSupabaseAdmin():getSupabasePublic();
    const {data,error}=await client.from("products").select("*").eq("id",id).maybeSingle();
    if(error) throw error;
    return data ? fromRow(data) : null;
  } catch {
    return seed.find(p=>p.id===id) ?? null;
  }
}

export async function createCatalog(input:CatalogProduct) {
  const client=getSupabaseAdmin();
  const {data,error}=await client.from("products").insert({
    sku:input.sku,slug:input.slug,name:input.name,description:input.description,category:input.category,
    supplier_id:input.supplierId,supplier_product_id:input.supplierProductId,supplier_cost:input.supplierCost,
    shipping_cost:input.shippingCost,duties:input.duties,payment_fees:input.paymentFees,operating_cost:input.operatingCost,
    target_margin:input.targetMargin,retail_price:input.retailPrice,currency:"ZAR",stock:input.stock,status:input.status,
    images:input.images,source_url:input.sourceUrl
  }).select("*").single();
  if(error) throw error;
  return fromRow(data);
}

export async function updateCatalog(id:string, patch:Partial<CatalogProduct>) {
  const client=getSupabaseAdmin();
  const mapped:Record<string,unknown>={};
  const map:Record<string,string>={sku:"sku",slug:"slug",name:"name",description:"description",category:"category",supplierId:"supplier_id",
    supplierProductId:"supplier_product_id",supplierCost:"supplier_cost",shippingCost:"shipping_cost",duties:"duties",paymentFees:"payment_fees",
    operatingCost:"operating_cost",targetMargin:"target_margin",retailPrice:"retail_price",stock:"stock",status:"status",images:"images",sourceUrl:"source_url"};
  for(const [key,column] of Object.entries(map)) if(patch[key as keyof CatalogProduct] !== undefined) mapped[column]=patch[key as keyof CatalogProduct];
  const {data,error}=await client.from("products").update(mapped).eq("id",id).select("*").single();
  if(error) throw error;
  return fromRow(data);
}
