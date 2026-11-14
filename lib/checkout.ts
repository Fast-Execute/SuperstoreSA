import { createClient } from '@supabase/supabase-js';
import { MAX_LINE_QUANTITY } from './cart';
import { getSupabaseServiceKey, getSupabaseUrl } from './config';
import { validateCheckoutForm } from './checkout-validation';

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

/** A problem the customer can fix (bad input, out of stock). Safe to show to them. */
export class CheckoutError extends Error {}

const MAX_ORDER_LINES = 50;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getAdminClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceKey();
  if (!url || !key) {
    throw new Error('Supabase is not configured: a Supabase URL and a service/secret key are required.');
  }
  return createClient(url, key);
}

function parseQuantity(value: number | undefined): number {
  const quantity = value === undefined ? 1 : Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
    throw new CheckoutError(`Quantity must be a whole number from 1 to ${MAX_LINE_QUANTITY}.`);
  }
  return quantity;
}

const toCents = (amount: number) => Math.round(amount * 100);

export async function createCheckoutOrder(input: CheckoutPayload) {
  if (!Array.isArray(input?.items) || input.items.length === 0) {
    throw new CheckoutError('Your cart is empty.');
  }
  if (input.items.length > MAX_ORDER_LINES) {
    throw new CheckoutError(`An order can have at most ${MAX_ORDER_LINES} different products.`);
  }

  const productIds = input.items.map((item) => String(item.productId || ''));
  if (productIds.some((id) => !id)) {
    throw new CheckoutError('Every cart item needs a product.');
  }
  if (productIds.length !== new Set(productIds).size) {
    throw new CheckoutError('Duplicate products are not allowed in one order.');
  }
  if (productIds.some((id) => !UUID.test(id))) {
    throw new CheckoutError("Some items in your cart are demo products and can't be ordered yet.");
  }

  const quantities = input.items.map((item) => parseQuantity(item.quantity));

  const country = String(input.shipping?.country || 'ZA').trim().toUpperCase();
  if (country !== 'ZA') {
    throw new CheckoutError('We currently deliver within South Africa only.');
  }

  const form = validateCheckoutForm({
    name: input.customer?.name,
    phone: input.customer?.phone,
    email: input.customer?.email,
    address: input.shipping?.address,
    city: input.shipping?.city,
    province: input.shipping?.province,
    zip: input.shipping?.zip,
  });
  if (!form.ok) {
    throw new CheckoutError(Object.values(form.errors)[0] || 'Please check your details.');
  }
  const details = form.value;

  const supabase = getAdminClient();

  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('status', 'active');

  if (fetchError) {
    throw fetchError;
  }

  const productMap = new Map((products || []).map((product) => [String(product.id), product]));

  let subtotalCents = 0;
  const lines = input.items.map((item, index) => {
    const product = productMap.get(productIds[index]);
    if (!product) {
      throw new CheckoutError('One of the items in your cart is no longer available.');
    }
    const quantity = quantities[index];
    const unitPrice = Number(product.retail_price ?? 0);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new CheckoutError(`"${product.name}" is not available to order right now.`);
    }
    const stock = Number(product.stock ?? 0);
    if (stock < quantity) {
      throw new CheckoutError(
        stock > 0 ? `Only ${stock} left of "${product.name}".` : `"${product.name}" is out of stock.`
      );
    }
    subtotalCents += toCents(unitPrice) * quantity;
    return { product, quantity, unitPrice };
  });

  const subtotal = subtotalCents / 100;
  const orderNumber = `SO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([
      {
        order_number: orderNumber,
        customer_name: details.name,
        customer_phone: details.phone,
        customer_email: details.email || null,
        shipping_address: details.address,
        shipping_city: details.city,
        shipping_province: details.province || null,
        shipping_country: 'ZA',
        shipping_zip: details.zip,
        subtotal,
        shipping_fee: 0,
        total: subtotal,
        status: 'pending',
      },
    ])
    .select('*')
    .single();

  if (orderError || !order) {
    throw orderError || new Error('Failed to create order.');
  }

  const orderItems: Array<Record<string, unknown>> = lines.map(({ product, quantity, unitPrice }) => ({
    order_id: order.id,
    product_id: product.id,
    alibaba_product_id: product.supplier_product_id || product.id,
    title: product.name,
    quantity,
    unit_price: unitPrice,
    total_price: toCents(unitPrice) * quantity / 100,
  }));

  const { data: insertedItems, error: itemError } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select('*');

  if (itemError) {
    // Don't leave an order with no items behind.
    await supabase.from('orders').delete().eq('id', order.id);
    throw itemError;
  }

  return {
    order,
    items: insertedItems || [],
  };
}
