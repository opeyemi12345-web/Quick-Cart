// Pagination.tsx client/src/components/common/Pagination.tsx
// Page controls for Shop, order history and admin tables.
//   <Pagination page={2} pages={7} onChange={(page) => ...} />

// STEP 34 (part 1): Pagination

import { MdChevronLeft, MdChevronRight } from "react-icons/md";

type PaginationProps = {
  page: number;
  pages: number;
  onChange: (page: number) => void;
};

const pagesToShow = (page: number, pages: number): (number | "…")[] => {
  const wanted = new Set(
    [1, pages, page - 1, page, page + 1].filter(
      (number) => number >= 1 && number <= pages,
    ),
  );
  const sorted = [...wanted].sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  sorted.forEach((number, index) => {
    if (index > 0 && number - sorted[index - 1] > 1) result.push("…");
    result.push(number);
  });
  return result;
};

const buttonClasses =
  "flex size-10 items-center justify-center rounded-xl bg-surface text-sm font-medium text-ink shadow-card transition-colors hover:bg-field disabled:cursor-not-allowed disabled:opacity-40";

const Pagination = ({ page, pages, onChange }: PaginationProps) => {
  if (pages <= 1) return null;

  return (
    <nav aria-label="Pages" className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={buttonClasses}
      >
        <MdChevronLeft size={20} aria-hidden="true" />
      </button>

      {pagesToShow(page, pages).map((item, index) =>
        item === "…" ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="px-1 text-muted"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Page ${item}`}
            className={
              item === page
                ? `${buttonClasses} bg-primary! text-white hover:bg-primary-hover!`
                : buttonClasses
            }
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        aria-label="Next page"
        className={buttonClasses}
      >
        <MdChevronRight size={20} aria-hidden="true" />
      </button>
    </nav>
  );
};

export default Pagination;
