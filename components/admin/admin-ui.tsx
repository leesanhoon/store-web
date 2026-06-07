import * as Select from "@radix-ui/react-select";
import { ReactNode } from "react";

export function adminFormatMoney(value: number) {
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)} đ`;
}

export function AdminSectionHeader({
    title,
    action,
    subtitle,
}: {
    title: string;
    subtitle?: string;
    action?: ReactNode;
}) {
    return (
        <section className="flex items-center justify-between gap-4">
            <div className="min-w-0">
                <h1 className="text-[21px] font-extrabold leading-tight tracking-tight text-[#0b1b3b]">
                    {title}
                </h1>
                {subtitle ? (
                    <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">
                        {subtitle}
                    </p>
                ) : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
        </section>
    );
}

export function AdminChip({
    active,
    children,
    onClick,
}: {
    active?: boolean;
    children: ReactNode;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-9 whitespace-nowrap rounded-full px-4 text-[13px] font-bold transition active:scale-[0.98] ${
                active
                    ? "bg-[#061b3d] text-white shadow-[0_14px_30px_-20px_rgba(6,27,61,0.9)]"
                    : "border border-[#eadfce] bg-white text-[#1f2f46] shadow-sm"
            }`}
        >
            {children}
        </button>
    );
}

export function AdminPrimaryButton({
    children,
    className = "",
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
    return (
        <button
            {...props}
            className={`inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-[#061b3d] px-4 py-2.5 text-[15px] font-extrabold text-white shadow-[0_18px_30px_-22px_rgba(6,27,61,0.9)] transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        >
            {children}
        </button>
    );
}

export function AdminCard({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <article
            className={`rounded-[18px] border border-[#eadfce] bg-white shadow-[0_18px_30px_-28px_rgba(15,23,42,0.3)] ${className}`}
        >
            {children}
        </article>
    );
}

const fieldClass =
    "w-full rounded-[13px] border border-[#eadfce] bg-white px-3.5 py-2.5 text-[14px] font-semibold text-[#0b1b3b] outline-none placeholder:text-slate-400 focus:border-[#0b1b3b] focus:ring-2 focus:ring-[#0b1b3b]/10";

export function AdminField({
    className = "",
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
    return <input {...props} className={`${fieldClass} ${className}`} />;
}

export function AdminTextArea({
    className = "",
    ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }) {
    return (
        <textarea
            {...props}
            className={`${fieldClass} min-h-20 resize-none ${className}`}
        />
    );
}

export type AdminSelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
};

type AdminSelectProps = {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    options?: AdminSelectOption[];
    className?: string;
    disabled?: boolean;
    name?: string;
    children?: ReactNode;
    onChange?: React.ChangeEventHandler<HTMLSelectElement>;
};

function ChevronDownIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
                d="m5 12 4 4 10-10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function AdminSelect({
    value,
    defaultValue,
    onValueChange,
    placeholder = "Chọn",
    options,
    className = "",
    disabled,
    name,
    children,
    onChange,
}: AdminSelectProps) {
    if (!options || !onValueChange) {
        return (
            <select
                value={value}
                defaultValue={defaultValue}
                disabled={disabled}
                name={name}
                onChange={onChange}
                className={`${fieldClass} appearance-none ${className}`}
            >
                {children}
            </select>
        );
    }

    return (
        <Select.Root
            value={value || undefined}
            defaultValue={defaultValue}
            onValueChange={onValueChange}
            disabled={disabled}
            name={name}
        >
            <Select.Trigger
                className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[13px] border border-[#eadfce] bg-white px-3.5 py-2.5 text-left text-[14px] font-semibold text-[#0b1b3b] outline-none transition data-[placeholder]:text-slate-400 focus:border-[#0b1b3b] focus:ring-2 focus:ring-[#0b1b3b]/10 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
            >
                <Select.Value placeholder={placeholder} />
                <Select.Icon className="grid h-5 w-5 shrink-0 place-items-center text-[#4c596c]">
                    <ChevronDownIcon />
                </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
                <Select.Content
                    position="popper"
                    sideOffset={6}
                    collisionPadding={12}
                    className="z-[100] max-h-[260px] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[16px] border border-[#eadfce] bg-white p-1.5 text-[#0b1b3b] shadow-[0_20px_45px_-24px_rgba(15,23,42,0.45)]"
                >
                    <Select.Viewport className="max-h-[248px] overflow-y-auto">
                        {options.map((option) => (
                            <Select.Item
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                                className="relative flex min-h-10 cursor-default select-none items-center rounded-[11px] py-2 pl-9 pr-3 text-[14px] font-semibold outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-[#061b3d] data-[highlighted]:text-white"
                            >
                                <Select.ItemIndicator className="absolute left-3 grid h-4 w-4 place-items-center text-emerald-600 data-[highlighted]:text-white">
                                    <CheckIcon />
                                </Select.ItemIndicator>
                                <Select.ItemText>{option.label}</Select.ItemText>
                            </Select.Item>
                        ))}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
}

export function AdminStatusBadge({
    tone = "neutral",
    children,
}: {
    tone?: "neutral" | "success" | "warning" | "info" | "danger";
    children: ReactNode;
}) {
    const classes =
        tone === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : tone === "warning"
              ? "border-orange-200 bg-orange-50 text-orange-600"
              : tone === "info"
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : tone === "danger"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-slate-50 text-slate-600";

    return (
        <span
            className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-extrabold ${classes}`}
        >
            {children}
        </span>
    );
}

export function AdminEmptyState({ children }: { children: ReactNode }) {
    return (
        <div className="rounded-[18px] border border-dashed border-[#eadfce] bg-white/80 p-4 text-center text-[13px] font-semibold text-slate-500">
            {children}
        </div>
    );
}
