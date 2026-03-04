import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/admin-login" />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/admin-login" />;
  }

  return children;
}

export default ProtectedRoute;