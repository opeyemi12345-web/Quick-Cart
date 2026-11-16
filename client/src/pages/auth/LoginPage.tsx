// LoginPage.tsx client/src/pages/auth/LoginPage.tsx
// "Welcome back": email, password, "Remember me for 30 days", Log In.

// STEP 31 (part 5): The login page

import { useState, type FormEvent } from "react";
import {
  MdLogin,
  MdOutlineHeadsetMic,
  MdOutlineLocalMall,
  MdOutlineLocalShipping,
  MdOutlineMail,
  MdOutlineVerifiedUser,
} from "react-icons/md";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  type Location,
} from "react-router-dom";
import CheckBox from "../../components/form/CheckBox";
import PasswordInput from "../../components/form/PasswordInput";
import TextInput from "../../components/form/TextInput";
import { useAuth } from "../../context/AuthContext";

const EMAIL_RULE = /^\S+@\S+\.\S+$/;

const perks = [
  {
    title: "Swift Delivery",
    text: "Real-time status tracking for every parcel.",
    icon: MdOutlineLocalShipping,
  },
  {
    title: "Buyer Guarantee",
    text: "Hassle-free 30-day return policy.",
    icon: MdOutlineVerifiedUser,
  },
  {
    title: "24/7 Concierge",
    text: "Instant help with cart & order updates.",
    icon: MdOutlineHeadsetMic,
  },
];

const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: Location } | null)?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user && !submitting) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const found: typeof errors = {};
    if (!EMAIL_RULE.test(email.trim())) {
      found.email = "Please enter a valid email address.";
    }
    if (!password) found.password = "Please enter your password.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setServerError("");
    setSubmitting(true);
    try {
      const loggedIn = await login(email.trim(), password, rememberMe);
      navigate(
        from === "/" && loggedIn.role === "admin" ? "/admin" : from,
        { replace: true },
      );
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Unable to log in. Try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-360 px-4 py-12 md:px-12 md:py-20">
      <div className="mx-auto max-w-120 rounded-3xl bg-surface p-8 shadow-lift md:p-11">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-5 flex size-15 items-center justify-center rounded-2xl bg-primary-hover text-white">
            <MdOutlineLocalMall size={28} aria-hidden="true" />
          </span>
          <h1 className="text-2xl leading-8 font-bold text-ink">
            Welcome back
          </h1>
          <p className="mt-1 text-[15px] leading-5.5 text-ink-soft">
            Sign in to continue shopping and manage your orders.
          </p>
        </div>

        {serverError && (
          <p
            role="alert"
            className="mb-5 rounded-xl bg-danger-light px-4 py-3 text-sm text-danger"
          >
            {serverError}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <TextInput
            label="Email Address"
            type="email"
            autoComplete="email"
            icon={MdOutlineMail}
            placeholder="ada.obi@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: undefined }));
            }}
            error={errors.email}
          />

          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined }));
            }}
            error={errors.password}
            labelAction={
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary-hover hover:underline"
              >
                Forgot password?
              </Link>
            }
          />

          <CheckBox
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          >
            Remember me for 30 days
          </CheckBox>

          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-hover text-base font-semibold text-white transition-colors hover:bg-primary disabled:opacity-60"
          >
            <MdLogin size={20} aria-hidden="true" />
            {submitting ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="mt-8 text-center text-[15px] text-ink-soft">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            state={location.state}
            className="font-semibold text-primary-hover hover:underline"
          >
            Create account
          </Link>
        </p>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wide text-muted">
          <MdOutlineVerifiedUser
            size={14}
            aria-hidden="true"
            className="text-success"
          />
          256-bit SSL encrypted &amp; secure connection
        </p>
      </div>

      <ul className="mx-auto mt-12 grid max-w-240 gap-6 md:grid-cols-3">
        {perks.map((perk) => (
          <li
            key={perk.title}
            className="flex items-center gap-4 rounded-2xl bg-surface p-5 shadow-card"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-field text-primary">
              <perk.icon size={24} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg leading-6 font-semibold text-ink">
                {perk.title}
              </h2>
              <p className="text-sm leading-5 text-ink-soft">{perk.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LoginPage;
