import { Link } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import type { ProductsResponse } from "../../types/api";
import ProductCard from "../product/ProductCard";
import SectionHeader from "../common/SectionHeader";

const FeaturedProducts = () => {
  const { data, error, loading, reload } =
    useApi<ProductsResponse>("/products?tag=featured&limit=8");
  const products = data?.products ?? [];

  return (
    <section aria-labelledby="featured-products-title">
      <SectionHeader
        eyebrow="Handpicked for you"
        title="Featured products"
        titleId="featured-products-title"
      >
        <Link
          to="/shop"
          className="text-sm font-semibold text-primary-hover hover:underline"
        >
          View all
        </Link>
      </SectionHeader>

      {error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-danger-light p-4 text-sm text-danger"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={reload}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <ul
          aria-label="Loading featured products"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <li
              key={index}
              aria-hidden="true"
              className="aspect-[3/4] animate-pulse rounded-3xl bg-surface shadow-card"
            />
          ))}
        </ul>
      ) : products.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product._id} className="min-w-0">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl bg-surface p-6 text-center text-sm text-muted">
          Featured products will appear here soon.
        </p>
      )}
    </section>
  );
};

export default FeaturedProducts;
