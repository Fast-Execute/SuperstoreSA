export type SupplierProduct={supplierId:string;supplierProductId:string;title:string;description?:string;currency:string;price:number;stock?:number;images?:string[];sourceUrl?:string};

export interface SupplierAdapter{
  listProducts():Promise<SupplierProduct[]>;
  getProduct(id:string):Promise<SupplierProduct|null>;
}

/**
 * Adapter boundary for an authorized Alibaba integration.
 * Credentials and API transport belong here; do not scrape public listings.
 */
export class AlibabaSupplierAdapter implements SupplierAdapter{
  async listProducts(){return [];}
  async getProduct(_id:string){return null;}
}