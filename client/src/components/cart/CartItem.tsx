// CartItem.tsx client/src/components/cart/CartItem.tsx
// One editable item row in the shopping cart.

import { MdClose, MdOutlineImageNotSupported } from "react-icons/md";
import { Link } from "react-router-dom";
import { useCart, type CartItem as CartLine } from "../../context/CartContext";
import { naira } from "../../utils/format";
import QuantityStepper from "../common/QuantityStepper";

const CartItem = ({ item }: { item: CartLine }) => {
  const { updateQuantity, removeItem } = useCart();

  return (
    <li className="flex flex-col gap-4 rounded-3xl bg-surface p-4 shadow-card sm:flex-row sm:items-center">
      <Link
        to={`/product/${item.slug}`}
        className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-field"
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="size-full object-cover"
          />
        ) : (
          <MdOutlineImageNotSupported
            size={32}
            aria-label="Product image unavailable"
            className="text-muted"
          />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          to={`/product/${item.slug}`}
          className="font-semibold text-ink hover:text-primary"
        >
          {item.name}
        </Link>
        {item.color && (
          <p className="mt-1 text-sm text-muted">Color: {item.color}</p>
        )}
        <p className="mt-2 font-bold text-ink">{naira(item.price)}</p>
        {item.oldPrice && item.oldPrice > item.price && (
          <del className="text-sm text-muted">{naira(item.oldPrice)}</del>
        )}
      </div>

      <QuantityStepper
        value={item.quantity}
        max={item.maxQuantity}
        size="sm"
        label={`Quantity of ${item.name}`}
        onChange={(quantity) => updateQuantity(item.key, quantity)}
      />

      <p className="min-w-24 text-right font-bold text-ink">
        {naira(item.price * item.quantity)}
      </p>

      <button
        type="button"
        onClick={() => removeItem(item.key)}
        aria-label={`Remove ${item.name} from cart`}
        className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-danger-light hover:text-danger"
      >
        <MdClose size={20} aria-hidden="true" />
      </button>
    </li>
  );
};

export default CartItem;
