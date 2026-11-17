// AdminLayout.tsx client/src/layouts/AdminLayout.tsx
// Frame for admin pages: sidebar, top bar, and nested page content.

// STEP 41 (part 5): The admin layout

import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../components/layout/AdminSideBar";
import AdminTopbar from "../components/layout/AdminTopBar";

const AdminLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-[288px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-line lg:block print:hidden">
        <AdminSidebar />
      </aside>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-label="Admin menu"
        >
          <button
            type="button"
            aria-label="Close the menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 animate-fade-in bg-ink/40"
          />
          <div className="absolute inset-y-0 left-0 w-72 animate-slide-in-left shadow-banner">
            <AdminSidebar onNavigate={() => setMenuOpen(false)} />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close the menu"
              className="absolute top-4 -right-12 flex size-10 items-center justify-center rounded-full bg-surface text-ink"
            >
              <MdClose size={22} />
            </button>
          </div>
        </div>
      )}

      <div className="min-w-0">
        <AdminTopbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="px-4 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
