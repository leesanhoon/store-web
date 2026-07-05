# Task: Thêm JWT Authentication cho Admin API

## Objective

Thay thế cơ chế "admin auth" hiện tại (flag `localStorage` + mật khẩu hardcode
`123456` lộ trong bundle JS ở `store-web/lib/admin-auth.ts`) bằng JWT auth thật ở
backend, và khoá các endpoint quản trị lại bằng `[Authorize]`.

## Bối cảnh hiện tại (đã xác nhận)

- `backend-api-dotnet9/Controllers/OrdersController.cs`: `GetAll` (danh sách đơn hàng
  kèm PII khách hàng) và `UpdateStatus` (PATCH) đang **hoàn toàn public**, không có
  `[Authorize]`.
- `ProductsController.cs`, `CategoriesController.cs`, `PartnersController.cs`: các
  action Create/Update/Delete cũng không có auth.
- `Program.cs` hiện chỉ gọi `AddApplicationServices` + `UseApplicationPipeline`,
  chưa có `AddAuthentication`/`AddAuthorization`/`UseAuthentication` nào.
- `store-web/lib/admin-auth.ts` chứa `ADMIN_USERNAME`/`ADMIN_PASSWORD` dạng plain
  text, ai xem source bundle cũng thấy được.

## Instructions

1. Trong `backend-api-dotnet9`, thêm package `Microsoft.AspNetCore.Authentication.JwtBearer`
   (dùng version tương thích .NET 9).
2. Thêm cấu hình JWT (issuer, audience, signing key, admin username, admin password
   hash) vào `appsettings.json`/`appsettings.Development.json` dưới section `Jwt` và
   `AdminAccount` — **không hardcode secret trong code**, đọc từ configuration.
   Password lưu dưới dạng hash (dùng `BCrypt.Net-Next` hoặc
   `Microsoft.AspNetCore.Identity.PasswordHasher`), không lưu plain text.
3. Tạo `Infrastructure/JwtOptions.cs` (theo pattern có sẵn của
   `CloudinaryOptions.cs`/`TelegramOptions.cs`) bind từ section `Jwt`.
4. Tạo controller mới `Controllers/AuthController.cs` với endpoint
   `POST /api/v{version}/auth/login` nhận `{ username, password }`, so khớp với
   `AdminAccount` config, trả về JWT nếu đúng, `401` nếu sai.
5. Đăng ký JWT Bearer authentication + authorization trong
   `Extensions/ServiceCollectionExtensions.cs` (hàm `AddApplicationServices`), và
   gọi `app.UseAuthentication()` + `app.UseAuthorization()` trong
   `Extensions/ApplicationBuilderExtensions.cs` (`UseApplicationPipeline`) — thứ tự
   đúng: `UseAuthentication` trước `UseAuthorization`, trước `MapControllers`.
6. Thêm `[Authorize]` cho các action sau (KHÔNG khoá endpoint đọc công khai cho
   khách như `GET` sản phẩm/danh mục/partner):
   - `OrdersController.GetAll`
   - `OrdersController.UpdateStatus`
   - Mọi action `Create`/`Update`/`Delete` trong `ProductsController`,
     `CategoriesController`, `PartnersController` (đọc code hiện tại để xác định
     chính xác tên action, không đoán).
7. Ở `store-web`:
   - Sửa `lib/admin-auth.ts`: xoá `ADMIN_USERNAME`/`ADMIN_PASSWORD` hardcode, thay
     `isAdminAuthenticated`/`setAdminAuthenticated`/`clearAdminAuthenticated` để làm
     việc với JWT token (lưu token thay vì flag `"true"`, ví dụ đổi key lưu trữ
     sang lưu token thật).
   - Tìm trang/login flow admin hiện tại (tìm nơi gọi `setAdminAuthenticated`) và
     sửa để gọi API `/auth/login`, lưu token trả về.
   - Tìm nơi gọi API admin (tạo/sửa/xoá sản phẩm, danh sách đơn hàng, đổi trạng
     thái đơn) và đính kèm header `Authorization: Bearer <token>`.

## Acceptance Criteria

- [ ] `dotnet build` ở `backend-api-dotnet9` pass không lỗi.
- [ ] Gọi `POST /auth/login` với sai mật khẩu → `401`.
- [ ] Gọi `POST /auth/login` với đúng mật khẩu → trả JWT hợp lệ.
- [ ] Gọi `GET /orders` (list) không kèm token → `401`.
- [ ] Gọi `GET /orders` kèm Bearer token hợp lệ → `200`.
- [ ] Các endpoint đọc công khai (sản phẩm, danh mục cho khách xem) vẫn hoạt động
      không cần token — KHÔNG được khoá nhầm.
- [ ] `store-web` build/lint pass, trang admin đăng nhập/gọi API vẫn hoạt động qua
      token, không còn hardcode mật khẩu trong source.

## Files to Touch

- `backend-api-dotnet9/backend-api-dotnet9.csproj` — thêm package JWT + bcrypt (nếu dùng)
- `backend-api-dotnet9/appsettings.json`, `appsettings.Development.json` — thêm `Jwt`, `AdminAccount` section
- `backend-api-dotnet9/Infrastructure/JwtOptions.cs` — mới
- `backend-api-dotnet9/Controllers/AuthController.cs` — mới
- `backend-api-dotnet9/Extensions/ServiceCollectionExtensions.cs` — đăng ký JWT auth
- `backend-api-dotnet9/Extensions/ApplicationBuilderExtensions.cs` — `UseAuthentication`/`UseAuthorization`
- `backend-api-dotnet9/Controllers/OrdersController.cs`, `ProductsController.cs`, `CategoriesController.cs`, `PartnersController.cs` — thêm `[Authorize]`
- `store-web/lib/admin-auth.ts` — bỏ hardcode, dùng token thật
- `store-web` admin login page + API client (tìm bằng cách grep `setAdminAuthenticated`, `ADMIN_PASSWORD`) — cập nhật flow gọi API
