/**
 * Alibaba product sync engine.
 */

import { createClient } from '@supabase/supabase-js';
import AlibabaClient from './client';
import type { ProductSync, SyncConfig, SyncJob } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export class ProductSyncEngine {
  private readonly alibaba: AlibabaClient;
  private readonly config: SyncConfig;
  private isRunning = false;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.ALIBABA_API_KEY || '',
      apiSecret: config.apiSecret || process.env.ALIBABA_API_SECRET || '',
      baseUrl: config.baseUrl || process.env.ALIBABA_API_BASE || 'https://api.1688.com',
      defaultMarkup: config.defaultMarkup ?? 30,
      syncInterval: config.syncInterval ?? 60 * 60 * 1000,
      batchSize: config.batchSize ?? 50,
    };

    this.alibaba = new AlibabaClient(this.config);
  }

  startSync() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log('Alibaba sync engine started');
    void this.executeSync();
    setInterval(() => {
      void this.executeSync();
    }, this.config.syncInterval);
  }

  stopSync() {
    this.isRunning = false;
    console.log('Alibaba sync engine stopped');
  }

  async executeSync(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    const job: SyncJob = {
      id: `sync-${Date.now()}`,
      status: 'running',
      productsProcessed: 0,
      productsUpdated: 0,
      productsSkipped: 0,
      startedAt: new Date(),
    };

    try {
      const { data: syncs, error } = await supabase
        .from('product_syncs')
        .select('*')
        .eq('status', 'active');

      if (error) {
        throw error;
      }

      for (const sync of syncs || []) {
        job.productsProcessed += 1;

        const product = await this.alibaba.getProductDetail(sync.alibaba_product_id as string);
        if (!product) {
          job.productsSkipped += 1;
          continue;
        }

        const retailPrice = product.price * (1 + Number(sync.markup_percent || this.config.defaultMarkup) / 100);

        const { error: updateError } = await supabase
          .from('products')
          .update({
            title: product.title,
            description: product.description,
            images: product.images,
            price: retailPrice,
            alibaba_original_price: product.price,
            alibaba_rating: product.rating,
            alibaba_sales: product.sales,
            stock_quantity: Math.max(product.minOrder, 50),
            updated_at: new Date(),
          })
          .eq('id', sync.local_product_id);

        if (updateError) {
          job.productsSkipped += 1;
          continue;
        }

        await supabase
          .from('product_syncs')
          .update({ last_synced_at: new Date() })
          .eq('id', sync.id);

        job.productsUpdated += 1;
      }

      job.status = 'completed';
      job.completedAt = new Date();
      await supabase.from('sync_jobs').insert([job]);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      await supabase.from('sync_jobs').insert([job]);
    }
  }

  async importProducts(options: { keyword: string; pageSize?: number; markup?: number }): Promise<number> {
    const products = await this.alibaba.searchProducts({
      keyword: options.keyword,
      pageSize: options.pageSize ?? 50,
      sortBy: 'sales',
    });

    let imported = 0;

    for (const product of products) {
      const { data: created, error: createError } = await supabase
        .from('products')
        .insert([
          {
            title: product.title,
            description: product.description,
            images: product.images,
            price: product.price * (1 + (options.markup ?? this.config.defaultMarkup) / 100),
            sku: `ALI-${product.alibabaId}`,
            stock_quantity: Math.max(product.minOrder, 50),
            alibaba_original_price: product.price,
            alibaba_rating: product.rating,
            alibaba_sales: product.sales,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ])
        .select();

      if (createError || !created || created.length === 0) {
        continue;
      }

      const localProductId = created[0].id as string;
      const { error: syncError } = await supabase.from('product_syncs').insert([
        {
          alibaba_product_id: product.alibabaId,
          local_product_id: localProductId,
          status: 'active',
          markup_percent: options.markup ?? this.config.defaultMarkup,
          last_synced_at: new Date(),
          sync_frequency: 'daily',
          created_at: new Date(),
        },
      ]);

      if (!syncError) {
        imported += 1;
      }
    }

    return imported;
  }
}

export const syncEngine = new ProductSyncEngine();
export default syncEngine;
