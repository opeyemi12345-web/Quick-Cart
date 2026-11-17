// AddressesPage.tsx client/src/pages/account/AddressesPage.tsx
// My Account → Delivery Addresses: saved addresses, add, edit, set default, delete.

// STEP 39 (part 15): The Delivery Addresses page

import { useState } from "react";
import { MdAdd, MdOutlineWrongLocation } from "react-icons/md";
import AddressCard from "../../components/accounts/AddressCard";
import AddressForm from "../../components/accounts/AddressForm";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const AddressesPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  if (!user) return null;

  const done = (message: string) => {
    setEditing(null);
    showToast({ type: "success", title: message });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-surface p-6 shadow-card">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Delivery Addresses
          </h1>
          <p className="mt-1 text-ink-soft">
            Your default address is chosen automatically at checkout.
          </p>
        </div>
        {editing === null && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-white hover:bg-primary-hover"
          >
            <MdAdd size={20} aria-hidden="true" /> Add New Address
          </button>
        )}
      </div>

      {editing !== null ? (
        <AddressForm
          key={editing}
          address={user.addresses.find((address) => address._id === editing)}
          onDone={done}
          onCancel={() => setEditing(null)}
        />
      ) : user.addresses.length === 0 ? (
        <EmptyState
          icon={MdOutlineWrongLocation}
          title="No saved addresses yet"
          text="Add one now to check out in seconds next time."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {user.addresses.map((address) => (
            <AddressCard
              key={address._id}
              address={address}
              onEdit={() => setEditing(address._id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressesPage;
