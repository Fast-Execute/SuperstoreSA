import {NextRequest,NextResponse} from "next/server";
import {listCatalog,validateCatalogProduct} from "@/lib/catalog-store";
export async function GET(){return NextResponse.json({products:listCatalog()})}
export async function POST(request:NextRequest){try{const product=validateCatalogProduct(await request.json());return NextResponse.json({message:"Validated product payload",product},{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid product"},{status:400})}}
