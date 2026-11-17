// DeliveryMethodForm.tsx client/src/components/checkout/DeliveryMethodForm.tsx
// Choose standard or Lagos-only express delivery at checkout.

// STEP 38 (part 7): Delivery method

import { MdOutlineLocalShipping, MdOutlineSchedule } from "react-icons/md";
import RadioCard from "../form/RadioCard";
import CheckoutSection from "./CheckoutSection";

type DeliveryMethod = "standard" | "express";

type DeliveryMethodFormProps = {
  value: DeliveryMethod;
  lagos: boolean;
  onChange: (value: DeliveryMethod) => void;
};

const DeliveryMethodForm = ({
  value,
  lagos,
  onChange,
}: DeliveryMethodFormProps) => (
  <CheckoutSection
    number={3}
    title="Delivery Method"
    subtitle="Choose how quickly your order arrives"
  >
    <div className="flex flex-col gap-3">
      <RadioCard
        name="delivery"
        value="standard"
        checked={value === "standard"}
        onChange={() => onChange("standard")}
        title="Standard Delivery"
        badge={
          <span className="rounded-full bg-mint px-2 py-0.5 text-xs font-semibold text-forest">
            Free
          </span>
        }
        description="Insured delivery in 2–3 business days."
      >
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <MdOutlineLocalShipping size={18} aria-hidden="true" />
          Track your package from dispatch to delivery.
        </p>
      </RadioCard>

      <RadioCard
        name="delivery"
        value="express"
        checked={value === "express"}
        onChange={() => onChange("express")}
        disabled={!lagos}
        title="Express Same-Day Dispatch"
        badge={
          <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-semibold text-primary">
            ₦2,500
          </span>
        }
        description={
          lagos
            ? "Priority dispatch for Lagos Metro addresses."
            : "Express delivery is available for Lagos addresses only."
        }
      >
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <MdOutlineSchedule size={18} aria-hidden="true" />
          Available for eligible Lagos addresses.
        </p>
      </RadioCard>
    </div>
  </CheckoutSection>
);

export default DeliveryMethodForm;
