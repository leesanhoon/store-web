# Task: Xoá cột chưa dùng `MaterialId`/`PrintTypeId` khỏi `order_items`

## Objective

`OrderItem.MaterialId` và `OrderItem.PrintTypeId` (nullable `int?`, xem
`backend-api-dotnet9/Models/Order.cs:32-33`) không có bảng `materials`/`print_types`
tương ứng, chưa được dùng ở bất kỳ nghiệp vụ nào hiện tại (đã xác nhận qua grep, chỉ
xuất hiện trong model + service CRUD cơ bản, không có logic thật). Quyết định của
Lead: xoá 2 cột này khỏi schema, dọn code liên quan. Nếu cần tính năng chọn chất
liệu/kiểu in trong tương lai, sẽ mở task mới thiết kế lại từ đầu.

## Instructions

1. Đọc kỹ các file sau để xác định TẤT CẢ chỗ tham chiếu `MaterialId`/`PrintTypeId`
   trước khi xoá (không đoán, đọc thật):
   - `backend-api-dotnet9/Models/Order.cs`
   - `backend-api-dotnet9/Services/OrderService.cs`
   - `backend-api-dotnet9/Services/Interfaces/IOrderService.cs`
   - Bất kỳ DTO nào trong `OrderService.cs`/`IOrderService.cs` (ví dụ
     `CreateOrderRequest`, `OrderItemRequest`, `OrderDetailDto`, v.v. — tên chính
     xác cần đọc code để xác nhận) có field `MaterialId`/`PrintTypeId`.
2. Xoá 2 property `MaterialId`/`PrintTypeId` khỏi class `OrderItem` trong
   `Models/Order.cs`.
3. Xoá mọi tham chiếu tương ứng trong `OrderService.cs`/`IOrderService.cs` (mapping
   khi tạo order, mapping khi trả DTO, v.v.).
4. Kiểm tra `store-web` (grep `materialId`/`printTypeId`, không phân biệt hoa
   thường) xem frontend có gửi/đọc 2 field này không. Nếu có, xoá luôn ở phía
   frontend (type definition, form, request payload) — nếu không chắc phạm vi ảnh
   hưởng, ghi vào `blocked.md` thay vì tự đoán và sửa bừa.
5. Tạo migration: `dotnet ef migrations add RemoveOrderItemMaterialAndPrintType`.
   Xác nhận migration sinh ra 2 lệnh `DropColumn` cho đúng 2 cột, không đụng cột
   nào khác.

## Acceptance Criteria

- [ ] `dotnet build` pass, không còn tham chiếu `MaterialId`/`PrintTypeId` trong
      backend.
- [ ] `store-web` build/typecheck pass (nếu có sửa phía frontend).
- [ ] `dotnet ef database update` áp dụng migration, 2 cột bị xoá khỏi
      `order_items` trên DB dev.
- [ ] Tạo đơn hàng mới qua API vẫn hoạt động bình thường (không còn field đã xoá
      trong request/response).

## Files to Touch

- `backend-api-dotnet9/Models/Order.cs` — xoá 2 property
- `backend-api-dotnet9/Services/OrderService.cs` — xoá mapping liên quan
- `backend-api-dotnet9/Services/Interfaces/IOrderService.cs` — xoá field khỏi DTO/interface nếu có
- `backend-api-dotnet9/Migrations/<timestamp>_RemoveOrderItemMaterialAndPrintType.cs` — mới
- `backend-api-dotnet9/Migrations/<timestamp>_RemoveOrderItemMaterialAndPrintType.Designer.cs` — mới (tự sinh)
- `backend-api-dotnet9/Migrations/AppDbContextModelSnapshot.cs` — tự cập nhật (Lead review merge)
- `store-web` — chỉ sửa nếu grep xác nhận có tham chiếu thật (nêu rõ file trong `result.md`)
