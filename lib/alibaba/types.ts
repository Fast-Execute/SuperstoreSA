/**
 * Type definitions for Alibaba integration.
 */

export interface AlibabaProduct {
  alibabaId: string;
  title: string;
  description: string;
  price: number;
  discount: number;
  images: string[];
  sales: number;
  rating: number;
  shopName: string;
  minOrder: number;
  weight: number;
  dimensions: string;
  specifications: Array<{ name: string; value: string }>;
  syncedAt: Date;
}

export interface AlibabaOrder {
  orderId: string;
  aliobabaOrderId: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  totalPrice: number;
}

export interface ProductSync {
  id: string;
  alibabaProductId: string;
  localProductId: string;
  status: 'active' | 'inactive' | 'archived';
  markupPercent: number;
  lastSyncedAt: Date;
  syncFrequency: 'hourly' | 'daily' | 'weekly';
  createdAt: Date;
}

export interface SyncConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  defaultMarkup: number;
  syncInterval: number;
  batchSize: number;
}

export interface SyncJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  productsProcessed: number;
  productsUpdated: number;
  productsSkipped: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}
