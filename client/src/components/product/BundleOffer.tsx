// BundleOffer.tsx client/src/components/product/BundleOffer.tsx
// Optional extras to add alongside the current product as a bundle.

// STEP 35 (part 13): Frequently bought together

import { useState } from "react";
import { MdOutlineImageNotSupported } from "react-icons/md";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import type { Product } from "../../types/api";
import { naira } from "../../utils/format";

const BundleOffer = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [picked, setPicked] = useState<string[]>(() =>
    product.bundleProducts.slice(0, 2).map((item) => item._id),
  );

  if (product.bundleProducts.length === 0) return null;

  const chosen = product.bundleProducts.filter((item) =>
    picked.includes(item._id),
  );
  const total =
    product.price + chosen.reduce((sum, item) => sum + item.price, 0);
  const count = chosen.length + 1;

  const toggle = (id: string) => {
    setPicked((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  };

  const addAll = () => {
    const problems = [product, ...chosen]
      .map((item) => addItem(item, { color: item.colors[0]?.name }))
      .flatMap((result) => (result.ok ? [] : [result.message]));

    if (problems.length > 0) {
      showToast({
        type: "error",
        title: "Some items weren't added",
        message: problems.join(" "),
      });
    }
  };

  return (
    <section
      aria-labelledby="bundle-title"
      className="rounded-3xl bg-surface p-6 shadow-card md:p-8"
    >
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold tracking-wider text-primary uppercase">
            Bundle &amp; Save
          </p>
          <h2
            id="bundle-title"
            className="text-2xl leading-8 font-semibold text-ink"
          >
            Frequently Bought Together
          </h2>
        </div>
        <div className="flex items-center gap-4 rounded-2xl bg-panel py-2 pr-2 pl-4">
          <p className="text-right text-sm text-ink-soft">
            Bundle Total ({count} items):
            <span className="block text-lg font-bold text-primary-hover">
              {naira(total)}
            </span>
          </p>
          <button
            type="button"
            onClick={addAll}
            className="h-11 rounded-xl bg-primary px-5 font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Add All {count} to Cart
          </button>
        </div>
      </div>

      <ul className="grid gap-4 md:grid-cols-3">
        {product.bundleProducts.map((item) => (
          <li key={item._id}>
            <div className="flex items-center gap-4 rounded-2xl border border-line bg-panel p-4 transition-colors has-checked:border-primary-light">
              <input
                id={`bundle-${product._id}-${item._id}`}
                type="checkbox"
                checked={picked.includes(item._id)}
                onChange={() => toggle(item._id)}
                className="size-4.5 shrink-0 accent-primary"
              />
              {item.images[0] ? (
                <img
                  src={item.images[0]}
                  alt=""
                  loading="lazy"
                  className="size-16 shrink-0 rounded-xl bg-field object-cover"
                />
              ) : (
                <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-field text-muted">
                  <MdOutlineImageNotSupported size={24} aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0">
                <Link
                  to={`/product/${item.slug}`}
                  className="block truncate font-medium text-ink hover:text-primary"
                >
                  {item.name}
                </Link>
                {item.tagline && (
                  <p className="truncate text-xs text-muted">{item.tagline}</p>
                )}
                <p className="mt-1 font-bold text-ink">{naira(item.price)}</p>
              </div>
              <label
                htmlFor={`bundle-${product._id}-${item._id}`}
                className="sr-only"
              >
                Add {item.name} to the bundle
              </label>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default BundleOffer;
