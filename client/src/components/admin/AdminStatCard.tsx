import type { ReactNode } from "react";
import type { IconType } from "react-icons";

type AdminStatCardProps = {
  label: string;
  value: string | number;
  icon: IconType;
  danger?: boolean;
  note?: ReactNode;
};

const AdminStatCard = ({
  label,
  value,
  icon: Icon,
  danger = false,
  note,
}: AdminStatCardProps) => (
  <div className="rounded-2xl bg-surface p-5 shadow-card">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        <p className="mt-1 text-3xl font-bold text-ink">{value}</p>
      </div>
      <Icon
        size={24}
        aria-hidden="true"
        className={danger ? "text-danger" : "text-primary"}
      />
    </div>
    {note !== undefined && note !== false && (
      <div className="mt-3 text-sm text-ink-soft">{note}</div>
    )}
  </div>
);

export default AdminStatCard;
