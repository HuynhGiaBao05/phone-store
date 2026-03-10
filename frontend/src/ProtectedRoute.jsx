import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {

  const role =
    localStorage.getItem("adminRole") ||
    localStorage.getItem("role");

  if (!role) {
    return <Navigate to="/admin-login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;