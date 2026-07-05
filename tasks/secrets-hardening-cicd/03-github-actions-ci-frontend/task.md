# Task: Thêm GitHub Actions CI cho store-web

## Objective

Repo `store-web` chưa có workflow GitHub Actions. Thêm workflow CI cơ bản: install,
lint, build (Next.js), không hardcode secret nào.

## Instructions

1. Đọc `store-web/package.json` để xác nhận chính xác tên script (`lint`, `build`,
   package manager đang dùng — kiểm tra có `package-lock.json`/`pnpm-lock.yaml`/
   `yarn.lock` để biết dùng npm/pnpm/yarn, không đoán).
2. Tạo `store-web/.github/workflows/ci.yml`:
   - Trigger: `push` và `pull_request` nhắm vào branch `master`.
   - Dùng `actions/setup-node` với version Node khớp `engines` trong `package.json`
     nếu có khai báo, nếu không dùng Node 20 LTS.
   - Cache dependency theo package manager đang dùng.
   - Bước: install dependencies, `npm run lint` (hoặc lệnh tương ứng), `npm run
     build`.
3. Biến môi trường `NEXT_PUBLIC_API_BASE_URL`/`NEXT_PUBLIC_API_URL` (xem
   `lib/api/http.ts`) có giá trị fallback mặc định trong code
   (`https://backend-api-dotnet9.onrender.com`) nên build CI không bắt buộc phải có
   secret này — chỉ thêm qua `secrets.NEXT_PUBLIC_API_BASE_URL` nếu muốn build trỏ
   tới môi trường khác, để lại comment TODO nếu chưa chắc cần.
4. Đảm bảo workflow KHÔNG in giá trị `secrets.*` ra log dưới bất kỳ hình thức nào.

## Acceptance Criteria

- [ ] File `store-web/.github/workflows/ci.yml` hợp lệ cú pháp YAML.
- [ ] Trigger đúng trên `push`/`pull_request` tới `master`.
- [ ] Lệnh lint/build trong workflow khớp đúng script thật trong `package.json` (đã
      chạy thử ở máy local để xác nhận cùng lệnh không lỗi trước khi coi là xong).
- [ ] Không có bước nào tham chiếu secret chưa tồn tại mà không có comment TODO.

## Files to Touch

- `store-web/.github/workflows/ci.yml` — mới
