// checkout.ts client/src/types/checkout.ts
// The checkout form state shared by its page and form sections.

// STEP 38 (part 2): The checkout form's shape

export type CheckoutForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressId: string;
  street: string;
  city: string;
  state: string;
  instructions: string;
  deliveryMethod: "standard" | "express";
  paymentMethod: "card" | "pay_on_delivery";
  cardNumber: string;
  expiry: string;
  cvv: string;
};

export type CheckoutErrors = Partial<Record<keyof CheckoutForm, string>>;

export type ChangeField = (field: keyof CheckoutForm, value: string) => void;
