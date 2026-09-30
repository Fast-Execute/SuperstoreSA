import {NextResponse} from "next/server";

export async function GET(){
  const configured=Boolean(
    process.env.ALIBABA_APP_KEY &&
    process.env.ALIBABA_APP_SECRET &&
    process.env.ALIBABA_ACCESS_TOKEN &&
    process.env.ALIBABA_API_BASE_URL &&
    process.env.ALIBABA_PRODUCT_LIST_PATH
  );
  return NextResponse.json({
    supplier:"Alibaba.com Open Platform",
    configured,
    status:configured?"ready_for_endpoint_mapping":"configuration_required"
  });
}