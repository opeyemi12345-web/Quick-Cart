// RecentlyViewed.tsx client/src/components/home/RecentlyViewed.tsx
// Show products the shopper has recently opened, persisted in browser localStorage.

import { useState } from "react";
import { MdHistory } from "react-icons/md";
import { getRecentlyViewed } from "../../utils/recentlyViewed";
import SectionHeader from "../common/SectionHeader";
import ProductCard from "../product/ProductCard";

const RecentlyViewed = ({ excludeId }: { excludeId?: string }) => {
  const [products] = useState(getRecentlyViewed);
  const visibleProducts = products
    .filter((product) => product._id !== excludeId)
    .slice(0, 4);

  if (visibleProducts.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-title">
      <SectionHeader
        eyebrow="Pick up where you left off"
        eyebrowIcon={MdHistory}
        title="Recently Viewed"
        titleId="recently-viewed-title"
      />
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {visibleProducts.map((product) => (
          <li key={product._id} className="flex">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RecentlyViewed;