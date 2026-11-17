// ContactInfoForm.tsx client/src/components/checkout/ContactInfoForm.tsx
// Contact information for the invoice and delivery updates.

// STEP 38 (part 5): Contact information

import {
  MdOutlineMail,
  MdOutlinePhone,
  MdVerified,
} from "react-icons/md";
import type {
  ChangeField,
  CheckoutErrors,
  CheckoutForm,
} from "../../types/checkout";
import TextInput from "../form/TextInput";
import CheckoutSection from "./CheckoutSection";

type ContactInfoFormProps = {
  form: CheckoutForm;
  errors: CheckoutErrors;
  onChange: ChangeField;
  verified: boolean;
};

const ContactInfoForm = ({
  form,
  errors,
  onChange,
  verified,
}: ContactInfoFormProps) => (
  <CheckoutSection
    number={1}
    title="Contact Information"
    subtitle="Order invoice & dispatch updates will be sent here"
    badge={
      verified && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-mint/30 px-2.5 py-1 text-xs font-semibold text-forest">
          <MdVerified size={14} aria-hidden="true" /> Verified Customer
        </span>
      )
    }
  >
    <div className="grid gap-5 sm:grid-cols-2">
      <TextInput
        label="First Name"
        autoComplete="given-name"
        value={form.firstName}
        onChange={(event) => onChange("firstName", event.target.value)}
        error={errors.firstName}
      />
      <TextInput
        label="Last Name"
        autoComplete="family-name"
        value={form.lastName}
        onChange={(event) => onChange("lastName", event.target.value)}
        error={errors.lastName}
      />
      <TextInput
        className="sm:col-span-2"
        label="Email Address"
        type="email"
        autoComplete="email"
        icon={MdOutlineMail}
        value={form.email}
        onChange={(event) => onChange("email", event.target.value)}
        error={errors.email}
      />
      <TextInput
        className="sm:col-span-2"
        label="Phone Number"
        type="tel"
        autoComplete="tel-national"
        icon={MdOutlinePhone}
        placeholder="0803 123 4567"
        value={form.phone}
        onChange={(event) => onChange("phone", event.target.value)}
        error={errors.phone}
      />
    </div>
    <p className="mt-2 text-sm text-muted">
      Our dispatch riders call this number when they arrive.
    </p>
  </CheckoutSection>
);

export default ContactInfoForm;
