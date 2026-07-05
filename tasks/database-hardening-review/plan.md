# Plan: Database Hardening & Cleanup Review

## Bối cảnh

Review database hiện tại (PostgreSQL/Neon, EF Core 9, backend `backend-api-dotnet9`)
phát hiện 5 vấn đề cần xử lý trước khi lên production: thiếu authentication cho API
admin, thiếu ràng buộc CHECK ở DB cho `orders.status`, hành vi cascade delete đáng
ngờ của bảng tự tham chiếu `product_lids`, 2 cột chưa dùng trong `order_items`, và
thiếu audit field (`UpdatedAtUtc`) trên các bảng dữ liệu chính.

Toàn bộ code liên quan nằm ở `H:\LeeSanHoon\cup-print\backend-api-dotnet9` (ngoài
subtask 05 có đụng tới `store-web` để đổi admin login từ localStorage sang gọi API).

## Architecture

- Auth: dùng JWT Bearer (built-in `Microsoft.AspNetCore.Authentication.JwtBearer`),
  tài khoản admin cấu hình qua `appsettings` (username + password hash), không cần
  bảng `users` mới ở giai đoạn này.
- DB constraint cho `orders.status`: thêm CHECK constraint bằng raw SQL trong migration
  EF Core (`migrationBuilder.Sql(...)`), không đổi kiểu cột hiện có (`varchar(20)`
  qua `HasConversion<string>`).
- `product_lids`: đổi `OnDelete` của FK `CompatibleProductId` từ `Cascade` sang
  `Restrict` để tránh xoá dây chuyền ngoài ý muốn qua bảng tự tham chiếu 2 FK.
- Xoá cột `MaterialId`/`PrintTypeId` khỏi `OrderItem` (chưa có bảng con, chưa có kế
  hoạch triển khai gần) — dọn theo hướng "xoá, thêm lại khi cần" thay vì giữ cột chết.
- Audit field: chỉ thêm `UpdatedAtUtc` (nullable, set trong service khi Update) cho
  `Product`, `Category`, `Partner`. Không làm soft-delete ở giai đoạn này (ngoài phạm
  vi được duyệt).

## Subtasks

| ID | Owner | Parallelizable | Dependencies | Allowed files | Output |
| --- | --- | --- | --- | --- | --- |
| 01-admin-jwt-auth | Worker | Có (độc lập) | Không | `backend-api-dotnet9/Extensions/*`, `backend-api-dotnet9/Controllers/*`, `backend-api-dotnet9/Infrastructure/*`, `backend-api-dotnet9/appsettings*.json`, `store-web` admin login page/API client | JWT auth hoạt động, các endpoint ghi/danh sách admin yêu cầu `[Authorize]` |
| 02-order-status-db-constraint | Worker | Có (độc lập) | Không | `backend-api-dotnet9/Migrations/*`, `backend-api-dotnet9/Data/AppDbContext.cs` | Migration mới thêm CHECK constraint cho `orders.status` |
| 03-fix-product-lids-cascade | Worker | Có (độc lập) | Không | `backend-api-dotnet9/Data/AppDbContext.cs`, `backend-api-dotnet9/Migrations/*` | Migration đổi `CompatibleProductId` FK sang `Restrict` |
| 04-remove-unused-order-columns | Worker | Có (độc lập) | Không | `backend-api-dotnet9/Models/Order.cs`, `backend-api-dotnet9/Services/OrderService.cs`, `backend-api-dotnet9/Services/Interfaces/IOrderService.cs`, `backend-api-dotnet9/Migrations/*` | Migration xoá cột `material_id`/`print_type_id`, code hết tham chiếu |
| 05-add-audit-fields | Worker | Có (độc lập) | Không | `backend-api-dotnet9/Models/Product.cs`, `Category.cs`, `Partner.cs`, `backend-api-dotnet9/Services/*`, `backend-api-dotnet9/Migrations/*` | Migration thêm `UpdatedAtUtc`, service set giá trị khi Update |

Cả 5 subtask không phụ thuộc lẫn nhau về mặt schema (không đụng cùng bảng cùng lúc)
nên có thể giao song song cho nhiều Worker. Riêng khi apply migration thực tế vào DB,
Lead cần review thứ tự merge để tránh xung đột file `Migrations/AppDbContextModelSnapshot.cs`
(file này sẽ bị đụng bởi tất cả 5 subtask — Lead merge tuần tự, không phải Worker tự ý).

## Testing Strategy

- Mỗi subtask: build project (`dotnet build`) phải pass, migration phải áp dụng được
  lên DB dev (`dotnet ef database update`) không lỗi.
- 01: test gọi endpoint admin không có token → 401; có token hợp lệ → 200.
- 02: test insert trực tiếp SQL với status không hợp lệ → phải bị DB từ chối.
- 03: test xoá 1 product đang là `CompatibleProduct` của product khác → phải bị chặn
  (Restrict) thay vì xoá dây chuyền.
- 04: build/run không còn tham chiếu cột đã xoá.
- 05: update 1 product qua API → `UpdatedAtUtc` thay đổi.

## Edge Cases & Error Handling

- 01: đảm bảo endpoint public (danh mục sản phẩm cho khách xem) KHÔNG bị khoá nhầm —
  chỉ khoá endpoint ghi (Create/Update/Delete) và các endpoint admin đọc dữ liệu
  nhạy cảm (danh sách đơn hàng, thông tin khách hàng).
- 03: nếu đã có dữ liệu thực tế phụ thuộc vào cascade cũ, migration cần kiểm tra
  không có bản ghi nào bị vi phạm ràng buộc mới trước khi apply.
- 04: kiểm tra không có DTO/response nào ở frontend (`store-web`) đang đọc 2 field
  này trước khi xoá ở backend.
