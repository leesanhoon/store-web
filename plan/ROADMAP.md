# Lo Trinh Phat Trien Store Web Cho Ban Va In Ly Nhua, Ly Giay

## Tom Tat

- Muc tieu: phat trien website ban ly nhua, ly giay va dich vu in an theo tung giai doan, uu tien ban hang thuc te truoc khi mo rong tu dong hoa.
- Nen tang hien tai: Next.js 16.2.6 App Router, React 19, TypeScript, Tailwind CSS 4.
- Backend hien co: API .NET Core da co kha nang tao va luu tru san pham.
- Nguyen tac: frontend tich hop dan voi API .NET Core, khong xay lai backend san pham trong Next.js.
- Truoc khi code cac phan lien quan Next.js, doc guide phu hop trong `node_modules/next/dist/docs/`.

## Giai Doan 1: Nen Tang Ban Hang MVP

Muc tieu: khach xem duoc san pham that, xem chi tiet va gui nhu cau mua hoac in.

Cong viec:

- Chuan hoa cau hinh API:
  - Chuyen `API_BASE_URL` hard-code trong `lib/api/http.ts` sang bien moi truong `NEXT_PUBLIC_API_BASE_URL`.
  - Giu fallback local/dev ro rang de tranh loi khi thieu bien moi truong.
  - Chuan hoa cach hien thi loi, loading va empty state khi goi API.
- Ket noi du lieu that:
  - Trang chu lay danh sach san pham tu API va hien thi nhom san pham noi bat.
  - Tao trang `/products` de xem tat ca san pham.
  - Trang `/product/[id]` lay chi tiet san pham that theo id.
- Chuan hoa noi dung:
  - Sua cac chuoi tieng Viet dang loi encoding.
  - Dung tieng Viet thong nhat cho UI ban hang va admin.
- Bo sung thong tin nganh ly:
  - Loai ly: PET, PP, giay.
  - Dung tich: 360ml, 500ml, 700ml.
  - Don vi ban: cay, thung.
  - So luong toi thieu.
  - Tuy chon co in hoac khong in.
- Them CTA:
  - Lien he Zalo.
  - Yeu cau bao gia.
  - Them vao gio.

Ket qua:

- Website co the gioi thieu va ban san pham that.
- Khach co the xem danh muc, chi tiet, gia co ban va gui nhu cau.

## Giai Doan 2: Gio Hang Va Yeu Cau Bao Gia

Muc tieu: xu ly dung nghiep vu ban ly va in an, chua can thanh toan online phuc tap.

Cong viec:

- Lam gio hang that o frontend:
  - Luu gio hang bang local state va `localStorage`.
  - Cho phep chon san pham, so luong va don vi.
  - Tinh tam tong tien.
- Them form yeu cau bao gia/in an:
  - Ho ten.
  - So dien thoai.
  - Ten quan hoac thuong hieu.
  - San pham, so luong, ghi chu in.
  - Tuy chon upload logo neu backend da ho tro; neu chua thi them ghi chu "gui qua Zalo sau".
- Tao checkout nhe:
  - Buoc 1: kiem tra gio hang.
  - Buoc 2: nhap thong tin lien he va yeu cau in.
  - Buoc 3: xac nhan gui yeu cau.
- Admin don hang:
  - Hoan thien `/admin/order`.
  - Hien thi danh sach yeu cau/don hang neu API da co.
  - Neu API chua co, ghi ro cac endpoint backend can bo sung.

Ket qua:

- Khach gui duoc yeu cau bao gia hoac dat hang.
- Admin co noi tiep nhan va xu ly don.

## Giai Doan 3: Quan Tri San Pham Cho In An

Muc tieu: admin tu quan ly du lieu san pham du de phuc vu ban ly va in ly.

Cong viec:

- Nang cap `/admin/product`:
  - Sua san pham.
  - Xoa hoac an san pham.
  - Nhap URL anh san pham hoac upload anh neu backend ho tro.
  - Quan ly trang thai: dang ban, tam an, het hang.
- Nang cap danh muc:
  - Ly nhua.
  - Ly giay.
  - Nap ly.
  - Dich vu in.
  - Combo.
- Them pricing co ban:
  - Gia theo so luong hoac moc so luong.
  - Gia in 1 mau, 2 mau, nhieu mau neu backend ho tro.
- Chuan hoa hien thi:
  - Tien Viet Nam.
  - Ton kho.
  - Don vi ban.
  - So luong toi thieu.

Ket qua:

- Admin co the van hanh catalog ma khong can sua code.
- Website du du lieu de phuc vu ban hang thuc te.

## Giai Doan 4: Don Hang In An Va Theo Doi Trang Thai

Muc tieu: so hoa quy trinh nhan don in, duyet mau va san xuat.

Cong viec:

- Bo sung trang thai don hang:
  - Moi tao.
  - Cho bao gia.
  - Cho coc.
  - Dang thiet ke.
  - Cho khach duyet mau.
  - Dang san xuat.
  - Dang giao.
  - Hoan tat.
  - Huy.
- Tao trang tra cuu don:
  - Tra bang ma don va so dien thoai.
  - Hien thi timeline trang thai.
- Admin cap nhat trang thai don.
- Luu ghi chu noi bo cho sales va designer.
- Chuan bi luong file thiet ke:
  - Logo khach gui.
  - File mockup.
  - File da duyet.

Ket qua:

- Khach biet don dang o buoc nao.
- Noi bo xu ly don in it phu thuoc Zalo ca nhan hon.

## Giai Doan 5: Tang Truong Va Tu Dong Hoa

Muc tieu: tang chuyen doi, giam thao tac thu cong va chuan bi mo rong.

Cong viec:

- SEO va noi dung:
  - Toi uu metadata cho trang san pham.
  - Them schema `Product` va `LocalBusiness`.
  - Tao trang portfolio mau ly da in.
  - Tao bai viet ve cach chon ly, chon dung tich, chon kieu in.
- Zalo:
  - Them nut chat Zalo noi.
  - Gui thong bao trang thai qua Zalo/ZNS neu co tai khoan OA va backend ho tro.
- Thanh toan:
  - Them VietQR hoac PayOS cho dat coc.
  - Admin xac nhan tien coc va cong no con lai.
- CRM B2B:
  - Luu thong tin khach hang/quang quan.
  - Luu lich su mua.
  - Nhac tai dat hang theo chu ky.
- Mockup:
  - Ban dau lam 2D preview don gian.
  - 3D mockup chi lam sau khi luong ban hang da on dinh.

Ket qua:

- Website khong chi ban hang ma con ho tro cham soc khach cu, nhan don in va toi uu doanh thu.

## Test Plan

- Chay `npm run lint` sau moi giai doan frontend.
- Chay `npm run build` truoc khi nghiem thu tung giai doan.
- Test thu cong cac luong chinh:
  - Trang chu tai san pham tu API.
  - Danh sach san pham loc va xem chi tiet dung.
  - Them gio hang, doi so luong, tinh tien.
  - Gui yeu cau bao gia.
  - Admin tao, sua, xoa san pham va danh muc.
  - Admin cap nhat trang thai don.
  - Khach tra cuu trang thai don.
- Kiem tra responsive tren mobile vi khach B2B thuong thao tac qua dien thoai va Zalo.

## Backend Can Bo Sung Neu Chua Co

- API lay chi tiet san pham theo id.
- API cap nhat/xoa/an san pham.
- API luu gio hang hoac yeu cau bao gia.
- API quan ly don hang.
- API cap nhat trang thai don hang.
- API upload file logo/mockup hoac tich hop object storage.
- API pricing theo so luong, don vi ban va tuy chon in.
- API khach hang B2B va lich su mua hang.

## Gia Dinh Va Mac Dinh

- Backend .NET Core tiep tuc la nguon du lieu chinh cho san pham, danh muc, don hang va file upload.
- Neu backend chua co API cho don hang, upload file, pricing matrix hoac trang thai don, frontend chi hien thi khung ro rang va ghi endpoint can bo sung.
- Uu tien MVP ban hang truoc.
- Thanh toan online, Zalo ZNS, CRM va mockup 3D dua sang giai doan sau.
