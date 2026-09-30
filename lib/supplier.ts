export type SupplierProduct={supplierId:string;supplierProductId:string;title:string;description?:string;currency:string;price:number;stock?:number;images?:string[];sourceUrl?:string};

export interface SupplierAdapter{
  listProducts():Promise<SupplierProduct[]>;
  getProduct(id:string):Promise<SupplierProduct|null>;
}

export type SupplierRequest=(input:{path:string;method?:"GET"|"POST";query?:Record<string,string>})=>Promise<unknown>;

export type AlibabaAdapterConfig={
  productListPath:string;
  request:SupplierRequest;
  supplierId?:string;
};

function asRecord(value:unknown):Record<string,unknown>{
  return value&&typeof value==="object"?value as Record<string,unknown>:{};
}

function normalizeProduct(value:unknown,supplierId:string):SupplierProduct|null{
  const item=asRecord(value);
  const id=item.supplierProductId??item.productId??item.id;
  const title=item.title??item.name;
  const price=Number(item.price??item.supplierPrice);
  if(!id||!title||!Number.isFinite(price)||price<0)return null;
  return {
    supplierId,
    supplierProductId:String(id),
    title:String(title),
    description:item.description?String(item.description):"",
    currency:String(item.currency??"USD"),
    price,
    stock:item.stock===undefined?undefined:Number(item.stock),
    images:Array.isArray(item.images)?item.images.map(String):[],
    sourceUrl:item.sourceUrl?String(item.sourceUrl):undefined
  };
}

export class AlibabaSupplierAdapter implements SupplierAdapter{
  private config:AlibabaAdapterConfig;

  constructor(config:AlibabaAdapterConfig){
    this.config=config;
  }

  async listProducts(){
    const response=asRecord(await this.config.request({path:this.config.productListPath,method:"GET"}));
    const raw=Array.isArray(response.products)?response.products:Array.isArray(response.items)?response.items:[];
    return raw
      .map(item=>normalizeProduct(item,this.config.supplierId??"alibaba"))
      .filter((item):item is SupplierProduct=>Boolean(item));
  }

  async getProduct(id:string){
    const response=asRecord(await this.config.request({
      path:this.config.productListPath,
      method:"GET",
      query:{productId:id}
    }));
    return normalizeProduct(response.product??response,this.config.supplierId??"alibaba");
  }
}
