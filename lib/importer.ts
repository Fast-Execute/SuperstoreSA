import {CatalogProduct,priceCatalogProduct,slugify} from "@/lib/catalog";
import {SupplierProduct} from "@/lib/supplier";

export type ImportDefaults={category:string;shippingCost:number;duties:number;paymentFees:number;operatingCost:number;targetMargin:number};

export function normalizeSupplierProduct(item:SupplierProduct,defaults:ImportDefaults):CatalogProduct{
  const safeSupplierId=item.supplierId.trim();
  const safeProductId=item.supplierProductId.trim();
  const skuBase=slugify(safeProductId).replace(/-/g,"").slice(0,24).toUpperCase();
  const base={
    id:`supplier-${slugify(safeSupplierId)}-${slugify(safeProductId)}`,
    sku:`SUP-${skuBase}`,
    name:item.title.trim(),
    slug:slugify(item.title),
    category:defaults.category,
    description:item.description??"",
    supplierId:safeSupplierId,
    supplierProductId:safeProductId,
    supplierCost:item.price,
    shippingCost:defaults.shippingCost,
    duties:defaults.duties,
    paymentFees:defaults.paymentFees,
    operatingCost:defaults.operatingCost,
    targetMargin:defaults.targetMargin,
    currency:"ZAR" as const,
    stock:item.stock??0,
    status:"draft" as const,
    images:item.images??[],
    sourceUrl:item.sourceUrl
  };
  return priceCatalogProduct(base);
}