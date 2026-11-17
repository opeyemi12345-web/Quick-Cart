import { Link } from "react-router-dom";
import logo from "../../assets/images`/Link.png";

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
  <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-field px-4 py-10 md:py-16">
    <div
      aria-hidden="true"
      className="absolute -top-20 -left-20 size-96 rounded-full bg-primary/10 blur-3xl"
    />
    <div
      aria-hidden="true"
      className="absolute -right-20 -bottom-20 size-96 rounded-full bg-mint/30 blur-3xl"
    />
    <div className="relative mx-auto grid max-w-220 overflow-hidden rounded-3xl bg-surface shadow-lift md:grid-cols-2">
      <aside className="flex flex-col justify-between bg-linear-to-br from-footer to-primary p-8 text-white md:p-10">
        <Link to="/" aria-label="QuickCart home">
          <img src={logo} alt="QuickCart" className="h-10 w-auto" />
        </Link>
        <div className="py-12">
          <h2 className="text-3xl leading-tight font-bold">{title}</h2>
          <p className="mt-4 leading-7 text-white/80">{text}</p>
        </div>
        <p className="text-sm text-white/70">Secure account recovery</p>
      </aside>
      <div className="p-6 md:p-10">{children}</div>
    </div>
  </div>
);

export default AccountRecoveryLayout;
