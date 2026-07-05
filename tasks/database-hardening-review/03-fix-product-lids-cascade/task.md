# Task: Sửa hành vi Cascade Delete của `product_lids`

## Objective

`ProductLid` (bảng `product_lids`) có 2 FK cùng trỏ về `products` với cùng behavior
`Cascade`:

```csharp
// backend-api-dotnet9/Data/AppDbContext.cs (~line 87-100)
modelBuilder.Entity<ProductLid>(entity =>
{
    entity.ToTable("product_lids");
    entity.HasKey(x => x.Id);
    entity.HasIndex(x => new { x.ProductId, x.CompatibleProductId }).IsUnique();
    entity.HasOne(x => x.Product)
        .WithMany(x => x.ProductLids)
        .HasForeignKey(x => x.ProductId)
        .OnDelete(DeleteBehavior.Cascade);
    entity.HasOne(x => x.CompatibleProduct)
        .WithMany()
        .HasForeignKey(x => x.CompatibleProductId)
        .OnDelete(DeleteBehavior.Cascade);
});
```

Vì `Product` có thể vừa là sản phẩm chính (`ProductId`) vừa là nắp tương thích của
sản phẩm khác (`CompatibleProductId`) cùng lúc, việc cả 2 FK đều `Cascade` khiến xoá
1 product có thể kéo theo xoá âm thầm nhiều liên kết ở cả 2 chiều, dễ mất dữ liệu
liên kết ngoài ý muốn mà admin không lường trước (ví dụ xoá nhầm 1 sản phẩm "nắp"
sẽ tự động xoá toàn bộ liên kết `product_lids` trỏ tới nó mà không có cảnh báo).

## Instructions

1. Đọc `backend-api-dotnet9/Models/ProductLid.cs` và
   `backend-api-dotnet9/Models/Product.cs` (thuộc tính `ProductLids` navigation) để
   hiểu đầy đủ quan hệ trước khi sửa.
2. Trong `AppDbContext.cs`, đổi `OnDelete` của FK `CompatibleProductId` (dòng
   `entity.HasOne(x => x.CompatibleProduct)...`) từ `DeleteBehavior.Cascade` sang
   `DeleteBehavior.Restrict`. Giữ nguyên `ProductId` là `Cascade` (xoá sản phẩm
   chính thì hợp lý khi tự dọn liên kết nắp của chính nó).
3. Tạo migration: `dotnet ef migrations add RestrictProductLidCompatibleProductDelete`.
4. Kiểm tra migration sinh ra đúng thay đổi FK constraint (drop + re-add với
   `ON DELETE RESTRICT` hoặc `NO ACTION` tương đương cho `CompatibleProductId`).

## Acceptance Criteria

- [ ] `dotnet build` pass.
- [ ] `dotnet ef database update` áp dụng thành công.
- [ ] Test: tạo product A và product B (lid), tạo `product_lids` liên kết A↔B. Xoá
      product B (đang là `CompatibleProduct`) qua API/trực tiếp → phải bị chặn lỗi
      FK vi phạm (Restrict), KHÔNG được tự động xoá row `product_lids`.
- [ ] Test: xoá product A (sản phẩm chính, có `ProductId` trỏ tới nó trong
      `product_lids`) → vẫn cascade xoá đúng như cũ (không đổi hành vi này).

## Files to Touch

- `backend-api-dotnet9/Data/AppDbContext.cs` — đổi `OnDelete` cho FK `CompatibleProductId`
- `backend-api-dotnet9/Migrations/<timestamp>_RestrictProductLidCompatibleProductDelete.cs` — mới
- `backend-api-dotnet9/Migrations/<timestamp>_RestrictProductLidCompatibleProductDelete.Designer.cs` — mới (tự sinh)
- `backend-api-dotnet9/Migrations/AppDbContextModelSnapshot.cs` — tự cập nhật (Lead review merge)
