# Debug Guide - Cup Print Store Web

## Quick Start

### Option 1: Debug Frontend Only
1. Mở VS Code workspace: `store-web`
2. Nhấn `F5` hoặc `Run > Start Debugging`
3. Chọn `Frontend (Next.js)`
4. Browser tự động mở với debugger

### Option 2: Debug Backend Only
1. Mở VS Code workspace: `backend-api-dotnet9`
2. Nhấn `F5` hoặc `Run > Start Debugging`
3. Chọn `Backend (.NET)`
4. Backend chạy ở `http://localhost:5000`

### Option 3: Debug Cả 2 (Recommended)
1. Mở 2 VS Code windows:
   - Window 1: `store-web` (frontend)
   - Window 2: `backend-api-dotnet9` (backend)
2. Nhấn `F5` ở mỗi window
3. Frontend (3000) + Backend (5000) chạy cùng lúc

## Cách Debug

### Frontend (Next.js):
- Set breakpoint bằng cách click vào line number
- Reload page để hit breakpoint
- Variables, watch, call stack hiển thị ở debug panel

### Backend (.NET):
- Set breakpoint ở file C#
- Gọi API từ frontend
- Debug panel sẽ hiển thị variables, watches, etc

## Keyboard Shortcuts
- `F5` - Start/Continue debug
- `F10` - Step over
- `F11` - Step into
- `Shift+F11` - Step out
- `Ctrl+Shift+D` - Open debug panel

## Troubleshoot

### Frontend debug không work:
1. Kiểm tra port 9229 có free không
2. Rebuild Next.js: `npm run build`

### Backend debug không work:
1. Kiểm tra port 5000 có free không
2. Build project: `dotnet build`
3. Kiểm tra appsettings.Development.json có config đúng không
