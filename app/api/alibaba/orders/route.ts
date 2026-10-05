/**
 * POST /api/alibaba/orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AlibabaClient } from '@/lib/alibaba';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, items, customer, shipping } = body;

    if (!orderId || !items || !customer || !shipping) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, items, customer, shipping' },
        { status: 400 }
      );
    }

    const client = new AlibabaClient();
    const results: any[] = [];

    for (const item of items) {
      try {
        const order = await client.createOrder({
          productId: item.alibaba_id,
          quantity: Number(item.quantity || 1),
          buyerName: customer.name,
          buyerPhone: customer.phone,
          shippingAddress: shipping.address,
          shippingCity: shipping.city,
          shippingCountry: shipping.country,
          shippingZip: shipping.zip,
        });

        await supabase.from('order_fulfillments').insert([
          {
            local_order_id: orderId,
            alibaba_order_id: order.aliobabaOrderId,
            product_id: item.id,
            alibaba_product_id: item.alibaba_id,
            quantity: Number(item.quantity || 1),
            status: 'pending',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ]);

        results.push(order);
      } catch (error) {
        results.push({
          productId: item.alibaba_id,
          error: error instanceof Error ? error.message : 'Failed to place order',
        });
      }
    }

    return NextResponse.json({ success: true, localOrderId: orderId, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
