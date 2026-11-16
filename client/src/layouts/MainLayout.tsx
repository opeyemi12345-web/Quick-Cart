import { Outlet } from "react-router-dom";
import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import ScrollToTop from "../components/layout/ScrollToTop";
import AddedToCartModal from "../components/product/AddedToCartModal";

const MainLayout = () => {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <AddedToCartModal />
    </>
  );
};

export default MainLayout;
