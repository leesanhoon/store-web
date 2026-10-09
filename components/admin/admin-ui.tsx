import * as Select from "@radix-ui/react-select";
import { ReactNode } from "react";
import type { OrderStatus } from "@/lib/api/orders";

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
                <h1 className="text-2xl font-semibold leading-tight text-ink">
                    {title}
                </h1>
                {subtitle ? (
                    <p className="mt-1 text-sm text-muted">{subtitle}</p>
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
            aria-pressed={!!active}
            className={`min-h-11 whitespace-nowrap rounded-md border px-4 text-sm font-medium transition-colors md:min-h-10 ${
                active
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-line bg-white text-label hover:border-primary hover:text-primary"
            }`}
        >
            {children}
        </button>
    );
}

const BUTTON_VARIANTS = {
    primary:
        "border-transparent bg-primary text-white enabled:hover:bg-primary-hover enabled:active:bg-primary-active",
    secondary:
        "border-line-strong bg-white text-ink enabled:hover:border-primary enabled:hover:text-primary",
    danger: "border-transparent bg-danger text-white enabled:hover:bg-danger/90",
};

export function AdminPrimaryButton({
    children,
    className = "",
    variant = "primary",
    size = "md",
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    className?: string;
    variant?: keyof typeof BUTTON_VARIANTS;
    size?: "sm" | "md";
}) {
    return (
        <button
            {...props}
            className={`inline-flex items-center justify-center gap-2 rounded-sm border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                size === "sm" ? "min-h-9 px-3 text-sm" : "min-h-11 px-4 text-base"
            } ${BUTTON_VARIANTS[variant]} ${className}`}
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
            className={`rounded-lg border border-line bg-white shadow-sm ${className}`}
        >
            {children}
        </article>
    );
}

// No min-height here: inputs/selects add min-h-11, the textarea min-h-20 (two min-h utilities would conflict)
const fieldClass =
    "w-full rounded-sm border border-line-strong bg-white px-3 py-2 text-base font-normal text-ink transition-colors placeholder:text-muted focus:border-primary disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger";

export function AdminField({
    className = "",
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
    return <input {...props} className={`${fieldClass} min-h-11 ${className}`} />;
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
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
            aria-hidden="true"
        >
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
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
            aria-hidden="true"
        >
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
                className={`${fieldClass} min-h-11 ${className}`}
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
                className={`${fieldClass} flex min-h-11 items-center justify-between gap-3 text-left data-placeholder:text-muted ${className}`}
            >
                <Select.Value placeholder={placeholder} />
                <Select.Icon className="grid h-5 w-5 shrink-0 place-items-center text-body">
                    <ChevronDownIcon />
                </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
                <Select.Content
                    position="popper"
                    sideOffset={6}
                    collisionPadding={12}
                    className="z-[100] max-h-[260px] min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-line bg-white p-1 text-ink shadow-lg"
                >
                    <Select.Viewport className="max-h-[248px] overflow-y-auto">
                        {/* outline-none: the highlight background is the focus indicator */}
                        {options.map((option) => (
                            <Select.Item
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                                className="relative flex min-h-11 cursor-default select-none items-center rounded-sm py-2 pl-9 pr-3 text-sm outline-none data-disabled:pointer-events-none data-disabled:opacity-45 data-highlighted:bg-primary-soft data-highlighted:text-ink md:min-h-10"
                            >
                                <Select.ItemIndicator className="absolute left-3 grid h-4 w-4 place-items-center text-primary">
                                    <CheckIcon />
                                </Select.ItemIndicator>
                                <Select.ItemText>
                                    {option.label}
                                </Select.ItemText>
                            </Select.Item>
                        ))}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
}

export type AdminTone = "neutral" | "success" | "warning" | "info" | "danger";

const TONE_CLASSES: Record<AdminTone, string> = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    info: "bg-blue-50 text-blue-700",
    danger: "bg-danger-soft text-danger",
    neutral: "bg-surface text-label",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, AdminTone> = {
    PendingConfirmation: "warning",
    Confirmed: "info",
    Shipping: "info",
    Completed: "success",
    Cancelled: "neutral",
};

export function AdminStatusBadge({
    tone = "neutral",
    children,
}: {
    tone?: AdminTone;
    children: ReactNode;
}) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-sm border border-current/20 px-2 py-0.5 text-xs font-semibold ${TONE_CLASSES[tone]}`}
        >
            <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
                aria-hidden="true"
            />
            {children}
        </span>
    );
}

export function AdminEmptyState({
    children,
    action,
}: {
    children: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className="rounded-lg border border-dashed border-line bg-white p-6 text-center text-sm text-body">
            {children}
            {action ? (
                <div className="mt-4 flex justify-center">{action}</div>
            ) : null}
        </div>
    );
}
