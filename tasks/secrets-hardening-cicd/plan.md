# Plan: Secrets Hardening & GitHub Actions CI

## Bối cảnh

Review database trước đó phát hiện `backend-api-dotnet9/appsettings.Development.json`
đang được **track trong git** và chứa secret thật dạng plain text:

- Neon PostgreSQL connection string (username + password thật)
- Cloudinary `ApiSecret` thật
- Telegram `BotToken` thật

Không có file `.gitignore` nào loại trừ `appsettings.Development.json`, và repo hiện
**chưa có bất kỳ GitHub Actions workflow nào**. Cần: (1) ngăn rò rỉ tiếp diễn trong
code, (2) xoay các secret đã lộ (thao tác tay trên Neon/Cloudinary/Telegram dashboard,
ngoài phạm vi Worker vì cần quyền truy cập tài khoản của chủ dự án), (3) thiết lập CI
cơ bản bằng GitHub Actions dùng repo secrets thay vì file commit.

## Architecture

- Dùng **dotnet user-secrets** cho local dev thay vì điền giá trị thật vào
  `appsettings.Development.json` — file này chỉ giữ cấu trúc key với placeholder rỗng
  từ nay về sau, và được thêm vào `.gitignore` (giữ 1 file `.example` làm mẫu).
- Rotation (đổi mật khẩu/API key thật) là thao tác thủ công trên dashboard của
  Neon/Cloudinary/Telegram — Lead/chủ dự án thực hiện, Worker không có quyền này.
  Worker chỉ chuẩn bị code/hướng dẫn để nhận giá trị mới qua biến môi trường.
- GitHub Actions: thêm workflow `ci.yml` tối thiểu (build + test) cho từng repo,
  đọc secret qua `${{ secrets.<NAME> }}` khi cần (ví dụ chạy `dotnet ef database
  update` để test migration trên DB staging), không hardcode bất kỳ giá trị nào
  trong file YAML.
- Không rewrite git history (BFG/filter-repo) trong phạm vi task này — quá rủi ro
  (cần force-push, ảnh hưởng mọi collaborator) và không bắt buộc vì rotation đã làm
  giá trị cũ vô dụng. Nếu sau này muốn dọn history, cần task riêng có xác nhận rõ
  ràng từ chủ dự án.

## Subtasks

| ID | Owner | Parallelizable | Dependencies | Allowed files | Output |
| --- | --- | --- | --- | --- | --- |
| 01-scrub-committed-secrets | Worker | Có | Không | `backend-api-dotnet9/appsettings.Development.json`, `appsettings.json`, `.gitignore`, `README.md` (nếu có hướng dẫn setup) | File config sạch, không còn giá trị thật, có `.gitignore` + hướng dẫn `dotnet user-secrets` |
| 02-github-actions-ci-backend | Worker | Có | Không | `backend-api-dotnet9/.github/workflows/ci.yml` | Workflow build/test backend dùng GH secrets |
| 03-github-actions-ci-frontend | Worker | Có | Không | `store-web/.github/workflows/ci.yml` | Workflow build/lint frontend |
| 04-manual-secret-rotation | Lead/User | Không (thao tác tay) | Không | N/A — không phải code task | Checklist xác nhận đã xoay Neon/Cloudinary/Telegram/JWT key + set trên Render/Vercel/GitHub Secrets |

01-03 là code task giao cho Worker. 04 là checklist thao tác tay, Lead theo dõi
tiến độ qua đối thoại trực tiếp với chủ dự án, không có `task.md` kiểu Worker.

## Testing Strategy

- 01: `git diff` xác nhận không còn chuỗi bí mật nào trong working tree; `dotnet run`
  vẫn khởi động được ở local nếu dev đã set `dotnet user-secrets` đúng.
- 02/03: workflow chạy thật trên 1 PR test (hoặc `workflow_dispatch` thủ công), build
  xanh, không log lộ giá trị secret (GitHub tự mask nếu secret được khai báo đúng
  qua `secrets.*`, không nên `echo` secret ra log).
- 04: sau khi xoay xong, gọi thử API backend bằng connection string MỚI xác nhận kết
  nối được; xác nhận giá trị CŨ (đã lộ) không còn hoạt động (Neon: reset password
  tự động vô hiệu hoá cái cũ; Cloudinary/Telegram: cần chủ động revoke/regenerate).

## Edge Cases & Error Handling

- 01: KHÔNG được xoá cấu trúc key (chỉ xoá giá trị) — nếu xoá cả key, code đọc
  `IOptions<T>` sẽ nhận default rỗng và có thể gây lỗi runtime khó debug. Giữ
  `appsettings.json` (không phải `.Development.json`) với placeholder rỗng như hiện
  tại — không đổi file này.
- 01: Nếu xoá giá trị thật khỏi `appsettings.Development.json` mà dev khác đang dùng
  file này để chạy local, họ sẽ mất kết nối cho tới khi cấu hình `user-secrets` —
  cần ghi rõ hướng dẫn thay thế trong `result.md`/README, không được để im lặng.
- 02/03: workflow không được in giá trị secret ra log dưới bất kỳ hình thức nào
  (kể cả debug/echo tạm thời) — nếu cần debug, chỉ log độ dài chuỗi hoặc giá trị đã
  mask.
