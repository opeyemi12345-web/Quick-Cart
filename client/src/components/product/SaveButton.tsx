// SaveButton.tsx client/src/components/product/SaveButton.tsx
// A heart button to save a product to the signed-in user's account.
// Logged-out users are sent to login and returned to their current page afterward.

// STEP 35 (part 5): The save (heart) button

import { useState } from "react";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../utils/api";

type SaveButtonProps = { productId: string; productName: string };

const SaveButton = ({ productId, productName }: SaveButtonProps) => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);

  const saved = user?.savedItems.includes(productId) ?? false;

  const toggle = async () => {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setBusy(true);
    try {
      const { savedItems } = await api<{ savedItems: string[] }>(
        `/account/saved/${productId}`,
        { method: saved ? "DELETE" : "POST" },
      );
      setUser({ ...user, savedItems });
      showToast({
        type: "success",
        title: saved ? "Removed from Saved Items" : "Saved for later",
        message: productName,
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Couldn't update Saved Items",
        message:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={
        saved
          ? `Remove ${productName} from Saved Items`
          : `Save ${productName} for later`
      }
      className="flex size-10 items-center justify-center rounded-full bg-surface text-ink shadow-card transition-colors hover:text-danger disabled:opacity-60"
    >
      {saved ? (
        <MdFavorite
          key="saved"
          size={20}
          aria-hidden="true"
          className="animate-heart text-danger"
        />
      ) : (
        <MdFavoriteBorder size={20} aria-hidden="true" />
      )}
    </button>
  );
};

export default SaveButton;
