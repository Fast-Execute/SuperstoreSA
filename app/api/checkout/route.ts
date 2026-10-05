import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutOrder } from '@/lib/checkout';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const items = Array.isArray(body?.items) ? body.items : [];
    const customer = body?.customer || {};
    const shipping = body?.shipping || {};

    if (!items.length) {
      return NextResponse.json({ error: 'Cart items are required.' }, { status: 400 });
    }

    if (!customer.name || !customer.phone || !shipping.address || !shipping.city || !shipping.zip) {
      return NextResponse.json(
        { error: 'customer.name, customer.phone, shipping.address, shipping.city, and shipping.zip are required.' },
        { status: 400 }
      );
    }

    const result = await createCheckoutOrder({
      items: items.map((item: any) => ({
        productId: String(item.productId || item.id),
        quantity: Number(item.quantity || 1),
      })),
      customer: {
        name: String(customer.name),
        phone: String(customer.phone),
        email: customer.email ? String(customer.email) : undefined,
      },
      shipping: {
        address: String(shipping.address),
        city: String(shipping.city),
        province: shipping.province ? String(shipping.province) : undefined,
        country: shipping.country ? String(shipping.country) : 'ZA',
        zip: String(shipping.zip),
      },
    });

    return NextResponse.json({ success: true, order: result.order, items: result.items }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create order.' },
      { status: 400 }
    );
  }
}
