/**
 * Nội dung tĩnh của trang Giới thiệu và Liên hệ.
 * Chỉ dùng các cam kết đã chốt: "Thiết kế miễn phí", "In nhanh 3-5 ngày", "Giao toàn quốc".
 * Không thêm số năm, doanh số hay giải thưởng khi chưa được chủ shop xác nhận.
 * Dữ liệu liên hệ (số điện thoại, Zalo, địa chỉ...) nằm ở lib/site.ts, không đặt ở đây.
 */

export type ContentCard = {
    title: string;
    text: string;
};

export const ABOUT_DESCRIPTION =
    "Giới thiệu dịch vụ in logo lên ly nhựa PET, PP, ly giấy và nắp ly cho quán café, trà sữa tại Quảng Ngãi.";

// TODO(owner): bổ sung câu chuyện thương hiệu, tầm nhìn và sứ mệnh của chi nhánh Quảng Ngãi sau khi chủ shop xác nhận.
export const ABOUT_LEAD =
    "Chúng tôi nhận in logo lên ly nhựa, ly giấy và cung cấp nắp ly cho quán café, trà sữa, cửa hàng đồ uống. Bạn chọn mẫu ly, gửi yêu cầu báo giá và duyệt thiết kế trước khi in.";

export const ABOUT_OFFERINGS_TITLE = "Chúng tôi làm gì";

export const ABOUT_OFFERINGS: readonly ContentCard[] = [
    {
        title: "Ly nhựa PET và PP",
        text: "Nhiều dung tích cho trà sữa, cà phê, nước ép và đồ uống mang đi.",
    },
    {
        title: "Ly giấy",
        text: "Ly giấy một lớp và hai lớp, in logo theo thiết kế của bạn.",
    },
    {
        title: "Nắp ly",
        text: "Nắp phẳng, nắp cầu, nắp bật nút. Chọn theo đường kính miệng ly để vừa khít.",
    },
    {
        title: "In logo theo yêu cầu",
        text: "Gửi logo hoặc ý tưởng, chúng tôi thiết kế miễn phí và in lên ly theo số lượng bạn cần.",
    },
];

export const ABOUT_COMMITMENTS_TITLE = "Cam kết khi đặt in";

export const ABOUT_COMMITMENTS: readonly ContentCard[] = [
    {
        title: "Thiết kế miễn phí",
        text: "Bạn xem và duyệt mẫu logo trên ly trước khi sản xuất.",
    },
    {
        title: "In nhanh 3-5 ngày",
        text: "Đơn in được sản xuất nhanh để quán của bạn sớm có ly dùng.",
    },
    {
        title: "Giao toàn quốc",
        text: "Giao hàng đến mọi tỉnh thành trên cả nước.",
    },
];

export const CONTACT_DESCRIPTION =
    "Thông tin liên hệ để được tư vấn và báo giá in logo trên ly nhựa, ly giấy tại Quảng Ngãi.";

export const CONTACT_LEAD =
    "Gọi điện hoặc nhắn Zalo để được tư vấn mẫu ly, số lượng và báo giá in logo.";

export const CONTACT_DETAILS_TITLE = "Thông tin liên hệ";

export const CONTACT_PENDING_WITH_CHANNELS =
    "Địa chỉ, email và giờ làm việc đang được cập nhật. Trong lúc đó, bạn có thể liên hệ qua điện thoại hoặc Zalo.";

export const CONTACT_PENDING =
    "Thông tin liên hệ đang được cập nhật. Bạn có thể gửi yêu cầu báo giá ngay từ danh mục sản phẩm.";

export const QUOTE_CTA = {
    title: "Cần báo giá in logo trên ly?",
    text: "Chọn mẫu ly và số lượng, sau đó gửi yêu cầu báo giá. Phí in sẽ được báo trong báo giá.",
    label: "Gửi yêu cầu báo giá",
    href: "/products",
} as const;
