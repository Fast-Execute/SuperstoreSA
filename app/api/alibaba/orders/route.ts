import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AlibabaClient } from '@/lib/alibaba';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, items, customer, shipping } = body as {
      orderId?: string;
      items?: Array<{
        id?: string;
        product_id?: string;
        alibaba_id?: string;
        alibabaProductId?: string;
        title?: string;
        quantity?: number;
        unit_price?: number;
      }>;
      customer?: {
        name?: string;
        phone?: string;
        email?: string;
      };
      shipping?: {
        address?: string;
        city?: string;
        province?: string;
        country?: string;
        zip?: string;
      };
    };

    if (!orderId || !Array.isArray(items) || items.length === 0 || !customer || !shipping) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, items, customer, shipping' },
        { status: 400 }
      );
    }

    const buyerName = String(customer.name || '').trim();
    const buyerPhone = String(customer.phone || '').trim();
    const shippingAddress = String(shipping.address || '').trim();
    const shippingCity = String(shipping.city || '').trim();
    const shippingCountry = String(shipping.country || 'ZA').trim() || 'ZA';
    const shippingZip = String(shipping.zip || '').trim();

    if (!buyerName || !buyerPhone || !shippingAddress || !shippingCity || !shippingZip) {
      return NextResponse.json(
        { error: 'Customer and shipping details are incomplete.' },
        { status: 400 }
      );
    }

    const { data: orderRecord, error: orderInsertError } = await supabase.from('orders').insert([
      {
        order_number: String(orderId),
        customer_name: buyerName,
        customer_phone: buyerPhone,
        customer_email: customer.email || null,
        shipping_address: shippingAddress,
        shipping_city: shippingCity,
        shipping_province: shipping.province || null,
        shipping_country: shippingCountry,
        shipping_zip: shippingZip,
        subtotal: items.reduce((sum, item) => {
          const qty = Number(item.quantity || 1);
          const price = asNumber(item.unit_price, 0);
          return sum + price * qty;
        }, 0),
        shipping_fee: 0,
        status: 'pending',
      },
    ]).select().single();

    if (orderInsertError) {
      throw orderInsertError;
    }

    const localOrderId = orderRecord.id as string;
    const results: any[] = [];

    for (const item of items) {
      const productId = item.product_id || item.id || null;
      const alibabaProductId = item.alibaba_id || item.alibabaProductId || null;
      const quantity = Math.max(1, Number(item.quantity || 1));
      const unitPrice = asNumber(item.unit_price, 0);
      const totalPrice = unitPrice * quantity;

      const { error: itemError } = await supabase.from('order_items').insert([
        {
          order_id: localOrderId,
          product_id: productId && productId.length === 36 ? productId : null,
          alibaba_product_id: alibabaProductId,
          title: item.title || `Alibaba product ${alibabaProductId || 'item'}`,
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
        },
      ]);

      if (itemError) {
        results.push({ productId: alibabaProductId, error: itemError.message });
        continue;
      }

      if (!alibabaProductId) {
        results.push({ productId: productId, error: 'Missing alibaba_id on line item' });
        continue;
      }

      try {
        const client = new AlibabaClient();
        const supplierOrder = await client.createOrder({
          productId: alibabaProductId,
          quantity,
          buyerName,
          buyerPhone,
          shippingAddress,
          shippingCity,
          shippingCountry,
          shippingZip,
        });

        const { data: insertedItem } = await supabase
          .from('order_items')
          .select('id')
          .eq('order_id', localOrderId)
          .eq('alibaba_product_id', alibabaProductId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (insertedItem?.id) {
          await supabase.from('order_supplier_links').insert([
            {
              order_id: localOrderId,
              order_item_id: insertedItem.id,
              alibaba_order_id: supplierOrder.aliobabaOrderId,
              supplier_name: 'Alibaba',
              status: supplierOrder.status,
            },
          ]);
        }

        await supabase.from('order_fulfillments').insert([
          {
            local_order_id: String(orderId),
            alibaba_order_id: supplierOrder.aliobabaOrderId,
            product_id: productId && productId.length === 36 ? productId : null,
            alibaba_product_id: alibabaProductId,
            quantity,
            status: supplierOrder.status,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ]);

        results.push({
          orderId: supplierOrder.orderId,
          aliobabaOrderId: supplierOrder.aliobabaOrderId,
          status: supplierOrder.status,
          createdAt: supplierOrder.createdAt,
          totalPrice: supplierOrder.totalPrice,
        });
      } catch (error) {
        results.push({
          productId: alibabaProductId,
          error: error instanceof Error ? error.message : 'Failed to place order',
        });
      }
    }

    await supabase
      .from('orders')
      .update({
        total: results.reduce((sum, result) => sum + (typeof result.totalPrice === 'number' ? result.totalPrice : 0), 0),
        status: results.some((result) => result.error) ? 'processing' : 'fulfilled',
        updated_at: new Date(),
      })
      .eq('id', localOrderId);

    return NextResponse.json({ success: true, localOrderId: orderId, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
