# Order Management API — Hướng dẫn tích hợp

> **Base URL:** `NEXT_PUBLIC_API_BASE_URL`  
> **API Version:** v1  
> **Prefix:** `/api/v1/orders`

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [API 1 — Tạo đơn hàng](#2-api-1--tạo-đơn-hàng)
3. [API 2 — Tra cứu đơn hàng (Khách hàng)](#3-api-2--tra-cứu-đơn-hàng-khách-hàng)
4. [API 3 — Danh sách đơn hàng (Admin)](#4-api-3--danh-sách-đơn-hàng-admin)
5. [API 4 — Cập nhật trạng thái đơn (Admin)](#5-api-4--cập-nhật-trạng-thái-đơn-admin)
6. [Data Models](#6-data-models)
7. [Trạng thái đơn hàng (Order Status Flow)](#7-trạng-thái-đơn-hàng)
8. [Xử lý lỗi](#8-xử-lý-lỗi)
9. [Ví dụ tích hợp Frontend (Next.js)](#9-ví-dụ-tích-hợp-frontend-nextjs)

---

## 1. Tổng quan

| # | Method | Endpoint | Mục đích | Auth |
|---|--------|----------|----------|------|
| 1 | `POST` | `/api/v1/orders` | Tạo đơn hàng mới | Không |
| 2 | `GET` | `/api/v1/orders/track` | Khách tra cứu đơn hàng | Không |
| 3 | `GET` | `/api/v1/orders` | Admin xem danh sách đơn | Không (*) |
| 4 | `PATCH` | `/api/v1/orders/{id}/status` | Admin cập nhật trạng thái | Không (*) |

> (*) Hiện tại chưa có authentication. Sẽ bổ sung sau khi có module Auth.

---

## 2. API 1 — Tạo đơn hàng

Gọi khi khách nhấn **"Gửi báo giá"** trên trang giỏ hàng.

### Request

```
POST /api/v1/orders
Content-Type: application/json
```

```json
{
  "customerName": "Nguyen Van A",
  "customerPhone": "0901234567",
  "customerEmail": null,
  "note": "Quán: Coffee ABC. Giao trước 15/7",
  "items": [
    {
      "productId": 3,
      "quantity": 5000,
      "unitPrice": 880,
      "materialId": null,
      "printTypeId": null
    },
    {
      "productId": 4,
      "quantity": 2000,
      "unitPrice": 750,
      "materialId": null,
      "printTypeId": null
    }
  ]
}
```

### Request Parameters

| Field | Type | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `customerName` | string | ✅ | Họ tên khách hàng |
| `customerPhone` | string | ✅ | Số điện thoại (dùng để tra cứu đơn) |
| `customerEmail` | string \| null | ❌ | Email |
| `note` | string \| null | ❌ | Ghi chú (bao gồm tên quán nếu có) |
| `items` | array | ✅ (≥ 1) | Danh sách sản phẩm |
| `items[].productId` | int | ✅ | ID sản phẩm |
| `items[].quantity` | int | ✅ | Số lượng (≥ 100) |
| `items[].unitPrice` | decimal | ✅ | Đơn giá (VNĐ) |
| `items[].materialId` | int \| null | ❌ | ID chất liệu |
| `items[].printTypeId` | int \| null | ❌ | ID loại in |

### Response — `201 Created`

```json
{
  "id": 2,
  "customerName": "Nguyen Van A",
  "customerPhone": "0901234567",
  "customerEmail": null,
  "note": "Quán: Coffee ABC. Giao trước 15/7",
  "totalAmount": 5900000.00,
  "status": "draft",
  "createdAtUtc": "2026-06-10T15:54:55.038529Z",
  "items": [
    {
      "productId": 3,
      "productName": "Ly PET trong suốt",
      "materialId": null,
      "materialName": null,
      "printTypeId": null,
      "printTypeName": null,
      "quantity": 5000,
      "unitPrice": 880.00
    },
    {
      "productId": 4,
      "productName": "Ly giấy trắng 1 lớp",
      "materialId": null,
      "materialName": null,
      "printTypeId": null,
      "printTypeName": null,
      "quantity": 2000,
      "unitPrice": 750.00
    }
  ]
}
```

### Response — `400 Bad Request`

```json
{
  "message": "Danh sach san pham khong duoc trong"
}
```

### Lưu ý

- `totalAmount` do backend tính = `sum(quantity × unitPrice)` cho tất cả items
- Trạng thái mặc định khi tạo là `"draft"`
- `productName` được backend resolve từ `productId`
- `productId` phải tồn tại trong database, nếu không sẽ trả 500

### Ví dụ fetch

```typescript
const response = await fetch(`${API_BASE_URL}/api/v1/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    customerName: formData.name,
    customerPhone: formData.phone,
    customerEmail: formData.email || null,
    note: formData.note || null,
    items: cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      materialId: item.materialId ?? null,
      printTypeId: item.printTypeId ?? null,
    })),
  }),
});

if (response.status === 201) {
  const order = await response.json();
  // Hiển thị trang xác nhận với order.id
}
```

---

## 3. API 2 — Tra cứu đơn hàng (Khách hàng)

Khách hàng tra cứu đơn bằng **mã đơn + số điện thoại**. Không cần đăng nhập.

### Request

```
GET /api/v1/orders/track?orderId={id}&phone={phone}
```

### Query Parameters

| Parameter | Type | Bắt buộc | Mô tả |
|-----------|------|----------|-------|
| `orderId` | int | ✅ | Mã đơn hàng |
| `phone` | string | ✅ | SDT đã dùng khi đặt hàng |

### Response — `200 OK`

Trả về `OrderDetailDto` (cùng format với response của API 1).

```json
{
  "id": 2,
  "customerName": "Nguyen Van A",
  "customerPhone": "0901234567",
  "customerEmail": null,
  "note": "Quán: Coffee ABC. Giao trước 15/7",
  "totalAmount": 4400000.00,
  "status": "confirmed",
  "createdAtUtc": "2026-06-10T15:54:55.038529Z",
  "items": [...]
}
```

### Response — `404 Not Found`

```json
{
  "message": "Khong tim thay don hang"
}
```

### Lưu ý

- Endpoint này là **public**, không yêu cầu authentication
- Phải khớp **CẢ HAI** `orderId` và `phone` mới trả về kết quả (bảo mật)
- Phone so khớp dạng **contains** (ví dụ: `0901` match `0901234567`)

### Ví dụ fetch

```typescript
const response = await fetch(
  `${API_BASE_URL}/api/v1/orders/track?orderId=${orderId}&phone=${encodeURIComponent(phone)}`
);

if (response.ok) {
  const order = await response.json();
  // Hiển thị thông tin đơn hàng
} else if (response.status === 404) {
  // Hiển thị "Không tìm thấy đơn hàng"
}
```

---

## 4. API 3 — Danh sách đơn hàng (Admin)

Admin xem danh sách đơn hàng, có phân trang và lọc theo trạng thái.

### Request

```
GET /api/v1/orders?page=1&pageSize=20&status=draft
```

### Query Parameters

| Parameter | Type | Default | Mô tả |
|-----------|------|---------|-------|
| `page` | int | 1 | Số trang |
| `pageSize` | int | 10 | Số item mỗi trang (tối đa 100) |
| `status` | string \| null | tất cả | Lọc theo trạng thái: `draft`, `confirmed`, `shipping`, `completed`, `cancelled` |

### Response — `200 OK`

```json
{
  "items": [
    {
      "id": 2,
      "customerName": "Nguyen Van A",
      "totalAmount": 4400000.00,
      "status": "draft",
      "createdAtUtc": "2026-06-10T15:54:55.038529Z"
    }
  ],
  "totalCount": 1,
  "page": 1,
  "pageSize": 20
}
```

### Lưu ý

- Kết quả sắp xếp theo `createdAtUtc` **giảm dần** (đơn mới nhất lên trước)
- Response dùng `PagedResult<OrderSummaryDto>` (cùng pattern với Products API)
- `pageSize` bị giới hạn tối đa 100

### Ví dụ fetch

```typescript
const params = new URLSearchParams({
  page: String(currentPage),
  pageSize: "20",
});
if (statusFilter) {
  params.set("status", statusFilter);
}

const response = await fetch(`${API_BASE_URL}/api/v1/orders?${params}`);
const data = await response.json();

// data.items       — danh sách đơn hàng
// data.totalCount  — tổng số đơn (dùng cho pagination)
// data.page        — trang hiện tại
// data.pageSize    — số item mỗi trang
```

---

## 5. API 4 — Cập nhật trạng thái đơn (Admin)

Admin chuyển trạng thái đơn hàng theo flow quy định.

### Request

```
PATCH /api/v1/orders/{id}/status
Content-Type: application/json
```

```json
{
  "status": "confirmed"
}
```

### Path Parameters

| Parameter | Type | Mô tả |
|-----------|------|-------|
| `id` | int | ID đơn hàng |

### Request Body

| Field | Type | Mô tả |
|-------|------|-------|
| `status` | string | Trạng thái mới: `confirmed`, `shipping`, `completed`, `cancelled` |

### Response — `200 OK`

Trả về `OrderDetailDto` với status đã cập nhật.

### Response — `400 Bad Request`

```json
{
  "message": "Khong the chuyen tu completed sang draft"
}
```

### Response — `404 Not Found`

Khi không tìm thấy đơn hàng với `id` đã cho.

### Ví dụ fetch

```typescript
const response = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}/status`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: newStatus }),
});

if (response.ok) {
  const updatedOrder = await response.json();
  // Cập nhật UI
} else if (response.status === 400) {
  const error = await response.json();
  // Hiển thị error.message
}
```

---

## 6. Data Models

### OrderDetailDto

Response đầy đủ của một đơn hàng (dùng cho API 1, 2, 4).

```typescript
interface OrderDetailDto {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  note: string | null;
  totalAmount: number;
  status: OrderStatus;
  createdAtUtc: string; // ISO 8601
  items: OrderItemDto[];
}
```

### OrderItemDto

```typescript
interface OrderItemDto {
  productId: number;
  productName: string;
  materialId: number | null;
  materialName: string | null;
  printTypeId: number | null;
  printTypeName: string | null;
  quantity: number;
  unitPrice: number;
}
```

### OrderSummaryDto

Response rút gọn cho danh sách (API 3).

```typescript
interface OrderSummaryDto {
  id: number;
  customerName: string;
  totalAmount: number;
  status: OrderStatus;
  createdAtUtc: string; // ISO 8601
}
```

### PagedResult

```typescript
interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
```

### CreateOrderRequest

```typescript
interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  note?: string | null;
  items: CreateOrderItemRequest[];
}

interface CreateOrderItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  materialId?: number | null;
  printTypeId?: number | null;
}
```

### UpdateOrderStatusRequest

```typescript
interface UpdateOrderStatusRequest {
  status: string;
}
```

---

## 7. Trạng thái đơn hàng

### OrderStatus Enum

| Value | Label (tiếng Việt) | Mô tả |
|-------|-------------------|-------|
| `draft` | Nháp | Đơn mới tạo, chưa xử lý |
| `confirmed` | Đã xác nhận | Admin đã xác nhận đơn |
| `shipping` | Đang giao | Đơn đang vận chuyển |
| `completed` | Hoàn tất | Đơn đã giao thành công |
| `cancelled` | Đã hủy | Đơn bị hủy |

### Status Flow

```
draft ──────┬──→ confirmed ──→ shipping ──→ completed
            │
            └──→ cancelled
```

| Từ trạng thái | Có thể chuyển sang |
|---------------|-------------------|
| `draft` | `confirmed`, `cancelled` |
| `confirmed` | `shipping` |
| `shipping` | `completed` |
| `completed` | *(kết thúc — không chuyển tiếp)* |
| `cancelled` | *(kết thúc — không chuyển tiếp)* |

### TypeScript helper

```typescript
type OrderStatus = "draft" | "confirmed" | "shipping" | "completed" | "cancelled";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Nháp",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["shipping"],
  shipping: ["completed"],
  completed: [],
  cancelled: [],
};

// Kiểm tra có thể chuyển trạng thái không
function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
```

---

## 8. Xử lý lỗi

### HTTP Status Codes

| Status | Ý nghĩa | Khi nào |
|--------|---------|--------|
| `200` | Thành công | GET, PATCH thành công |
| `201` | Đã tạo | POST tạo đơn thành công |
| `400` | Lỗi validation | Items rỗng, chuyển trạng thái không hợp lệ |
| `404` | Không tìm thấy | Đơn hàng không tồn tại hoặc phone không khớp |
| `500` | Lỗi server | ProductId không tồn tại, lỗi DB |

### Error Response Format

```json
{
  "message": "Mô tả lỗi bằng tiếng Việt (không dấu)"
}
```

### Xử lý lỗi phía Frontend

```typescript
async function apiCall<T>(url: string, options?: RequestInit): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(url, options);

    if (response.ok) {
      const data = await response.json();
      return { data };
    }

    if (response.status === 404) {
      return { error: "Không tìm thấy" };
    }

    const errorBody = await response.json().catch(() => null);
    return { error: errorBody?.message ?? `Lỗi ${response.status}` };
  } catch {
    return { error: "Không thể kết nối server" };
  }
}
```

---

## 9. Ví dụ tích hợp Frontend (Next.js)

### API Client

```typescript
// lib/api/orders.ts

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function createOrder(request: CreateOrderRequest): Promise<OrderDetailDto> {
  const res = await fetch(`${API_BASE}/api/v1/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Không thể tạo đơn hàng");
  }
  return res.json();
}

export async function trackOrder(orderId: number, phone: string): Promise<OrderDetailDto | null> {
  const params = new URLSearchParams({
    orderId: String(orderId),
    phone,
  });
  const res = await fetch(`${API_BASE}/api/v1/orders/track?${params}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Lỗi tra cứu đơn hàng");
  return res.json();
}

export async function getOrders(
  page: number = 1,
  pageSize: number = 20,
  status?: OrderStatus
): Promise<PagedResult<OrderSummaryDto>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (status) params.set("status", status);

  const res = await fetch(`${API_BASE}/api/v1/orders?${params}`);
  if (!res.ok) throw new Error("Lỗi tải danh sách đơn hàng");
  return res.json();
}

export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus
): Promise<OrderDetailDto> {
  const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Không thể cập nhật trạng thái");
  }
  return res.json();
}
```

### Storefront — Form đặt hàng

```typescript
// app/checkout/page.tsx

async function handleSubmit() {
  try {
    const order = await createOrder({
      customerName: name,
      customerPhone: phone,
      customerEmail: email || null,
      note: note || null,
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        materialId: item.materialId ?? null,
        printTypeId: item.printTypeId ?? null,
      })),
    });

    // Chuyển sang trang xác nhận, hiển thị mã đơn
    router.push(`/order-success?id=${order.id}`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Đặt hàng thất bại");
  }
}
```

### Storefront — Tra cứu đơn hàng

```typescript
// app/track-order/page.tsx

async function handleTrack() {
  const order = await trackOrder(Number(orderId), phone);

  if (!order) {
    setError("Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và số điện thoại.");
    return;
  }

  setOrder(order);
}
```

### Admin — Danh sách đơn hàng

```typescript
// app/admin/orders/page.tsx

const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
const [page, setPage] = useState(1);

const { data } = useSWR(
  ["orders", page, statusFilter],
  () => getOrders(page, 20, statusFilter)
);

// data.items       → render bảng
// data.totalCount  → tính tổng số trang
```

### Admin — Cập nhật trạng thái

```typescript
async function handleStatusChange(orderId: number, newStatus: OrderStatus) {
  try {
    await updateOrderStatus(orderId, newStatus);
    toast.success("Cập nhật trạng thái thành công");
    mutate(); // refresh danh sách
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Cập nhật thất bại");
  }
}
```
