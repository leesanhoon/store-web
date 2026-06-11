"use client";

import Image from "next/image";
import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
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

function preserveAdminScroll() {
    const scroller = document.getElementById("admin-main-content");
    const scrollTop = scroller?.scrollTop ?? 0;
    const restore = () => {
        if (scroller) scroller.scrollTop = scrollTop;
    };
    window.requestAnimationFrame(restore);
    window.setTimeout(restore, 120);
    window.setTimeout(restore, 320);
}

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
}

function PlusIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
            />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path
                d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0 0-3l-.5-.5a2.1 2.1 0 0 0-3 0l-10 10L4 20Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function DeleteIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path
                d="M6 7h12M10 11v6M14 11v6M8 7l1 13h6l1-13M10 7V5h4v2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function UploadIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-9 w-9"
            aria-hidden="true"
        >
            <path
                d="M12 16V7m0 0 4 4m-4-4-4 4"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7 18a4 4 0 1 1 .9-7.9A5 5 0 0 1 17.7 11 3.5 3.5 0 1 1 18 18H7Z"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function FieldLabel({
    children,
    required,
}: {
    children: React.ReactNode;
    required?: boolean;
}) {
    return (
        <span className="mb-1.5 block text-[13px] font-extrabold text-[#101a36]">
            {children}{" "}
            {required ? <span className="text-red-500">*</span> : null}
        </span>
    );
}

function IconButton({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#eadfce] bg-white text-[#4c596c] shadow-sm transition active:scale-[0.96]"
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

    const isFormMode = mode === "create" || selectedId !== null;
    const formTitle = selectedId ? "Sửa đối tác" : "Thêm đối tác";

    const visiblePartners = partners.filter((p) => {
        if (!searchTerm.trim()) return true;
        const text = `${p.name} ${p.address} ${p.description ?? ""}`.toLowerCase();
        return text.includes(searchTerm.trim().toLowerCase());
    });

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
            setError("Vui lòng nhập tên và địa chỉ đối tác.");
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
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể lưu đối tác.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (partnerId: number) => {
        if (!window.confirm("Xóa đối tác này?")) return;
        setIsSubmitting(true);
        setMessage("");
        setError("");
        try {
            await deletePartner(partnerId);
            await mutate();
            if (selectedId === partnerId) closeForm();
            setMessage("Đã xóa đối tác.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể xóa đối tác.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isFormMode) {
        const editingPartner = selectedId
            ? partners.find((p) => p.id === selectedId)
            : null;
        const existingAvatar = editingPartner?.avatarImageUrl ?? null;
        const existingGallery =
            editingPartner?.galleryImages.map((g) => g.imageUrl) ?? [];

        return (
            <div className="space-y-3 text-[#101a36]">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={closeForm}
                        className="grid h-10 w-10 place-items-center rounded-full text-[#101a36]"
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
                    <h1 className="text-[21px] font-extrabold leading-tight tracking-tight">
                        {formTitle}
                    </h1>
                </div>

                {message ? (
                    <AdminCard className="border-emerald-200 bg-emerald-50 p-3 text-[13px] font-bold text-emerald-700">
                        {message}
                    </AdminCard>
                ) : null}
                {error ? (
                    <AdminCard className="border-rose-200 bg-rose-50 p-3 text-[13px] font-bold text-rose-700">
                        {error}
                    </AdminCard>
                ) : null}

                <form onSubmit={onSubmit} className="space-y-4">
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

                    <div>
                        <FieldLabel>Ảnh đại diện</FieldLabel>
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
                            className="grid min-h-[136px] w-full place-items-center rounded-[14px] border border-dashed border-[#8a99ad] bg-white/60 p-3 text-center text-[#3d4860] transition active:scale-[0.99]"
                        >
                            {avatarPreviewUrl ? (
                                <Image
                                    src={avatarPreviewUrl}
                                    alt="Ảnh đại diện xem trước"
                                    width={220}
                                    height={180}
                                    unoptimized
                                    className="h-[118px] w-full rounded-xl object-cover"
                                />
                            ) : existingAvatar ? (
                                <Image
                                    src={existingAvatar}
                                    alt="Ảnh đại diện hiện tại"
                                    width={220}
                                    height={180}
                                    className="h-[118px] w-full rounded-xl object-cover"
                                />
                            ) : (
                                <span className="grid place-items-center text-[14px] font-extrabold">
                                    <UploadIcon />
                                    Tải ảnh lên
                                    <small className="mt-1 text-[11px] font-semibold text-slate-500">
                                        JPG, PNG tối đa 2MB
                                    </small>
                                </span>
                            )}
                        </button>
                    </div>

                    <div>
                        <FieldLabel>Thư viện ảnh sản phẩm</FieldLabel>
                        <input
                            ref={galleryInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                            multiple
                            onChange={handleGalleryFileChange}
                            className="hidden"
                        />
                        <div className="grid grid-cols-3 gap-2 rounded-[14px] border border-[#eadfce] bg-white p-2">
                            {(galleryPreviewUrls.length > 0
                                ? galleryPreviewUrls
                                : existingGallery
                            )
                                .slice(0, 5)
                                .map((src, index) => (
                                    <Image
                                        key={`${src}-${index}`}
                                        src={src}
                                        alt="Ảnh sản phẩm"
                                        width={96}
                                        height={86}
                                        unoptimized={src.startsWith("blob:")}
                                        className="h-[68px] w-full rounded-[10px] border border-[#f1e7d8] object-cover"
                                    />
                                ))}
                            <button
                                type="button"
                                onClick={openGalleryPicker}
                                className="grid h-[68px] place-items-center rounded-[10px] border border-dashed border-[#d6c9b8] bg-white text-center text-[12px] font-extrabold text-[#101a36] transition active:scale-[0.98]"
                            >
                                <span>
                                    <span className="block text-2xl leading-none">
                                        +
                                    </span>
                                    Ảnh khác
                                </span>
                            </button>
                        </div>
                    </div>

                    <AdminPrimaryButton
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-full py-3 text-[16px]"
                    >
                        {isSubmitting ? "Đang lưu..." : "Lưu đối tác"}
                    </AdminPrimaryButton>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-3 text-[#101a36]">
            <AdminSectionHeader
                title="Quản lý đối tác"
                action={
                    <AdminPrimaryButton
                        type="button"
                        onClick={startCreate}
                        className="h-10 min-h-10 rounded-[13px] px-3 text-[14px]"
                    >
                        <PlusIcon />
                        Thêm
                    </AdminPrimaryButton>
                }
            />

            <label className="flex h-12 items-center gap-3 rounded-[14px] border border-[#eadfce] bg-white px-3.5 text-slate-400 shadow-sm">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                >
                    <path
                        d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                </svg>
                <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm đối tác..."
                    className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#101a36] outline-none placeholder:text-slate-400"
                />
            </label>

            {message ? (
                <AdminCard className="border-emerald-200 bg-emerald-50 p-3 text-[12px] font-bold text-emerald-700">
                    {message}
                </AdminCard>
            ) : null}
            {error ? (
                <AdminCard className="border-rose-200 bg-rose-50 p-3 text-[12px] font-bold text-rose-700">
                    {error}
                </AdminCard>
            ) : null}

            <section className="space-y-2.5">
                {visiblePartners.map((partner) => (
                    <AdminCard key={partner.id} className="p-3">
                        <div className="grid grid-cols-[64px_1fr_auto] items-center gap-3">
                            <div className="grid h-[60px] w-[60px] place-items-center overflow-hidden rounded-[16px] border border-[rgba(16,26,54,0.06)] bg-gradient-to-br from-[#101a36] to-[#0f766e]">
                                {partner.avatarImageUrl ? (
                                    <Image
                                        src={partner.avatarImageUrl}
                                        alt={partner.name}
                                        width={120}
                                        height={120}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-[18px] font-black text-white">
                                        {getInitials(partner.name)}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h2 className="truncate text-[15px] font-extrabold leading-tight text-[#101a36]">
                                    {partner.name}
                                </h2>
                                <p className="mt-0.5 truncate text-[12px] font-semibold text-[#3d4860]">
                                    {partner.address}
                                </p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                    {partner.galleryImages.length > 0 ? (
                                        <span className="rounded-lg bg-[#f8f0e6] px-2 py-0.5 text-[10px] font-extrabold text-[#3d4860]">
                                            {partner.galleryImages.length} ảnh
                                        </span>
                                    ) : null}
                                    {partner.phoneNumber ? (
                                        <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                                            {partner.phoneNumber}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <IconButton
                                    label="Sửa đối tác"
                                    onClick={() => editPartner(partner)}
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    label="Xóa đối tác"
                                    onClick={() =>
                                        void handleDelete(partner.id)
                                    }
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </div>
                        </div>
                    </AdminCard>
                ))}
                {visiblePartners.length === 0 ? (
                    <AdminEmptyState>
                        Chưa có đối tác nào. Nhấn &ldquo;Thêm&rdquo; để tạo
                        đối tác mới.
                    </AdminEmptyState>
                ) : null}
            </section>
        </div>
    );
}
