import { PASSWORD_RULES } from "../../utils/password";

const PasswordStrength = ({ password }: { password: string }) => {
  const passed = PASSWORD_RULES.map((rule) => rule.test(password));
  const score = passed.filter(Boolean).length;
  const strength =
    score <= 1
      ? { label: "Weak", color: "bg-danger" }
      : score <= 3
        ? { label: "Getting stronger", color: "bg-warning" }
        : { label: "Strong", color: "bg-success" };

  return (
    <div aria-live="polite">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-ink-soft">Password strength</span>
        <span className="font-semibold text-subtle">
          {password ? strength.label : "Enter a password"}
        </span>
      </div>
      <div
        className="mb-3 flex gap-1"
        role="meter"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
      >
        {PASSWORD_RULES.map((rule, index) => (
          <span
            key={rule.label}
            className={`h-1.5 flex-1 rounded-full ${
              passed[index] ? strength.color : "bg-line"
            }`}
          />
        ))}
      </div>
      <ul className="grid gap-1 text-xs text-subtle sm:grid-cols-2">
        {PASSWORD_RULES.map((rule, index) => (
          <li
            key={rule.label}
            className={passed[index] ? "text-success" : undefined}
          >
            <span aria-hidden="true">{passed[index] ? "✓" : "○"}</span>{" "}
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrength;
