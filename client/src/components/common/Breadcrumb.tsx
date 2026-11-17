import { MdChevronRight } from "react-icons/md";
import { Link } from "react-router-dom";

type BreadcrumbItem = { label: string; to?: string };

const Breadcrumb = ({ items }: { items: BreadcrumbItem[] }) => (
  <nav aria-label="Breadcrumb" className="mb-5">
    <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
      {items.map((item, index) => {
        const current = index === items.length - 1;
        return (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && <MdChevronRight size={16} aria-hidden="true" />}
            {item.to && !current ? (
              <Link to={item.to} className="hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={current ? "page" : undefined}
                className={current ? "font-medium text-ink" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);

export default Breadcrumb;
