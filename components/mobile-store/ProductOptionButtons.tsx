"use client";

import { useCartConfigurator } from "@/components/cart/CartConfiguratorProvider";
import { ChevronRightIcon } from "@/components/mobile-store/icons";

type Props = {
  productId: number;
  name: string;
  price: number;
  categoryName: string;
  imageSrc?: string | null;
};

const optionButtons = [
  { title: "Loại in", hint: "Không in, In 1 màu, In nhiều màu" },
  { title: "Nắp đi kèm", hint: "Không nắp, Nắp bằng, Nắp cầu" },
];

export default function ProductOptionButtons({ productId, name, price, categoryName, imageSrc }: Props) {
  const { openConfigurator } = useCartConfigurator();

  const open = () => openConfigurator({ productId, name, price, categoryName, imageSrc });

  return (
    <div className="detail-option-panel">
      {optionButtons.map((option) => (
        <button key={option.title} type="button" onClick={open}>
          <span>
            <strong>{option.title}</strong>
            <em>{option.hint}</em>
          </span>
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      ))}
    </div>
  );
}
