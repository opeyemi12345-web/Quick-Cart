import { MdOutlineLocalOffer } from "react-icons/md";
import type { Product } from "../../types/api";
import ProductCard from "./ProductCard";

const BundleOffer = ({ product }: { product: Product }) => {
  if (product.bundleProducts.length === 0) return null;

  return (
    <section aria-labelledby="bundle-offer-title">
      <div className="mb-4 flex items-center gap-2">
        <MdOutlineLocalOffer
          size={20}
          aria-hidden="true"
          className="text-primary"
        />
        <h2
          id="bundle-offer-title"
          className="text-2xl font-bold tracking-tight text-ink"
        >
          Frequently Bought Together
        </h2>
      </div>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {product.bundleProducts.map((bundledProduct) => (
          <li key={bundledProduct._id} className="flex">
            <ProductCard product={bundledProduct} />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default BundleOffer;
