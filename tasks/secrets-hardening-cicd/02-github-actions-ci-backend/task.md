# Task: Thêm GitHub Actions CI cho backend-api-dotnet9

## Objective

Repo `backend-api-dotnet9` chưa có bất kỳ workflow GitHub Actions nào. Thêm workflow
CI cơ bản: build + (nếu có test project) chạy test, khi cần giá trị bí mật thì đọc
qua `${{ secrets.<NAME> }}`, không hardcode.

## Instructions

1. Kiểm tra repo có test project nào không (tìm file `*.Tests.csproj` hoặc thư mục
   `tests/`). Nếu không có test project, workflow chỉ cần bước build — không tự tạo
   test giả.
2. Tạo `backend-api-dotnet9/.github/workflows/ci.yml`:
   - Trigger: `push` và `pull_request` nhắm vào branch `master`.
   - Job build dùng `actions/setup-dotnet` với version .NET 9 (khớp
     `backend-api-dotnet9.csproj` — kiểm tra `<TargetFramework>` thật, không đoán).
   - Bước: `dotnet restore`, `dotnet build --configuration Release`.
   - Nếu có test project: thêm bước `dotnet test`.
3. KHÔNG thêm bước chạy `dotnet ef database update` trong workflow này trừ khi có
   secret `DB_CONNECTION_STRING` đã được set sẵn trong GitHub repo settings — vì
   Worker không có quyền tạo secret thay người dùng. Nếu muốn thêm bước verify
   migration sau này, để lại comment TODO trong file YAML ghi rõ cần secret nào,
   không tự ý thêm bước sẽ fail vì thiếu secret.
4. Đảm bảo workflow KHÔNG in bất kỳ giá trị `secrets.*` nào ra log (không dùng `run:
   echo ${{ secrets.X }}` dưới bất kỳ hình thức nào, kể cả để debug).

## Acceptance Criteria

- [ ] File `backend-api-dotnet9/.github/workflows/ci.yml` hợp lệ cú pháp YAML.
- [ ] Trigger đúng trên `push`/`pull_request` tới `master`.
- [ ] `dotnet build --configuration Release` chạy được locally với đúng lệnh trong
      workflow (test bằng cách chạy chính lệnh đó ở máy local trước khi coi là xong).
- [ ] Không có bước nào tham chiếu secret chưa tồn tại mà không có comment TODO giải
      thích rõ.

## Files to Touch

- `backend-api-dotnet9/.github/workflows/ci.yml` — mới
