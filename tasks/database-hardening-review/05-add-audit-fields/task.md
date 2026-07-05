# Task: Thêm `UpdatedAtUtc` cho Product, Category, Partner

## Objective

Hiện chỉ có `product_images`/`partner_images` có `CreatedAtUtc`; các bảng chính
`products`, `categories`, `partners` không có bất kỳ audit field nào (không
`CreatedAtUtc`, không `UpdatedAtUtc`). Khi admin sửa dữ liệu, không có cách nào biết
lần sửa gần nhất là khi nào. Phạm vi task này: CHỈ thêm `UpdatedAtUtc` (nullable
`DateTime?`), không làm soft-delete, không thêm `CreatedAtUtc` cho các bảng này
(ngoài phạm vi đã duyệt — nếu muốn thêm, cần task riêng).

## Instructions

1. Đọc `backend-api-dotnet9/Models/Product.cs`, `Category.cs`, `Partner.cs` để nắm
   cấu trúc hiện tại.
2. Thêm property `public DateTime? UpdatedAtUtc { get; set; }` vào cả 3 class
   `Product`, `Category`, `Partner`.
3. Đọc `backend-api-dotnet9/Services/ProductService.cs`,
   `Services/CategoryService.cs`, `Services/PartnerService.cs` — tìm đúng method
   Update của từng service, thêm `entity.UpdatedAtUtc = DateTime.UtcNow;` ngay
   trước khi save changes (không set khi Create, chỉ set khi Update).
4. Trong `Data/AppDbContext.cs`, thêm cấu hình cột nếu cần (map tên cột theo đúng
   convention hiện có của project — kiểm tra cách `CreatedAtUtc` của
   `ProductImage`/`PartnerImage` được cấu hình để làm theo đúng convention, ví dụ
   snake_case column name).
5. Tạo migration: `dotnet ef migrations add AddUpdatedAtUtcToCoreEntities`.

## Acceptance Criteria

- [ ] `dotnet build` pass.
- [ ] `dotnet ef database update` áp dụng migration, cột `updated_at_utc` (hoặc tên
      tương ứng theo convention) xuất hiện ở 3 bảng `products`, `categories`,
      `partners`.
- [ ] Gọi API Update 1 product → `UpdatedAtUtc` trong response/DB thay đổi thành
      thời điểm hiện tại (UTC).
- [ ] Gọi API Create 1 product mới → `UpdatedAtUtc` là `null` (chưa từng update).
- [ ] Tương tự cho Category và Partner.

## Files to Touch

- `backend-api-dotnet9/Models/Product.cs` — thêm `UpdatedAtUtc`
- `backend-api-dotnet9/Models/Category.cs` — thêm `UpdatedAtUtc`
- `backend-api-dotnet9/Models/Partner.cs` — thêm `UpdatedAtUtc`
- `backend-api-dotnet9/Services/ProductService.cs` — set giá trị khi Update
- `backend-api-dotnet9/Services/CategoryService.cs` — set giá trị khi Update
- `backend-api-dotnet9/Services/PartnerService.cs` — set giá trị khi Update
- `backend-api-dotnet9/Data/AppDbContext.cs` — cấu hình cột nếu cần theo convention hiện có
- `backend-api-dotnet9/Migrations/<timestamp>_AddUpdatedAtUtcToCoreEntities.cs` — mới
- `backend-api-dotnet9/Migrations/<timestamp>_AddUpdatedAtUtcToCoreEntities.Designer.cs` — mới (tự sinh)
- `backend-api-dotnet9/Migrations/AppDbContextModelSnapshot.cs` — tự cập nhật (Lead review merge)
