# Task: Thêm CHECK constraint cho `orders.status`

## Objective

`orders.status` hiện là `varchar(20)` với `HasConversion<string>()`
(`Data/AppDbContext.cs:111`), ràng buộc giá trị hợp lệ (`PendingConfirmation`,
`Confirmed`, `Shipping`, `Completed`, `Cancelled`) chỉ được enforce ở tầng
application (enum C#), KHÔNG có ràng buộc ở tầng DB. Thêm CHECK constraint để DB tự
chặn giá trị không hợp lệ.

## Instructions

1. Đọc `backend-api-dotnet9/Data/AppDbContext.cs` xung quanh dòng cấu hình
   `entity.Property(x => x.Status)...` (trong `modelBuilder.Entity<Order>`) để nắm
   chính xác tên cột thật trong DB (`ToTable("orders")`, property → column mapping).
2. Tạo migration mới bằng `dotnet ef migrations add AddOrderStatusCheckConstraint`
   trong `backend-api-dotnet9`.
3. Trong file migration `.cs` vừa tạo, dùng `migrationBuilder.Sql(...)` để thêm
   CHECK constraint trên cột status của bảng `orders`, giới hạn giá trị đúng 5 chuỗi
   khớp tên enum C# (`PendingConfirmation`, `Confirmed`, `Shipping`, `Completed`,
   `Cancelled`) — lấy chính xác tên cột thật (snake_case hay PascalCase tuỳ theo
   convention EF đang dùng, kiểm tra migration cũ để biết convention).
4. Viết `Down()` tương ứng để drop constraint khi rollback.
5. KHÔNG sửa `AppDbContext.cs` — model-level annotation cho CHECK constraint là tuỳ
   chọn (`HasCheckConstraint`) nhưng để tránh rủi ro đụng file đang được subtask khác
   (03, 05) cùng sửa, chỉ thêm raw SQL trong migration lần này. Nếu dùng
   `HasCheckConstraint` fluent API thì phải tự đảm bảo không xung đột merge với
   thay đổi của subtask khác trong `AppDbContext.cs` — nếu không chắc, ưu tiên chỉ
   sửa migration.

## Acceptance Criteria

- [ ] `dotnet build` pass.
- [ ] `dotnet ef database update` áp dụng migration thành công lên DB dev.
- [ ] Insert thử 1 row `orders` với `status = 'InvalidStatus'` bằng SQL trực tiếp →
      bị DB từ chối (vi phạm CHECK constraint).
- [ ] Insert/update với 1 trong 5 giá trị hợp lệ → vẫn hoạt động bình thường qua
      API hiện có.

## Files to Touch

- `backend-api-dotnet9/Migrations/<timestamp>_AddOrderStatusCheckConstraint.cs` — mới
- `backend-api-dotnet9/Migrations/<timestamp>_AddOrderStatusCheckConstraint.Designer.cs` — mới (tự sinh)
- `backend-api-dotnet9/Migrations/AppDbContextModelSnapshot.cs` — tự cập nhật bởi `dotnet ef migrations add` (Lead sẽ review merge)
