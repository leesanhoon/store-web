# Store Web

Store Web là ứng dụng web thương mại điện tử được xây dựng bằng Next.js App Router, React và TypeScript. Dự án hiện tập trung vào giao diện bán hàng cơ bản, trang giỏ hàng và khu vực quản trị để quản lý sản phẩm, danh mục và đơn hàng.

## Công nghệ sử dụng

- Next.js 16.2.6 với App Router
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- ESLint 9
- Backend API bên ngoài: `https://backend-api-dotnet9.onrender.com`

## Chức năng chính

### Website bán hàng

- Trang chủ giới thiệu thương hiệu và danh sách sản phẩm mẫu.
- Trang chi tiết sản phẩm theo route `/product/[id]`.
- Trang giỏ hàng `/cart` với dữ liệu mẫu và tính tổng tiền.
- Header/Footer dùng chung cho giao diện người dùng.

### Khu vực quản trị

- Dashboard quản trị tại `/admin`.
- Quản lý sản phẩm tại `/admin/product`:
  - Tải danh sách sản phẩm từ API.
  - Tạo sản phẩm mới với tên, mô tả, giá, tồn kho và danh mục.
  - Tải danh sách category để chọn khi tạo sản phẩm.
- Quản lý category tại `/admin/category`:
  - Tải danh sách category từ API.
  - Thêm, sửa, xóa category.
  - Hiển thị số lượng sản phẩm theo category nếu API trả về dữ liệu liên quan.
- Trang quản lý đơn hàng tại `/admin/order` hiện là khung giao diện để phát triển tiếp.

## Cấu trúc thư mục

```text
app/
  admin/              Các trang quản trị
  cart/               Trang giỏ hàng
  product/[id]/       Trang chi tiết sản phẩm
  page.tsx            Trang chủ
components/           Header, Footer, logo và component dùng chung
lib/api/              API client và hàm gọi backend
docs/                 Tài liệu phân tích nghiệp vụ và kiến trúc
public/               Tài nguyên tĩnh
server/               Thư mục dành cho phần server nếu cần mở rộng
```

## API client

Các lời gọi API tập trung trong `lib/api/`:

- `lib/api/http.ts`: wrapper `fetch` dùng chung, cấu hình `API_BASE_URL`.
- `lib/api/products.ts`: lấy danh sách và tạo sản phẩm.
- `lib/api/categories.ts`: lấy danh sách, tạo, cập nhật và xóa category.

Hiện tại `API_BASE_URL` đang được hard-code trong `lib/api/http.ts`. Khi triển khai thực tế, nên chuyển giá trị này sang biến môi trường như `NEXT_PUBLIC_API_BASE_URL` hoặc route server-side phù hợp.

## Cài đặt và chạy dự án

Cài dependencies:

```bash
npm install
```

Chạy môi trường development:

```bash
npm run dev
```

Mở trình duyệt tại:

```text
http://localhost:3000
```

Build production:

```bash
npm run build
```

Chạy bản production sau khi build:

```bash
npm run start
```

Kiểm tra lint:

```bash
npm run lint
```

## Ghi chú hiện trạng

- Một số dữ liệu ở trang chủ, trang chi tiết sản phẩm và giỏ hàng vẫn là dữ liệu mẫu trong frontend.
- Một số link điều hướng như `/products`, `/about`, `/contact` chưa có page tương ứng.
- Khu vực admin hiện chưa thấy cơ chế xác thực/phân quyền ở frontend.
- Trang quản lý order mới có giao diện placeholder, chưa kết nối API.
- Một số chuỗi tiếng Việt trong code có dấu hiệu lỗi encoding và nên được chuẩn hóa lại.

## Hướng phát triển tiếp theo

- Kết nối dữ liệu sản phẩm thật cho trang chủ và trang chi tiết.
- Hoàn thiện route danh sách sản phẩm `/products`.
- Thêm xác thực và phân quyền cho `/admin`.
- Bổ sung upload ảnh sản phẩm, ví dụ lưu ảnh trên Cloudinary rồi lưu URL vào backend.
- Hoàn thiện quản lý đơn hàng.
- Chuẩn hóa biến môi trường cho backend API.
- Bổ sung test cho các luồng tạo/sửa/xóa dữ liệu.
