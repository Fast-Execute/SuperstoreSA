/**
 * Alibaba 1688 / AliExpress client wrapper.
 * This is a starter integration for mirroring product data and creating supplier orders.
 */

import type { AlibabaOrder, AlibabaProduct, SyncConfig } from './types';

const DEFAULT_BASE_URL = process.env.ALIBABA_API_BASE || 'https://api.1688.com';

export class AlibabaClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(config?: Partial<SyncConfig>) {
    this.apiKey = config?.apiKey || process.env.ALIBABA_API_KEY || '';
    this.apiSecret = config?.apiSecret || process.env.ALIBABA_API_SECRET || '';
    this.baseUrl = config?.baseUrl || DEFAULT_BASE_URL;
  }

  async searchProducts(params: {
    keyword?: string;
    categoryId?: string;
    pageNum?: number;
    pageSize?: number;
    sortBy?: 'price' | 'sales' | 'rating';
  }): Promise<AlibabaProduct[]> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Alibaba API credentials not configured');
    }

    const endpoint = `${this.baseUrl}/openapi/param2/1/alibabaitem/search`;
    const query = new URLSearchParams({
      apikey: this.apiKey,
      keyword: params.keyword || '',
      categoryId: params.categoryId || '',
      pageNum: String(params.pageNum || 1),
      pageSize: String(params.pageSize || 50),
      sortBy: params.sortBy || 'sales',
      fields: 'title,price,discount,image,sales,rating,shop,categoryId,productId,minOrder,weight,dimensions',
    });

    const response = await fetch(`${endpoint}?${query.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Alibaba search failed: ${response.status}`);
    }

    const data = await response.json();
    return (data.items || []).map((item: any) => this.normalizeProduct(item));
  }

  async getProductDetail(productId: string): Promise<AlibabaProduct | null> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Alibaba API credentials not configured');
    }

    const endpoint = `${this.baseUrl}/openapi/param2/1/alibabaitem/detail`;
    const query = new URLSearchParams({
      apikey: this.apiKey,
      productId,
      fields: 'title,price,discount,image,sales,rating,shop,categoryId,productId,minOrder,weight,dimensions,description,specifications,images',
    });

    const response = await fetch(`${endpoint}?${query.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return this.normalizeProduct(data);
  }

  async createOrder(order: {
    productId: string;
    quantity: number;
    buyerName: string;
    buyerPhone: string;
    shippingAddress: string;
    shippingCity: string;
    shippingCountry: string;
    shippingZip: string;
  }): Promise<AlibabaOrder> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Alibaba API credentials not configured');
    }

    const endpoint = `${this.baseUrl}/openapi/param2/1/order/create`;
    const payload = {
      apikey: this.apiKey,
      productId: order.productId,
      quantity: order.quantity,
      buyerName: order.buyerName,
      buyerPhone: order.buyerPhone,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingCountry: order.shippingCountry,
      shippingZip: order.shippingZip,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Alibaba order creation failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      orderId: data.orderId || crypto.randomUUID(),
      aliobabaOrderId: data.alibaba_order_id || data.orderId || crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date(),
      totalPrice: Number(data.totalPrice || 0),
    };
  }

  private normalizeProduct(raw: any): AlibabaProduct {
    const imageList = Array.isArray(raw.images) ? raw.images : raw.image ? [raw.image] : [];
    return {
      alibabaId: raw.productId || raw.id || raw.product_id || crypto.randomUUID(),
      title: raw.title || 'Alibaba Product',
      description: raw.description || '',
      price: Number(raw.price || 0),
      discount: Number(raw.discount || 0),
      images: imageList,
      sales: Number(raw.sales || 0),
      rating: Number(raw.rating || 0),
      shopName: raw.shop?.name || 'Alibaba Supplier',
      minOrder: Number(raw.minOrder || 1),
      weight: Number(raw.weight || 0),
      dimensions: raw.dimensions || '',
      specifications: Array.isArray(raw.specifications) ? raw.specifications : [],
      syncedAt: new Date(),
    };
  }
}

export default AlibabaClient;

