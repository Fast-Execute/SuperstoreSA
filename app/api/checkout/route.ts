import { NextRequest, NextResponse } from 'next/server';
import { CheckoutError, createCheckoutOrder } from '@/lib/checkout';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Send a JSON body with items, customer and shipping.' }, { status: 400 });
    }

    const items = Array.isArray(body.items) ? body.items : [];
    const customer = body.customer || {};
    const shipping = body.shipping || {};

    if (!items.length) {
      return NextResponse.json({ error: 'Cart items are required.' }, { status: 400 });
    }

    const result = await createCheckoutOrder({
      items: items.map((item: any) => ({
        productId: String(item?.productId || item?.id || ''),
        quantity: item?.quantity === undefined ? undefined : Number(item.quantity),
      })),
      customer: {
        name: String(customer.name ?? ''),
        phone: String(customer.phone ?? ''),
        email: customer.email ? String(customer.email) : undefined,
      },
      shipping: {
        address: String(shipping.address ?? ''),
        city: String(shipping.city ?? ''),
        province: shipping.province ? String(shipping.province) : undefined,
        country: shipping.country ? String(shipping.country) : 'ZA',
        zip: String(shipping.zip ?? ''),
      },
    });

    return NextResponse.json({ success: true, order: result.order, items: result.items }, { status: 201 });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // Anything else is our problem, not the customer's: log it, don't leak database details.
    console.error('checkout failed', error);
    return NextResponse.json({ error: "We couldn't place your order. Please try again." }, { status: 500 });
  }
}
