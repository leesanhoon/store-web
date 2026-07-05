# Task: Dọn secret thật khỏi file config đang commit

## Objective

`backend-api-dotnet9/appsettings.Development.json` đang chứa Neon DB connection
string, Cloudinary `ApiSecret`, Telegram `BotToken` thật, dạng plain text, đã commit
vào git. Xoá giá trị thật khỏi file, thêm `.gitignore`, chuyển sang dùng
`dotnet user-secrets` cho local dev.

## Instructions

1. Đọc `backend-api-dotnet9/appsettings.Development.json` hiện tại để biết đầy đủ
   cấu trúc key (không được xoá nhầm key nào, chỉ thay giá trị).
2. Thay các giá trị thật sau bằng chuỗi rỗng `""` (giữ nguyên key, đúng cấu trúc
   JSON như `appsettings.json` đang làm):
   - `ConnectionStrings.DefaultConnection`
   - `Jwt.SigningKey` (có thể giữ 1 placeholder rõ ràng ghi chú "dev only",
     KHÔNG dùng lại giá trị hiện tại vì đã bị commit công khai)
   - `AdminAccount.PasswordHash`
   - `Cloudinary.ApiSecret`
   - `Telegram.BotToken`, `Telegram.ChatId` (ChatId không phải secret nhưng đổi
     luôn cho gọn nếu đã đổi BotToken thì token cũ vô hiệu)
3. Thêm `dotnet user-secrets init` cho project `backend-api-dotnet9.csproj` (chỉ cần
   thêm `<UserSecretsId>` vào `.csproj` nếu chưa có — không cần chạy lệnh CLI thật vì
   Worker không cần init secret thật, chỉ cần project được cấu hình để hỗ trợ).
4. Cập nhật `Program.cs` hoặc nơi build configuration (kiểm tra
   `WebApplication.CreateBuilder` mặc định đã tự đọc `UserSecrets` khi
   `IsDevelopment()` — nếu builder dùng cấu hình mặc định của .NET thì không cần sửa
   gì thêm, chỉ cần `<UserSecretsId>` tồn tại trong `.csproj`. Xác nhận qua tài liệu
   .NET, không đoán.).
5. Thêm vào `backend-api-dotnet9/.gitignore`:
   ```
   appsettings.Development.json
   appsettings.*.local.json
   ```
   Nhưng vì file `appsettings.Development.json` đã tồn tại và được track, thêm vào
   `.gitignore` không tự động untrack — KHÔNG chạy `git rm --cached` (đây là quyết
   định của Lead/chủ dự án vì ảnh hưởng tới việc các dev khác pull code có mất file
   cấu hình hay không). Chỉ thêm `.gitignore` entry, ghi rõ trong `result.md` rằng
   file vẫn đang được track và cần Lead quyết định có untrack hay không.
6. Tạo file mẫu mới `backend-api-dotnet9/appsettings.Development.json.example` với
   toàn bộ cấu trúc key nhưng giá trị placeholder mô tả rõ (ví dụ
   `"<neon-connection-string>"`), để dev mới biết cần điền gì.
7. Nếu có `README.md` ở `backend-api-dotnet9` mô tả cách chạy local, thêm 1 đoạn
   ngắn hướng dẫn dùng `dotnet user-secrets set "ConnectionStrings:DefaultConnection"
   "<value>"` thay vì sửa trực tiếp `appsettings.Development.json`. Nếu không có
   README, không tạo mới (ngoài phạm vi task).

## Acceptance Criteria

- [ ] `appsettings.Development.json` không còn bất kỳ giá trị secret thật nào (grep
      xác nhận không còn chuỗi bắt đầu `postgresql://`, `AQAAAA`, số điện thoại/token
      Telegram, hoặc Cloudinary API secret cũ).
- [ ] Cấu trúc JSON (tên key) giữ nguyên, không bị xoá nhầm.
- [ ] `dotnet build` vẫn pass.
- [ ] `.gitignore` có 2 dòng mới, file `.example` mới được tạo với placeholder rõ ràng.
- [ ] `result.md` nêu rõ: (a) file cũ vẫn đang track trong git, cần Lead quyết định
      untrack; (b) đã xác nhận `.csproj` có `UserSecretsId` hay chưa, nếu chưa đã
      thêm.

## Files to Touch

- `backend-api-dotnet9/appsettings.Development.json` — xoá giá trị thật, giữ key
- `backend-api-dotnet9/appsettings.Development.json.example` — mới
- `backend-api-dotnet9/.gitignore` — thêm 2 dòng
- `backend-api-dotnet9/backend-api-dotnet9.csproj` — thêm `<UserSecretsId>` nếu chưa có
- `backend-api-dotnet9/README.md` — chỉ sửa nếu file đã tồn tại, thêm hướng dẫn ngắn
