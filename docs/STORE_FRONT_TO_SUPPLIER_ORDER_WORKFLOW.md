# Storefront Product Click to Supplier Order Workflow

## Flow overview

```text
Customer opens product page
        ↓
Product data loaded from local catalog (`products` table)
        ↓
Customer adds item to cart
        ↓
Checkout creates local order + order_items
        ↓
Shipping details captured
        ↓
POST /api/alibaba/orders
        ↓
For each item:
  - read supplier product ID (`alibaba_product_id`)
  - call Alibaba order create API
  - create `order_fulfillments` row
        ↓
Supplier order status tracked as pending/confirmed/shipped/delivered/cancelled
        ↓
Use order status to update storefront order state
```

## Step-by-step

### 1) Product click

A user clicks a product card in the storefront. The app shows the product from the local `products` table. This product was previously imported from Alibaba and stored with:
- `sku`
- `title`
- `description`
- `images`
- `price`
- `alibaba_original_price`
- `alibaba_rating`
- `alibaba_sales`

### 2) Add to cart

The cart stores local product IDs, quantities, and unit price. At this stage, the retail amount and the supplier link are available in the storefront app.

### 3) Checkout

On checkout, the system creates:
- a local order row
- one `order_items` row per product
- the shipping address and customer details

### 4) Order placement trigger

The app calls:

```http
POST /api/alibaba/orders
```

with a payload like:

```json
{
  "orderId": "ord_123",
  "customer": {
    "name": "Aisha Naidoo",
    "phone": "+27821234567"
  },
  "shipping": {
    "address": "12 Main Road",
    "city": "Johannesburg",
    "country": "ZA",
    "zip": "2000"
  },
  "items": [
    {
      "id": "prod_uuid",
      "alibaba_id": "1234567890",
      "quantity": 2
    }
  ]
}
```

### 5) Supplier order execution

For each item, the route runs:

```ts
await client.createOrder({
  productId: item.alibaba_id,
  quantity: Number(item.quantity || 1),
  buyerName: customer.name,
  buyerPhone: customer.phone,
  shippingAddress: shipping.address,
  shippingCity: shipping.city,
  shippingCountry: shipping.country,
  shippingZip: shipping.zip,
});
```

This returns a supplier confirmation object with `orderId`, `aliobabaOrderId`, `status`, and `totalPrice`.

### 6) Fulfillment bookkeeping

The app inserts the mapping into `order_fulfillments`:

```sql
INSERT INTO order_fulfillments (
  local_order_id,
  alibaba_order_id,
  product_id,
  alibaba_product_id,
  quantity,
  status,
  created_at,
  updated_at
)
VALUES (...)
```

### 7) Local order status update

The storefront then updates the local order status to:
- `processing`
- `fulfilled`
- or `cancelled` if Alibaba rejects the order

### 8) Tracking and customer communication

Once the supplier confirms shipping, the app updates:
- tracking number
- status: `shipped` / `delivered`
- customer order timeline

## State flow

```text
Cart Created
   ↓
Checkout Started
   ↓
Order Created in local DB
   ↓
Supplier Order Request Sent
   ↓
Alibaba Response Received
   ↓
Order Fulfillment Row Created
   ↓
Local Order Status Updated
```

## Important implementation gap in this repo

The current repo has the supplier API call and fulfillment mapping, but it does not yet define a full local storefront order model (`orders` and `order_items`). That layer is required for a complete storefront-to-supplier-order system.

