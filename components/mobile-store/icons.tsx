import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function SvgIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3.5 10.8 12 4l8.5 6.8" />
      <path d="M5.5 10.2V20h13v-9.8" />
      <path d="M9.5 20v-5h5v5" />
    </SvgIcon>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1.6" />
      <rect x="14" y="4" width="6" height="6" rx="1.6" />
      <rect x="4" y="14" width="6" height="6" rx="1.6" />
      <rect x="14" y="14" width="6" height="6" rx="1.6" />
    </SvgIcon>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M7 3.8h7l3 3V20H7z" />
      <path d="M14 3.8V7h3" />
      <path d="M9.5 11h5" />
      <path d="M9.5 15h5" />
    </SvgIcon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M8 3.5v4" />
      <path d="M16 3.5v4" />
      <path d="M4 10h16" />
    </SvgIcon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </SvgIcon>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 5h2l1.5 9h8.4l1.4-6.2H8" />
      <circle cx="10" cy="19" r="1.4" />
      <circle cx="17" cy="19" r="1.4" />
    </SvgIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="10.7" cy="10.7" r="6" />
      <path d="m15.2 15.2 4 4" />
    </SvgIcon>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m15 5-7 7 7 7" />
    </SvgIcon>
  );
}

export function CupIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M7 4h10l-1.2 16H8.2z" />
      <path d="M8 8h8" />
    </SvgIcon>
  );
}

export function LidIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 15.5h14" />
      <path d="M7 12.5c1.1-2 2.7-3 5-3s3.9 1 5 3" />
      <path d="M8 17.5h8" />
    </SvgIcon>
  );
}

export function BadgeLogoIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M9.3 14.8 12 7.8l2.7 7" />
      <path d="M10.2 12.8h3.6" />
    </SvgIcon>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 15V5" />
      <path d="m8 9 4-4 4 4" />
      <path d="M5 15v3.5h14V15" />
    </SvgIcon>
  );
}

export function CloudIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M7.8 17.5H17a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.5 1.8A3.2 3.2 0 0 0 7.8 17.5Z" />
      <path d="M12 15.5v-6" />
      <path d="m9.8 11.7 2.2-2.2 2.2 2.2" />
    </SvgIcon>
  );
}
