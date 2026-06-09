import Link from "next/link";
import type { ProductDto } from "@/lib/api/products";

type Partner = {
  id: string;
  name: string;
  mark: string;
  specialty: string;
};

const partners: Partner[] = [
  { id: "urban-roast", name: "Urban Roast", mark: "UR", specialty: "Chuoi cafe take-away" },
  { id: "daily-bean", name: "Daily Bean", mark: "DB", specialty: "Coffee kiosk" },
  { id: "milk-lab", name: "Milk Lab", mark: "ML", specialty: "Tra sua va dessert" },
  { id: "brew-corner", name: "Brew Corner", mark: "BC", specialty: "Quan specialty coffee" },
];

type Props = {
  products: ProductDto[];
};

export default function PartnersSection({ products }: Props) {
  const previewProducts = products.slice(0, 3);

  return (
    <section className="mobile-section">
      <div className="mobile-section-heading">
        <h2>Doi tac noi tieng</h2>
        <Link href="/products">Xem san pham</Link>
      </div>

      <div className="partners-grid" aria-label="Doi tac noi bat">
        {partners.map((partner) => (
          <article key={partner.id} className="partner-card">
            <div className="partner-mark" aria-hidden="true">
              {partner.mark}
            </div>
            <div>
              <h3>{partner.name}</h3>
              <p>{partner.specialty}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="partner-products-panel">
        <div className="partner-products-copy">
          <strong>Goi y san pham cho doi tac F&B</strong>
          <p>Danh sach nay dang lay truc tiep tu backend, uu tien cac mau ly de cac quan co the dat nhanh.</p>
        </div>
        {previewProducts.length === 0 ? (
          <p className="mobile-alert">Chua co san pham nao.</p>
        ) : (
          <div className="partner-product-tags">
            {previewProducts.map((product) => (
              <span key={product.id}>{product.name}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
