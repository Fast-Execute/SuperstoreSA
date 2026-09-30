export type PricingInput={supplierCost:number;shipping:number;duties:number;paymentFees:number;operatingCost:number;targetMargin:number;minimumPrice?:number};
export type PricingResult={landedCost:number;retailPrice:number;grossProfit:number;grossMargin:number};
export function calculateRetailPrice(input:PricingInput):PricingResult{
 const landedCost=input.supplierCost+input.shipping+input.duties+input.paymentFees+input.operatingCost;
 const margin=Math.min(Math.max(input.targetMargin,0),0.9);
 const calculated=landedCost/(1-margin);
 const retailPrice=Math.max(input.minimumPrice??0,Math.ceil(calculated/10)*10);
 const grossProfit=retailPrice-landedCost;
 return {landedCost,retailPrice,grossProfit,grossMargin:retailPrice?grossProfit/retailPrice:0};
}