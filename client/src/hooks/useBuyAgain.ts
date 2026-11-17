// useBuyAgain.ts client/src/hooks/useBuyAgain.ts
// "Buy Again" on an old order: add its items to the cart at today's price and stock.

// STEP 40 (part 1): Buy again

import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import type { OrderItem, ProductResponse } from "../types/api";
import { api } from "../utils/api";

export const useBuyAgain = () => {
  const { addItem } = useCart();
  const { showToast } = useToast();

  return async (items: OrderItem[]) => {
    const problems: string[] = [];

    const results = await Promise.allSettled(
      items.map((item) => api<ProductResponse>(`/products/${item.product}`)),
    );

    results.forEach((result, index) => {
      const item = items[index];
      if (result.status === "rejected") {
        problems.push(`"${item.name}" is no longer available.`);
        return;
      }

      const added = addItem(result.value.product, {
        color: item.color,
        quantity: item.quantity,
      });
      if (!added.ok) problems.push(added.message);
    });

    if (problems.length > 0) {
      showToast({
        type: "error",
        title:
          problems.length === items.length
            ? "Nothing could be added"
            : "Some items weren't added",
        message: problems.join(" "),
      });
    }
  };
};
