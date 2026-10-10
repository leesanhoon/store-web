import type { Action, Plan, PlanFamily, PlanVariant } from "./plan.ts";

// Renders out/plan.md: the Vietnamese report the owner reads and approves before anything is written.

const ACTIONS: Array<{ action: Action; meaning: string }> = [
    { action: "create", meaning: "Sẽ tạo mới" },
    { action: "skip-overlap", meaning: "Trùng sản phẩm đang có, mặc định bỏ qua" },
    { action: "needs-decision", meaning: "Cần anh/chị quyết định" },
    { action: "deferred", meaning: "Hoãn" },
];

// From the read-only survey of the old site (2026-10-09); these parts are deliberately not imported.
const NOT_IMPORTED = [
    "1.409 bài blog: toàn bộ là bài spam hoặc bài thử, mục Tin tức thật có 0 bài.",
    "195 ảnh rác `ywar_reviews_uploaded_files` (1×1 px) và mọi ảnh không phải ảnh đại diện sản phẩm. Mỗi sản phẩm cũ chỉ có 1 ảnh nên không có ảnh phụ.",
    'Danh mục "Khuyến Mãi", "None" và phần dư của giao diện cũ (Điện thoại, Laptop, Apple, Samsung...).',
    "Các trang rỗng của WooCommerce (cửa hàng, giỏ hàng, thanh toán, tài khoản) và đường dẫn cũ (không làm redirect 301).",
    "Thông tin liên hệ, số điện thoại, địa chỉ: importer không đụng tới, nằm ở `lib/site.ts`.",
];

function cell(text: string | number): string {
    return String(text).replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
}

function table(header: string[], rows: Array<Array<string | number>>): string[] {
    const line = (cells: Array<string | number>) => `| ${cells.join(" | ")} |`;
    return [line(header), line(header.map(() => "---")), ...rows.map((row) => line(row.map(cell))), ""];
}

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;
const signed = (value: number) => `${value > 0 ? "+" : ""}${value.toLocaleString("vi-VN")}đ`;
const ids = (list: Array<{ productId: number }>) => list.map((item) => `#${item.productId}`).join(", ");

function categoryLabel(family: PlanFamily): string {
    const { category } = family;
    if (!category) return "chưa xác định";
    return `${category.name} (${category.isNew ? `tạo mới dưới #${category.parentId}` : `#${category.id}`})`;
}

function variantRow(variant: PlanVariant): Array<string | number> {
    const { source } = variant;
    const overlaps = variant.overlaps.map((o) => {
        const price = `từ ${o.minQuantity} cái: ${money(o.unitPrice)}, chênh ${signed(o.delta)}`;
        return `#${o.productId} ${o.productName} (${price})`;
    });
    return [
        variant.capacityMl > 0 ? `${variant.capacityMl}ml${variant.oz ? ` (${variant.oz})` : ""}` : "–",
        variant.diameterMm,
        `${variant.heightMm ?? "–"} / ${variant.baseDiameterMm ?? "–"}`,
        money(variant.priceTiers[0].unitPrice),
        source.variationId ? `#${source.productId}/${source.variationId}` : `#${source.productId}`,
        variant.flags.join(", ") || "–",
        overlaps.join("; ") || "–",
    ];
}

function familyDetail(family: PlanFamily, position: number): string[] {
    const lines = [
        `### ${position}. ${family.name}`,
        "",
        `- Hành động: \`${family.action}\`, pha ${family.phase}, danh mục: ${categoryLabel(family)}`,
        `- Nguồn cũ: ${ids(family.oldProducts)}; ảnh đại diện lấy từ #${family.avatarOldProductId ?? "–"}`,
        ...family.reasons.map((reason) => `- Lý do: ${reason}`),
        ...family.warnings.map((warning) => `- Cảnh báo: ${warning}`),
        "",
    ];
    if (family.variants.length === 0) return lines;
    return [
        ...lines,
        ...table(
            ["Dung tích", "Phi (mm)", "Cao / đáy (mm)", "Giá cũ", "Nguồn", "Gắn cờ", "Trùng sản phẩm đang có"],
            family.variants.map(variantRow),
        ),
    ];
}

function familyList(plan: Plan, action: Action): string[] {
    const rows = plan.families.flatMap((family, index) => {
        if (family.action !== action) return [];
        const notes = [...family.reasons, ...family.warnings].join("; ") || "–";
        return [[index + 1, family.phase, family.name, categoryLabel(family), family.variants.length, notes]];
    });
    return rows.length > 0 ? table(["#", "Pha", "Nhóm", "Danh mục", "Biến thể", "Ghi chú"], rows) : ["Không có.", ""];
}

export function renderPlanReport(plan: Plan): string {
    const totalVariants = plan.families.reduce((sum, family) => sum + family.variants.length, 0);
    const out: string[] = [
        "# Kế hoạch nhập dữ liệu từ inlybinhduong.vn (dry-run)",
        "",
        "Báo cáo này chỉ dùng GET. Chưa có gì được ghi lên website hay backend.",
        "",
        `- Đích: \`${plan.target.host}\` (production hiện có ${plan.target.productCount} sản phẩm, ${plan.target.categoryCount} danh mục, id sản phẩm lớn nhất ${plan.target.maxProductId})`,
        `- Snapshot site cũ: ${plan.snapshot.products} sản phẩm, ${plan.snapshot.variations} biến thể, lấy lúc ${plan.snapshot.fetchedAt}`,
        `- Tạo lúc: ${plan.generatedAt}`,
        `- \`planSha256\`: \`${plan.planSha256}\` (truyền vào \`--plan-sha\` khi chạy \`apply\` sau khi anh/chị đã duyệt bản này)`,
        "",
        "## 1. Tóm tắt",
        "",
        ...table(
            ["Hành động", "Ý nghĩa", "Số nhóm", "Số biến thể"],
            ACTIONS.map(({ action, meaning }) => [action, meaning, plan.totals[action].families, plan.totals[action].variants]),
        ),
        `Tổng: ${plan.families.length} nhóm, ${totalVariants} biến thể.`,
        "",
        "Cách hiểu:",
        "",
        "- Site cũ coi kích thước là sản phẩm và hãng/loại là biến thể; backend mới làm ngược lại. Importer đảo trục: loại/hãng thành **nhóm (sản phẩm)**, dung tích × đường kính thành **biến thể**.",
        "- Mỗi biến thể có đúng 1 bậc giá `minQuantity = 1` bằng giá cũ. Site cũ không có bậc giá theo số lượng; giá chỉ là dữ liệu nội bộ vì storefront đang ẩn giá.",
        "- Trùng nghĩa là cùng danh mục, cùng dung tích và cùng đường kính với một biến thể đang có trên production. Importer chỉ thêm mới và không bao giờ ghi đè. Muốn nhập một nhóm trùng vẫn phải ghi quyết định riêng cho nhóm đó vào `decisions.json`.",
        "- Thứ tự dưới đây cũng là thứ tự nhập. Trang chủ hiển thị 8 ly mới nhất theo id, nên nhóm nhập sau cùng sẽ nổi bật nhất.",
        "- Chất liệu hoặc hãng nắp chưa rõ không bị đoán: điền vào `overrides.json` (`material`: `PP`/`PET`, `brand`: `UKP`/`MVP`/`HT`) rồi chạy lại `plan`.",
        "",
        "## 2. Cần anh/chị quyết định (`needs-decision`)",
        "",
        ...familyList(plan, "needs-decision"),
        "## 3. Trùng sản phẩm đang có (`skip-overlap`)",
        "",
        ...familyList(plan, "skip-overlap"),
        "Giá cũ là giá theo cái; giá hiện có là bậc giá nhỏ nhất của sản phẩm trên production (thường từ 1.000 cái), nên chênh lệch chỉ để tham khảo. Chi tiết từng biến thể ở mục 9.",
        "",
        "## 4. Sẽ tạo mới (`create`)",
        "",
        ...familyList(plan, "create"),
        "## 5. Hoãn (`deferred`)",
        "",
        "Phụ kiện (ống hút, túi đựng ly, muỗng, màng ép) tính theo kg, cái hoặc cuộn mà backend chưa có đơn vị tính. Nhập vào mục nắp sẽ hiển thị sai.",
        "",
        ...familyList(plan, "deferred"),
        "## 6. Không đọc được hoặc bị loại",
        "",
        ...(plan.needsReview.length > 0
            ? table(
                  ["Sản phẩm cũ", "Biến thể", "Tên", "Lý do"],
                  plan.needsReview.map((item) => [`#${item.productId}`, item.variationId ?? "–", item.name, item.reasons.join("; ")]),
              )
            : ["Không có dòng nào cần xem lại.", ""]),
        ...(plan.dropped.length > 0
            ? table(
                  ["Sản phẩm cũ", "Biến thể", "Tên", "Giá"],
                  plan.dropped.map((row) => [`#${row.productId}`, row.variationId ?? "–", row.name, row.price || "(trống)"]),
              )
            : ["Không có dòng giá 0 hoặc trống bị bỏ.", ""]),
        "## 7. Danh mục sẽ tạo",
        "",
        ...(plan.categoriesToCreate.length > 0
            ? plan.categoriesToCreate.map((category) => `- "${category.name}" dưới danh mục #${category.parentId}`)
            : ["Không có."]),
        "",
        "## 8. Phần không nhập",
        "",
        ...NOT_IMPORTED.map((item) => `- ${item}`),
        "",
        "## 9. Chi tiết từng nhóm (theo thứ tự nhập)",
        "",
        ...plan.families.flatMap((family, index) => familyDetail(family, index + 1)),
    ];
    return `${out.join("\n")}\n`;
}
