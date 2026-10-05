# Alibaba API Request Format (1688 / AliExpress)

## Scope

This repository uses a generic Alibaba request shape as a starting point. The exact fields must be confirmed against the supplier account’s 1688/AliExpress API contract because the platform and supplier-side API variants differ by account and marketplace.

## Product search request

### Query example

```http
GET https://api.1688.com/openapi/param2/1/alibabaitem/search?apikey=YOUR_API_KEY&keyword=electronics&pageNum=1&pageSize=50&sortBy=sales&fields=title,price,discount,image,sales,rating,shop,categoryId,productId,minOrder,weight,dimensions
```

### URL params

```json
{
  "apikey": "YOUR_API_KEY",
  "keyword": "electronics",
  "categoryId": "",
  "pageNum": 1,
  "pageSize": 50,
  "sortBy": "sales",
  "fields": "title,price,discount,image,sales,rating,shop,categoryId,productId,minOrder,weight,dimensions"
}
```

## Product detail request

```http
GET https://api.1688.com/openapi/param2/1/alibabaitem/detail?apikey=YOUR_API_KEY&productId=1234567890&fields=title,price,discount,image,sales,rating,shop,categoryId,productId,minOrder,weight,dimensions,description,specifications,images
```

## Supplier order create request

This is the generic request format used by the repo’s starter integration:

```http
POST https://api.1688.com/openapi/param2/1/order/create
Content-Type: application/json
```

```json
{
  "apikey": "YOUR_API_KEY",
  "productId": "1234567890",
  "quantity": 2,
  "buyerName": "Aisha Naidoo",
  "buyerPhone": "+27821234567",
  "shippingAddress": "12 Main Road",
  "shippingCity": "Johannesburg",
  "shippingCountry": "ZA",
  "shippingZip": "2000"
}
```

## Production-ready variant

For real supplier-side fulfillment, this is often expanded to include request-specific metadata:

```json
{
  "apikey": "YOUR_API_KEY",
  "productId": "1234567890",
  "quantity": 2,
  "buyerName": "Aisha Naidoo",
  "buyerPhone": "+27821234567",
  "address": {
    "country": "ZA",
    "province": "Gauteng",
    "city": "Johannesburg",
    "district": "Johannesburg Central",
    "street": "12 Main Road",
    "zip": "2000"
  },
  "logistics": {
    "shippingMethod": "standard",
    "warehouseId": "WH-001"
  },
  "notes": "Gift wrap optional"
}
```

## Response format

```json
{
  "orderId": "ali_order_001",
  "alibaba_order_id": "1688_001",
  "totalPrice": 32.5,
  "status": "pending"
}
```

## Important notes

- 1688 and AliExpress integrations are not always identical.
- The supplier account may require a signed request, a different endpoint, or a different payload schema.
- The repo’s implementation is a starter abstraction, not a final production implementation.

## Best practice

Keep a supplier adapter per channel:

```ts
interface SupplierOrderRequest {
  productId: string;
  quantity: number;
  buyerName: string;
  buyerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  shippingZip: string;
}
```

Then adapt it to 1688 or AliExpress per supplier account.

