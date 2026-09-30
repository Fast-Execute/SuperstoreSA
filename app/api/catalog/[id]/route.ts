import {NextRequest,NextResponse} from "next/server";
import {findCatalog,updateCatalog,validateCatalogProduct} from "@/lib/catalog-store";

export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const product=await findCatalog(id,true);
  return product?NextResponse.json({product}):NextResponse.json({error:"Product not found"},{status:404});
}

export async function PUT(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  try{
    const patch=validateCatalogProduct(await request.json());
    const product=await updateCatalog(id,patch);
    return NextResponse.json({message:"Product updated in Supabase",product});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Unable to update product"},{status:400});
  }
}
