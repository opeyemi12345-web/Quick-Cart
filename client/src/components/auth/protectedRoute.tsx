import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ adminOnly = false }: { adminOnly?: boolean }) => {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return (
      <div
        role="status"
        className="flex min-h-[50vh] items-center justify-center"
      >
        <span className="size-8 animate-spin rounded-full border-3 border-primary-light border-t-primary" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={adminOnly ? "/admin/login" : "/login"}
        replace
        state={{ from: location }}
      />
    );
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
