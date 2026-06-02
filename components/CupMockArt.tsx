import Image from "next/image";

type Props = {
    src: string;
    label: string;
};

export default function CupMockArt({ src, label }: Props) {
    return (
        <div className="overflow-hidden rounded-3xl border border-[#e6e0d8] bg-white shadow-soft">
            <div className="relative aspect-[4/5] bg-[#fbfaf7]">
                <Image
                    src={src}
                    alt={label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 25vw"
                />
            </div>
            <div className="border-t border-[#eee7de] px-4 py-3">
                <p className="text-sm font-semibold text-header">{label}</p>
            </div>
        </div>
    );
}
