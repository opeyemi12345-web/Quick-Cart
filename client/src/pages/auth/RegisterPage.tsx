// RegisterPage.tsx client/src/pages/auth/RegisterPage.tsx
// Create an account with live email availability, phone and password validation.

// STEP 31 (part 6): The register page

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  MdAlternateEmail,
  MdArrowForward,
  MdCheckCircleOutline,
  MdLockReset,
  MdOutlineLocalShipping,
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
import PasswordStrength from "../../components/form/PasswordStrength";
import TextInput from "../../components/form/TextInput";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../utils/api";
import { isPasswordValid } from "../../utils/password";

const EMAIL_RULE = /^\S+@\S+\.\S+$/;

const toInternational = (phone: string) =>
  `+234${phone.replace(/\D/g, "").replace(/^0/, "")}`;
const isPhoneValid = (phone: string) =>
  /^\d{10}$/.test(phone.replace(/\D/g, "").replace(/^0/, ""));

type FieldName =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "password"
  | "confirmPassword"
  | "agreeToTerms";
type Errors = Partial<Record<FieldName, string>>;

const RegisterPage = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: Location } | null)?.from?.pathname ?? "/";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailCheck, setEmailCheck] = useState<{
    email: string;
    available: boolean;
  } | null>(null);
  const email = form.email.trim().toLowerCase();

  useEffect(() => {
    if (!EMAIL_RULE.test(email)) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      void api<{ available: boolean }>(
        `/auth/check-email?email=${encodeURIComponent(email)}`,
        { signal: controller.signal },
      )
        .then(({ available }) => setEmailCheck({ email, available }))
        .catch(() => {
          // Registration still checks email uniqueness if this optional check fails.
        });
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [email]);

  const emailAvailable =
    emailCheck?.email === email ? emailCheck.available : undefined;

  if (user && !submitting) {
    return <Navigate to={from} replace />;
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validate = () => {
    const found: Errors = {};
    if (!form.firstName.trim()) found.firstName = "First name is required.";
    if (!form.lastName.trim()) found.lastName = "Last name is required.";
    if (!EMAIL_RULE.test(email)) {
      found.email = "Please enter a valid email address.";
    } else if (emailAvailable === false) {
      found.email = "This email already has an account. Log in instead?";
    }
    if (!isPhoneValid(form.phone)) {
      found.phone = "Enter a Nigerian mobile number, e.g. 0803 123 4567.";
    }
    if (!isPasswordValid(form.password)) {
      found.password =
        "Your password needs at least 8 characters, an uppercase letter and a number.";
    }
    if (form.confirmPassword !== form.password) {
      found.confirmPassword = "Passwords do not match.";
    }
    if (!agreeToTerms) {
      found.agreeToTerms =
        "Please agree to the Terms of Service and Privacy Policy.";
    }
    return found;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setServerError("");
    setSubmitting(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email,
        phone: toInternational(form.phone),
        password: form.password,
        confirmPassword: form.confirmPassword,
        agreeToTerms,
      });
      navigate("/verify-email", { replace: true }); // new accounts verify their email first (STEP 37)
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Unable to create your account.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden px-4 py-12 md:py-20">
      <div
        aria-hidden="true"
        className="absolute -top-20 -left-20 size-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 -bottom-20 size-96 rounded-full bg-mint/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-160 rounded-3xl bg-surface p-6 shadow-lift md:p-10">
        <div className="mb-8 text-center">
          <p className="mx-auto mb-4 flex w-fit items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-[11px] font-bold tracking-wide text-ink uppercase">
            <MdOutlineLocalShipping
              size={15}
              aria-hidden="true"
              className="text-primary"
            />
            Fast 30-min delivery nationwide
          </p>
          <h1 className="text-3xl leading-9 font-bold tracking-tight text-ink">
            Create your account
          </h1>
          <p className="mx-auto mt-2 max-w-115 text-[15px] leading-5.5 text-ink-soft">
            Join thousands of shoppers enjoying 30-minute delivery and
            member-exclusive deals across Nigeria.
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
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput
              label="First name"
              name="firstName"
              autoComplete="given-name"
              value={form.firstName}
              onChange={handleChange}
              valid={form.firstName.trim().length > 0}
              error={errors.firstName}
            />
            <TextInput
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              value={form.lastName}
              onChange={handleChange}
              valid={form.lastName.trim().length > 0}
              error={errors.lastName}
            />
          </div>

          <TextInput
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            icon={MdAlternateEmail}
            placeholder="ada.obi@example.com"
            value={form.email}
            onChange={handleChange}
            valid={emailAvailable === true}
            error={
              errors.email ??
              (emailAvailable === false
                ? "This email already has an account. Log in instead?"
                : undefined)
            }
            labelAction={
              emailAvailable && (
                <span className="flex items-center gap-1 text-xs font-semibold text-success">
                  <MdCheckCircleOutline size={14} aria-hidden="true" />
                  Available
                </span>
              )
            }
          />

          <TextInput
            label="Phone number"
            name="phone"
            type="tel"
            autoComplete="tel-national"
            inputMode="tel"
            placeholder="0803 123 4567"
            value={form.phone}
            onChange={handleChange}
            valid={isPhoneValid(form.phone)}
            error={errors.phone}
            leading={
              <span className="flex h-12 items-center gap-2 rounded-xl bg-field px-3 text-sm font-semibold text-ink">
                <span
                  aria-hidden="true"
                  className="flex h-3.5 w-5 overflow-hidden rounded-xs"
                >
                  <span className="flex-1 bg-[#008751]" />
                  <span className="flex-1 bg-white" />
                  <span className="flex-1 bg-[#008751]" />
                </span>
                +234
              </span>
            }
          />

          <div className="flex flex-col gap-3">
            <PasswordInput
              label="Create password"
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
            />
            <PasswordStrength password={form.password} />
          </div>

          <PasswordInput
            label="Confirm password"
            name="confirmPassword"
            autoComplete="new-password"
            icon={MdLockReset}
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          <CheckBox
            checked={agreeToTerms}
            onChange={(event) => {
              setAgreeToTerms(event.target.checked);
              setErrors((current) => ({
                ...current,
                agreeToTerms: undefined,
              }));
            }}
            error={errors.agreeToTerms}
          >
            I agree to QuickCart&apos;s{" "}
            <Link to="/terms" className="text-primary-hover hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary-hover hover:underline">
              Privacy Policy
            </Link>
            .
          </CheckBox>

          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-hover text-base font-semibold text-white transition-colors hover:bg-primary disabled:opacity-60"
          >
            {submitting ? "Creating your account..." : "Create Account"}
            <MdArrowForward size={20} aria-hidden="true" />
          </button>
        </form>

        <p className="mt-8 text-center text-[15px] text-ink-soft">
          Already have an account?{" "}
          <Link
            to="/login"
            state={location.state}
            className="font-semibold text-primary-hover hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
