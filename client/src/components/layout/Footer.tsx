import { Link } from "react-router-dom";
import footerLogo from "../../assets/images`/Containers.png";
import { MdOutlineChat, MdOutlineShare, MdPublic } from "react-icons/md";

// the three link columns. A link with a "badge" shows a small greeen pill next to it
const FooterColums: {
  title: string;
  links: { label: string; to: string; badge?: string }[];
}[] = [
  {
    title: "Shop & Categories",
    links: [
      { label: "Electronics & Gadgets", to: "/shop?category=electronics" },
      { label: "Fashion & Apparel", to: "/shop?category=fashion" },
      { label: "Home & Living", to: "/shop?category=living" },
      { label: "Beauty & Personal Care", to: "/shop?category=beauty" },
      { label: "Daily Flash Deals", to: "/#Flash-sale" },
    ],
  },

  {
    title: "customer Care",
    links: [
      { label: "Track Your Order", to: "/account/orders" },
      { label: "Shipping & Delivery", to: "/help/shipping" },
      { label: "Easy 7-Day Returns", to: "/help/returns" },
      { label: "FAQs & Help Desk", to: "/help/faqs" },
      { label: "Buyer protection policy", to: "/help/buyer-protection" },
    ],
  },

  {
    title: "Company & Legal",
    links: [
      { label: "About QuickCart", to: "/about" },
      { label: "Careers", to: "/careers" },
      { label: "Terms & Services", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Merchant Partners", to: "/cookies" },
    ],
  },
];

// look for the round social button under the brand text
const SocialClasses =
  "flex size-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20";

const paymentMethods = [
  "Mastercard",
  "Visa",
  "Verve",
  "Paystack",
  "FlutterWave",
  "BankTransfer",
];

// The current year of the copyright line
const currentYear = new Date().getFullYear();

const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-footer text-white print:hidden">
      <div className="mx-auto max-w-368 px-4 pt-12 pb-6 md:px-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[513px_repeat(3,minmax(0,1fr))] lg:gap-x-10.25 lg:gap-y-0">
          <section aria-label="About QuickCart">
            <Link to="/" className="mb-4" aria-label="QuickCart home">
              <img src={footerLogo} alt="" />
            </Link>

            <p>
              Everyday essentials, delivered in 30 minutes across Lagos, Abuja,
              and Port Harcourt. Authenticity guaranteed, effortless ordering.
            </p>

            <ul className="mt-4 flex items-center gap-4">
              <li>
                <button
                  type="button"
                  aria-label="share-QuickCart"
                  className={SocialClasses}
                >
                  <MdOutlineShare
                    size={16}
                    aria-hidden="true"
                    className="-translate-y-px"
                  />
                </button>
              </li>

              <li>
                <a
                  href="mailto:help@quickcart.ng"
                  aria-label="EmailOur Help Desk"
                  className={SocialClasses}
                >
                  <MdOutlineChat
                    size={16}
                    aria-hidden="true"
                    className="-translate-y-px"
                  />
                </a>
              </li>

              <li>
                <Link
                  to="/about"
                  aria-label="About QuickCart"
                  className={SocialClasses}
                >
                  <MdPublic
                    size={16}
                    aria-hidden="true"
                    className="-translate-y-px"
                  />
                </Link>
              </li>
            </ul>
          </section>

          {FooterColums.map((column) => (
            <section key={column.title} aria-label={column.title}>
              <h2 className="mb-3.5 text-xs leading-4 font-bold tracking-wide uppercase">
                {column.title}
              </h2>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-white/80 text-[13px] leading-4.5 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>

                    {link.badge && (
                      <span className="rounded-full bg-success text-[10px] leading-4 px-2 font-medium text-white">
                        {link.badge}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Bottom bar: payment methods, country and copyright */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/5 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center">
            <p>Secure Payments:</p>

            <ul className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => {
                return (
                  <li
                    key={method}
                    className="rounded-md bg-white/10 px-2.5 pt-0.75 pb-1.25 font-mono text-[11px] leading-4 text-white"
                  >
                    {method}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <p className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs leading-4 font-semibold">
              <span
                className="size-2 rounded-full bg-[#34d399]"
                aria-hidden
              ></span>
              Nigeria (NGN ₦)
            </p>

            <p>
              © {currentYear} QuickCart. Powered by Techstudio Academy. All
              rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
