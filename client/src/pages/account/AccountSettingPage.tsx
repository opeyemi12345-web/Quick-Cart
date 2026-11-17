// AccountSettingsPage.tsx client/src/pages/account/AccountSettingsPage.tsx
// My Account → Account Settings: personal details, password, and email verification.

// STEP 39 (part 14): The Account Settings page

import ChangePasswordForm from "../../components/accounts/ChangePasswordForm";
import EditProfileForm from "../../components/accounts/EditProfileForm";
import SecurityCard from "../../components/accounts/SecurityCard";

const AccountSettingPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl bg-surface p-6 shadow-card">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Account Settings
        </h1>
        <p className="mt-1 text-ink-soft">
          Update your personal details and keep your account secure.
        </p>
      </div>
      <div className="rounded-3xl bg-surface p-2 shadow-card">
        <EditProfileForm />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
        <ChangePasswordForm />
        <SecurityCard />
      </div>
    </div>
  );
};

export default AccountSettingPage;
