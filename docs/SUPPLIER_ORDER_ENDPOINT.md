# Supplier Order Endpoint

## Endpoint

POST `/api/alibaba/orders`

## Purpose

This endpoint converts a local storefront order into one or more Alibaba supplier orders. It is triggered after checkout is accepted and the shipping details are known.

## Request format

```json
{
  "orderId": "ord_123456",
  "customer": {
    "name": "Aisha Naidoo",
    "phone": "+27821234567",
    "email": "aisha@example.com"
  },
  "shipping": {
    "address": "12 Main Road",
    "city": "Johannesburg",
    "province": "Gauteng",
    "country": "ZA",
    "zip": "2000"
  },
  "items": [
    {
      "id": "7d82e2b4-7ecf-4d5d-94d0-4f4ec2a66f4b",
      "alibaba_id": "1234567890",
      "quantity": 2,
      "sku": "ALI-1234567890",
      "unit_price": 16.25
    }
  ]
}
```

## Validation

The route validates:
- `orderId`
- `items[]`
- `customer.name`
- `customer.phone`
- `shipping.address`
- `shipping.city`
- `shipping.country`
- `shipping.zip`

If any required value is missing, it returns:

```json
{
  "error": "Missing required fields: orderId, items, customer, shipping"
}
```

HTTP status: `400`

## Backend logic

The route implementation follows this exact pattern:

```ts
const client = new AlibabaClient();

for (const item of items) {
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

  await supabase.from('order_fulfillments').insert({
    local_order_id: orderId,
    alibaba_order_id: order.aliobabaOrderId,
    product_id: item.id,
    alibaba_product_id: item.alibaba_id,
    quantity: Number(item.quantity || 1),
    status: 'pending',
    created_at: new Date(),
    updated_at: new Date(),
  });
}
```

## Response format

```json
{
  "success": true,
  "localOrderId": "ord_123456",
  "results": [
    {
      "orderId": "ali_order_001",
      "aliobabaOrderId": "1688_001",
      "status": "pending",
      "createdAt": "2026-10-05T19:00:00.000Z",
      "totalPrice": 32.5
    }
  ]
}
```

## Notes

- This repo currently sends one supplier order per line item.
- `order_fulfillments` records the local order to supplier order mapping.
- The actual Alibaba supplier API may require supplier-specific fields such as `addressId`, `countryCode`, `province`, `city`, or account-level order metadata.

## Recommended next step

Add a per-order wrapper object and support for batching by supplier or by warehouse so a single storefront order can produce multiple Alibaba orders and one combined fulfillment status.

