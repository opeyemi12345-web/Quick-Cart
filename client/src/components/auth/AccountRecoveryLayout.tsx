import { Link } from "react-router-dom";
import { MdDevices, MdLockOutline, MdShield, MdTimer } from "react-icons/md";

type AccountRecoveryLayoutProps = {
  title: string;
  text: string;
  children: React.ReactNode;
};

const AccountRecoveryLayout = ({
  title,
  text,
  children,
}: AccountRecoveryLayoutProps) => (
  <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-field px-4 py-6 md:px-8 md:py-10">
    <div
      aria-hidden="true"
      className="absolute -top-20 -left-20 size-96 rounded-full bg-primary/10 blur-3xl"
    />
    <div
      aria-hidden="true"
      className="absolute -right-20 -bottom-20 size-96 rounded-full bg-mint/30 blur-3xl"
    />
    <div className="relative mx-auto grid w-full max-w-[1500px] overflow-hidden rounded-3xl bg-surface shadow-lift lg:min-h-[520px] lg:grid-cols-[0.8fr_1fr]">
      <aside className="flex flex-col justify-between gap-10 bg-linear-to-br from-primary-hover to-primary p-8 text-white md:p-10 lg:p-11">
        <Link to="/" aria-label="QuickCart home" className="flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15">
            <MdShield size={28} aria-hidden="true" />
          </span>
          <span className="flex flex-col">
            <span className="text-xs font-bold tracking-wide text-white/75 uppercase">
              Security Protocol
            </span>
            <span className="text-xl leading-7 font-bold">QuickCart Shield</span>
          </span>
        </Link>
        <div>
          <h2 className="text-3xl leading-tight font-bold lg:text-4xl">{title}</h2>
          <p className="mt-4 max-w-150 leading-7 text-white/80">{text}</p>
        </div>
        <ul className="flex flex-col gap-4 rounded-2xl bg-white/10 p-5 text-sm font-semibold md:p-6">
          <li className="flex items-center gap-3">
            <MdTimer size={22} aria-hidden="true" className="shrink-0 text-mint" />
            <span>15-minute validity window</span>
          </li>
          <li className="flex items-center gap-3">
            <MdLockOutline size={22} aria-hidden="true" className="shrink-0 text-mint" />
            <span>Zero credentials stored in plain text</span>
          </li>
          <li className="flex items-center gap-3">
            <MdDevices size={22} aria-hidden="true" className="shrink-0 text-mint" />
            <span>Revokes sessions on all other devices</span>
          </li>
        </ul>
      </aside>
      <div className="p-6 md:p-10 lg:p-11">{children}</div>
    </div>
  </div>
);

export default AccountRecoveryLayout;
