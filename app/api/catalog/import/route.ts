import {NextRequest,NextResponse} from "next/server";
import {normalizeSupplierProduct} from "@/lib/importer";

export async function POST(request:NextRequest){
  try{
    const body=await request.json();
    const product=body?.product;
    if(!product?.supplierId||!product?.supplierProductId||typeof product.price!=="number"||!Number.isFinite(product.price)||product.price<0){
      return NextResponse.json({error:"supplierId, supplierProductId and a valid numeric price are required"},{status:400});
    }
    const defaults={
      category:String(body.category??"Uncategorized"),
      shippingCost:Number(body.shippingCost??0),
      duties:Number(body.duties??0),
      paymentFees:Number(body.paymentFees??0),
      operatingCost:Number(body.operatingCost??0),
      targetMargin:Number(body.targetMargin??.3)
    };
    return NextResponse.json({product:normalizeSupplierProduct(product,defaults)});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to normalize supplier product"},{status:400});
  }
}