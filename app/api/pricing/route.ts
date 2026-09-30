import { NextResponse } from "next/server";
import { calculateRetailPrice } from "@/lib/pricing";

export async function POST(request:Request){
 try{
  const body=await request.json();
  const result=calculateRetailPrice(body);
  return NextResponse.json(result);
 }catch{
  return NextResponse.json({error:"Invalid pricing input"},{status:400});
 }
}