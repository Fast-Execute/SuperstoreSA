import { createClient } from '@supabase/supabase-js';

export type CheckoutItem = {
  productId: string;
  quantity?: number;
};

export type CheckoutPayload = {
  items: CheckoutItem[];
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  shipping: {
    address: string;
    city: string;
    province?: string;
    country?: string;
    zip: string;
  };
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function normalizeQty(value: number | undefined): number {
  const parsed = Number(value ?? 1);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

export async function createCheckoutOrder(input: CheckoutPayload) {
  if (!Array.isArray(input?.items) || input.items.length === 0) {
    throw new Error('At least one cart item is required.');
  }

  const productIds = input.items.map((item) => item.productId).filter(Boolean);
  if (productIds.length !== new Set(productIds).size) {
    throw new Error('Duplicate product IDs are not allowed in a single checkout.');
  }

  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds);

  if (fetchError) {
    throw fetchError;
  }

  const productMap = new Map((products || []).map((product) => [String(product.id), product]));
  const missing = input.items.filter((item) => !productMap.has(item.productId));
  if (missing.length > 0) {
    throw new Error(`Product not found: ${missing[0].productId}`);
  }

  const orderNumber = `SO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const subtotal = input.items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    const quantity = normalizeQty(item.quantity);
    const unitPrice = Number(product.retail_price ?? 0);
    return sum + unitPrice * quantity;
  }, 0);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([
      {
        order_number: orderNumber,
        customer_name: String(input.customer.name || '').trim(),
        customer_phone: String(input.customer.phone || '').trim(),
        customer_email: input.customer.email?.trim() || null,
        shipping_address: String(input.shipping.address || '').trim(),
        shipping_city: String(input.shipping.city || '').trim(),
        shipping_province: input.shipping.province?.trim() || null,
        shipping_country: String(input.shipping.country || 'ZA').trim() || 'ZA',
        shipping_zip: String(input.shipping.zip || '').trim(),
        subtotal,
        shipping_fee: 0,
        total: subtotal,
        status: 'pending',
      },
    ])
    .select('*')
    .single();

  if (orderError || !order) {
    throw orderError || new Error('Failed to create local order.');
  }

  const orderItems: Array<Record<string, unknown>> = input.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const quantity = normalizeQty(item.quantity);
    const unitPrice = Number(product.retail_price ?? 0);
    const totalPrice = unitPrice * quantity;

    return {
      order_id: order.id,
      product_id: product.id,
      alibaba_product_id: product.supplier_product_id || product.id,
      title: product.name,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
    };
  });

  const { data: insertedItems, error: itemError } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select('*');

  if (itemError) {
    throw itemError;
  }

  return {
    order,
    items: insertedItems || [],
  };
}
