export type SupplierProduct={supplierId:string;title:string;description?:string;currency:string;price:number;stock?:number;images?:string[];sourceUrl?:string};
export interface SupplierAdapter{listProducts():Promise<SupplierProduct[]>;getProduct(id:string):Promise<SupplierProduct|null>;}
export class AlibabaSupplierAdapter implements SupplierAdapter{
 async listProducts(){return [];}
 async getProduct(_id:string){return null;}
}