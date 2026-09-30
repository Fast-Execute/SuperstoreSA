import {NextRequest,NextResponse} from "next/server";
import {createCatalog,listCatalog,validateCatalogProduct} from "@/lib/catalog-store";

export async function GET(){ return NextResponse.json({products:await listCatalog(true)}); }

export async function POST(request:NextRequest){
  try{
    const product=validateCatalogProduct(await request.json());
    const saved=await createCatalog(product as never);
    return NextResponse.json({message:"Product saved to Supabase",product:saved},{status:201});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to save product"},{status:400});
  }
}
