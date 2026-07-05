# Checklist: Xoay secret đã lộ (thao tác tay — không giao Worker)

Đây KHÔNG phải task cho Worker — cần quyền truy cập dashboard Neon/Cloudinary/
Telegram/Render/Vercel/GitHub mà chỉ chủ dự án mới có. Lead theo dõi tiến độ qua
checklist này.

**Cập nhật 2026-07-05**: chủ dự án xác nhận đã set trên Render Environment,
chia 2 nhóm:
- **Secret**: `ConnectionStrings__DefaultConnection`, `Cloudinary__ApiKey`,
  `Cloudinary__ApiSecret`, `Telegram__BotToken`
- **Variable** (không nhạy cảm, để dạng plain là hợp lý): `ASPNETCORE_ENVIRONMENT`,
  `Cloudinary__CloudName`, `Cloudinary__Folder`, `Telegram__ChatId`

Còn thiếu hoàn toàn: **`Jwt__SigningKey`**, **`AdminAccount__PasswordHash`** — 2 cái
này **bắt buộc**, thiếu `AdminAccount__PasswordHash` nghĩa là hiện login admin
production sẽ luôn thất bại vì `appsettings.json` có `PasswordHash: ""`.

⚠️ Chưa xác nhận việc **xoay giá trị** (reset password Neon / regenerate Cloudinary
secret / revoke Telegram token) đã thực hiện chưa, hay chỉ đang **di chuyển giá trị
cũ (đã lộ)** từ file sang Render env var. Nếu là vế sau, giá trị vẫn đang bị lộ
trong lịch sử git và PHẢI xoay lại — set đúng chỗ (Render) không thay thế việc xoay.

## 1. Neon PostgreSQL

- [x] Connection string đã set trên Render (`ConnectionStrings__DefaultConnection`).
- [ ] Xác nhận: đây có phải giá trị MỚI (đã reset password) hay vẫn là giá trị cũ
      đã lộ trong `appsettings.Development.json`? Nếu là giá trị cũ → vào Neon
      Console → **Roles** → reset password cho `neondb_owner` → cập nhật lại giá
      trị mới trên Render.
- [ ] Test: gọi thử 1 API backend (ví dụ `GET /api/v1/categories`) sau khi Render
      redeploy → phải trả về dữ liệu bình thường.

## 2. Cloudinary

- [x] `Cloudinary__ApiKey`, `Cloudinary__ApiSecret` (Secret), `Cloudinary__CloudName`,
      `Cloudinary__Folder` (Variable) đã set trên Render.
- [ ] Xác nhận `ApiSecret` đang set có phải giá trị MỚI hay giá trị cũ đã lộ. Nếu là
      giá trị cũ → Cloudinary Console → Settings → Security → **regenerate API
      Secret** → cập nhật lại Render.
- [ ] Test: thử upload 1 ảnh sản phẩm qua trang admin sau khi deploy lại.

## 3. Telegram Bot

- [x] `Telegram__BotToken` (Secret), `Telegram__ChatId` (Variable) đã set trên Render.
- [ ] Xác nhận token đang set có phải giá trị MỚI hay cũ đã lộ. Nếu là giá trị cũ →
      mở chat với **@BotFather** → `/revoke` → lấy token mới → cập nhật lại Render.
- [ ] Test: tạo 1 đơn hàng thử, xác nhận vẫn nhận được thông báo Telegram.

## 4. JWT SigningKey & Admin Password — CHƯA SET, ưu tiên cao nhất

- [ ] Tạo `SigningKey` mới ngẫu nhiên ≥32 ký tự (ví dụ `openssl rand -base64 48`).
- [ ] Quyết định mật khẩu admin mới, dùng
      `Utilities/PasswordHashGenerator.HashPassword(newPassword)` để sinh hash
      (chạy 1 lần offline, không commit password thô ở bất kỳ đâu).
- [ ] Set `Jwt__SigningKey` và `AdminAccount__PasswordHash` trên Render Environment
      Variables (2 biến này hiện CHƯA có — nếu đã deploy code JWT lên Render mà
      thiếu `AdminAccount__PasswordHash`, đăng nhập admin sẽ luôn trả `401`).
- [ ] Test: đăng nhập `/account` bằng mật khẩu mới → nhận JWT hợp lệ; mật khẩu cũ
      (`123456`) không còn đăng nhập được (route cũ đã bỏ từ subtask 01-admin-jwt-auth
      của task `database-hardening-review`).

## 5. GitHub Actions Secrets (nếu dùng cho CI/deploy tự động)

Vào GitHub repo → **Settings → Secrets and variables → Actions → New repository
secret**, thêm (chỉ thêm secret nào workflow thực sự dùng tới, xem
`02-github-actions-ci-backend/task.md` và `03-github-actions-ci-frontend/task.md`):

- [ ] `DB_CONNECTION_STRING` (giá trị Neon MỚI sau khi xoay)
- [ ] `CLOUDINARY_API_SECRET` (giá trị MỚI)
- [ ] `TELEGRAM_BOT_TOKEN` (giá trị MỚI)
- [ ] `JWT_SIGNING_KEY` (giá trị MỚI)
- [ ] `ADMIN_PASSWORD_HASH` (hash MỚI)

## 6. Xác nhận đóng task

- [ ] Tất cả giá trị cũ (đã lộ trong git) không còn hoạt động ở bất kỳ đâu.
- [ ] Không còn secret thật nào trong working tree của cả 2 repo (đã xác nhận ở
      subtask `01-scrub-committed-secrets`).
- [ ] (Tuỳ chọn, cân nhắc riêng) Nếu muốn xoá secret cũ khỏi lịch sử git bằng BFG/
      `git filter-repo`: đây là thao tác phá hoại (cần force-push, ảnh hưởng mọi
      người đang clone repo) — chỉ làm khi chủ dự án xác nhận rõ ràng, không tự ý
      thực hiện.
