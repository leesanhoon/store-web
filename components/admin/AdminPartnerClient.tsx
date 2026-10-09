"use client";

import Image from "next/image";
import { FormEvent, ReactNode, Ref, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import {
    createPartner,
    deletePartner,
    getPartners,
    PartnerDto,
    updatePartner,
} from "@/lib/api/partners";
import {
    AdminCard,
    AdminEmptyState,
    AdminField,
    AdminPrimaryButton,
    AdminSectionHeader,
    AdminTextArea,
} from "@/components/admin/admin-ui";
import {
    PlusIcon,
    EditIcon,
    DeleteIcon,
    UploadIcon,
    FieldLabel,
    preserveAdminScroll,
    normalizeSearch,
} from "@/components/admin/shared";

type PartnerForm = {
    name: string;
    address: string;
    phoneNumber: string;
    description: string;
};

const initialForm: PartnerForm = {
    name: "",
    address: "",
    phoneNumber: "",
    description: "",
};

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
}

const NOTICE_TONES = {
    success: "border-success/30 bg-success-soft text-success",
    danger: "border-danger/30 bg-danger-soft text-danger",
};

function Notice({
    tone,
    className = "",
    ref,
    children,
}: {
    tone: keyof typeof NOTICE_TONES;
    className?: string;
    ref?: Ref<HTMLDivElement>;
    children: ReactNode;
}) {
    return (
        <div
            ref={ref}
            role={tone === "danger" ? "alert" : "status"}
            className={`rounded-lg border p-3 text-sm font-medium ${NOTICE_TONES[tone]} ${className}`}
        >
            {children}
        </div>
    );
}

function IconButton({
    label,
    onClick,
    tone = "neutral",
    children,
}: {
    label: string;
    onClick: () => void;
    tone?: "neutral" | "danger";
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`grid h-11 w-11 place-items-center rounded-md border bg-white transition-colors ${
                tone === "danger"
                    ? "border-danger/30 text-danger hover:bg-danger-soft"
                    : "border-line text-label hover:border-primary hover:text-primary"
            }`}
            aria-label={label}
        >
            {children}
        </button>
    );
}

async function fetchPartners() {
    const response = await getPartners({ pageSize: 100 });
    return response.items;
}

export default function AdminPartnerClient({
    initialPartners,
}: {
    initialPartners: PartnerDto[];
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");
    const avatarInputRef = useRef<HTMLInputElement | null>(null);
    const galleryInputRef = useRef<HTMLInputElement | null>(null);
    const errorRef = useRef<HTMLDivElement | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [form, setForm] = useState<PartnerForm>(initialForm);
    const [avatarImage, setAvatarImage] = useState<File | null>(null);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const {
        data: partners = initialPartners,
        mutate,
    } = useSWR<PartnerDto[]>("/api/v1/partners", fetchPartners, {
        fallbackData: initialPartners,
    });

    const avatarPreviewUrl = useMemo(
        () => (avatarImage ? URL.createObjectURL(avatarImage) : ""),
        [avatarImage],
    );

    const galleryPreviewUrls = useMemo(
        () => galleryImages.map((f) => URL.createObjectURL(f)),
        [galleryImages],
    );

    // (P-fix) `?mode=edit` is required too, so browser Back from the edit form returns to the list
    const isFormMode =
        mode === "create" || (mode === "edit" && selectedId !== null);
    const formTitle = selectedId ? "Sửa đối tác" : "Thêm đối tác";

    // Accent-insensitive, same as the product and lid searches
    const visiblePartners = partners.filter((p) => {
        if (!searchTerm.trim()) return true;
        const text = normalizeSearch(
            `${p.name} ${p.address} ${p.description ?? ""}`,
        );
        return text.includes(normalizeSearch(searchTerm.trim()));
    });

    // The banner sits above the form while the save button is in the sticky bar: render it now, then bring it into view
    const showError = (text: string) => {
        flushSync(() => setError(text));
        errorRef.current?.scrollIntoView({ block: "center" });
    };

    const openAvatarPicker = () => {
        preserveAdminScroll();
        avatarInputRef.current?.click();
    };
    const openGalleryPicker = () => {
        preserveAdminScroll();
        galleryInputRef.current?.click();
    };
    const handleAvatarFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setAvatarImage(event.currentTarget.files?.[0] ?? null);
        event.currentTarget.value = "";
        preserveAdminScroll();
    };
    const handleGalleryFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setGalleryImages(Array.from(event.currentTarget.files ?? []));
        event.currentTarget.value = "";
        preserveAdminScroll();
    };

    const startCreate = () => {
        setSelectedId(null);
        setForm(initialForm);
        setAvatarImage(null);
        setGalleryImages([]);
        setMessage("");
        setError("");
        router.push("/admin/partner?mode=create");
    };

    const closeForm = () => {
        setSelectedId(null);
        setForm(initialForm);
        setAvatarImage(null);
        setGalleryImages([]);
        setError("");
        router.push("/admin/partner");
    };

    const editPartner = (partner: PartnerDto) => {
        setSelectedId(partner.id);
        setForm({
            name: partner.name,
            address: partner.address,
            phoneNumber: partner.phoneNumber ?? "",
            description: partner.description ?? "",
        });
        setAvatarImage(null);
        setGalleryImages([]);
        setMessage("");
        setError("");
        router.push("/admin/partner?mode=edit");
    };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.name.trim() || !form.address.trim()) {
            showError("Vui lòng nhập tên và địa chỉ đối tác.");
            return;
        }

        setIsSubmitting(true);
        setMessage("");
        setError("");

        try {
            const payload = {
                name: form.name.trim(),
                address: form.address.trim(),
                phoneNumber: form.phoneNumber.trim() || undefined,
                description: form.description.trim() || undefined,
                avatarImage: avatarImage ?? undefined,
                galleryImages:
                    galleryImages.length > 0 ? galleryImages : undefined,
            };

            if (selectedId) {
                await updatePartner(selectedId, payload);
                setMessage("Đã cập nhật đối tác.");
            } else {
                await createPartner(payload);
                setMessage("Đã tạo đối tác mới.");
            }
            await mutate();
            closeForm();
        } catch (err) {
            showError(
                err instanceof Error
                    ? err.message
                    : "Không thể lưu đối tác.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

    const confirmDelete = async () => {
        if (deleteTarget === null) return;
        setIsSubmitting(true);
        setMessage("");
        setError("");
        try {
            await deletePartner(deleteTarget);
            await mutate();
            if (selectedId === deleteTarget) closeForm();
            setMessage("Đã xóa đối tác.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể xóa đối tác.",
            );
        } finally {
            setIsSubmitting(false);
            setDeleteTarget(null);
        }
    };

    if (isFormMode) {
        const editingPartner = selectedId
            ? partners.find((p) => p.id === selectedId)
            : null;
        const existingAvatar = editingPartner?.avatarImageUrl ?? null;
        const existingGallery =
            editingPartner?.galleryImages.map((g) => g.imageUrl) ?? [];
        const displayAvatarUrl = avatarPreviewUrl || existingAvatar || "";
        const isExistingAvatar = !avatarPreviewUrl && !!existingAvatar;
        // Newly picked files are previewed instead of the current gallery
        const showsNewGallery = galleryPreviewUrls.length > 0;

        return (
            <div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={closeForm}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-ink transition-colors hover:bg-primary-soft hover:text-primary"
                        aria-label="Quay lại"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-6 w-6"
                            aria-hidden="true"
                        >
                            <path
                                d="M15 5 8 12l7 7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                    <h1 className="text-2xl font-semibold leading-tight text-ink">
                        {formTitle}
                    </h1>
                </div>

                {message ? (
                    <Notice tone="success" className="mt-4">
                        {message}
                    </Notice>
                ) : null}
                {error ? (
                    <Notice ref={errorRef} tone="danger" className="mt-4">
                        {error}
                    </Notice>
                ) : null}

                <form onSubmit={onSubmit} className="mt-4">
                    <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
                        <AdminCard className="min-w-0 space-y-4 p-4 lg:col-span-2">
                            <label className="block">
                                <FieldLabel required>Tên đối tác</FieldLabel>
                                <AdminField
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="VD: Phúc Long Coffee"
                                />
                            </label>

                            <label className="block">
                                <FieldLabel required>Địa chỉ</FieldLabel>
                                <AdminField
                                    value={form.address}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            address: e.target.value,
                                        }))
                                    }
                                    placeholder="VD: 123 Trần Hưng Đạo, Quảng Ngãi"
                                />
                            </label>

                            <label className="block">
                                <FieldLabel>Số điện thoại</FieldLabel>
                                <AdminField
                                    type="tel"
                                    value={form.phoneNumber}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            phoneNumber: e.target.value,
                                        }))
                                    }
                                    placeholder="VD: 0987 654 321"
                                />
                            </label>

                            <label className="block">
                                <FieldLabel>Mô tả</FieldLabel>
                                <AdminTextArea
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="Mô tả ngắn về đối tác..."
                                />
                            </label>
                        </AdminCard>

                        <AdminCard className="mt-4 grid min-w-0 gap-4 p-4 md:grid-cols-2 lg:mt-0 lg:grid-cols-1">
                            <div>
                                <FieldLabel>Ảnh đại diện</FieldLabel>
                                <div className="relative">
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                                        onChange={handleAvatarFileChange}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={openAvatarPicker}
                                        aria-label={
                                            displayAvatarUrl
                                                ? "Đổi ảnh đại diện"
                                                : undefined
                                        }
                                        className="grid min-h-40 w-full place-items-center rounded-lg border border-dashed border-line-strong bg-white p-2 text-center text-ink transition-colors hover:border-primary hover:text-primary"
                                    >
                                        {displayAvatarUrl ? (
                                            <Image
                                                src={displayAvatarUrl}
                                                alt=""
                                                width={400}
                                                height={300}
                                                unoptimized={displayAvatarUrl.startsWith(
                                                    "blob:",
                                                )}
                                                className="h-36 w-full rounded-md object-cover"
                                            />
                                        ) : (
                                            <span className="grid place-items-center gap-1 text-sm font-semibold">
                                                <UploadIcon />
                                                Tải ảnh lên
                                                <small className="text-sm font-normal text-muted">
                                                    JPG, PNG tối đa 2MB
                                                </small>
                                            </span>
                                        )}
                                    </button>
                                    {isExistingAvatar ? (
                                        <span className="pointer-events-none absolute bottom-4 left-4 rounded-sm bg-ink/80 px-2 py-0.5 text-xs font-semibold text-white">
                                            Ảnh hiện tại
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            <div>
                                <FieldLabel>Thư viện ảnh sản phẩm</FieldLabel>
                                <div className="grid grid-cols-3 gap-2 rounded-lg border border-line bg-white p-2">
                                    <input
                                        ref={galleryInputRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                                        multiple
                                        onChange={handleGalleryFileChange}
                                        className="hidden"
                                    />
                                    {(showsNewGallery
                                        ? galleryPreviewUrls
                                        : existingGallery
                                    )
                                        .slice(0, 5)
                                        .map((src, index) => (
                                            <div
                                                key={`${src}-${index}`}
                                                className="relative"
                                            >
                                                <Image
                                                    src={src}
                                                    alt={`${showsNewGallery ? "Ảnh mới" : "Ảnh sản phẩm"} ${index + 1}`}
                                                    width={160}
                                                    height={160}
                                                    unoptimized={src.startsWith("blob:")}
                                                    className="aspect-square w-full rounded-md border border-line object-cover"
                                                />
                                                {showsNewGallery ? (
                                                    <span className="absolute bottom-1 left-1 rounded-sm bg-ink/80 px-1.5 py-0.5 text-xs font-semibold text-white">
                                                        Mới
                                                    </span>
                                                ) : null}
                                            </div>
                                        ))}
                                    <button
                                        type="button"
                                        onClick={openGalleryPicker}
                                        aria-label="Thêm ảnh khác vào thư viện"
                                        className="grid aspect-square place-items-center rounded-md border border-dashed border-line-strong bg-white text-center text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
                                    >
                                        <span className="grid place-items-center gap-1">
                                            <PlusIcon />
                                            Ảnh khác
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </AdminCard>
                    </div>

                    <div className="admin-form-actions mt-6">
                        <AdminPrimaryButton
                            type="button"
                            variant="secondary"
                            onClick={closeForm}
                            className="flex-1 md:flex-none"
                        >
                            Hủy
                        </AdminPrimaryButton>
                        <AdminPrimaryButton
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 md:flex-none"
                        >
                            {isSubmitting ? "Đang lưu..." : "Lưu đối tác"}
                        </AdminPrimaryButton>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <AdminSectionHeader
                title="Quản lý đối tác"
                action={
                    <AdminPrimaryButton type="button" onClick={startCreate}>
                        <PlusIcon />
                        Thêm
                    </AdminPrimaryButton>
                }
            />

            <div className="relative md:w-80">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                >
                    <path
                        d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                </svg>
                <AdminField
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm đối tác..."
                    aria-label="Tìm đối tác"
                    className="pl-10"
                />
            </div>

            {message ? <Notice tone="success">{message}</Notice> : null}
            {error ? <Notice tone="danger">{error}</Notice> : null}

            <section aria-label="Danh sách đối tác" className="space-y-2">
                {visiblePartners.map((partner) => {
                    const meta = [
                        partner.galleryImages.length > 0
                            ? `${partner.galleryImages.length} ảnh`
                            : "",
                        partner.phoneNumber ?? "",
                    ]
                        .filter(Boolean)
                        .join(" · ");
                    return (
                        <AdminCard
                            key={partner.id}
                            className="flex items-center gap-3 p-3 md:gap-4"
                        >
                            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-primary-soft text-primary">
                                {partner.avatarImageUrl ? (
                                    <Image
                                        src={partner.avatarImageUrl}
                                        alt=""
                                        width={112}
                                        height={112}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span
                                        className="text-lg font-semibold"
                                        aria-hidden="true"
                                    >
                                        {getInitials(partner.name)}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="truncate text-base font-semibold text-ink">
                                    {partner.name}
                                </h2>
                                <p className="truncate text-sm text-body">
                                    {partner.address}
                                </p>
                                {meta ? (
                                    <p className="truncate text-sm text-muted">
                                        {meta}
                                    </p>
                                ) : null}
                            </div>
                            <div className="flex shrink-0 flex-col gap-2 md:flex-row">
                                <IconButton
                                    label={`Sửa ${partner.name}`}
                                    onClick={() => editPartner(partner)}
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    label={`Xóa ${partner.name}`}
                                    tone="danger"
                                    onClick={() =>
                                        setDeleteTarget(partner.id)
                                    }
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </div>
                        </AdminCard>
                    );
                })}
                {visiblePartners.length === 0 ? (
                    <AdminEmptyState>
                        {searchTerm.trim() ? (
                            "Không tìm thấy đối tác phù hợp."
                        ) : (
                            <>
                                Chưa có đối tác nào. Nhấn &ldquo;Thêm&rdquo; để
                                tạo đối tác mới.
                            </>
                        )}
                    </AdminEmptyState>
                ) : null}
            </section>

            <ConfirmModal
                open={deleteTarget !== null}
                title="Xóa đối tác?"
                description="Thao tác này không thể hoàn tác."
                danger
                confirmLabel="Xóa"
                loading={isSubmitting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
            <LoadingOverlay open={isSubmitting} message="Đang xử lý..." />
        </div>
    );
}
