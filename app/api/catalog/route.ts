import {NextRequest,NextResponse} from "next/server";
import {products} from "@/data/products";
export async function GET(){return NextResponse.json({products})}
export async function POST(request:NextRequest){const body=await request.json();if(!body?.name||!body?.sku||!body?.price)return NextResponse.json({error:"name, sku and price are required"},{status:400});return NextResponse.json({message:"Validated product payload",product:body},{status:201})}
