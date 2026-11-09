import { BrowserRouter, Routes, Route } from "react-router-dom";
import CategoriesPage from "./pages/shop/CategoriesPage";
import ShopPage from "./pages/shop/ShopPage";
import HomePage from "./pages/home/HomePage";
import ProductDetailsPage from "./pages/shop/ProductDetailsPage";
import CartPage from "./pages/cart/CartPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import CheckoutPage from "./pages/cart/CheckoutPage";
import OrderCorfirmationPAge from "./pages/cart/OrderCorfirmationPAge";
import OrderHistotyPage from "./pages/account/OrderHistotyPage";
import AddressesPage from "./pages/account/AddressesPage";
import SavedItemsPage from "./pages/account/SavedItemsPage";
import AccountSettingPage from "./pages/account/AccountSettingPage";
import OrderDetailsPage from "./pages/account/OrderDetailsPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminProductsFormPage from "./pages/admin/AdminProductsFormPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import MainLayout from "./layouts/MainLayout";
import AccountLayout from "./layouts/AccountLayout";
import AdminLayout from "./layouts/AdminLayout";
import AccountOverviewPage from "./pages/account/AccountOverviewPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import NotFoundPage from "./pages/NotFoundPage";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/product/:productId" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          {/* pages that need a login: shoppers who are not logged in are sent to login first if they try to acess the page */}

          <Route path="/Verify-email" element={<VerifyEmailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/Order-confirmation/:orderId"
            element={<OrderCorfirmationPAge />}
          />
          {/* Account pages: account menu on the left */}
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<AccountOverviewPage />} />
            <Route path="Orders" element={<OrderHistotyPage />} />
            <Route path="addresses" element={<AddressesPage />} />
            <Route path="saved" element={<SavedItemsPage />} />
            <Route path="settings" element={<AccountSettingPage />} />
          </Route>
          <Route
            path="/account/orders/:orderId"
            element={<OrderDetailsPage />}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="login" element={<AdminLoginPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="Products/new" element={<AdminProductsPage />} />
          <Route
            path="Products/:productId/edit"
            element={<AdminProductsFormPage />}
          />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
