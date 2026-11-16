// TodaysDeal.tsx client/src/components/home/TodaysDeal.tsx
// "24-HOUR EXCLUSIVES / Today's Deals": a horizontally scrolling row of deal products.

// STEP 33 (part 5): Today's deals

import { useRef } from "react";
import {
  MdChevronLeft,
  MdChevronRight,
  MdOutlineLocalOffer,
} from "react-icons/md";
import { useApi } from "../../hooks/useApi";
import type { ProductsResponse } from "../../types/api";
import { naira } from "../../utils/format";
import SectionHeader from "../common/SectionHeader";
import ProductCard from "../product/ProductCard";

const arrowClasses =
  "flex size-10 items-center justify-center rounded-full bg-surface text-ink shadow-card transition-colors hover:bg-field disabled:opacity-40";

const TodaysDeal = () => {
  const { data, error, loading } = useApi<ProductsResponse>(
    "/products?tag=deal&limit=8",
  );
  const rowRef = useRef<HTMLUListElement>(null);

  if (error || (!loading && !data?.products.length)) return null;

  const scrollBy = (direction: 1 | -1) => {
    rowRef.current?.scrollBy({ left: direction * 300, behavior: "smooth" });
  };

  return (
    <section aria-labelledby="deals-title">
      <SectionHeader
        eyebrow="24-hour exclusives"
        eyebrowIcon={MdOutlineLocalOffer}
        title="Today's Deals"
        titleId="deals-title"
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Previous deals"
            className={arrowClasses}
          >
            <MdChevronLeft size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="More deals"
            className={arrowClasses}
          >
            <MdChevronRight size={22} aria-hidden="true" />
          </button>
        </div>
      </SectionHeader>

      <ul
        ref={rowRef}
        className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pt-1 pb-4 md:mx-0 md:px-0"
      >
        {loading
          ? Array.from({ length: 4 }, (_, index) => (
              <li
                key={index}
                aria-hidden="true"
                className="h-105 w-70 shrink-0 animate-pulse rounded-3xl bg-surface shadow-card"
              />
            ))
          : data?.products.map((product) => (
              <li key={product._id} className="flex w-70 shrink-0 snap-start">
                <ProductCard
                  product={product}
                  badge={
                    product.oldPrice
                      ? {
                          label: `Save ${naira(product.oldPrice - product.price)}`,
                          className:
                            product.oldPrice - product.price >= 10000
                              ? "bg-danger text-white"
                              : "bg-success text-white",
                        }
                      : undefined
                  }
                  details={
                    <p className="text-[13px] text-muted">
                      {product.tagline ?? product.brand}
                    </p>
                  }
                />
              </li>
            ))}
      </ul>
    </section>
  );
};

export default TodaysDeal;
