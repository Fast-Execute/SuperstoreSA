import {NextRequest,NextResponse} from "next/server";
import {createCatalog,listCatalog,validateCatalogProduct} from "@/lib/catalog-store";

export async function GET(){return NextResponse.json({products:await listCatalog(true)});}

export async function POST(request:NextRequest){
  try{
    const body=await request.json();
    const product=validateCatalogProduct(body);
    const saved=await createCatalog({
      id:String(body.id ?? crypto.randomUUID()),
      sku:String(product.sku),
      name:String(product.name),
      slug:String(product.slug),
      category:String(product.category),
      description:String(product.description ?? ""),
      supplierId:String(product.supplierId ?? "manual"),
      supplierProductId:String(product.supplierProductId ?? product.sku),
      supplierCost:Number(product.supplierCost ?? 0),
      shippingCost:Number(product.shippingCost ?? 0),
      duties:Number(product.duties ?? 0),
      paymentFees:Number(product.paymentFees ?? 0),
      operatingCost:Number(product.operatingCost ?? 0),
      targetMargin:Number(product.targetMargin ?? 0.3),
      retailPrice:Number(product.retailPrice),
      currency:"ZAR",
      stock:Number(product.stock ?? 0),
      status:product.status ?? "draft",
      images:Array.isArray(product.images)?product.images:[],
      sourceUrl:product.sourceUrl
    });
    return NextResponse.json({message:"Product saved to Supabase",product:saved},{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to save product"},{status:400});}
}